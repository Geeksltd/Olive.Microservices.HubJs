﻿import AjaxRedirect from "olive/mvc/ajaxRedirect";
import Service from "app/model/service";
import Url from "olive/components/url";
import ResponseProcessor from "olive/mvc/responseProcessor";
import Waiting from "olive/components/waiting";
import ErrorViewsNavigator from "app/error/errorViewsNavigator";

export default class HubAjaxRedirect extends AjaxRedirect {
    constructor(url: Url, responseProcessor: ResponseProcessor, waiting: Waiting) {
        super(url, responseProcessor, waiting);
    }

    protected onRedirected(title: string, url: string) {
        Service.onNavigated(url, title);
    }

    protected onRedirectionFailed(url: string, response: JQueryXHR) {
        let service = Service.fromUrl(url);

        if (service)
            ErrorViewsNavigator.goToServiceError(service, url);
        else
            super.onRedirectionFailed(url, response);
    }

    public go(
        url: string,
        trigger: JQuery = null,
        ajaxTarget: string = undefined,
        isBack: boolean = false,
        keepScroll: boolean = false,
        addToHistory = true,
        onComplete?: (successful: boolean) => void): boolean {
        if (!$(trigger).parent().hasClass("modal-body"))
            $("iframe.view-frame").attr("src", "").attr("style", "");
        return super.go(url, trigger, ajaxTarget, isBack, keepScroll, addToHistory, onComplete);
    }
}
