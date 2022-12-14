import Url from "olive/components/url";
import Service from "app/model/service";

export default class HubUrl extends Url {
    goBack = function () {
        if (this.current().indexOf(this.baseContentUrl + "/##") === 0)
            history.back();
            
        else {
            var returnUrl = this.getQuery("ReturnUrl");
            returnUrl = this.decodeGzipUrl(returnUrl);
            if (returnUrl) {
                let isInServiceTag = $(event.target).closest("service").length > 0;
                let serviceName = $("service").attr("of");
                if (isInServiceTag && !window.location.href.startsWith("/" + serviceName)) {
                    window.location.href = "/" + serviceName + returnUrl.substring(1)
                } else
                    window.location.href = returnUrl;
            }
            else
                history.back();
        }
    }
    effectiveUrlProvider = (url: string, trigger?: JQuery): string => {

        //$("#iFrameHolder").hide(); //hide any opened iFrame content after ajax call.
        //$("iframe.view-frame").attr("src", "").attr("style", ""); // remove previous path
        let serviceName: string;
        let serviceContainer = trigger ? trigger.closest("service[of]") : $("service[of]").first();

        if (serviceContainer.length === 0) serviceContainer = $("service[of]").first();

        if (serviceContainer.length === 0)
            throw new Error("<service of='...' /> is not found on the page.");

        serviceName = serviceContainer.attr("of").toLocaleLowerCase();

        if (!this.isAbsolute(url)) {

            let innerUrl: string = "";

            if (url.startsWith("/")) innerUrl = url.trimStart("/");
            else innerUrl = url;

            // Explicitly specified on the link?
            if (innerUrl.startsWith("[") && innerUrl.contains("]")) {
                serviceName = innerUrl.substring(1, innerUrl.indexOf("]"));
                innerUrl = innerUrl.substring(serviceName.length + 2);
                serviceContainer.attr("of", serviceName);
            }

            //All urls starting with "under" are from HUB service.
            if (innerUrl.startsWith("under")) serviceName = "hub";

            var baseUrl = Service.fromName(serviceName).BaseUrl;

            if (!baseUrl.startsWith("http"))
                baseUrl = baseUrl.withPrefix("http://");

            return this.makeAbsolute(baseUrl, innerUrl);
        }

        if (url.contains("/under/")) {
            serviceContainer.attr("of", "Hub");
            $(".task-bar").addClass("d-lg-flex");
        }

        //URL is absolute for sure
        return url;
    }
}
