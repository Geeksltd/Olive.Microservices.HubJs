import 'jquery';

export interface MasonaryOptions {
    minColumnWidth: number
    parentSelector: string
    itemsSelector: string
    cacheKey?: string  // Optional: unique key for this board (e.g., projectId)
}

export default class MasonryGrid {
    options: MasonaryOptions;
    parent: HTMLElement;
    items: Element[];
    resizeObserver: ResizeObserver;
    mutationObserver: MutationObserver;
    rafId: number | undefined;
    lastSchematic: Array<Array<number>> = [[]];
    lastWidth: number = 0;
    lastColumnCount: number = 0;

    private heightCache: Map<string, number> = new Map();
    private readonly CACHE_STORAGE_KEY = 'masonry-heights';

    constructor(options: MasonaryOptions) {
        this.options = options;
        this.loadHeightCache();
        this.initialize();
    }

    private initialize() {
        try {
            this.parent = document.querySelector<HTMLElement>(this.options.parentSelector);
            this.items = !this.parent
                ? undefined
                : Array.from(this.parent.querySelectorAll(this.options.parentSelector + ' > ' + this.options.itemsSelector));

            if (!this.parent || !this.items || !this.items.length) throw "invalid board dom structure";

            // Apply cached heights immediately to prevent layout shift
            this.applyCachedHeights();

            // Only observe parent for width changes (reduces overhead)
            this.resizeObserver = new ResizeObserver((entries) => {
                const entry = entries[0];
                if (entry.contentRect.width !== this.lastWidth) {
                    this.lastWidth = entry.contentRect.width;
                    this.drawGrid();
                }
            });
            this.resizeObserver.observe(this.parent);

            // Use MutationObserver for item changes (additions/removals)
            this.mutationObserver = new MutationObserver(() => this.drawGrid());
            this.mutationObserver.observe(this.parent, { childList: true, subtree: false });

            this.drawGrid();
        } catch (error) {
            console.log(error);
            setTimeout(() => {
                this.initialize();
            }, 100);
        }
    }

    // Load cached heights from localStorage
    private loadHeightCache() {
        try {
            const key = this.getCacheStorageKey();
            const cached = localStorage.getItem(key);
            if (cached) {
                const data = JSON.parse(cached) as Record<string, number>;
                this.heightCache = new Map();
                for (const k in data) {
                    if (data.hasOwnProperty(k)) {
                        this.heightCache.set(k, data[k]);
                    }
                }
            }
        } catch { /* ignore parse errors */ }
    }

    // Save heights to localStorage
    private saveHeightCache() {
        try {
            const key = this.getCacheStorageKey();
            const data: Record<string, number> = {};
            this.heightCache.forEach((value, k) => {
                data[k] = value;
            });
            localStorage.setItem(key, JSON.stringify(data));
        } catch { /* ignore quota errors */ }
    }

    private getCacheStorageKey(): string {
        return `${this.CACHE_STORAGE_KEY}_${this.options.cacheKey || 'default'}`;
    }

    // Generate unique identifier for cache key
    private getWidgetHash(item: Element): string {
        const widgetId = item.getAttribute('data-widget-id');
        if (widgetId) return widgetId;

        // Fallback: use data-type and nested data-url
        const type = item.getAttribute('data-type') || '';
        const url = item.querySelector('[data-url]')?.getAttribute('data-url') || '';
        return `${type}|${url}`;
    }

    // Apply cached heights as temporary placeholders
    private applyCachedHeights() {
        this.items.forEach(item => {
            const hash = this.getWidgetHash(item);
            const cachedHeight = this.heightCache.get(hash);
            if (cachedHeight) {
                // Set min-height as TEMPORARY placeholder to reserve space
                (item as HTMLElement).style.minHeight = `${cachedHeight}px`;
                // Mark as using cached height (for later cleanup)
                item.setAttribute('data-cached-height', 'true');
            }
        });
    }

    // Call this after widget content has fully loaded
    public finalizeHeights() {
        let cacheUpdated = false;

        // Refresh items list first
        this.items = Array.from(this.parent.querySelectorAll(
            this.options.parentSelector + ' > ' + this.options.itemsSelector +
            ', ' + this.options.parentSelector + ' > .column > ' + this.options.itemsSelector
        ));

        this.items.forEach(item => {
            const hash = this.getWidgetHash(item);
            const htmlItem = item as HTMLElement;

            // Remove temporary min-height constraint
            if (item.getAttribute('data-cached-height')) {
                htmlItem.style.minHeight = '';
                item.removeAttribute('data-cached-height');
            }

            // Measure actual height now that content is loaded
            const actualHeight = htmlItem.offsetHeight;
            const cachedHeight = this.heightCache.get(hash);

            // Update cache if height changed (threshold to ensure content loaded)
            if (actualHeight > 50 && actualHeight !== cachedHeight) {
                this.heightCache.set(hash, actualHeight);
                cacheUpdated = true;
            }
        });

        // Save to localStorage if cache changed
        if (cacheUpdated) {
            this.saveHeightCache();
        }

        // Re-layout with actual heights
        this.lastSchematic = [[]]; // Reset to force re-layout
        this.drawGrid();
    }

