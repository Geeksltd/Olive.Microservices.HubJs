import Url from 'olive/components/url';
import Service from 'app/model/service';
import Waiting from 'olive/components/waiting'
import AjaxRedirect from 'olive/mvc/ajaxRedirect';
import FullMenuFiltering from 'featuresMenu/fullMenuFiltering';
declare var requirejs: any;

export class FeaturesMenuFactory implements IService {
    constructor(private url: Url, private waiting: Waiting, private ajaxRedirect: AjaxRedirect) { }

    public enableFeaturesTreeView() {
        var menu = new FeaturesMenu(this.url, this.waiting, this.ajaxRedirect);
        menu.bindExpandIcons();
        menu.bindFeatureMenuItemsClicks($(".feature-menu-item > a:not([href=''])"));
        menu.showSubMenu();
        menu.enableIFrameClientSideRedirection($(".feature-menu-item a:not([data-redirect])"));
    }

    public bindItemListClick() {
        var menu = new FeaturesMenu(this.url, this.waiting, this.ajaxRedirect);
        menu.bindMidMenuItemsClicks($("div.item > a:not([href=''])"));
        menu.enableIFrameClientSideRedirection($("div.item a:not([data-redirect])"));
    }
    public show(featureId: string) {
        let featureLink = $("#" + featureId + " > a");

        if (!featureLink) {
            console.log("Could not find menu item for " + featureLink);
            return;
        }

        featureLink.click();
    }
    public getMenu() {
        var menu = new FeaturesMenu(this.url, this.waiting, this.ajaxRedirect);
        return menu;
    }
}

export default class FeaturesMenu {
    constructor(private url: Url, private waiting: Waiting, private ajaxRedirect: AjaxRedirect) { }

    enableIFrameClientSideRedirection(selector: JQuery) {
        selector.each((ind, el) => {
            $(el).click(e => {
                if (e == undefined || e.target == undefined)
                    return;
                $("main").show();

                let iFrameHolder = $("#iFrameHolder");
                iFrameHolder.hide().attr("style", "height: 0;");

                let targetIframe = $("iframe.view-frame");
                targetIframe.attr("src", "").attr("style", "");
                let link = $(e.currentTarget);

                let url = link.attr("href");

                if (url.startsWith("/under/")) // Go to the children page
                {
                    url = Service.fromName("hub").BaseUrl + url; // We should make URL absolute to fix cross module navigation ambiguous 
                    this.ajaxRedirect.go(url)
                    return false;
                }

                if (!url.startsWith("/[") || !url.contains("]")) {
                    console.log("The url does not contain the service info part. Urls should start with [ServiceName]/.");
                    return;
                }

                let serviceName = url.substring(2, url.indexOf("]"));

                var baseUrl = Service.fromName(serviceName).BaseUrl;
                if (!baseUrl.startsWith("http"))
                    baseUrl = baseUrl.withPrefix(window.location.protocol + "//");

                url = url.substring(serviceName.length + 3)
                url = this.url.makeAbsolute(baseUrl, url);

                targetIframe.attr("src", url);
                $("main").hide();

                this.waiting.show();

                targetIframe.on("load", null, null, e => {
                    this.waiting.hide();
                    if (targetIframe.attr("src") !== "")
                        iFrameHolder.attr("style", "").show();
                    else
                        iFrameHolder.hide().attr("style", "height: 0;");
                });

                return false;
            });
        });
    }

    showSubMenu() {
        let sideExpandedChildItems = $(".feature-menu-item[expand='true'][is-side-menu-child='true']");
        let hasExpandedItemInSubmenuVisible = sideExpandedChildItems.length > 0;

        if (!hasExpandedItemInSubmenuVisible) return;

        this.showSubMenuOf(sideExpandedChildItems.last());
    }

    showSubMenuOf(parent: any) {
        requirejs(["handlebars"], (x) => { this.generateTopMenu(x, parent); });
    }

