import AjaxRedirect from "olive/mvc/ajaxRedirect";
import Service from "app/model/service";
import Url from "olive/components/url";
import ResponseProcessor from "olive/mvc/responseProcessor";
import Waiting from "olive/components/waiting";
import ErrorViewsNavigator from "app/error/errorViewsNavigator";

export default class HubAjaxRedirect extends AjaxRedirect {
    constructor(url: Url, responseProcessor: ResponseProcessor, waiting: Waiting) {
        super(url, responseProcessor, waiting);
    }

    protected onRedirected(trigger: JQuery, title: string, url: string) {
        // if trigger is a main tag with name starting by $ character or it has a parent with this conditions
        // we need to edit a query string parameter as _{main tag name without $}={url pathname}
        const mainTag = trigger.is("main[name^='$']") ? trigger : trigger.closest("main[name^='$']")
        if (mainTag && mainTag.length) {
            const service = Service.fromUrl(url);
            var urlData = new URL(url);
            const relativeUrl = `/[${service.Name.toLowerCase()}]${urlData.pathname}${urlData.search}`;
            url = this.url.updateQuery(this.url.current(), mainTag.attr("name").replace("$", "_"), this.url.encodeGzipUrl(relativeUrl));
            history.pushState({}, title, url);
            return;
        }
        Service.onNavigated(url, title);
    }

    protected onRedirectionFailed(trigger: JQuery, url: string, response: JQueryXHR) {
        if (response.status == 401) {
            document.location.href = url;
        }
        else {
            let service = Service.fromUrl(url);
            if (service)
                ErrorViewsNavigator.showServiceError(trigger, service, url, response);
            else
                super.onRedirectionFailed(trigger,url, response);
        }
    }

    public go(
        url: string,
        trigger: JQuery = null,
        isBack: boolean = false,
        keepScroll: boolean = false,
        addToHistory = true,
        onComplete?: (successful: boolean) => void,
        ajaxTarget?: string,
        ajaxhref?: string
    ): boolean {
        if (!$(trigger).parent().hasClass("modal-body"))
            $("iframe.view-frame").attr("src", "").attr("style", "");
        return super.go(url, trigger, isBack, keepScroll, addToHistory, onComplete, ajaxTarget, ajaxhref);
    }
}
