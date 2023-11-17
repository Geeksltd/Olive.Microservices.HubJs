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
    getMenu(): FeaturesMenu;
}
export default class FeaturesMenu {
    private url;
    private waiting;
    private ajaxRedirect;
    constructor(url: Url, waiting: Waiting, ajaxRedirect: AjaxRedirect);
    enableIFrameClientSideRedirection(selector: JQuery): void;
    showSubMenu(): void;
    bindExpandIcons(menuItems: JQuery): void;
    bindFeatureMenuItemsClicks(selector: JQuery): void;
    bindMidMenuItemsClicks(selector: JQuery): void;
    onMidMenuClicked(link: JQuery): void;
    getPathName(): {
        pathname: string;
        pathnameWithBrackets: string;
    };
    onLinkClicked(link: JQuery): boolean;
    generatePageBreadcrumb(data: any): void;
    getObjects(obj: any, key: any, val: any): any[];
}
