/// <amd-dependency path='olive/olivePage' />

import Url from "olive/components/url";
import { FeaturesMenuFactory } from "./featuresMenu/featuresMenu";
import AjaxRedirect from "olive/mvc/ajaxRedirect";
import ResponseProcessor from 'olive/mvc/responseProcessor';
import CrossDomainEvent from "olive/components/crossDomainEvent";
import Service from "./model/service";
import BreadcrumbMenu from "./featuresMenu/breadcrumbMenu";
import { ModalHelper } from "lib/olive.mvc/typings/components/modal";
import HubInstantSearch from "./hubInstantSearch";

export default class Hub implements IService {
    constructor(
        private url: Url,
        private ajaxRedirect: AjaxRedirect,
        private featuresMenuFactory: FeaturesMenuFactory,
        private breadcrumbMenu: BreadcrumbMenu,
        private responseProcessor: ResponseProcessor
    ) { }

    public initialize() {
        Service.registerServices();
        this.featuresMenuFactory.enableFeaturesTreeView();
        this.breadcrumbMenu.enableBreadcrumb();
        window["resolveServiceUrl"] = this.url.effectiveUrlProvider;

        CrossDomainEvent.handle("setViewFrameHeight", h => this.setViewFrameHeight(h));
        CrossDomainEvent.handle("setServiceUrl", u => Service.onNavigated(u.url, u.title));
        CrossDomainEvent.handle("openModal", u => {
            if (u.url) {
                window.page.modal.close();
                window.page.modal.open(null, u.url);
            }
        });

        console.log("here");
        //initial right task menu after 3 sec delay.
        this.initRightTaskMenu();

        //this function deal with touch events for task system.
        this.initServiceWorker();

        this.loadServiceHealthChecks();
        HubInstantSearch.enable($("[name=HubInstantSearch]"));
    }

    initRightTaskMenu() {
        setTimeout(() => {
            var iframe = $("#taskiFram-container");
            if (iframe.is(":visible") && iframe.attr("data-src")) {
                let src = iframe.attr("data-src");
                iframe.removeAttr("data-src");

                $.ajax({
                    url: src,
                    type: 'GET',
                    xhrFields: { withCredentials: true },
                    async: !false,
                    success: (response) => {
                        this.responseProcessor.processAjaxResponse(response, iframe.find(".module-content"), null, null);
                    },
                    error: (event) => {
                    },
                    complete: (x) => {
                    }
                });
            }
            this.loadTimesheetsWidget();
            //setInterval(this.loadTimesheetsWidget, 60 * 1000 * 10);
        }, 2000);
    }


    loadTimesheetsWidget(): void {
        var iframe2 = $("#timesheets-container");
        if (iframe2.is(":visible") && iframe2.attr("data-src")) {
            let src = iframe2.attr("data-src");
            $.ajax({
                url: src,
                type: 'GET',
                xhrFields: { withCredentials: true },
                async: !false,
                success: (response) => {
                    this.responseProcessor.processAjaxResponse(response, iframe2.find(".module-content"), null, null);
                    this.handleChange();
                },
                error: (event) => {
                },
                complete: (x) => {
                }
            });
        }
    }

    handleChange(): void {
        var iframe2 = $("#timesheets-container");
        iframe2.find('#shouldReloadTimeSheetsWidget').change((e) => {
            let src = iframe2.attr("data-src");
            setTimeout(() => {
                $.ajax({
                    url: src,
                    type: 'GET',
                    xhrFields: { withCredentials: true },
                    async: !false,
                    success: (response) => {
                        this.responseProcessor.processAjaxResponse(response, iframe2.find(".module-content"), null, null);
                        this.handleChange();
                    },
                    error: (event) => {
                    },
                    complete: (x) => {
                    }
                })
            }, 2000);
        });
    }

    loadServiceHealthChecks(): void {
        $(".service-tiles .tile").each((inx, item) => {
            var _this = $(item);
            _this.css("background", "yellow");
            $.get(_this.attr('url'), () => {
                _this.css("background", "green");
            }).fail(() => {
                _this.css("background", "red");
            });
        });
    }

    setViewFrameHeight(height) {
        if (height <= 0) return;

        height = Math.max($(".side-bar").height() - 400, height);

        var currentFrameHeight = $("iframe.view-frame").height();

        if (currentFrameHeight < height) this.setiFrameHeight(height);
        else {
            // Frame is larger. But is it too large?
            if (currentFrameHeight > height + 150) this.setiFrameHeight(height);
        }
    }

    setiFrameHeight(height: number) {
        let iFrame = $("iframe.view-frame");
        if (iFrame.attr("src") !== "")
            iFrame.css("cssText", "height: " + (height + 80) + "px !important;");
        else
            iFrame.hide();
    }

    public go(url: string, iframe: boolean,trigger:any) {
        if (iframe) {
            url = this.url.effectiveUrlProvider(url, null);
            if($(trigger).closest("[data-module-inner]").length > 0){
                $("iframe.view-frame").attr("src", url);
                $(".iframe.view-frame").show();
                $(".feature-frame-view").show();
            }
            else{
                $("iframe.view-frame").attr("src", url);
                $(".feature-frame-view").show();
                $("main").hide();
            }
            
        }
        else this.ajaxRedirect.go(url,trigger);
    }

    initServiceWorker(): any {
        if ("serviceWorker" in navigator) {
            try {
                navigator.serviceWorker
                    .register("service-worker.js")
                    .then(() => {
                        console.log("Service worker registered");
                    })
                    .catch(error => { console.log(error); });
            }
            catch (err) {
                console.log(err);
            }
        }
    }
}