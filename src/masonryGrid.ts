import 'jquery';

export interface MasonryOptions {
    minColumnWidth: number;
    parentSelector: string;
    itemsSelector: string;
    redrawInterval?: number;
    storageKey?: string;
    onReady?: () => void;
}

export interface HeightCache {
    windowWidth: number;
    heights: Record<string, number>; // widgetId -> height
}

export default class MasonryGrid {
    options: MasonryOptions;
    parent: HTMLElement;
    items: Element[];
    resizeObserver: ResizeObserver;
    preRendered: boolean = false;
    private resizeId: number | undefined;
    private lastSchematic: number[][] = [[]];
    private lastColumnCount: number = 0;
    private isLayoutInProgress: boolean = false;
    private pendingRedraw: boolean = false;
    private layoutPassCount: number = 0;
    private readyFired: boolean = false;
    private readonly MAX_LAYOUT_PASSES = 3;
    private readonly DEFAULT_WIDGET_HEIGHT = 200;
    private static readonly LOADING_CLASS = 'masonry-loading';
    private static readonly STYLE_CLASS = 'masonry-grid-fade-style';

    constructor(options: MasonryOptions) {
        this.options = options;
        this.initialize();
    }

    // Inject the loader/transition CSS into a board-local container instead
    // of <head>. Adding stylesheets to <head> at runtime makes Chromium
    // re-resolve every web font on the page, which briefly blanks all
    // FontAwesome glyphs (FA's font-display: block).
    static ensureStyle(target: Element) {
        if (typeof document === 'undefined' || !target) return;
        if (target.querySelector('style.' + MasonryGrid.STYLE_CLASS)) return;
        const style = document.createElement('style');
        style.className = MasonryGrid.STYLE_CLASS;
        style.textContent =
            '.' + MasonryGrid.LOADING_CLASS + '{opacity:0;}' +
            '.board-components-result>.list-items{transition:opacity 220ms ease-out;}';
        target.appendChild(style);
    }

    private fireReady() {
        if (this.readyFired) return;
        this.readyFired = true;
        if (this.parent) this.parent.classList.remove(MasonryGrid.LOADING_CLASS);
        try { this.options.onReady?.(); } catch (e) { console.error(e); }
    }

    private initialize() {
        try {
            this.parent = document.querySelector<HTMLElement>(this.options.parentSelector);
            this.items = this.parent
                ? Array.from(this.parent.querySelectorAll(this.options.parentSelector + ' > ' + this.options.itemsSelector))
                : undefined;

            if (!this.parent || !this.items?.length) throw "invalid board dom structure";

            // Inject the masonry transition CSS inside the board DOM (parentElement
            // = .board-components-result). Keeps the stylesheet out of <head> so
            // Chromium doesn't re-resolve FA web fonts on each board mount.
            MasonryGrid.ensureStyle(this.parent.parentElement || this.parent);

            if (this.preRenderFromCache()) {
                this.preRendered = true;
                // Only watch parent resize so item-content load does not trigger re-layout.
                this.resizeObserver = new ResizeObserver(() => {
                    if (this.getColumnCount() !== this.lastColumnCount) {
                        this.preRendered = false;
                        this.drawGrid();
                    }
                });
                this.resizeObserver.observe(this.parent);

                // Save heights after content has had time to render.
                setTimeout(() => this.saveHeightCache(), 3000);

                // Cached path is already visible; fire onReady on next frame
                // so callers get the ready signal consistently.
                requestAnimationFrame(() => this.fireReady());
            } else {
                // No cache - hide the grid until layout stabilizes, then fade in.
                this.parent.classList.add(MasonryGrid.LOADING_CLASS);
                this.resizeObserver = new ResizeObserver(() => {
                    if (this.isLayoutInProgress) {
                        this.pendingRedraw = true;
                        return;
                    }
                    this.layoutPassCount = 0;
                    this.drawGrid();
                });
                this.resizeObserver.observe(this.parent);
                this.items.forEach(item => this.resizeObserver.observe(item));
                this.drawGrid();
            }
        } catch (error) {
            console.log(error);
            setTimeout(() => this.initialize(), 100);
        }
    }

    private getItemId(item: Element): string {
        return item.getAttribute('id') || item.getAttribute('data-id') || item.getAttribute('data-type') || '';
    }

    private getColumnCount(): number {
        return Math.max(Math.floor(this.parent.clientWidth / this.options.minColumnWidth), 1);
    }

    private getAllItemsSelector(): string {
        const { parentSelector, itemsSelector } = this.options;
        return `${parentSelector} > ${itemsSelector}, ${parentSelector} > .column > ${itemsSelector}`;
    }

