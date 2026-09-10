import AjaxRedirect from "olive/mvc/ajaxRedirect";

export default class BreadcrumbMenu implements IService {

    // The menu node the trail is currently drawn for, and the address it was drawn for.
    // A click draws the trail straight away, then the view change that follows re-draws it
    // from the new address; these let that second pass tell "the click already got this right"
    // apart from "we have landed somewhere the menu says nothing about".
    private renderedNode: Element = null;
    private renderedFor: string = null;

    constructor(private ajaxRedirect: AjaxRedirect) { }

    public enableBreadcrumb() {
        this.refresh();
    }

    public bindItemListClick() {

        //select feature items
        this.bindFeatureMenuItemsClicks($("div.item > a:not([href=''])"));
    }

    bindFeatureMenuItemsClicks(selector: JQuery) {
        // Bound by namespace and unbound first: this runs again on every ajax view change, and
        // anchors that survive a partial update would otherwise collect one handler per update.
        selector.off("click.breadcrumb").on("click.breadcrumb", e => this.onLinkClicked($(e.currentTarget)));
    }

    onLinkClicked(link: JQuery) {
        this.render(this.findNodeForLink(link), this.normalizePath(link.attr("href")));
    }

    // Re-draws the trail for whatever the address bar now holds. Called after every view change,
    // so navigations that no menu click started - the back button, an in page link, a redirect,
    // a page loaded directly by its address - get a trail that matches the page on screen.
    public refresh() {
        // The side menu can be replaced by an ajax update, taking its handlers with it, so the
        // links are bound again here. Handlers are namespaced and replaced, so they never stack.
        this.bindFeatureMenuItemsClicks($(".features-side-menu .feature-menu-item > a:not([href=''])"));

        const address = window.location.pathname + window.location.search;
        const node = this.findNodeForUrl(address);

        if (node) {
            this.render(node, this.normalizePath(address));
            return;
        }

        // The menu holds nothing for this address. If the click that brought us here drew a
        // trail for this very address, that trail is still the right one.
        if (this.renderedNode && document.body.contains(this.renderedNode)
            && this.renderedFor === this.normalizePath(address)) return;

        // Otherwise show Home alone rather than leaving the previous page's trail up.
        this.render(null, this.normalizePath(address));
    }

    onBreadcrumbLinkClicked(link: JQuery) {
        const menuLink = this.menuLinkOf(link);

        if (menuLink.length == 0) {
            $("[data-module=SideBarTopModule] .logo img").click();
            return false;
        }

        // The flag belongs on the menu item, which is what reads it when deciding whether the
        // click should collapse the branch. Stepping up the trail should leave the menu open.
        menuLink.closest(".feature-menu-item").attr("no-collapse", "no-collapse");
        menuLink.click();

        return false;
    }

    // The side menu anchor a breadcrumb item stands for. Found by the node id stamped on the item,
    // so the click lands on the menu item itself and the menu expands and highlights with it, and
    // by address for menus whose items carry no id.
    private menuLinkOf(breadcrumbLink: JQuery): JQuery {
        const href = breadcrumbLink.attr("href");
        if (!href) return $();

        const itemId = breadcrumbLink.attr("data-itemid");
        if (itemId) {
            // getElementById rather than a "#id" selector: ids come from the server and may hold
            // characters that would otherwise be read as selector syntax.
            const node = document.getElementById(itemId);
            const own = node ? $(node).children("a").filter((i, el) => $(el).attr("href") === href).first() : $();
            if (own.length) return own;
        }

        return this.menuLinks().filter((i, el) => $(el).attr("href") === href).first();
    }

    // ================= Finding the menu node =================

    private menuLinks(): JQuery {
        return $(".features-side-menu .feature-menu-item > a[href]").filter((i, el) => !!$(el).attr("href"));
    }

    // The menu node a clicked link stands for. The link is either a side menu link itself, or a
    // mid page item that carries the id (or data-nodeid) of the side menu node it duplicates.
    private findNodeForLink(link: JQuery): Element {
        if (!link || !link.length) return null;

        const own = link.closest(".features-side-menu li");
        if (own.length) return own[0];

        const referenced = link.attr("id") || link.closest("[data-nodeid]").attr("data-nodeid")
            || link.closest("div.item").attr("id");
        if (referenced) {
            // getElementById rather than a "#id" selector: ids come from the server and may hold
            // characters that would otherwise be read as selector syntax.
            const node = document.getElementById(referenced);
            if (node && $(node).closest(".features-side-menu").length) return node;
        }

        // Nothing links it to a menu node, so fall back to what its address says.
        return this.findNodeForUrl(link.attr("href"));
    }