    bindExpandIcons(): void {
        $(".side-bar > .features-side-menu > ul > .feature-menu-item").each((ind, el) => {
            let $el = $(el);
            let hasChildMenuItems = $("ul", $el).length > 0;
            let expandIcon = $("<span class='arrow-right'></span>");

            if (hasChildMenuItems) {
                // Add the expand button;
                expandIcon.click((e) => {
                    let expanded = $el.attr("expand") == "true";
                    let $this = $(e.target);

                    if (expanded) {
                        $this.removeClass().addClass("arrow-right");
                        $el.attr("expand", "false");
                    }
                    else {
                        $this.removeClass().addClass("arrow-down");
                        $el.attr("expand", "true");
                    }
                });
            }
            else {
                expandIcon.prop('disabled', true);
                expandIcon.html("&nbsp;");
            }

            if ($el.attr("expand") === "true")
                expandIcon.removeClass().addClass("arrow-down");

            const emptyLink = $("> a[href='']", $el);
            if (emptyLink.length > 0)
                emptyLink.click(e => {
                    expandIcon.click();
                    e.stopPropagation();
                    return false;
                });

            if (hasChildMenuItems) {
                $el.prepend(expandIcon);
            }
        });
    }

    bindFeatureMenuItemsClicks(selector: JQuery) {
        selector.each((ind, el) => {
            const link = $(el);
            link.click(() => this.onLinkClicked(link));
        });
    }

    bindMidMenuItemsClicks(selector: JQuery) {
        selector.each((ind, el) => {
            const link = $(el);
            link.click(() => this.onMidMenuClicked(link));
        });
    }

    onMidMenuClicked(link: JQuery) {
        $(`li[data-nodeid='${link.attr("id")}']`).addClass("active");

        let wrapper = $(`#${link.attr("id")}`);
        wrapper.addClass("active");
        this.showSubMenuOf(wrapper);
    }

    bindSubMenuClicks(selector: JQuery) {
        selector.each((ind, el) => {
            let link = $(el);
            link.click(e => this.onSubMenuClicked(link));
        });
    }

