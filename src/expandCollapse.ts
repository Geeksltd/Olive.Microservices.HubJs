declare var requirejs: any;

export default class ExpandCollapse {
    button: JQuery;
    backdrop: JQuery;
    panel: JQuery;
    page: JQuery;
    side: string;
    key: string;
    cookies: any;

    static readonly EXPANDED = "expanded";
    static readonly COLLAPSED = "collapsed";

    constructor(side: string) {
        this.button = $(".side-bar-handle." + side);
        this.backdrop = $(".side-bar-backdrop." + side);
        this.panel = $(this.key = ".side-bar." + side);
        this.page = $(".page");
        this.side = side;
        window[side + "SideBar"] = this;
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
        if (!this.panel.length) return false;

        // On mobile the side bars start collapsed and the user's desktop choice is left untouched.
        if (ExpandCollapse.isMobile()) return this.page.hasClass("expanded-" + this.side);

        return this.cookies.get(this.key) === ExpandCollapse.EXPANDED;
    }

    initialize(): void {
        requirejs(["js-cookie"], x => {
            this.cookies = x;

            // Bind click handlers after cookies is initialized to prevent race condition
            this.button.click(() => this.toggle());
            this.backdrop.click(() => this.toggle());

            if (ExpandCollapse.isMobile()) this.page.removeClass("expanded-" + this.side);
            else this.apply();
            this.page.attr("data-js-init", "true");
        });
    }

    toggle() {
        const expand = !this.isExpanded();

        // Never store an empty value: ASP.NET Core drops empty cookies, so the server would lose the choice.
        if (!ExpandCollapse.isMobile())
            this.cookies.set(this.key, expand ? ExpandCollapse.EXPANDED : ExpandCollapse.COLLAPSED, { expires: 365 });

        this.apply(expand);
    }

    apply(expanded: boolean = this.isExpanded()) {
        if (expanded) {
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