    setMinColumnWidth(w: number) {
        this.options.minColumnWidth = w;
        this.drawGrid();
    }

    drawGrid() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }

        if (!this.parent || !this.items || !this.items.length) return;

        this.rafId = requestAnimationFrame(() => {
            this.rafId = undefined;

            const parentWidth = this.parent.clientWidth;
            const columnCount = Math.max(Math.floor(parentWidth / this.options.minColumnWidth), 1);

            // Refresh items list (handles dynamic additions) - check both direct children and items in columns
            this.items = Array.from(this.parent.querySelectorAll(
                this.options.parentSelector + ' > ' + this.options.itemsSelector +
                ', ' + this.options.parentSelector + ' > .column > ' + this.options.itemsSelector
            ));

            if (!this.items.length) return;

            const newSchematic = this.generateSchematic(columnCount);
            if (this.lastSchematic && this.areEqualSchematics(this.lastSchematic, newSchematic))
                return;

            this.lastSchematic = newSchematic;
            this.applyLayout(newSchematic, columnCount);
        });
    }

    private applyLayout(schematic: number[][], columnCount: number) {
        // Reset parent grid styles (we use DOM columns instead)
        this.parent.style.display = '';
        this.parent.style.gridTemplateColumns = '';
        this.parent.style.gridAutoRows = '';
        this.parent.style.gap = '';
        this.parent.style.alignItems = '';

        // Move all items back to parent first (if they're in columns)
        this.items.forEach(item => {
            const htmlItem = item as HTMLElement;
            // Clear any grid positioning styles
            htmlItem.style.gridColumn = '';
            htmlItem.style.gridRowStart = '';
            htmlItem.style.gridRowEnd = '';
            htmlItem.style.order = '';

            if (item.parentElement !== this.parent) {
                this.parent.appendChild(item);
            }
        });

        // Remove existing columns
        this.parent.querySelectorAll(':scope > .column').forEach(col => col.remove());

        // Create columns
        const columns: HTMLElement[] = [];
        for (let i = 0; i < columnCount; i++) {
            const col = document.createElement('div');
            col.className = 'column';
            this.parent.appendChild(col);
            columns.push(col);
        }

        // Move items into their assigned columns
        for (let col = 0; col < schematic.length; col++) {
            for (let i = 0; i < schematic[col].length; i++) {
                const item = this.items[schematic[col][i]];
                columns[col].appendChild(item);
            }
        }
    }

    areEqualSchematics(a: number[][], b: number[][]): boolean {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i].length !== b[i].length) return false;
            for (let j = 0; j < a[i].length; j++) {
                if (a[i][j] !== b[i][j]) return false;
            }
        }
        return true;
    }

    generateSchematic(columnCount: number): number[][] {
        // Stable sort by box-order (tie-break by original index for determinism)
        const sortedItems = this.items
            .map((item, index) => ({
                item,
                index,
                order: parseInt(item.getAttribute("box-order") || "0")
            }))
            .sort((a, b) => b.order - a.order || a.index - b.index);

        // Batch read all heights upfront (single reflow)
        // Use cached height if available and item is still loading
        const heights = sortedItems.map(x => {
            const item = x.item as HTMLElement;
            const hash = this.getWidgetHash(item);
            const actual = item.offsetHeight;

            // If item has cached height marker, prefer cached value for initial layout
            if (item.getAttribute('data-cached-height')) {
                return this.heightCache.get(hash) || actual;
            }
            return actual;
        });

        // Initialize columns
        const columns: { index: number; height: number }[] = [];
        const schematic: number[][] = [];
        for (let i = 0; i < columnCount; i++) {
            columns.push({ index: i, height: 0 });
            schematic.push([]);
        }

        // Distribute items to shortest column (stable tie-break by column index)
        for (let i = 0; i < sortedItems.length; i++) {
            columns.sort((a, b) => a.height - b.height || a.index - b.index);
            const targetCol = columns[0].index;
            columns[0].height += heights[i];
            schematic[targetCol].push(sortedItems[i].index);
        }

        return schematic;
    }
}
