import AjaxRedirect from "olive/mvc/ajaxRedirect";
export default class BreadcrumbMenu implements IService {
    private ajaxRedirect;
    private renderedNode;
    private renderedFor;
    constructor(ajaxRedirect: AjaxRedirect);
    enableBreadcrumb(): void;
    bindItemListClick(): void;
    bindFeatureMenuItemsClicks(selector: JQuery): void;
    onLinkClicked(link: JQuery): void;
    refresh(): void;
    onBreadcrumbLinkClicked(link: JQuery): boolean;
    private menuLinkOf;
    private menuLinks;
    private findNodeForLink;
    private findNodeForUrl;
    private normalizeUrl;
    private normalizePath;
    private trailOf;
    render(node: Element, address: string): void;
    private escape;
}
