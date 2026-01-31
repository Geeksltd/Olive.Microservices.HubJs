import 'jquery';

export interface MasonaryOptions {
    minColumnWidth: number
    parentSelector: string
    itemsSelector: string
    redrawInterval: number
    storageKey?: string
}

export interface HeightCache {
    windowWidth: number
    heights: Record<string, number>  // widgetId -> height
}

export default class MasonryGrid {
    options: MasonaryOptions;
    parent: HTMLElement;
    items: Element[];
    resizeObserver: ResizeObserver;
    resizeId: number | undefined;
    lastSchematic: Array<Array<number>> = [[]];
    preRendered: boolean = false;
    private lastColumnCount: number = 0;
    private readonly DEFAULT_WIDGET_HEIGHT = 200;

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

            // Try to pre-render from cache first
            if (this.preRenderFromCache()) {
                this.preRendered = true;

                // Only observe parent for window resize - don't observe items
                // This prevents any layout changes from item content loading
                const parentResizeObserver = new ResizeObserver((entries) => {
                    const newColumnCount = Math.max(
                        Math.floor(this.parent.clientWidth / this.options.minColumnWidth), 1
                    );
                    // Only redraw if column count changes (window resize)
                    if (newColumnCount !== this.lastColumnCount) {
                        this.preRendered = false;
                        this.drawGrid();
                    }
                });
                this.resizeObserver = parentResizeObserver;
                this.resizeObserver.observe(this.parent);

                // Save heights after content loads (delayed)
                setTimeout(() => this.saveHeightCache(), 3000);
            } else {
                // No cache - use normal dynamic layout
                const o = function (entries) {
                    this.drawGrid();
                }.bind(this);
                this.resizeObserver = new ResizeObserver(o);
                this.resizeObserver.observe(this.parent);
                this.items.forEach(item => this.resizeObserver.observe(item));
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
        const heightCache = this.getHeightCache();

        // Skip if window width changed (layout would be different)
        if (!heightCache || window.innerWidth !== heightCache.windowWidth) {
            return false;
        }

        // Sort items by box-order
        this.items.sort((a, b) =>
            parseInt(b.getAttribute("box-order") || "0") -
            parseInt(a.getAttribute("box-order") || "0")
        );

        // Build height map for schematic generation
        const itemHeights: number[] = [];
        for (const item of this.items) {
            const id = this.getItemId(item);
            const cachedHeight = id ? heightCache.heights[id] : undefined;
            const height = (cachedHeight && cachedHeight > 0) ? cachedHeight : this.DEFAULT_WIDGET_HEIGHT;

            (item as HTMLElement).style.minHeight = `${height}px`;
            itemHeights.push(height);
        }

        // Generate layout using cached heights (not clientHeight)
        const columnCount = Math.max(
            Math.floor(this.parent.clientWidth / this.options.minColumnWidth), 1
        );
        this.lastColumnCount = columnCount;
        this.generateColumns(columnCount);
        this.lastSchematic = this.generateSchematicWithHeights(columnCount, itemHeights);

        for (let c = 0; c < this.lastSchematic.length; c++) {
            const column = this.parent.querySelectorAll(".column")[c];
            for (const itemIndex of this.lastSchematic[c]) {
                column.appendChild(this.items[itemIndex]);
            }
        }

        return true;
    }

    setMinColumnWidth(w: number) {
        this.options.minColumnWidth = w;
        this.preRendered = false;
        this.drawGrid();
    }

    drawGrid() {
        if (this.resizeId) clearTimeout(this.resizeId);
        if (!this.parent || !this.items || !this.items.length) return;

        // If pre-rendered, don't do anything - layout is stable
        if (this.preRendered) {
            return;
        }

        this.resizeId = setTimeout(function () {
            this.resizeId = undefined;

            const parentWidth = this.parent.clientWidth;
            const columnCount = Math.max(Math.floor(parentWidth / this.options.minColumnWidth), 1);

            // Refresh items list
            this.items = Array.from(this.parent.querySelectorAll(
                this.options.parentSelector + ' > ' + this.options.itemsSelector +
                ', ' + this.options.parentSelector + ' > .column > ' + this.options.itemsSelector
            ));

            if (!this.items.length) return;

            const newSchematic = this.generateSchematic(columnCount);

            // Skip DOM manipulation if layout would be the same
            if (this.lastColumnCount === columnCount &&
                this.lastSchematic &&
                this.areEqualSchematics(this.lastSchematic, newSchematic)) {
                this.saveHeightCache();
                return;
            }

            this.lastSchematic = newSchematic;
            this.lastColumnCount = columnCount;
            this.removeColumns();
            this.generateColumns(columnCount);

            for (let c = 0; c < this.lastSchematic.length; c++) {
                const column = this.parent.querySelectorAll(".column")[c];
                for (const itemIndex of this.lastSchematic[c]) {
                    column.appendChild(this.items[itemIndex]);
                }
            }

            this.items.forEach(item => this.resizeObserver.observe(item));

            // Save actual heights for next visit
            this.saveHeightCache();
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
        return this.generateSchematicWithHeights(columnCount, null);
    }

    private generateSchematicWithHeights(columnCount: number, itemHeights: number[] | null) {
        var result = [];
        var schematic = [];

        for (let i = 0; i < columnCount; i++) {
            result.push({ index: i, height: 0 });
            schematic.push([]);
        }
        this.items.sort((a, b) => parseInt(b.getAttribute("box-order") || "0") - parseInt(a.getAttribute("box-order") || "0"));

        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            result.sort((a, b) => a.height - b.height);
            const index = result[0].index;
            // Use provided heights if available, otherwise use clientHeight
            const height = itemHeights ? itemHeights[i] : item.clientHeight;
            result[0].height += height;
            schematic[index].push(i);
        }

        return schematic;
    }

    private getHeightCacheKey(): string {
        const path = window.location.pathname.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        return this.options.storageKey || `masonry-heights-${path || 'root'}`;
    }

    getHeightCache(): HeightCache | null {
        try {
            const stored = localStorage.getItem(this.getHeightCacheKey());
            return stored ? JSON.parse(stored) : null;
        } catch (e) { return null; }
    }

    private saveHeightCache(): void {
        // Refresh items list to get current items in columns
        this.items = Array.from(this.parent.querySelectorAll(
            this.options.parentSelector + ' > ' + this.options.itemsSelector +
            ', ' + this.options.parentSelector + ' > .column > ' + this.options.itemsSelector
        ));

        const heights: Record<string, number> = {};
        this.items.forEach(item => {
            const id = this.getItemId(item);
            if (id) heights[id] = (item as HTMLElement).clientHeight;
        });

        try {
            localStorage.setItem(this.getHeightCacheKey(), JSON.stringify({
                windowWidth: window.innerWidth,
                heights
            }));
        } catch (e) { /* ignore quota errors */ }
    }
}
