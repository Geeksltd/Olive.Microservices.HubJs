import AjaxRedirect from "olive/mvc/ajaxRedirect";
import Url from "olive/components/url";
import ResponseProcessor from "olive/mvc/responseProcessor";
import Waiting from "olive/components/waiting";
export default class HubAjaxRedirect extends AjaxRedirect {
    constructor(url: Url, responseProcessor: ResponseProcessor, waiting: Waiting);
    protected onRedirected(trigger: JQuery, title: string, url: string): void;
    protected onRedirectionFailed(trigger: JQuery, url: string, response: JQueryXHR): void;
    go(url: string, trigger?: JQuery, isBack?: boolean, keepScroll?: boolean, addToHistory?: boolean, onComplete?: (successful: boolean) => void, ajaxTarget?: string, ajaxhref?: string): boolean;
}
