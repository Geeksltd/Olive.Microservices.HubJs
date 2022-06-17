export default class HubInstantSearch {
    public static enable(selector: JQuery) {
        selector.each((i, e) => new HubInstantSearch($(e)).enable());
    }

    constructor(private input: JQuery) { }

    private enable() {
        this.input.off("keyup.immediate-filter").on("keyup.immediate-filter", this.onChanged);

        this.input.on("keydown", e => {
            if (e.keyCode == 13) e.preventDefault();
        });
    }

    private onChanged(event: any) {
        this.input = this.input || $(event.currentTarget);
        let keywords = this.input.val().toLowerCase().split(' ');
        let rows = this.input.closest('[data-module]').find(".olive-instant-search-item");

        rows.each((index, e) => {
            let row = $(e);
            let content = row.text().toLowerCase();
            let hasAllKeywords = keywords.filter((i) => content.indexOf(i) == -1).length == 0;
            if (hasAllKeywords) row.show(); else row.hide();
        });
    }
}