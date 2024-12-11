
import OlivePage from 'olive/olivePage';
import { FeaturesMenuFactory } from './featuresMenu/featuresMenu';
import BadgeNumber from './badgeNumber';
import ToggleCheckbox from './toggleCheckbox';
import ExpandCollapse from './expandCollapse';
import BreadcrumbMenu from './featuresMenu/breadcrumbMenu';
import FullMenuFiltering from './featuresMenu/FullMenuFiltering';
import { ServiceContainer } from 'olive/di/serviceContainer';
import Services from 'olive/di/services';
import HubAjaxRedirect from './overrides/hubAjaxRedirect';
import HubStandardAction from './overrides/hubStandardAction';
import Alert from 'olive/components/alert'
import Select from 'olive/plugins/select'
import Form from 'olive/components/form'
import { ModalHelper } from 'olive/components/modal'
import Url from 'olive/components/url';
import ResponseProcessor from 'olive/mvc/responseProcessor';
import Waiting from 'olive/components/waiting';
import HubForm from './overrides/hubForm';
import Validate from 'olive/components/validate';
import AjaxRedirect from 'olive/mvc/ajaxRedirect';
import HubServices from './hubServices';
import Hub, { getMainDomain } from './hub';
import HubUrl from './overrides/hubUrl';
import HubModal from './hubModal';
import BoardComponents from './boardComponents';
import HubEcharts from './hubEcharts'
import * as echarts from 'echarts';

// import Chartist from '../lib/@types/chartist/index';

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
// import 'chartist';
import ServerInvoker from 'olive/mvc/serverInvoker';
import HubResponseProcessor from './overrides/hubResponseProcessor';
import { ServiceDescription } from 'olive/di/serviceDescription';
import { MainTagHelper } from 'olive/components/mainTag';


export default class HubPage extends OlivePage {

    // Here you can override any of the base standard functions.
    // e.g: To use a different AutoComplete library, simply override handleAutoComplete(input).
    public static IsFirstPageLoad: boolean = true;
    public board: BoardComponents = null;
    constructor() {
        super();
        new FullMenuFiltering();
        // var myChart = echarts.init('');
        // myChart.setOption({});
        this.getService<Hub>(HubServices.Hub).initialize();
        this.getService<HubEcharts>(HubServices.HubEcharts).initialize();

        ExpandCollapse.enableExpandCollapse("left");
        ExpandCollapse.enableExpandCollapse("right");
        ExpandCollapse.autoCloseOnMobile();

        setTimeout(() => BadgeNumber.enableBadgeNumber($("a[data-badgeurl]")), 4 * 1000);

        //every 5 min badge numbers should be updated
        window.setInterval(() => { BadgeNumber.enableBadgeNumber($("a[data-badgeurl]")); }, 5 * 60 * 1000);

        $("#iFrameHolder").hide();
        $("iframe.view-frame").attr("src", "").attr("style", "");
    }

