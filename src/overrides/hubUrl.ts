import Url from "olive/components/url";
import Service from "app/model/service";

export default class HubUrl extends Url {
    goBack = function (target) {
        
        if (this.current().indexOf(this.baseContentUrl + "/##") === 0)
            history.back();

        else {
            var returnUrl = this.getQuery("ReturnUrl");
            returnUrl = this.decodeGzipUrl(returnUrl);
            if (returnUrl) {
                let isInServiceTag = $(target).closest("service").length > 0;
                let serviceName = isInServiceTag ? $(target).closest("service").attr("of") : undefined;
                if (isInServiceTag && !window.location.pathname.startsWith("/" + serviceName)) {
                    window.location.href = "/" + serviceName + returnUrl.substring(1)
                } else
                    window.location.href = returnUrl;
            }
            else
                history.back();
        }
    }
    effectiveUrlProvider = (url: string, trigger?: JQuery): string => {

        if (!url) url = "";

        //$("#iFrameHolder").hide(); //hide any opened iFrame content after ajax call.
        //$("iframe.view-frame").attr("src", "").attr("style", ""); // remove previous path

        let serviceName: string;
        let serviceContainer = trigger ? trigger.closest("service[of]") : $("service[of]").first();

        if (serviceContainer.length === 0) serviceContainer = $("service[of]").first();

        if (serviceContainer.length === 0)
            throw new Error("<service of='...' /> is not found on the page.");

        const setServiceName = (sn: string, pn: string) => {
            serviceContainer.attr("of", sn);
            serviceContainer.attr("page", pn);
        }

        //upload with parameters
        if (trigger && trigger.attr("parameters")) {
            url = url + trigger.attr("parameters");
        }

        serviceName = serviceContainer.attr("of").toLocaleLowerCase();

        if (!this.isAbsolute(url)) {

            let innerUrl: string = "";

            if (url.startsWith("/")) innerUrl = url.trimStart("/");
            else innerUrl = url;

            // Explicitly specified on the link?
            if (innerUrl.startsWith("[") && innerUrl.contains("]")) {
                serviceName = innerUrl.substring("[".length, innerUrl.indexOf("]"));
                innerUrl = innerUrl.substring(serviceName.length + 2);

                let page = "";
                const urlParts = innerUrl.split('/').filter(a => !!a);
                if (urlParts.length) {
                    page = urlParts[0];
                    if (page.indexOf("?") !== -1) {
                        page = page.split("?")[0];
                    }
                }
                setServiceName(serviceName, page);
            }

            //All urls starting with "under" are from HUB service.
            if (innerUrl.startsWith("under")) {
                serviceName = "hub";
                setServiceName(serviceName, "");
            }

            var baseUrl = Service.fromName(serviceName).BaseUrl;

            if (!baseUrl.startsWith("http"))
                baseUrl = baseUrl.withPrefix("http://");
            
            return this.makeAbsolute(baseUrl, innerUrl);
        }

        if (url.contains("/under/")) {
            setServiceName("hub", "");
            $(".task-bar").addClass("d-lg-flex");
        }

        //URL is absolute for sure
        return url;
    }
}
