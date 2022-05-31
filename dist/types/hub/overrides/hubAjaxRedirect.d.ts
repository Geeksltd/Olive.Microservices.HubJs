import AjaxRedirect from "olive/mvc/ajaxRedirect";
import Url from "olive/components/url";
import ResponseProcessor from "olive/mvc/responseProcessor";
import Waiting from "olive/components/waiting";
export default class HubAjaxRedirect extends AjaxRedirect {
    constructor(url: Url, responseProcessor: ResponseProcessor, waiting: Waiting);
    protected onRedirected(title: string, url: string): void;
    protected onRedirectionFailed(url: string, response: JQueryXHR): void;
    go(url: string, trigger: JQuery, ajaxTarget: string, isBack?: boolean, keepScroll?: boolean, addToHistory?: boolean, onComplete?: (successful: boolean) => void): boolean;
}
