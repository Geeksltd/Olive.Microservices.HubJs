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
    heights: Record<string, number>;
}
export default class MasonryGrid {
    options: MasonryOptions;
    parent: HTMLElement;
    items: Element[];
    resizeObserver: ResizeObserver;
    preRendered: boolean;
    private resizeId;
    private lastSchematic;
    private lastColumnCount;
    private isLayoutInProgress;
    private pendingRedraw;
    private layoutPassCount;
    private readyFired;
    private destroyed;
    private initRetries;
    private cachedHeightByItem;
    private readonly MAX_LAYOUT_PASSES;
    private readonly MAX_INIT_RETRIES;
    private readonly DEFAULT_WIDGET_HEIGHT;
    private static readonly HEIGHT_DIVERGENCE_THRESHOLD;
    private static readonly LOADING_CLASS;
    private static readonly STYLE_CLASS;
    constructor(options: MasonryOptions);
    static ensureStyle(target: Element): void;
    private fireReady;
    private initialize;
    private hasItemHeightDiverged;
    redraw(): void;
    destroy(): void;
    private getItemId;
    private getColumnCount;
    private getAllItemsSelector;
    private sortItemsByBoxOrder;
    private applySchematicToColumns;
    private preRenderFromCache;
    setMinColumnWidth(w: number): void;
    drawGrid(): void;
    private generateColumns;
    private removeColumns;
    private areEqualSchematics;
    private generateSchematic;
    private getHeightCacheKey;
    getHeightCache(): HeightCache | null;
    private saveHeightCache;
}
