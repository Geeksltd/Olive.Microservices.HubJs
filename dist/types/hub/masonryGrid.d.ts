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
    private readonly MAX_LAYOUT_PASSES;
    private readonly DEFAULT_WIDGET_HEIGHT;
    private static readonly LOADING_CLASS;
    private static readonly STYLE_ID;
    constructor(options: MasonryOptions);
    private static ensureStyle;
    private fireReady;
    private initialize;
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
