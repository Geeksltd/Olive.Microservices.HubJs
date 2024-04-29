import 'jquery';

export interface MasonaryOptions {
    minColumnWidth: number
    parentSelector: string
    itemsSelector: string
}

export default class MasonryGrid {
    options: MasonaryOptions;
    parent: HTMLElement;
    items: NodeListOf<Element>;
    resizeObserver: ResizeObserver;
    resizeId: number | undefined;
    lastSchematic: Array<Array<number>> = [[]];

    constructor(options) {
        this.options = options;
        this.initialize();
    }

    private initialize() {
        try {
            this.parent = document.querySelector<HTMLElement>(this.options.parentSelector);
            this.items = !this.parent
                ? undefined
                : this.parent.querySelectorAll(this.options.parentSelector + ' > ' + this.options.itemsSelector);

            if (!this.parent || !this.items || !this.items.length) return;

            const o = function (entries) {
                this.drawGrid();
            }.bind(this);
            this.resizeObserver = new ResizeObserver(o);

            this.resizeObserver.observe(this.parent);
            this.items.forEach(item => this.resizeObserver.observe(item));
        } catch (error) {
            console.error(error);
            setTimeout(() => {
                this.initialize();
            }, 100);
        }
    }

    setMinColumnWidth(w: number) {
        this.options.minColumnWidth = w;
        this.drawGrid();
    }

    drawGrid() {
        if (this.resizeId) {
            clearTimeout(this.resizeId);
        }

        if (!this.parent || !this.items || !this.items.length) return;

        this.resizeId = setTimeout(function () {
            const parentWidth = this.parent.clientWidth;
            const columnCount = Math.max(Math.floor(parentWidth / this.options.minColumnWidth), 1);

            const newItems = this.parent.querySelectorAll(this.options.parentSelector + ' > ' + this.options.itemsSelector);

            const newSchematic = this.generateSchematic(columnCount);
            if (this.lastSchematic) {
                if (this.areEqualSchematics(this.lastSchematic, newSchematic))
                    return;
                else
                    this.lastSchematic = newSchematic;
            } else {
                this.lastSchematic = newSchematic;
            }

            this.items.forEach(item => {
                if (item.parentElement != this.parent)
                    this.parent.appendChild(item);
            });

            this.parent.querySelectorAll(".column").forEach(element => {
                element.remove();
            });

            for (let i = 0; i < columnCount; i++) {
                this.parent.insertAdjacentHTML("beforeend", "<div class='column'></div>");
            }

            for (let c = 0; c < this.lastSchematic.length; c++) {
                const column = this.parent.querySelectorAll(".column")[c]
                for (let i = 0; i < this.lastSchematic[c].length; i++) {
                    column.appendChild(this.items[this.lastSchematic[c][i]]);
                }
            }

            newItems.forEach(item => this.resizeObserver.observe(item));
            this.resizeId = undefined;
        }.bind(this), 500);
    }

    areEqualSchematics(a, b) {
        return JSON.stringify(a) === JSON.stringify(b);
    }

    generateSchematic(columnCount) {

        var result = [];
        var schematic = [];

        for (let i = 0; i < columnCount; i++) {
            result.push({ index: i, height: 0 });
            schematic.push([]);
        }

        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            result.sort((a, b) => a.height - b.height);
            const index = result[0].index;
            result[0].height += item.clientHeight;
            schematic[index].push(i);
        }

        return schematic;
    }
}