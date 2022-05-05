import AjaxRedirect from "olive/mvc/ajaxRedirect";
export default class BreadcrumbMenu implements IService {
    private ajaxRedirect;
    constructor(ajaxRedirect: AjaxRedirect);
    enableBreadcrumb(): void;
    bindItemListClick(): void;
    bindFeatureMenuItemsClicks(selector: JQuery): void;
    onLinkClicked(link: JQuery): void;
    onBreadcrumbLinkClicked(link: JQuery): boolean;
    initBreadcrumb(): void;
    generateBreadcrumb(link: JQuery): void;
    removeDuplicate(items: Array<any>): any[];
}
