define(["require", "exports"], function (require, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    class ExpandCollapse {
        constructor(button, panelKey) {
            this.button = button.click(() => this.toggle());
            this.panel = $(this.key = panelKey);
        }
        static enableExpandCollapse(buttonSelector, panelSelector) {
            new ExpandCollapse($(buttonSelector), panelSelector).initialize();
        }
        isCollapsed() {
            if (this.cookies.get(this.key) === 'collapsed')
                return true;
            else
                return false;
        }
        initialize() {
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
                if (iframe.length)
                    iframe.attr("src", iframe.attr("data-src")).removeAttr("data-src");
            }
            this.applyIcon();
        }
        applyIcon() {
            var collapsedIcon = this.key == ".side-bar" ? "right" : "left";
            var expandedIcon = collapsedIcon == "left" ? "right" : "left";
            var toRemove = this.isCollapsed() ? expandedIcon : collapsedIcon;
            var toAdd = toRemove == "left" ? "right" : "left";
            this.button.find("i").removeClass("fa-chevron-" + toRemove).addClass("fa-chevron-" + toAdd);
            this.syncHubFrame();
        }
        syncHubFrame() {
            let arg = Math.round($("service").height());
            let paramW = { command: "setViewFrameHeight", arg: arg };
            window.parent.postMessage(JSON.stringify(paramW), "*");
        }
    }
    exports.default = ExpandCollapse;
});
//# sourceMappingURL=expandCollapse.js.map