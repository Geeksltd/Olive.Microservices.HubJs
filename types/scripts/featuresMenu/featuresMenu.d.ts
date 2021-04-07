import Url from 'olive/components/url';
import Waiting from 'olive/components/waiting';
import AjaxRedirect from 'olive/mvc/ajaxRedirect';
export declare class FeaturesMenuFactory implements IService {
    private url;
    private waiting;
    private ajaxRedirect;
    constructor(url: Url, waiting: Waiting, ajaxRedirect: AjaxRedirect);
    enableFeaturesTreeView(): void;
    bindItemListClick(): void;
    show(featureId: string): void;
}
export default class FeaturesMenu {
    private url;
    private waiting;
    private ajaxRedirect;
    constructor(url: Url, waiting: Waiting, ajaxRedirect: AjaxRedirect);
    enableIFrameClientSideRedirection(selector: JQuery): void;
    showSubMenu(): void;
    showSubMenuOf(parent: any): void;
    bindExpandIcons(): void;
    bindFeatureMenuItemsClicks(selector: JQuery): void;
    bindMidMenuItemsClicks(selector: JQuery): void;
    onMidMenuClicked(link: JQuery): void;
    bindSubMenuClicks(selector: JQuery): void;
    onSubMenuClicked(link: JQuery): void;
    getPathName(): {
        pathname: string;
        pathnameWithBrackets: string;
    };
    onLinkClicked(link: JQuery): void;
    generateTopMenu(Handlebars: any, element: any): void;
    generateTopMenuHtml(topMenuData: any, element: any, Handlebars: any): void;
    getObjects(obj: any, key: any, val: any): any[];
}
