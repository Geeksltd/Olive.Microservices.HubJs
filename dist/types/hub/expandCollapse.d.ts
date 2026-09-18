export default class ExpandCollapse {
    button: JQuery;
    backdrop: JQuery;
    panel: JQuery;
    page: JQuery;
    side: string;
    key: string;
    cookies: any;
    static readonly EXPANDED = "expanded";
    static readonly COLLAPSED = "collapsed";
    constructor(side: string);
    static enableExpandCollapse(side: string): void;
    static autoCloseOnMobile(): void;
    static isMobile(): boolean;
    isExpanded(): boolean;
    initialize(): void;
    toggle(): void;
    apply(expanded?: boolean): void;
    applyIcon(): void;
    syncHubFrame(): void;
}
