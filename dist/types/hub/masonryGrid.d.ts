import 'jquery';
export interface MasonaryOptions {
    minColumnWidth: number;
    parentSelector: string;
    itemsSelector: string;
    cacheKey?: string;
}
export default class MasonryGrid {
    options: MasonaryOptions;
    parent: HTMLElement;
    items: Element[];
    resizeObserver: ResizeObserver;
    mutationObserver: MutationObserver;
    rafId: number | undefined;
    lastSchematic: Array<Array<number>>;
    lastWidth: number;
    lastColumnCount: number;
    private heightCache;
    private readonly CACHE_STORAGE_KEY;
    constructor(options: MasonaryOptions);
    private initialize;
    private loadHeightCache;
    private saveHeightCache;
    private getCacheStorageKey;
    private getWidgetHash;
    private applyCachedHeights;
    finalizeHeights(): void;
    setMinColumnWidth(w: number): void;
    drawGrid(): void;
    private applyLayout;
    areEqualSchematics(a: number[][], b: number[][]): boolean;
    generateSchematic(columnCount: number): number[][];
}
