import AjaxRedirect from "olive/mvc/ajaxRedirect";
import Service from "app/model/service";
import Url from "olive/components/url";
import ResponseProcessor from "olive/mvc/responseProcessor";
import Waiting from "olive/components/waiting";
import ErrorViewsNavigator from "app/error/errorViewsNavigator";
import OlivePage from "olive/olivePage";
import { MainTagHelper } from "olive/components/mainTag";
import Services from "olive/di/services";

export default class HubAjaxRedirect extends AjaxRedirect {
    constructor(url: Url, responseProcessor: ResponseProcessor, waiting: Waiting) {
        super(url, responseProcessor, waiting);
    }

    protected onRedirected(trigger: JQuery, title: string, url: string) {
        if (this.onMainTagRedirected(trigger, title, url)) {
            return;
        }
        Service.onNavigated(url, title);
    }

    // The hub shell renders the page, then loads the service's own content into it by ajax
    // without touching the address bar. That load carries the page's title, and nothing else
    // will supply one until the next navigation, so it is applied here.
    protected onTitleChanged(title: string, url: string) {
        Service.setWindowTitle(url, title);
    }

    protected onMainTagRedirected(trigger: JQuery, title: string, url: string): boolean {
        // if trigger is a main tag with name starting by $ character or it has a parent with this conditions
        // we need to edit a query string parameter as _{main tag name without $}={url pathname}
        const mainTag = this.finalTargetAsMainTag(trigger);
        if (!this.isInternalMainTag(mainTag)) return false;
        const service = Service.fromUrl(url);
        var urlData = new URL(url);
        const relativeUrl = `/[${service.Name.toLowerCase()}]${urlData.pathname}${urlData.search}`;
        (window.page as OlivePage).getService<MainTagHelper>(Services.MainTagHelper)
            .changeUrl(relativeUrl, mainTag.attr("name").replace("$", ""), title);
        return true;
    }

    protected onRedirectionFailed(trigger: JQuery, url: string, response: JQueryXHR) {
        // A request the page itself cancelled is not a failure. Bailing out here rather than only in the
        // error view keeps the address bar and the history entry alone as well, which a user who simply
        // clicked away has no reason to see rewritten to "Error > ...".
        if (response.statusText == "abort") return;

        if (response.status == 401) {
            this.url.goToUrlAfterLogin(this.url.current());
        }
        else {
            let service = Service.fromUrl(url);
            if (service) {
                const mainTag = this.finalTargetAsMainTag(trigger);
                const urlData = new URL(url);
                const addressBar = `/${service.Name.toLowerCase()}${urlData.pathname}${urlData.search}`;

                // The address bar is about to be replaced with the failing address, so capture
                // where the user came from. If they landed on the failing address directly,
                // there is nowhere to go back to.
                const cameFrom = window.location.pathname + window.location.search;
                const backUrl = cameFrom == addressBar ? null : window.location.href;

                if (!this.isInternalMainTag(mainTag)) {
                    window.history.pushState(null, "Error > " + service.Name, addressBar);
                } else {
                    const relativeUrl = `/[${service.Name.toLowerCase()}]${urlData.pathname}${urlData.search}`;
                    (window.page as OlivePage).getService<MainTagHelper>(Services.MainTagHelper)
                        .changeUrl(relativeUrl, mainTag.attr("name").replace("$", ""), "Error > " + service.Name);
                }
                // The address bar now holds the failing page's hub address, so it is also the address
                // that would re-request it. The error view offers it as Try again; a reload would not do,
                // because the main tag branch above leaves the address bar on the surrounding page.
                ErrorViewsNavigator.showServiceError(trigger, service, url, response, backUrl, addressBar);
            }
            else
                // No service maps to this url. Render the same error view (message + reference code)
                // rather than the base class's confirm() dialog, so every failure looks the same to the
                // user. 401 is already handled above, so we are not swallowing the login redirect.
                ErrorViewsNavigator.showGenericError(trigger, url, response);
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
        if (!$(trigger).closest(".modal-body").length)
            $("iframe.view-frame").attr("src", "").attr("style", "");
        return super.go(url, trigger, isBack, keepScroll, addToHistory, onComplete, ajaxTarget, ajaxhref);
    }
}
