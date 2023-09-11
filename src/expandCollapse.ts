import { FeaturesMenuFactory } from "./featuresMenu/featuresMenu";
declare var requirejs: any;

export default class ExpandCollapse {
    button: JQuery;
    panel: JQuery;
    key: string;
    cookies: any;
    featuresMenuFactory: FeaturesMenuFactory

    constructor(button: JQuery, panelKey: string) {
        this.button = button.click(() => this.toggle());
        this.panel = $(this.key = panelKey);
    }

    public static enableExpandCollapse(buttonSelector: string, panelSelector: string) {
        new ExpandCollapse($(buttonSelector), panelSelector).initialize();
    }

    isCollapsed() {
        if (this.cookies.get(this.key) === 'collapsed') return true;
        else return false;
    }

    initialize(): void {
        requirejs(["js-cookie"], x => {
            this.cookies = x;
            this.apply();
        });
    }

    toggle() {
        this.cookies.set(this.key, this.isCollapsed() ? "" : "collapsed", { expires: 7 });
        this.apply();
    }

    apply() {
        if (this.isCollapsed()) {
            this.panel.addClass("collapsed");
            this.button.addClass("collapse");
        }
        else {
            this.button.removeClass("collapse");
            this.panel.removeClass("collapsed");

            var iframe = this.panel.find("iframe[data-src]");
            if (iframe.length) iframe.attr("src", iframe.attr("data-src")).removeAttr("data-src");
        }

        this.applyIcon();
        this.syncHubTopMenu();
    }

    applyIcon() {
        var customCollapsedIcon = this.button.attr("data-icon-collapsed");
        var customExpandedIcon = this.button.attr("data-icon-expanded");

        var collapsedIcon = customCollapsedIcon
            ? customCollapsedIcon
            : (this.key == ".side-bar" ? "fa-chevron-right" : "fa-chevron-left");

        var expandedIcon = customExpandedIcon
            ? customExpandedIcon
            : (this.key == ".side-bar" ? "fa-chevron-left" : "fa-chevron-right");

        var toRemove = this.isCollapsed() ? expandedIcon : collapsedIcon;
        var toAdd = this.isCollapsed() ? collapsedIcon : expandedIcon;

        this.button.find("i").removeClass(toRemove).addClass(toAdd);
        this.syncHubFrame();
    }
    syncHubTopMenu() {
        window.page.services.getService("featuresMenuFactory").getMenu().onResize();
        if (window.page.board)
            window.page.board.onResize();

        // let arg = {};
        // let paramW = { command: "sideBarRightToggleEvent", arg: arg };
        // window.parent.postMessage(JSON.stringify(paramW), "*");
    }
    syncHubFrame() {
        let arg = Math.round($("service").height());
        let paramW = { command: "setViewFrameHeight", arg: arg };
        window.parent.postMessage(JSON.stringify(paramW), "*");
    }
}