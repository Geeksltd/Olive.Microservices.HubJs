import 'jquery';
export interface MasonaryOptions {
    minColumnWidth: number;
    parentSelector: string;
    itemsSelector: string;
    redrawInterval: number;
    storageKey?: string;
}
export interface WidgetState {
    index: number;
    id: string;
    order: number;
    height: number;
}
export interface ColumnState {
    index: number;
    height: number;
    widgets: WidgetState[];
}
export interface BoardState {
    timestamp: number;
    windowWidth: number;
    windowHeight: number;
    parentWidth: number;
    parentHeight: number;
    minColumnWidth: number;
    columnCount: number;
    columns: ColumnState[];
    schematic: number[][];
}
export default class MasonryGrid {
    options: MasonaryOptions;
    parent: HTMLElement;
    items: Element[];
    resizeObserver: ResizeObserver;
    resizeId: number | undefined;
    lastSchematic: Array<Array<number>>;
    preRendered: boolean;
    constructor(options: any);
    private initialize;
    private getItemId;
    private preRenderFromCache;
    setMinColumnWidth(w: number): void;
    drawGrid(): void;
    generateColumns(columnCount: any): void;
    removeColumns(): void;
    areEqualSchematics(a: any, b: any): boolean;
    generateSchematic(columnCount: any): any[];
    private getStorageKey;
    saveBoardState(): void;
    getBoardState(): BoardState | null;
    clearBoardState(): void;
}
