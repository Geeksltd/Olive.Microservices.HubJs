import 'jquery';

export interface MasonaryOptions {
    minColumnWidth: number
    parentSelector: string
    itemsSelector: string
    redrawInterval: number
    storageKey?: string
}

export interface WidgetState {
    index: number
    id: string
    order: number
    height: number
}

export interface ColumnState {
    index: number
    height: number
    widgets: WidgetState[]
}

export interface BoardState {
    timestamp: number
    windowWidth: number
    windowHeight: number
    parentWidth: number
    parentHeight: number
    minColumnWidth: number
    columnCount: number
    columns: ColumnState[]
    schematic: number[][]
}

export default class MasonryGrid {
    options: MasonaryOptions;
    parent: HTMLElement;
    items: Element[];
    resizeObserver: ResizeObserver;
    resizeId: number | undefined;
    lastSchematic: Array<Array<number>> = [[]];
    preRendered: boolean = false;

    constructor(options) {
        this.options = options;
        this.initialize();
    }

    private initialize() {
        try {
            this.parent = document.querySelector<HTMLElement>(this.options.parentSelector);
            this.items = !this.parent
                ? undefined
                : Array.from(this.parent.querySelectorAll(this.options.parentSelector + ' > ' + this.options.itemsSelector));

            if (!this.parent || !this.items || !this.items.length) throw "invalid board dom structure";

            const o = function (entries) {
                this.drawGrid();
            }.bind(this);
            this.resizeObserver = new ResizeObserver(o);

            this.resizeObserver.observe(this.parent);
            this.items.forEach(item => this.resizeObserver.observe(item));

            // Try to pre-render from cache if window width matches
            if (this.preRenderFromCache()) {
                this.preRendered = true;
            } else {
                this.drawGrid();
            }
        } catch (error) {
            console.log(error);
            setTimeout(() => {
                this.initialize();
            }, 100);
        }
    }

    private getItemId(item: Element): string {
        return item.getAttribute('id') || item.getAttribute('data-id') || item.getAttribute('data-type') || '';
    }

    private preRenderFromCache(): boolean {
        const cachedState = this.getBoardState();
        if (!cachedState) return false;

        // Check if window width matches cached width
        if (window.innerWidth !== cachedState.windowWidth) return false;

        // Verify we have valid cached data
        if (!cachedState.columns || !cachedState.schematic) return false;

        // Build a map of cached widget IDs to their heights
        const cachedWidgetHeights = new Map<string, number>();
        cachedState.columns.forEach(col => {
            col.widgets.forEach(widget => {
                if (widget.id) {
                    cachedWidgetHeights.set(widget.id, widget.height);
                }
            });
        });

        // Sort items by box-order like in generateSchematic
        this.items.sort((a, b) => parseInt(b.getAttribute("box-order")) - parseInt(a.getAttribute("box-order")));

        // Verify all current items exist in cache (by ID)
        const currentIds: string[] = [];
        for (const item of this.items) {
            const id = this.getItemId(item);
            if (!id || !cachedWidgetHeights.has(id)) {
                // Widget not found in cache - cannot pre-render
                return false;
            }
            currentIds.push(id);
        }

        // Verify same count (handles case where cache has more widgets than current)
        if (currentIds.length !== cachedWidgetHeights.size) return false;

        // Generate columns
        this.generateColumns(cachedState.columnCount);

        // Distribute items to columns based on cached schematic and set min-height by ID
        for (let c = 0; c < cachedState.schematic.length; c++) {
            const column = this.parent.querySelectorAll(".column")[c];
            for (let i = 0; i < cachedState.schematic[c].length; i++) {
                const itemIndex = cachedState.schematic[c][i];
                const item = this.items[itemIndex] as HTMLElement;
                const itemId = this.getItemId(item);
                const cachedHeight = itemId ? cachedWidgetHeights.get(itemId) : undefined;

                if (cachedHeight && cachedHeight > 0) {
                    item.style.minHeight = `${cachedHeight}px`;
                }

                column.appendChild(item);
            }
        }

        this.lastSchematic = cachedState.schematic;
        return true;
    }

    setMinColumnWidth(w: number) {
        this.options.minColumnWidth = w;
        this.drawGrid();
    }

