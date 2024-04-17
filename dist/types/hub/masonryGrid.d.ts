/// <reference path="../olive.mvc/typings-lib/jquery/jquery.d.ts" />
import 'jquery';
export interface MasonaryOptions {
    minColumnWidth: number;
    parentSelector: string;
    itemsSelector: string;
}
export default class MasonryGrid {
    options: MasonaryOptions;
    parent: HTMLElement;
    items: NodeListOf<Element>;
    resizeObserver: ResizeObserver;
    resizeId: number | undefined;
    constructor(options: any);
    private initialize;
    setMinColumnWidth(w: number): void;
    drawGrid(): void;
}