    // The menu node whose link points at the given address. Tries the whole address first, then
    // the path alone, then the longest menu path the address sits under - so a detail page still
    // shows the trail of the feature it belongs to.
    private findNodeForUrl(url: string): Element {
        const targetFull = this.normalizeUrl(url, true);
        const targetPath = this.normalizePath(url);
        if (!targetPath) return null;

        let exact: Element = null;
        let byPath: Element = null;
        let byPrefix: Element = null;
        let prefixLength = 0;

        this.menuLinks().each((i, el) => {
            const href = $(el).attr("href");
            const full = this.normalizeUrl(href, true);
            const path = this.normalizePath(href);
            if (!path || path === "/") return;

            if (!exact && full === targetFull) exact = el;
            if (!byPath && path === targetPath) byPath = el;

            if (path.length > prefixLength && targetPath.startsWith(path + "/")) {
                byPrefix = el;
                prefixLength = path.length;
            }
        });

        const link = exact || byPath || byPrefix;
        if (!link) return null;

        const node = $(link).closest(".features-side-menu li");
        return node.length ? node[0] : null;
    }

    // Menu links, hub addresses and service addresses spell the same feature differently:
    // "/[CRM]/customers", "/hub/crm/customers" and "https://hub.x.com/crm/customers" are one page.
    // This reduces all of them to "/crm/customers" so they can be compared.
    private normalizeUrl(url: string, keepQuery: boolean): string {
        if (!url) return "";

        let path = url.trim().toLowerCase();
        if (!path || path === "#") return "";

        const scheme = path.indexOf("://");
        if (scheme !== -1) {
            const firstSlash = path.indexOf("/", scheme + 3);
            path = firstSlash === -1 ? "/" : path.substring(firstSlash);
        }

        if (!keepQuery) {
            const query = path.search(/[?#]/);
            if (query !== -1) path = path.substring(0, query);
        }

        path = path.replace("[", "").replace("]", "");

        if (!path.startsWith("/")) path = "/" + path;
        if (path.startsWith("/hub/")) path = path.substring("/hub".length);
        else if (path === "/hub") path = "/";

        if (path.length > 1) path = path.replace(/\/+$/, "");

        return path;
    }

    private normalizePath(url: string): string {
        return this.normalizeUrl(url, false);
    }

    // ================= Drawing the trail =================

    // The node and every menu level above it, root first. Only levels inside the side menu count,
    // so nothing from the surrounding page layout can find its way into the trail.
    private trailOf(node: Element): Element[] {
        if (!node) return [];

        const menu = $(node).closest(".features-side-menu");
        if (!menu.length) return [node];

        const levels = ($(node).parents("li").filter((i, el) => $.contains(menu[0], el)).get() as Element[]).reverse();
        levels.push(node);

        return levels.filter((el, i) => levels.indexOf(el) === i);
    }

    render(node: Element, address: string) {
        const bar = $(".breadcrumb");
        if (!bar.length) return;

        bar.show().empty();
        bar.append(`<li class="breadcrumb-item"><a href="${window.location.origin}/under/" data-redirect="ajax">Home</a></li>`);

        this.trailOf(node).forEach(el => {
            const level = $(el);
            const anchor = level.children("a").first();
            const text = anchor.text().trim();
            if (!text) return;

            const path = anchor.attr("href");

            if (!path) {
                // A grouping level with nothing to navigate to. It still names a step of the trail.
                bar.append(`<li class="breadcrumb-item">${this.escape(text)}</li>`);
                return;
            }

            const nodeId = level.attr("id") || "";
            const item = $(`<li class="breadcrumb-item"><a href="${this.escape(path)}" data-redirect="ajax" data-itemid="${this.escape(nodeId)}">${this.escape(text)}</a></li>`)
                .appendTo(bar);

            // Only hub pages are fetched by ajax. Anything else is a service page, which the menu
            // item itself knows how to open, so the click is handed to the menu instead.
            if (!path.startsWith("/under/")) item.find("a").removeAttr("data-redirect");
        });

        this.renderedNode = node;
        this.renderedFor = address;

        this.ajaxRedirect.enableRedirect(bar.find("a[data-redirect=ajax]"));

        // The Home item is left to its ajax redirect; the rest are handed to the menu.
        bar.find(".breadcrumb-item > a[data-itemid]").off("click.breadcrumb").on("click.breadcrumb", e => {
            e.preventDefault();
            this.onBreadcrumbLinkClicked($(e.currentTarget));
        });
    }

    private escape(value: string): string {
        return $("<div/>").text(value == null ? "" : value).html().replace(/"/g, "&quot;");
    }
}
