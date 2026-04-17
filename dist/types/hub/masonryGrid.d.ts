import 'jquery';
export interface MasonaryOptions {
    minColumnWidth: number;
    parentSelector: string;
    itemsSelector: string;
    redrawInterval: number;
    storageKey?: string;
    onReady?: () => void;
}
export interface HeightCache {
    windowWidth: number;
    heights: Record<string, number>;
}
export default class MasonryGrid {
    options: MasonaryOptions;
    parent: HTMLElement;
    items: Element[];
    resizeObserver: ResizeObserver;
    resizeId: number | undefined;
    lastSchematic: Array<Array<number>>;
    preRendered: boolean;
    private lastColumnCount;
    private isLayoutInProgress;
    private pendingRedraw;
    private layoutPassCount;
    private readyFired;
    private readonly MAX_LAYOUT_PASSES;
    private readonly DEFAULT_WIDGET_HEIGHT;
    private static readonly LOADING_CLASS;
    private static readonly STYLE_ID;
    constructor(options: any);
    private static ensureStyle;
    private fireReady;
    private initialize;
    private getItemId;
    private preRenderFromCache;
    setMinColumnWidth(w: number): void;
    drawGrid(): void;
    generateColumns(columnCount: any): void;
    removeColumns(): void;
    areEqualSchematics(a: any, b: any): boolean;
    generateSchematic(columnCount: any): any[];
    private generateSchematicWithHeights;
    private getHeightCacheKey;
    getHeightCache(): HeightCache | null;
    private saveHeightCache;
}
