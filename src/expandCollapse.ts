declare var requirejs: any;

export default class ExpandCollapse {
    button: JQuery;
    backdrop: JQuery;
    panel: JQuery;
    page: JQuery;
    side: string;
    key: string;
    cookies: any;

    constructor(side: string) {
        const button = $(".side-bar-handle." + side);
        const backdrop = $(".side-bar-backdrop." + side);
        this.button = button.click(() => this.toggle());
        this.backdrop = backdrop.click(() => this.toggle());
        this.panel = $(this.key = ".side-bar." + side);
        this.page = $(".page");
        this.side = side;
    }

    public static enableExpandCollapse(side: string) {
        new ExpandCollapse(side).initialize();
    }

    public static autoCloseOnMobile() {
        $(document).on("ajaxComplete", function () {
            if (ExpandCollapse.isMobile()) {
                $(".page").removeClass("expanded-left").removeClass("expanded-right")
            }
        });
    }

    public static isMobile() {
        return window.innerWidth < 992;
    }

    isExpanded() {
        if (this.panel.length && this.cookies.get(this.key) === 'expanded') return true;
        else return false;
    }

    initialize(): void {
        requirejs(["js-cookie"], x => {
            this.cookies = x;
            if (ExpandCollapse.isMobile()) {
                this.page.removeClass("expanded-left");
                this.cookies.set(".side-bar.left", "", { expires: 7 });

                this.page.removeClass("expanded-right");
                this.cookies.set(".side-bar.right", "", { expires: 7 });
            } else {
                this.apply();
            }
            this.page.attr("data-js-init", "true");
        });
    }

    toggle() {
        this.cookies.set(this.key, this.isExpanded() ? "" : "expanded", { expires: 7 });
        this.apply();
    }

    apply() {
        if (this.isExpanded()) {
            this.page.addClass("expanded-" + this.side);
        }
        else {
            this.page.removeClass("expanded-" + this.side);

            var iframe = this.panel.find("iframe[data-src]");
            if (iframe.length) iframe.attr("src", iframe.attr("data-src")).removeAttr("data-src");
        }

        this.applyIcon();
    }

    applyIcon() {
        var iconDom = this.button.find("i");
        if (!iconDom.length) return;

        var customCollapsedIcon = this.button.attr("data-icon-collapsed");
        var customExpandedIcon = this.button.attr("data-icon-expanded");

        var collapsedIcon = customCollapsedIcon
            ? customCollapsedIcon
            : (this.key == ".side-bar" ? "fa fa-chevron-right" : "fa fa-chevron-left");

        var expandedIcon = customExpandedIcon
            ? customExpandedIcon
            : (this.key == ".side-bar" ? "fa fa-chevron-left" : "fa fa-chevron-right");

        var toRemove = this.isExpanded() ? collapsedIcon : expandedIcon;
        var toAdd = this.isExpanded() ? expandedIcon : collapsedIcon;

        iconDom.removeClass(toRemove).addClass(toAdd);
        this.syncHubFrame();
    }
    syncHubFrame() {
        let arg = Math.round($("service").height());
        let paramW = { command: "setViewFrameHeight", arg: arg };
        window.parent.postMessage(JSON.stringify(paramW), "*");
    }
}