    onSubMenuClicked(link: JQuery) {
        var wrapper = link.closest(".feature-menu-item");
        $("#" + wrapper.attr("data-nodeid")).attr("expand", "false").find("a").first().click();
        //$(".feature-top-menu .active").removeClass("active");
        //$.each(wrapper.parents("li"), (i: number, p: any) => {
        //    $(p).addClass("active");
        //})
        //wrapper.addClass("active");
        //$("#" + wrapper.attr("id")).addClass("active");
    }
    getPathName() {
        var path = window.location.pathname.toLowerCase().startsWith("/") ? window.location.pathname.toLowerCase().substring(1) : window.location.pathname.toLowerCase();
        var pos = path.indexOf("/");

        return {
            pathname: window.location.pathname.toLowerCase(),
            pathnameWithBrackets: "/[" + path.substring(0, pos) + "]" + path.substring(pos)
        };
    }
    onLinkClicked(link: JQuery) {
        $("service main").html("<center class='w-100'>loading...</center>")
        //Hide iframe after each Ajax call.
        $("#iFrameHolder").hide().attr("style", "height: 0;");

        //check to see if click event is from mid-page or left page
        if (link.closest(".feature-menu-item").length == 0) {
            link = $(`#${link.attr("id")} > a`);
        }

        let wrapper = link.closest(".feature-menu-item");

        if (wrapper.attr("expand") == "true") {
            // Collapse the wrapper
            if (!$(link).parent().attr("no-collapse") != undefined)
                $(link).parent().removeAttr("no-collapse")
            else
                wrapper.attr("expand", "false");
        }
        else {
            // Expand the wrapper
            wrapper.attr("expand", "true");
        }

        // Update the exapnd icon.
        let expandIcon = $(".arrow-right", wrapper);

        if (expandIcon.length > 0) {
            expandIcon.removeClass().addClass("arrow-down")
        }
        else {
            expandIcon = $(".arrow-down", wrapper);
            expandIcon.removeClass().addClass("arrow-right")
        }


        let isInSubmenu = wrapper.attr("side-menu-parent") !== undefined;
        let hasChild = wrapper.is("a") ? wrapper.parent().find("ul").length > 0 : wrapper.find("ul").length > 0;
        var pathname = this.getPathName();

        var currentMenu = $("a[href='" + pathname.pathname + "']:not(.feature-button)").first();
        if (currentMenu.length == 0)
            currentMenu = $("a[href='" + pathname.pathnameWithBrackets + "']:not(.feature-button)").first();
        let currentMenuLi = currentMenu.is("a") ? currentMenu.parent() : currentMenu;
        let currentMenuparent = currentMenu.is("a") ? currentMenu.parent().parent() : currentMenu.parent();
        let parentHasChild = currentMenu.is("a") ? currentMenu.parent().find("ul").length > 0 : currentMenu.find("ul").length > 0;

        if (hasChild || link.parent().attr("side-menu-parent") == undefined || (link.parent().attr("side-menu-parent") != currentMenuLi.attr("id") && link.parent().attr("side-menu-parent") != currentMenuLi.attr("side-menu-parent"))) //|| (parent.first().is(link.parent().parent()) && parentHasChild && hasChild)
            $(".features-sub-menu").empty();
        // Set the active item
        $(".active").removeClass("active");
        $("#" + wrapper.attr("id")).addClass("active");
        $("[data-nodeid=" + wrapper.attr("id") + "]").addClass("active");
        //$("." + wrapper.attr("id")).addClass("active");
        //top menu needs this
        wrapper.addClass("active");

        if (isInSubmenu) {
            if (hasChild)
                this.showSubMenuOf(wrapper);
            else
                this.showSubMenuOf(wrapper.parent().parent());
        }
        else
            this.showSubMenuOf(wrapper);
    }
    generateTopMenu(Handlebars: any, element) {

        //if the top menu has been already generated, so we ignore generating it again.
        if ($(".features-sub-menu ul li").length > 0) {
            return;
        }
        $(".features-sub-menu ul li").html('');
        let elementId = $(element).attr("id");

        if ($("body").data("currentMenu") == elementId && $(".features-sub-menu li").length > 0) {
            return;
        }
        else {
            $("body").data("currentMenu", elementId);
        }

        let topMenuData = $("#topMenu").attr("value");

        this.generateTopMenuHtml(topMenuData, element, Handlebars);

        let activeId = $(".feature-menu-item .active").attr("id");

        //make left and top menu active
        $(".feature-menu-item .active").parents("li.feature-menu-item").addClass("active");
        setTimeout(function () {
            $(".feature-menu-item[data-nodeid=" + activeId + "]").addClass("active").parents("li.feature-menu-item").addClass("active");
        }, 100)
    }
    showPageSubMenu(data) {
        let sideExpandedChildItems = $(".feature-menu-item[expand='true'][is-side-menu-child='true']");
        requirejs(["handlebars"], (x) => { this.generatePageTopMenu(data, x, sideExpandedChildItems.last()); });
    }
    generatePageTopMenu(data, Handlebars, element) {
        this.generatePageTopMenuHtml(data, Handlebars);
        let activeId = $(".feature-menu-item .active").attr("id");
        $(".feature-menu-item .active").parents("li.feature-menu-item").addClass("active");
        setTimeout(function () {
            $(".feature-menu-item[data-nodeid=" + activeId + "]").addClass("active").parents("li.feature-menu-item").addClass("active");
        }, 100);
    }
    generatePageTopMenuHtml(menuData, Handlebars) {
        var d = JSON.parse(menuData);
        var data = { menus: [{ Children: d.Result }] };
        this.generatePageBreadcrumb(d.Breadcrumb);
        let template = $("#sumMenu-template").html();
        var compiled = Handlebars.compile(template);
        var result = compiled(data);
        $(".features-sub-menu").html('').append(result);
        window.page.services.getService("modalHelper").enableLink($(".features-sub-menu .feature-menu-item > a[target='$modal'][href]"))
        window.page.services.getService("serverInvoker").enableInvokeWithAjax($("[formaction]").not("[formmethod=post]"), "click.formaction", "formaction");
        window.page.services.getService("confirmBoxFactory").enable($("[data-confirm-question]"))
        // this.bindSubMenuClicks($(".features-sub-menu .feature-menu-item > a:not([href=''])"));
        this.enableIFrameClientSideRedirection($(".features-sub-menu .feature-menu-item a:not([data-redirect]):not([data-confirm-question])"));
        this.ajaxRedirect.enableRedirect($("a[data-redirect=ajax]"));
        // setTimeout(function () {
        //     $("." + $(".feature-menu-item[expand='true'][is-side-menu-child='true']").attr("id")).addClass("active");
        // }, 100);
    }
    generatePageBreadcrumb(data) {
        $(".breadcrumb").html("");
        $(".breadcrumb").append(`<li class="breadcrumb-item"><a href="${window.location.origin}/under/" data-redirect="ajax">Home</a></li>`);
        //check to see if click event is from mid-page or left page

        data.each((i: number, d) => {
            let path = d.Url;
            let text = d.Name;

            if ((data.length - 1) > i) {
                {
                    let li = $(`<li class="breadcrumb-item"><a href="${path}" data-redirect="ajax" data-itemid="">${text}</a></li>`)
                        .appendTo($(".breadcrumb"));

                    if (!path.startsWith("/under/"))
                        li.find("a").removeAttr("data-redirect");

                    var featuresMenu = $(".features-side-menu [href='" + path + "']");
                    if (featuresMenu.length == 0)
                        featuresMenu = $(".features-side-menu [href='" + path.split("?")[0] + "']");
                    if (featuresMenu.length == 0) {
                        var ms = path.startsWith("/") ? path.substring(1).split("/")[0] : path.split("/")[0];
                        path = "/[" + ms + "]/" + path.split(ms)[1];
                        featuresMenu = $(".features-side-menu [href='" + path.split("?")[0] + "']");
                    }
                    if (featuresMenu.length > 0) {
                        if (featuresMenu.hasClass("feature-menu-item active"))
                            featuresMenu.addClass("active");
                        else
                            featuresMenu.parent().attr("expand", "true");

                    }

                }
            }
            else {
                $(".breadcrumb").append(`<li class="breadcrumb-item active" aria-current="page">${text}</li>`);
            }
        });

    }
    generateTopMenuHtml(topMenuData, element, Handlebars) {

        let data = { menus: this.getObjects(JSON.parse(topMenuData), "ID", $(element).attr("id")) };

        let template = $("#sumMenu-template").html();

        var compiled = Handlebars.compile(template);

        var result = compiled(data);

        $(".features-sub-menu").append(result);

        this.bindSubMenuClicks($(".features-sub-menu .feature-menu-item > a:not([href=''])"));

        this.enableIFrameClientSideRedirection($(".features-sub-menu .feature-menu-item a:not([data-redirect])"));

        this.ajaxRedirect.enableRedirect($("a[data-redirect=ajax]"));
        setTimeout(function () {
            $("." + $(".feature-menu-item[expand='true'][is-side-menu-child='true']").attr("id")).addClass("active");
        }, 100)
    }

    getObjects(obj, key, val) {
        var objects = [];
        for (var i in obj) {
            if (!obj.hasOwnProperty(i)) continue;
            if (typeof obj[i] == 'object') {
                objects = objects.concat(this.getObjects(obj[i], key, val));
            } else if (i == key && obj[key] == val) {
                objects.push(obj);
            }
        }
        return objects;
    }
}
