export default class WidgetModule {
    input: JQuery;
    constructor(targetInput: JQuery);
    static enableWidget(selector: JQuery): void;
    enableWidget(): void;
}
