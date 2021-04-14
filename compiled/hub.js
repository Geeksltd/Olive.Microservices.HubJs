/// <amd-dependency path='olive/olivePage' />
define(["require", "exports", "olive/components/crossDomainEvent", "./model/service", "./hubInstantSearch", "olive/olivePage"], function (require, exports, crossDomainEvent_1, service_1, hubInstantSearch_1) {
    Object.defineProperty(exports, "__esModule", { value: true });
    class Hub {
        constructor(url, ajaxRedirect, featuresMenuFactory, breadcrumbMenu, responseProcessor) {
            this.url = url;
            this.ajaxRedirect = ajaxRedirect;
            this.featuresMenuFactory = featuresMenuFactory;
            this.breadcrumbMenu = breadcrumbMenu;
            this.responseProcessor = responseProcessor;
        }
        initialize() {
            service_1.default.registerServices();
            this.featuresMenuFactory.enableFeaturesTreeView();
            this.breadcrumbMenu.enableBreadcrumb();
            window["resolveServiceUrl"] = this.url.effectiveUrlProvider;
            crossDomainEvent_1.default.handle("setViewFrameHeight", h => this.setViewFrameHeight(h));
            crossDomainEvent_1.default.handle("setServiceUrl", u => service_1.default.onNavigated(u.url, u.title));
            crossDomainEvent_1.default.handle("openModal", u => {
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
            hubInstantSearch_1.default.enable($("[name=HubInstantSearch]"));
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
        loadTimesheetsWidget() {
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
        handleChange() {
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
                    });
                }, 2000);
            });
        }
        loadServiceHealthChecks() {
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
            if (height <= 0)
                return;
            height = Math.max($(".side-bar").height() - 400, height);
            var currentFrameHeight = $("iframe.view-frame").height();
            if (currentFrameHeight < height)
                this.setiFrameHeight(height);
            else {
                // Frame is larger. But is it too large?
                if (currentFrameHeight > height + 150)
                    this.setiFrameHeight(height);
            }
        }
        setiFrameHeight(height) {
            let iFrame = $("iframe.view-frame");
            if (iFrame.attr("src") !== "")
                iFrame.css("cssText", "height: " + (height + 80) + "px !important;");
            else
                iFrame.hide();
        }
        go(url, iframe) {
            if (iframe) {
                url = this.url.effectiveUrlProvider(url, null);
                $("iframe.view-frame").attr("src", url);
                $(".feature-frame-view").show();
                $("main").hide();
            }
            else
                this.ajaxRedirect.go(url);
        }
        initServiceWorker() {
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
    exports.default = Hub;
});
//# sourceMappingURL=hub.js.map