    drawGrid() {
        if (this.resizeId) {
            clearTimeout(this.resizeId);
        }

        if (!this.parent || !this.items || !this.items.length) return;

        this.resizeId = setTimeout(function () {
            this.resizeId = undefined;

            const parentWidth = this.parent.clientWidth;
            const columnCount = Math.max(Math.floor(parentWidth / this.options.minColumnWidth), 1);

            const newItems = this.parent.querySelectorAll(this.options.parentSelector + ' > ' + this.options.itemsSelector);

            if (!newItems.length) {
                const newSchematic = this.generateSchematic(columnCount);
                if (this.lastSchematic && this.areEqualSchematics(this.lastSchematic, newSchematic))
                    return; // Keep min-heights intact - no redraw needed
                this.lastSchematic = newSchematic;
                this.removeColumns();
            } else {
                this.removeColumns();
                this.items = Array.from(this.parent.querySelectorAll(this.options.parentSelector + ' > ' + this.options.itemsSelector));
                this.lastSchematic = this.generateSchematic(columnCount);
            }

            // Clear min-heights only when doing actual redraw
            if (this.preRendered) {
                this.items.forEach(item => {
                    (item as HTMLElement).style.minHeight = '';
                });
                this.preRendered = false;
                // Force reflow to ensure correct heights before saving
                void this.parent.offsetHeight;
            }

            this.generateColumns(columnCount);

            for (let c = 0; c < this.lastSchematic.length; c++) {
                const column = this.parent.querySelectorAll(".column")[c]
                for (let i = 0; i < this.lastSchematic[c].length; i++) {
                    column.appendChild(this.items[this.lastSchematic[c][i]]);
                }
            }

            newItems.forEach(item => this.resizeObserver.observe(item));

            this.saveBoardState();
        }.bind(this), this.options.redrawInterval ?? 100);
    }

    generateColumns(columnCount) {
        for (let i = 0; i < columnCount; i++) {
            this.parent.insertAdjacentHTML("beforeend", "<div class='column'></div>");
        }
    }

    removeColumns() {
        this.items.forEach(item => {
            if (item.parentElement != this.parent)
                this.parent.appendChild(item);
        });

        this.parent.querySelectorAll(".column").forEach(element => {
            element.remove();
        });
    }

    areEqualSchematics(a, b) {
        return JSON.stringify(a) === JSON.stringify(b);
    }

    generateSchematic(columnCount) {

        var result = [];
        var schematic = [];

        for (let i = 0; i < columnCount; i++) {
            result.push({ index: i, height: 0 });
            schematic.push([]);
        }
        this.items.sort((a, b) => parseInt(b.getAttribute("box-order")) - parseInt(a.getAttribute("box-order")));

        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            result.sort((a, b) => a.height - b.height);
            const index = result[0].index;
            result[0].height += item.clientHeight;
            schematic[index].push(i);
        }

        return schematic;
    }

    private getStorageKey(): string {
        if (this.options.storageKey) return this.options.storageKey;
        const path = window.location.pathname.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        return `masonry-board-state-${path || 'root'}`;
    }

    saveBoardState(): void {
        if (!this.parent || !this.items || !this.lastSchematic) return;

        const columns = this.parent.querySelectorAll(".column");
        const columnStates: ColumnState[] = [];

        columns.forEach((column, colIndex) => {
            const widgets: WidgetState[] = [];
            const columnItems = column.querySelectorAll(this.options.itemsSelector);

            columnItems.forEach((item, itemIndex) => {
                const itemId = this.getItemId(item);
                if (!itemId) return; // Skip items without valid ID
                widgets.push({
                    index: itemIndex,
                    id: itemId,
                    order: parseInt(item.getAttribute('box-order')) || 0,
                    height: (item as HTMLElement).clientHeight
                });
            });

            columnStates.push({
                index: colIndex,
                height: (column as HTMLElement).clientHeight,
                widgets: widgets
            });
        });

        const boardState: BoardState = {
            timestamp: Date.now(),
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
            parentWidth: this.parent.clientWidth,
            parentHeight: this.parent.clientHeight,
            minColumnWidth: this.options.minColumnWidth,
            columnCount: columns.length,
            columns: columnStates,
            schematic: this.lastSchematic
        };

        try {
            localStorage.setItem(this.getStorageKey(), JSON.stringify(boardState));
        } catch (e) {
            console.warn('Failed to save board state to localStorage:', e);
        }
    }

    getBoardState(): BoardState | null {
        try {
            const stored = localStorage.getItem(this.getStorageKey());
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            console.warn('Failed to read board state from localStorage:', e);
            return null;
        }
    }

    clearBoardState(): void {
        try {
            localStorage.removeItem(this.getStorageKey());
        } catch (e) {
            console.warn('Failed to clear board state from localStorage:', e);
        }
    }
}
