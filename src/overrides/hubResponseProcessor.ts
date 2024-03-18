import { getMainDomain } from "app/hub";
import ResponseProcessor from "olive/mvc/responseProcessor";


export default class HubResponseProcessor extends ResponseProcessor {
    private fixUrlForOpenNewWindows(service: string, url: string) {
        if (!service || !url)
            return url;
        if (url.contains(":"))
            return url;
        if (url.contains("[") && url.contains("]"))
            return url;
        if (service == "hub" || service == undefined || service == null)
            return url;

        return "/" + service + "/" + url.trimStart("/");
    }
    // private fixElementForOpenNewWindows(element: JQuery) {
    //     if ($(element).closest(".hub-service").length > 0) return;
    //     let serviceContainer = $(element).closest("service[of]");
    //     if (!serviceContainer || !serviceContainer.length) {
    //         serviceContainer = $("service[of]");
    //     }
    //     if (serviceContainer.length > 0) {
    //         let url = element.attr("href");
    //         if (!url.contains(":")) {
    //             element.attr("ajax-href", url)
    //             url = this.fixUrlForOpenNewWindows(serviceContainer.attr('of'), url)
    //             if (url.indexOf("undefined") < 0)
    //                 element.attr("ajax-href", url)
    //         }
    //     }
    // }
    private fixUrlsForOpenNewWindows(response: any, trigger: JQuery) {
        var asElement = $(response);

        if (asElement.closest(".hub-service").length > 0 || asElement.hasClass("hub-service") || asElement.attr("data-module") == "MYPriorityView")
            return asElement;

        let serviceContainer = undefined;
        if (trigger && trigger.length && (trigger.is("main[name^='$']") || trigger.is("[target^='$']"))) {
            if (trigger.is("main[name^='$']")) serviceContainer = trigger.closest("service[of]");
            else serviceContainer = $("main[name='" + trigger.attr('target') + "']").closest("service[of]");
        }
        else {
            serviceContainer = $("service[of]");
        }

        if (serviceContainer.length > 0) {
            const service = serviceContainer.attr("of");
            var aTags = asElement.find("a:not([target^='$'])")
            for (var i = 0; i < aTags.length; i++) {
                var element = aTags.get(i);
                var url = $(element).attr("href");
                if (url != undefined && url != null && !url.contains(":")) {
                    $(element).attr("ajax-href", url);
                    url = this.fixUrlForOpenNewWindows(service, url)
                    if (url.indexOf("undefined") < 0)
                        $(element).attr("href", url);
                }

            }
        }
        return asElement;
    }
    public processAjaxResponse(response: any, containerModule: JQuery, trigger: JQuery, args: any, ajaxTarget?: string, ajaxhref?: string) {
        let asElement = $(response);
        asElement = this.fixUrlsForOpenNewWindows(response, trigger);
        if (ajaxTarget) {
            var currentPath = document.URL;
            if (currentPath.contains("?$")) {
                currentPath = currentPath.substring(0, currentPath.indexOf("?"));
            }
            trigger = $("main[name='" + ajaxTarget + "']");
            if (ajaxhref != undefined && ajaxhref != null && ajaxhref.contains(".aspx")) {
                trigger.empty();
                trigger.append($("<iframe name='dashboard-frame'>"));
                trigger = $("iframe[name='dashboard-frame']");
                trigger.attr("src", ajaxhref.replace("hub." + getMainDomain() + "/dashboard", "dashboard." + getMainDomain()));
                trigger.attr("class", "view-frame embed-responsive-item w-100 h-100");
                trigger.attr("frameBorder", "0");
                history.pushState({}, "", currentPath + "?$" + ajaxTarget + "=" + ajaxhref);
                return;
            }
            this.onViewChanged(asElement, trigger);
            history.pushState({}, "", currentPath + "?$" + ajaxTarget + "=" + ajaxhref);
            return;
        }

        if (trigger != null && trigger.is("[data-module-inner]") && typeof (response) != typeof ([])) {
            let innerMadule = $("[data-module-inner-container]");
            innerMadule.html('').append(asElement);
            trigger = asElement.find("[data-module]")
            this.onViewChanged(asElement, trigger);
            return;
        }

        if (trigger != null && trigger.is("[data-module-target]") && typeof (response) != typeof ([])) {
            let targetModule = $("[data-module='" + trigger.attr("data-module-target") + "']");
            targetModule.replaceWith(asElement);
            this.onViewChanged(asElement, trigger);
            return;
        }

        if (asElement.is("main")) {
            this.navigate(asElement, trigger, args);
            return;
        }

        if (asElement.is("[data-module]") && containerModule != null) {
            containerModule.replaceWith(asElement);
            this.onViewChanged(asElement, trigger);
            return;
        }



        if (response.length == 1 && response[0].ReplaceView && containerModule != null) {
            asElement = $("<div/>").append(response[0].ReplaceView);
            containerModule.replaceWith(asElement);
            this.onViewChanged(asElement, trigger);
            return;
        }

        if (trigger && trigger.is("[data-add-subform]") && containerModule != null) {
            let subFormName = trigger.attr("data-add-subform");
            let container = containerModule.find("[data-subform=" + subFormName + "] > table tbody:first");

            if (container.length == 0)
                container = containerModule.find("[data-subform=" + subFormName + "]:first");

            container.append(asElement);
            // this.masterDetail.updateSubFormStates();
            this.onSubformChanged(response, trigger);
            this.onViewChanged(asElement, trigger);
            return;
        }

        // List of actions
        if (typeof (response) == typeof ([]))
            this.onNothingFoundToProcess(response, trigger);
    }
}