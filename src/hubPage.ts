﻿import OlivePage from 'olive/olivePage';
import { FeaturesMenuFactory } from './featuresMenu/featuresMenu';
import AppContent from './appContent';
import BadgeNumber from './badgeNumber';
import ToggleCheckbox from './toggleCheckbox';
import WidgetModule from './widgetModule';
import ExpandCollapse from './expandCollapse';
import BreadcrumbMenu from './featuresMenu/breadcrumbMenu';
import FullMenuFiltering  from './featuresMenu/fullMenuFiltering';
import MenuFiltering  from './featuresMenu/menuFiltering';
import { ServiceContainer } from 'olive/di/serviceContainer';
import Services from 'olive/di/services';
import HubAjaxRedirect from './overrides/hubAjaxRedirect';
import Url from 'olive/components/url';
import ResponseProcessor from 'olive/mvc/responseProcessor';
import Waiting from 'olive/components/waiting';
import HubForm from './overrides/hubForm';
import Validate from 'olive/components/validate';
import AjaxRedirect from 'olive/mvc/ajaxRedirect';
import HubServices from './hubServices';
import Hub from './hub';
import HubUrl from './overrides/hubUrl';
import HubModal from './hubModal';

//loading all modules
import 'jquery';
import 'jquery-ui-all';
import 'jquery-validate';
import 'jquery-validate-unobtrusive';
import 'underscore';
import 'alertify';
import 'smartmenus';
import 'file-upload';
import 'jquery-typeahead';
import 'combodate';
import 'js-cookie';
import 'handlebars';
import 'hammerjs';
import 'jquery-mentions';
import 'chosen';
import 'jquery-elastic';
import 'jquery-events-input';
import 'popper';
import 'bootstrap';
import 'validation-style';
import 'file-style';
import 'spinedit';
import 'password-strength';
import 'slider';
import 'moment';
import 'moment-locale';
import 'datepicker';
import 'bootstrapToggle';
import 'bootstrap-select';
import 'flickity';

export default class HubPage extends OlivePage {

    // Here you can override any of the base standard functions.
    // e.g: To use a different AutoComplete library, simply override handleAutoComplete(input).

    constructor() {
        super();
        new FullMenuFiltering();

        this.getService<Hub>(HubServices.Hub).initialize();
        setTimeout(() => BadgeNumber.enableBadgeNumber($("a[data-badgeurl]")), 4 * 1000);

        //every 5 min badge numbers should be updated
        window.setInterval(() => { BadgeNumber.enableBadgeNumber($("a[data-badgeurl]")); }, 5 * 60 * 1000);

        ExpandCollapse.enableExpandCollapse("#sidebarCollapse", ".side-bar");
        ExpandCollapse.enableExpandCollapse("#taskBarCollapse", ".task-bar");

        $("#iFrameHolder").hide();
        $("iframe.view-frame").attr("src", "").attr("style", "");
    }

    configureServices(services: ServiceContainer) {

        services.addSingleton(Services.Url, () => new HubUrl());

        services.addSingleton(HubServices.Hub, (url: Url, ajaxRedirect: AjaxRedirect, featuresMenuFactory: FeaturesMenuFactory, breadcrumbMenu: BreadcrumbMenu, responseProcessor: ResponseProcessor) =>
            new Hub(url, ajaxRedirect, featuresMenuFactory, breadcrumbMenu, responseProcessor))
            .withDependencies(Services.Url, Services.AjaxRedirect, HubServices.FeaturesMenuFactory, HubServices.BreadcrumbMenu, Services.ResponseProcessor);

        services.addSingleton(HubServices.FeaturesMenuFactory, (url: Url, waiting: Waiting, ajaxRedirect: AjaxRedirect) =>
            new FeaturesMenuFactory(url, waiting, ajaxRedirect))
            .withDependencies(Services.Url, Services.Waiting, Services.AjaxRedirect);

        services.addSingleton(HubServices.AppContent, (waiting: Waiting, ajaxRedirect: AjaxRedirect) =>
            new AppContent(waiting, ajaxRedirect))
            .withDependencies(Services.Waiting, Services.AjaxRedirect);

        services.addSingleton(HubServices.BreadcrumbMenu, (ajaxRedirect: AjaxRedirect) => new BreadcrumbMenu(ajaxRedirect))
            .withDependencies(Services.AjaxRedirect);

        services.addSingleton(Services.AjaxRedirect, (url: Url, responseProcessor: ResponseProcessor, waiting: Waiting) =>
            new HubAjaxRedirect(url, responseProcessor, waiting))
            .withDependencies(Services.Url, Services.ResponseProcessor, Services.Waiting);

        services.addSingleton(Services.Form, (url: Url, validate: Validate, waiting: Waiting, ajaxRedirect: AjaxRedirect) =>
            new HubForm(url, validate, waiting, ajaxRedirect))
            .withDependencies(Services.Url, Services.Validate, Services.Waiting, Services.AjaxRedirect);

        services.addSingleton(Services.ModalHelper, (url: Url, ajaxRedirect: AjaxRedirect, responseProcessor: ResponseProcessor) =>
            new HubModal(url, ajaxRedirect, responseProcessor))
            .withDependencies(Services.Url, Services.AjaxRedirect, Services.ResponseProcessor);

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
        this.getService<FeaturesMenuFactory>(HubServices.FeaturesMenuFactory).bindItemListClick();
        this.getService<BreadcrumbMenu>(HubServices.BreadcrumbMenu).bindItemListClick();
        const appcontext = this.getService<AppContent>(HubServices.AppContent);
        appcontext.enableContentBlock($("AppContent"));
        appcontext.enableHelp($("Help"));
        ToggleCheckbox.enableToggleCheckbox($("input[class='form-check']"));
        WidgetModule.enableWidget($("Widget"));

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
        if (currentMenu.length > 0 && event == undefined) {
            if (currentMenu.parent().attr("is-side-menu-child") == "true")
                currentMenu.parent().parent().parent().addClass("active").attr("expand", "true");
            currentMenu.addClass("active");
            currentMenu.first().click();
        }
        // This function is called upon every Ajax update as well as the initial page load.
        // Any custom initiation goes here.
    }
}

//window["page"] = new AppPage();