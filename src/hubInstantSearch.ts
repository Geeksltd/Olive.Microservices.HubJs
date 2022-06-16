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

    }
}