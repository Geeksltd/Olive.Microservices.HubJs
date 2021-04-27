define(["require", "exports", "olive/olivePage", "./featuresMenu/featuresMenu", "./appContent", "./badgeNumber", "./toggleCheckbox", "./widgetModule", "./expandCollapse", "./featuresMenu/breadcrumbMenu", "./featuresMenu/fullMenuFiltering", "olive/di/services", "./overrides/hubAjaxRedirect", "./overrides/hubForm", "./hubServices", "./hub", "./overrides/hubUrl", "./hubModal", "./boardComponents", "jquery", "jquery-ui-all", "jquery-validate", "jquery-validate-unobtrusive", "underscore", "alertify", "smartmenus", "file-upload", "jquery-typeahead", "combodate", "js-cookie", "handlebars", "hammerjs", "jquery-mentions", "chosen", "jquery-elastic", "jquery-events-input", "popper", "bootstrap", "validation-style", "file-style", "spinedit", "password-strength", "slider", "moment", "moment-locale", "datepicker", "bootstrapToggle", "bootstrap-select", "flickity"], function (require, exports, olivePage_1, featuresMenu_1, appContent_1, badgeNumber_1, toggleCheckbox_1, widgetModule_1, expandCollapse_1, breadcrumbMenu_1, fullMenuFiltering_1, services_1, hubAjaxRedirect_1, hubForm_1, hubServices_1, hub_1, hubUrl_1, hubModal_1, boardComponents_1) {
    Object.defineProperty(exports, "__esModule", { value: true });
    class HubPage extends olivePage_1.default {
        constructor() {
            super();
            new fullMenuFiltering_1.default();
            new boardComponents_1.default(null);
            this.getService(hubServices_1.default.Hub).initialize();
            setTimeout(() => badgeNumber_1.default.enableBadgeNumber($("a[data-badgeurl]")), 4 * 1000);
            //every 5 min badge numbers should be updated
            window.setInterval(() => { badgeNumber_1.default.enableBadgeNumber($("a[data-badgeurl]")); }, 5 * 60 * 1000);
            expandCollapse_1.default.enableExpandCollapse("#sidebarCollapse", ".side-bar");
            expandCollapse_1.default.enableExpandCollapse("#taskBarCollapse", ".task-bar");
            $("#iFrameHolder").hide();
            $("iframe.view-frame").attr("src", "").attr("style", "");
        }
        configureServices(services) {
            services.addSingleton(services_1.default.Url, () => new hubUrl_1.default());
            services.addSingleton(hubServices_1.default.Hub, (url, ajaxRedirect, featuresMenuFactory, breadcrumbMenu, responseProcessor) => new hub_1.default(url, ajaxRedirect, featuresMenuFactory, breadcrumbMenu, responseProcessor))
                .withDependencies(services_1.default.Url, services_1.default.AjaxRedirect, hubServices_1.default.FeaturesMenuFactory, hubServices_1.default.BreadcrumbMenu, services_1.default.ResponseProcessor);
            services.addSingleton(hubServices_1.default.FeaturesMenuFactory, (url, waiting, ajaxRedirect) => new featuresMenu_1.FeaturesMenuFactory(url, waiting, ajaxRedirect))
                .withDependencies(services_1.default.Url, services_1.default.Waiting, services_1.default.AjaxRedirect);
            services.addSingleton(hubServices_1.default.AppContent, (waiting, ajaxRedirect) => new appContent_1.default(waiting, ajaxRedirect))
                .withDependencies(services_1.default.Waiting, services_1.default.AjaxRedirect);
            services.addSingleton(hubServices_1.default.BreadcrumbMenu, (ajaxRedirect) => new breadcrumbMenu_1.default(ajaxRedirect))
                .withDependencies(services_1.default.AjaxRedirect);
            services.addSingleton(services_1.default.AjaxRedirect, (url, responseProcessor, waiting) => new hubAjaxRedirect_1.default(url, responseProcessor, waiting))
                .withDependencies(services_1.default.Url, services_1.default.ResponseProcessor, services_1.default.Waiting);
            services.addSingleton(services_1.default.Form, (url, validate, waiting, ajaxRedirect) => new hubForm_1.default(url, validate, waiting, ajaxRedirect))
                .withDependencies(services_1.default.Url, services_1.default.Validate, services_1.default.Waiting, services_1.default.AjaxRedirect);
            services.addSingleton(services_1.default.ModalHelper, (url, ajaxRedirect, responseProcessor) => new hubModal_1.default(url, ajaxRedirect, responseProcessor))
                .withDependencies(services_1.default.Url, services_1.default.AjaxRedirect, services_1.default.ResponseProcessor);
            super.configureServices(services);
        }
        revive() {
            super.initialize();
        }
        getPathName() {
            var path = window.location.pathname.toLowerCase().startsWith("/") ? window.location.pathname.toLowerCase().substring(1) : window.location.pathname.toLowerCase();
            var pos = path.indexOf("/");
            return {
                pathname: window.location.pathname.toLowerCase(),
                pathnameWithBrackets: "/[" + path.substring(0, pos) + "]" + path.substring(pos)
            };
        }
        initialize() {
            super.initialize();
            this.getService(hubServices_1.default.FeaturesMenuFactory).bindItemListClick();
            this.getService(hubServices_1.default.BreadcrumbMenu).bindItemListClick();
            const appcontext = this.getService(hubServices_1.default.AppContent);
            appcontext.enableContentBlock($("AppContent"));
            appcontext.enableHelp($("Help"));
            toggleCheckbox_1.default.enableToggleCheckbox($("input[class='form-check']"));
            widgetModule_1.default.enableWidget($("Widget"));
            let currentService = $("service[of]").attr("of");
            if (currentService) {
                currentService = currentService.toLocaleLowerCase();
            }
            var pathname = this.getPathName();
            var currentMenu = $("a[href='" + pathname.pathname + "']:not(.feature-button)");
            if (currentMenu.length == 0) {
                //var path = window.location.pathname.toLowerCase().startsWith("/") ? window.location.pathname.toLowerCase().substring(1) : window.location.pathname.toLowerCase();
                //var pos = path.indexOf("/");
                //currentMenu = $("a[href='/[" + path.substring(0, pos) + "]" + path.substring(pos) + "']:not(.feature-button)");
                currentMenu = $("a[href='" + pathname.pathnameWithBrackets + "']:not(.feature-button)");
            }
            if (currentMenu.length > 0 && HubPage.IsFirstPageLoad == true) {
                if (currentMenu.parent().attr("is-side-menu-child") == "true")
                    currentMenu.parent().parent().parent().addClass("active").attr("expand", "true");
                currentMenu.addClass("active");
                HubPage.IsFirstPageLoad = false;
                if (window.location.search != "") {
                    var origUrl = currentMenu.attr("href");
                    currentMenu.attr("href", origUrl + window.location.search);
                    currentMenu.first().click();
                    setTimeout(function () {
                        currentMenu.attr("href", origUrl);
                    }, 500);
                }
                else
                    currentMenu.first().click();
            }
            // This function is called upon every Ajax update as well as the initial page load.
            // Any custom initiation goes here.
        }
    }
    exports.default = HubPage;
    // Here you can override any of the base standard functions.
    // e.g: To use a different AutoComplete library, simply override handleAutoComplete(input).
    HubPage.IsFirstPageLoad = true;
});
//window["page"] = new AppPage();
//# sourceMappingURL=hubPage.js.map