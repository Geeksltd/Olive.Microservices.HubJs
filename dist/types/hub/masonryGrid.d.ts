import 'jquery';
export interface MasonaryOptions {
    minColumnWidth: number;
    parentSelector: string;
    itemsSelector: string;
    redrawInterval: number;
}
export default class MasonryGrid {
    options: MasonaryOptions;
    parent: HTMLElement;
    items: Element[];
    resizeObserver: ResizeObserver;
    resizeId: number | undefined;
    lastSchematic: Array<Array<number>>;
    constructor(options: any);
    private initialize;
    setMinColumnWidth(w: number): void;
    drawGrid(): void;
    generateColumns(columnCount: any): void;
    removeColumns(): void;
    areEqualSchematics(a: any, b: any): boolean;
    generateSchematic(columnCount: any): any[];
}