    configureServices(services: ServiceContainer) {

        const out: IOutParam<ServiceDescription> = {};
        services.addSingleton(Services.Url, () => new HubUrl());
        services.addSingleton(HubServices.HubEcharts, () => new HubEcharts());
        services.tryAddSingleton(Services.ResponseProcessor, () => new HubResponseProcessor(), out);

        services.addSingleton(HubServices.Hub, (url: Url, ajaxRedirect: AjaxRedirect, featuresMenuFactory: FeaturesMenuFactory, breadcrumbMenu: BreadcrumbMenu, responseProcessor: ResponseProcessor) =>
            new Hub(url, ajaxRedirect, featuresMenuFactory, breadcrumbMenu, responseProcessor))
            .withDependencies(Services.Url, Services.AjaxRedirect, HubServices.FeaturesMenuFactory, HubServices.BreadcrumbMenu, Services.ResponseProcessor);

        services.addSingleton(HubServices.FeaturesMenuFactory, (url: Url, waiting: Waiting, ajaxRedirect: AjaxRedirect) =>
            new FeaturesMenuFactory(url, waiting, ajaxRedirect))
            .withDependencies(Services.Url, Services.Waiting, Services.AjaxRedirect);

        services.addSingleton(HubServices.BreadcrumbMenu, (ajaxRedirect: AjaxRedirect) => new BreadcrumbMenu(ajaxRedirect))
            .withDependencies(Services.AjaxRedirect);

        services.addSingleton(Services.AjaxRedirect, (url: Url, responseProcessor: ResponseProcessor, waiting: Waiting) =>
            new HubAjaxRedirect(url, responseProcessor, waiting))
            .withDependencies(Services.Url, Services.ResponseProcessor, Services.Waiting);

        services.addSingleton(Services.StandardAction, (alert: Alert, form: Form, waiting: Waiting, ajaxRedirect: AjaxRedirect,
            responseProcessor: ResponseProcessor, select: Select, modalHelper: ModalHelper, mainTagHelper: MainTagHelper, serviceLocator: IServiceLocator) =>
            new HubStandardAction(alert, form, waiting, ajaxRedirect, responseProcessor, select, modalHelper, mainTagHelper, serviceLocator))
            .withDependencies(Services.Alert, Services.Form, Services.Waiting, Services.AjaxRedirect,
                Services.ResponseProcessor, Services.Select, Services.ModalHelper, Services.MainTagHelper, Services.ServiceLocator);

        services.addSingleton(Services.Form, (url: Url, validate: Validate, waiting: Waiting, ajaxRedirect: AjaxRedirect) =>
            new HubForm(url, validate, waiting, ajaxRedirect))
            .withDependencies(Services.Url, Services.Validate, Services.Waiting, Services.AjaxRedirect);

        //   services.tryAddSingleton
        // if (services.getService(Services.ModalHelper) == null || services.getService(Services.ModalHelper) == undefined)
        // services.addSingleton(Services.ModalHelper, (url: Url, ajaxRedirect: AjaxRedirect, responseProcessor: ResponseProcessor) =>
        //     new HubModal(url, ajaxRedirect, responseProcessor))
        //     .withDependencies(Services.Url, Services.AjaxRedirect, Services.ResponseProcessor);

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
            pathnameWithBrackets: "/[" + path.substring(0, pos) + "]" + path.substring(pos),
            pathnameWithoutHub: window.location.pathname.toLowerCase().replace('/hub/', '/').replace('/[hub]/', '/'),
        };
    }
    initialize() {

        super.initialize();
        this.getService<FeaturesMenuFactory>(HubServices.FeaturesMenuFactory).bindItemListClick();
        this.getService<BreadcrumbMenu>(HubServices.BreadcrumbMenu).bindItemListClick();
        ToggleCheckbox.enableToggleCheckbox($("input[class='form-check']"));

        const currentPath = this.getPathName();
        if (currentPath != undefined && currentPath != null && currentPath.pathname != undefined && currentPath.pathname != null) {
            const allBoards = window["boards"] && window["boards"].length ? window["boards"] : [];
            const currentBoard = allBoards.filter(b => currentPath.pathname.startsWith("/hub/" + b + "/") || currentPath.pathname.startsWith("/" + b + "/"));
            if (currentBoard && currentBoard.length) {

                var initialized = $(".board-components").attr("data-initialized") === 'true';
                if (initialized) return;

                $(".board-components").attr("data-initialized", "true");

                this.board = new BoardComponents($(".board-components"),
                    this.getService<ModalHelper>(Services.ModalHelper),
                    this.getService<AjaxRedirect>(Services.AjaxRedirect),
                    (currentPath.pathname.startsWith("https://hub." + getMainDomain())
                        ? currentPath.pathname
                        : "https://hub." + getMainDomain() + currentPath.pathname));
            }
            else {
                var hubserv = $(".board-components");
                if (hubserv != undefined && hubserv != null) {
                    hubserv.remove();
                }
            }
        }


        //if(this.board == null)
        //    this.board = new BoardComponents($(".board-components"),
        //    this.getService<ModalHelper>(Services.ModalHelper),
        //    this.getService<AjaxRedirect>(Services.AjaxRedirect));

        var currentService = $("service[of]").attr("of");
        //if (currentService == "urls.aspx") {
        //    var currentUrl = document.URL;
        //    var startindex = currentUrl.lastIndexOf("=");
        //    if (startindex != undefined && startindex != null && startindex > 0) {
        //        currentService = currentUrl.substring(startindex + 1, currentUrl.length);
        //    }
        //}

        if (currentService) {
            currentService = currentService.toLocaleLowerCase();
        }
        var pathname = this.getPathName();
        var currentMenu = $("a[href='" + pathname.pathname + "']:not(.feature-button)");
        if (currentMenu.length == 0) {
            currentMenu = $("a[href='" + pathname.pathnameWithBrackets + "']:not(.feature-button)");
        }
        if (currentMenu.length == 0) {
            currentMenu = $("a[href='" + pathname.pathnameWithoutHub + "']:not(.feature-button)");
        }
        if (currentMenu.length == 0 && HubPage.IsFirstPageLoad == true) {
            HubPage.IsFirstPageLoad = false;
            return;
        }
        if (currentMenu.length > 0 && HubPage.IsFirstPageLoad == true) {
            if (currentMenu.parent().attr("is-side-menu-child") == "true")
                currentMenu.parents(".feature-menu-item").attr("expand", "true");
            currentMenu.closest(".feature-menu-item").addClass("active");

            HubPage.IsFirstPageLoad = false;

            if (window.location.search != "") {
                var origUrl = currentMenu.attr("href")
                currentMenu.attr("href", origUrl + window.location.search)
                currentMenu.first().click();
                setTimeout(function () {
                    currentMenu.attr("href", origUrl)
                }, 500);
            }
            else
                currentMenu.first().click();
        }
        // This function is called upon every Ajax update as well as the initial page load.
        // Any custom initiation goes here.
    }
}