    private sortItemsByBoxOrder() {
        this.items.sort((a, b) =>
            parseInt(b.getAttribute("box-order") || "0") -
            parseInt(a.getAttribute("box-order") || "0")
        );
    }

    private applySchematicToColumns() {
        const columns = this.parent.querySelectorAll(".column");
        for (let c = 0; c < this.lastSchematic.length; c++) {
            for (const itemIndex of this.lastSchematic[c]) {
                columns[c].appendChild(this.items[itemIndex]);
            }
        }
    }

    private preRenderFromCache(): boolean {
        const heightCache = this.getHeightCache();

        // Skip if window width changed (layout would be different)
        if (!heightCache || window.innerWidth !== heightCache.windowWidth) return false;

        this.sortItemsByBoxOrder();

        // Build height map for schematic generation
        const itemHeights = this.items.map(item => {
            const id = this.getItemId(item);
            const cached = id ? heightCache.heights[id] : undefined;
            const height = cached > 0 ? cached : this.DEFAULT_WIDGET_HEIGHT;
            (item as HTMLElement).style.minHeight = `${height}px`;
            return height;
        });

        // Generate layout using cached heights (not clientHeight)
        const columnCount = this.getColumnCount();
        this.lastColumnCount = columnCount;
        this.generateColumns(columnCount);
        this.lastSchematic = this.generateSchematic(columnCount, itemHeights);
        this.applySchematicToColumns();
        return true;
    }

    setMinColumnWidth(w: number) {
        this.options.minColumnWidth = w;
        this.preRendered = false;
        this.drawGrid();
    }

    drawGrid() {
        if (this.resizeId) clearTimeout(this.resizeId);
        if (!this.parent || !this.items?.length) return;

        // If pre-rendered, don't do anything - layout is stable
        if (this.preRendered) return;

        this.resizeId = setTimeout(() => {
            this.resizeId = undefined;

            const columnCount = this.getColumnCount();

            // Refresh items list
            this.items = Array.from(this.parent.querySelectorAll(this.getAllItemsSelector()));
            if (!this.items.length) return;

            const newSchematic = this.generateSchematic(columnCount);

            // Skip DOM manipulation if layout would be the same
            if (this.lastColumnCount === columnCount && this.areEqualSchematics(this.lastSchematic, newSchematic)) {
                this.saveHeightCache();
                return;
            }

            this.isLayoutInProgress = true;
            this.pendingRedraw = false;
            this.layoutPassCount++;

            this.lastSchematic = newSchematic;
            this.lastColumnCount = columnCount;
            this.removeColumns();
            this.generateColumns(columnCount);
            this.applySchematicToColumns();
            this.saveHeightCache();

            // Double RAF ensures we are past the ResizeObserver
            // notifications triggered by our own DOM moves.
            // (RAF fires before ResizeObserver in the rendering
            // pipeline, so we need the second frame to be safe.)
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    this.isLayoutInProgress = false;
                    // If resize events fired during layout, do a stabilization
                    // pass so content-driven height changes are not lost —
                    // capped to prevent infinite oscillation.
                    if (this.pendingRedraw && this.layoutPassCount < this.MAX_LAYOUT_PASSES) {
                        this.pendingRedraw = false;
                        this.drawGrid();
                    } else {
                        this.pendingRedraw = false;
                        this.fireReady();
                    }
                });
            });
        }, this.options.redrawInterval ?? 100);
    }

    private generateColumns(columnCount: number) {
        for (let i = 0; i < columnCount; i++) {
            this.parent.insertAdjacentHTML("beforeend", "<div class='column'></div>");
        }
    }

    private removeColumns() {
        this.items.forEach(item => {
            if (item.parentElement !== this.parent) this.parent.appendChild(item);
        });
        this.parent.querySelectorAll(".column").forEach(el => el.remove());
    }

    private areEqualSchematics(a: number[][], b: number[][]): boolean {
        return JSON.stringify(a) === JSON.stringify(b);
    }

    private generateSchematic(columnCount: number, itemHeights: number[] | null = null): number[][] {
        const result: { index: number; height: number }[] = [];
        const schematic: number[][] = [];

        for (let i = 0; i < columnCount; i++) {
            result.push({ index: i, height: 0 });
            schematic.push([]);
        }

        this.sortItemsByBoxOrder();

        for (let i = 0; i < this.items.length; i++) {
            result.sort((a, b) => a.height - b.height);
            const index = result[0].index;
            // Use provided heights if available, otherwise measure live.
            const height = itemHeights ? itemHeights[i] : this.items[i].clientHeight;
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
        this.items = Array.from(this.parent.querySelectorAll(this.getAllItemsSelector()));

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
