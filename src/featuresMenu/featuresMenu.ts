import Url from 'olive/components/url';
import Service from 'app/model/service';
import Waiting from 'olive/components/waiting'
import AjaxRedirect from 'olive/mvc/ajaxRedirect';
declare var requirejs: any;

export class FeaturesMenuFactory implements IService {
    constructor(private url: Url, private waiting: Waiting, private ajaxRedirect: AjaxRedirect) { }

    public enableFeaturesTreeView() {
        var menu = new FeaturesMenu(this.url, this.waiting, this.ajaxRedirect);
        menu.bindExpandIcons($(".side-bar .features-side-menu > ul > .feature-menu-item"));
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
    constructor(private url: Url, private waiting: Waiting, private ajaxRedirect: AjaxRedirect) {
    }

    enableIFrameClientSideRedirection(selector: JQuery) {
        selector.each((ind, el) => {
            $(el).click(e => {
                if (e == undefined || e.target == undefined)
                    return;

                let link = $(e.currentTarget);
                let url = link.attr("href");

                if (url.indexOf("_nav=no") !== -1) {
                    window.location.href = url;
                    return;
                }

                $("main").show();

                let iFrameHolder = $("#iFrameHolder");
                iFrameHolder.hide().attr("style", "height: 0;");

                let targetIframe = $("iframe.view-frame");
                targetIframe.attr("src", "").attr("style", "");

                if (url.startsWith("/under/")) // Go to the children page
                {
                    url = Service.fromName("hub").BaseUrl + url; // We should make URL absolute to fix cross module navigation ambiguous 
                    this.ajaxRedirect.go(url, undefined, false, false, false)
                    return false;
                }

                if (!url.startsWith("/[") || !url.contains("]")) {
                    console.log("The url does not contain the service info part. Urls should start with [ServiceName]/.", url);
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

    }

    bindExpandIcons(menuItems: JQuery): void {
        if (!menuItems.length) return;
        menuItems.each((ind, el) => {
            let $el = $(el);
            let hasChildMenuItems = $("ul", $el).length > 0;
            let expandIcon = $("<span class='arrow'></span>");

            if (hasChildMenuItems) {
                // Add the expand button;
                expandIcon.click((e) => {
                    let expanded = $el.attr("expand") == "true";

                    if (expanded) {
                        $el.attr("expand", "false");
                    }
                    else {
                        $el.attr("expand", "true");
                    }
                });
            }
            else {
                expandIcon.prop('disabled', true);
                expandIcon.html("&nbsp;");
            }

            const emptyLink = $("> a[href='']", $el);
            if (emptyLink.length > 0)
                emptyLink.click(e => {
                    expandIcon.click();
                    e.stopPropagation();
                    return false;
                });

            if (hasChildMenuItems) {
                $el.prepend(expandIcon);
                const childUlList = $el.find(">ul");
                if (childUlList.length) {
                    this.bindExpandIcons(childUlList.find(">.feature-menu-item"))
                }
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
        let wrapper = $(`#${link.attr("id")}`);
        wrapper.addClass("active");
    }

    getPathName() {
        var path = window.location.pathname.toLowerCase().startsWith("/") ? window.location.pathname.toLowerCase().substring(1) : window.location.pathname.toLowerCase();
        var pos = path.indexOf("/");

        return {
            pathname: window.location.pathname.toLowerCase(),
            pathnameWithBrackets: ("/[" + path.substring(0, pos) + "]" + path.substring(pos))
        };
    }

    onLinkClicked(link: JQuery) {
        $("service main").html("<center class='w-100'>loading...</center>");
        //Hide iframe after each Ajax call.
        $("#iFrameHolder").hide().attr("style", "height: 0;");

        let wrapper = link.closest(".feature-menu-item");

        //check to see if click event is from mid-page or left page
        if (wrapper.length == 0) {
            link = $(`#${link.attr("id")} > a`);
            wrapper = link.closest(".feature-menu-item");
        }

        const url = link.attr('href')
        if (url.indexOf('_nav=no') !== -1) {
            $("service main").remove();
            window.location.href = url;
            return false;
        }

        // Expand/Collapse the wrapper
        // Update the exapnd icon.
        const expandIcon = wrapper.find(">.arrow");
        const isExpanded = wrapper.attr("expand") === "true"
        if (expandIcon.length)
            if (isExpanded) {
                if (wrapper.attr("no-collapse") != undefined)
                    wrapper.removeAttr("no-collapse")
                else
                    wrapper.attr("expand", "false");
            }
            else {
                wrapper.attr("expand", "true");
            }

        // Set the active item
        $(".active").removeClass("active");
        wrapper.addClass("active");
    }

    // generatePageBreadcrumb(data) {
    //     $(".breadcrumb").html("");
    //     $(".breadcrumb").append(`<li class="breadcrumb-item"><a href="${window.location.origin}/under/" data-redirect="ajax">Home</a></li>`);
    //     //check to see if click event is from mid-page or left page

    //     $.each(data, (i: number, d) => {
    //         let path = d.Url;
    //         let text = d.Name;

    //         if ((data.length - 1) > i) {
    //             {
    //                 let li = $(`<li class="breadcrumb-item"><a href="${path}" data-redirect="ajax" data-itemid="">${text}</a></li>`)
    //                     .appendTo($(".breadcrumb"));

    //                 if (!path.startsWith("/under/"))
    //                     li.find("a").removeAttr("data-redirect");

    //                 var featuresMenu = $(".features-side-menu [href='" + path + "']");
    //                 if (featuresMenu.length == 0)
    //                     featuresMenu = $(".features-side-menu [href='" + path.split("?")[0] + "']");
    //                 if (featuresMenu.length == 0) {
    //                     path = path;
    //                     var ms = path.startsWith("/") ? path.substring(1).split("/")[0] : path.split("/")[0];
    //                     path = "/[" + ms + "]" + path.split(ms)[1];
    //                     featuresMenu = $(".features-side-menu [href='" + path.split("?")[0] + "']");
    //                 }
    //                 if (featuresMenu.length > 0) {
    //                     if (featuresMenu.parent().attr("is-side-menu-child") == "true")
    //                         featuresMenu.parent().addClass("active");
    //                     else
    //                         featuresMenu.parent().attr("expand", "true");
    //                 }

    //             }
    //         }
    //         else {
    //             $(".breadcrumb").append(`<li class="breadcrumb-item active" aria-current="page">${text}</li>`);
    //         }
    //     });

    // }

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
