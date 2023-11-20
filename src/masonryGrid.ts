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

    constructor(options) {
        this.options = options;
        this.initialize();
    }

    private initialize() {
        this.parent = document.querySelector<HTMLElement>(this.options.parentSelector);
        this.items = this.parent.querySelectorAll(this.options.itemsSelector);

        if (!this.parent || !this.items || !this.items.length) return;

        const that = this;

        this.resizeObserver = new ResizeObserver(entries => {
            clearTimeout(that.resizeId);
            that.resizeId = setTimeout(function () {
                that.drawGrid();
                that.resizeId = undefined;
                setTimeout(function () { that.parent.style.setProperty('opacity', '1') }, 100);
            }, 500);
        });

        this.resizeObserver.observe(this.parent);
        this.items.forEach(item => this.resizeObserver.observe(item));
    }

    drawGrid() {
        const parentWidth = this.parent.clientWidth;
        const columnCount = Math.max(parentWidth / this.options.minColumnWidth, 1);

        const newItems = this.parent.querySelectorAll(this.options.parentSelector + ' > ' + this.options.itemsSelector);

        this.items.forEach(item => {
            if (item.parentElement != this.parent)
                this.parent.appendChild(item);
        });

        this.items = this.parent.querySelectorAll(this.options.itemsSelector);

        this.parent.querySelectorAll(".column").forEach(element => {
            element.remove();
        });

        for (let i = 1; i <= columnCount; i++) {
            this.parent.insertAdjacentHTML("beforeend", "<div class='column'></div>");
        }

        var result = [];
        for (let i = 1; i <= columnCount; i++) {
            result.push({ index: i - 1, height: 0 });
        }

        this.items.forEach(item => {
            result.sort((a, b) => a.height - b.height);
            const index = result[0].index;
            const div = this.parent.querySelectorAll(".column")[index]
            div.appendChild(item);
            result[0].height += item.clientHeight;
        });

        newItems.forEach(item => this.resizeObserver.observe(item));
    }
}