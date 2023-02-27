import { ModalHelper } from 'olive/components/modal'
import Url from 'olive/components/url';
import AjaxRedirect from 'olive/mvc/ajaxRedirect';
import { getMainDomain } from './hub';

export default class BoardComponents implements IService {
    private urlList: string[];
    private boardItemId: string = null;
    private boardType: string = null;
    private filterInput: JQuery;
    private modalHelper: ModalHelper
    private ajaxRedirect: AjaxRedirect
    private timer: any = null
    private myStorage: any
    private boardPath: string;
    constructor(private input: JQuery, modalHelper: ModalHelper, ajaxRedirect: AjaxRedirect, boardPath: string) {
        if (input == null || input.length == 0) return;
        this.boardPath = boardPath;
        var urls = input.attr("data-board-source").split(";");
        this.filterInput = this.input.parent().find(".board-components-filter");
        this.ajaxRedirect = ajaxRedirect;
        this.modalHelper = modalHelper;
        this.createBoardComponent(urls);
    }

    protected getResultPanel() {
        const boardPanel = this.input.parent();
        let resultPanel = boardPanel.find(".board-components-result");

        if (resultPanel === undefined || resultPanel === null || resultPanel.length === 0) {
            resultPanel = $("<div class='board-components-result'>");
            boardPanel.append(resultPanel);
        }
        else {
            resultPanel.show();
        }

        return resultPanel;
    }
    protected getAddableItemsPanel() {
        const boardPanel = this.input.parent();
        let resultPanel = boardPanel.find(".board-addable-items-container");

        if (resultPanel === undefined || resultPanel === null || resultPanel.length === 0) {
            resultPanel = $("<div class='board-addable-items-container'>");
            boardPanel.append(resultPanel);
        }
        // else {
        //     resultPanel.show();
        // }

        return resultPanel;
    }

    protected async createBoardComponent(urls: string[]) {

        var currentUrl = document.URL;
        if (currentUrl != undefined && currentUrl != null && currentUrl.contains("?$")) {
            var moduleinner = $("[data-module-inner]").find(".col-md-10").find(".board-links").children();
            if (moduleinner != undefined && moduleinner != null && moduleinner.length > 0)
                return;
        }

        this.boardItemId = this.input.attr("data-id");
        this.boardType = this.input.attr("data-boardtype");

        const resultPanel = this.getResultPanel();
        const addableItemsPanel = this.getAddableItemsPanel();

        addableItemsPanel.empty();

        const boardHolder = $("<div class='list-items'>");
        const addabledItemsHolder = $("<div class='list-items'>");
        $("iframe.view-frame").hide();
        var urlToLoad = new Url().getQuery("url", location.href);
        if (urlToLoad) {
            var serviceName = location.pathname.split('/')[3]
            this.ajaxRedirect.go(serviceName + (urlToLoad.startsWith('/') ? '' : '/') + urlToLoad, $("[data-module-inner]"), false, false, false)
        }
        const ajaxList = urls.map((p): IAjaxObject => {
            return {
                url: p,
                state: AjaxState.pending,
            };
        });

        const context: IBoardContext = {
            ajaxList,
            ajaxCallCount: 0,
            resultCount: 0,
            resultPanel: resultPanel,
            addableItemsPanel: addableItemsPanel,
            boardHolder: boardHolder,
            addabledItemsHolder: addabledItemsHolder,
            beginSearchStarted: true,
            boardItemId: this.boardItemId,
            boardType: this.boardType,
        };

        for (const ajaxObject of context.ajaxList) {
            var cache: IBoardResultDto = this.getItem(ajaxObject.url)
            if (cache) {
                this.onSuccess(ajaxObject, context, cache, true)
                this.onComplete(context, null)
            }
            ajaxObject.ajx = $
                .ajax({
                    dataType: "json",
                    url: ajaxObject.url,
                    xhrFields: { withCredentials: true },
                    async: true,
                    data: { id: context.boardItemId, type: context.boardType },
                    success: (result) => this.onSuccess(ajaxObject, context, result, false),
                    complete: (jqXhr) => this.onComplete(context, jqXhr),
                    error: (jqXhr) => this.onError(ajaxObject, context.boardHolder, jqXhr),
                });
        }
        $(document).click(function (e) {
            if (!$(e.target).closest("a").is($(".manage-button,.add-button")))
                $(".board-addable-items-container,.board-manage-items-container").fadeOut();
        })
        $(window).on('resize', function () {
            this.onResize()
        });

        this.relocateBoardComponentsHeaderActions();
        this.removeBoardGap();
    }
    protected onResize() {
        var width = 0;
        if ($(".sidebarCollapse.collapse").length == 0)
            width += 230;
        if ($("#taskBarCollapse.collapse").length == 0)
            width += 300;
        if ($.fn.masonryGrid)
            $(".board-components-result .list-items").masonryGrid({
                'columns': parseInt((($(document).outerWidth() - width) / 300).toString())
            });
    }
    protected createBoardItems(sender: IAjaxObject, context: IBoardContext, items: IInfoDto[], addableButtons: IButtonDto[], widgets: IWidgetDto[], html: IHtmlDto[], boxTitle: string) {
        if (items.length == 0 && widgets.length == 0 && html.length == 0) return null;
        var table = $("<table>");
        var colour = "#aaa"
        if (items.length > 0) colour = items[0].BoxColour
        else if (widgets.length > 0) colour = widgets[0].BoxColour
        else if (html.length > 0) colour = html[0].BoxColour

        const searchItem = $("<div class='item' data-type='" + boxTitle + "'>");
        
        var columnsCount = (items[0].BoxColumnsCount > 3 || items[0].BoxColumnsCount <= 1 ) ? 1 : items[0].BoxColumnsCount;
        if(columnsCount > 1) searchItem.addClass(`item-col-${columnsCount}`);

        const h3 = $('<h3 >').html(boxTitle + (boxTitle.endsWith("s") ? "" : "s")).append(this.createHeaderAction(boxTitle, addableButtons))
        searchItem.append($("<div class='header' " + " style=\"" + this.addColour(colour) + "\">").append(h3))

        //table.append($("<tr>").append($("<th " + "' style=\"" + this.addColour(items[0]) + "\" " + ">")

        for (let i = 0; i < items.length; i++) {
            context.resultCount++;
            table.append(this.createInfo(items[i], context));
        }
        for (let i = 0; i < widgets.length; i++) {
            context.resultCount++;
            table.append('<tr><td data-url="' + widgets[i].Url + '"><br/><br/><center>loading...</center></td></tr>');
            this.createWidgets(widgets[i], context);
        }
        for (let i = 0; i < html.length; i++) {
            context.resultCount++;
            table.append('<tr><td>' + html[i].RawHtml + '</td></tr>');
        }
        searchItem.append($("<div>").append(table))
        return searchItem;
    }
    private getItemBox(button: IButtonDto) {
        if (button.BoxTitle == null || button.BoxTitle == '' || button.BoxTitle == undefined)
            return button.BoxColour;
        return button.BoxTitle;
    }
    private handelLinksClick(link: any) {
        var ajaxredirect = this.ajaxRedirect;
        $(link).click(function (e) {
            e.preventDefault()
            $(".board-links .btn").removeClass("active")
            $(this).addClass("active")
            var url = $(this).attr("href");
            var serviceName = '';
            var urlToLoad = $(this).attr("href");
            // var urlToLoad = new Url().getQuery("url", $(this).attr("href"));
            // if (!urlToLoad) {
            //     urlToLoad = new Url().makeRelative($(this).attr("href"))
            //     serviceName = urlToLoad.split('/')[0]
            //     urlToLoad = urlToLoad.substr(serviceName.length)
            // }
            const link = $(e.currentTarget);
            if (link != undefined && link != null) {
                var ajaxTarget = link.attr("ajax-target");
                var ajaxhref = link.attr("href");
            }
            if (urlToLoad) {
                $(".board-components-result, [data-module=BoardView]").fadeOut('false', function () { $(this).remove() })
                if (!serviceName)
                    serviceName = $(this).attr("href").split('?')[0].split('/').pop()
                $("[data-module-inner]").closest("service[of]").attr("of", serviceName)
                //if (currentServiceName == serviceName)

                ajaxredirect.go(urlToLoad, $("[data-module-inner]"), false, false, false, undefined, ajaxTarget, ajaxhref)
                // else
                //     ajaxredirect.go(serviceName + (urlToLoad.startsWith('/') ? '' : '/') + urlToLoad, $("[data-module-inner]"), false, false, false)
                return false;
            }
            ajaxredirect.go($(this).attr("href"), null, false, false, false, undefined, ajaxTarget, ajaxhref)

            return false;
        })
    }
    //Adding menu Items and buttons
    protected createHeaderAction(boxTitle: String, addableButtons: IButtonDto[]) {
        const buttons = addableButtons.filter((p) => p.Url != null && p.Url != undefined && this.getItemBox(p) == boxTitle);

        const headerAction = $("<div class='header-actions'>");
        for (let i = 0; i < buttons.length; i++) {
            var item = addableButtons[i]
            var attr = "";
            if (item.Action == ActionEnum.Popup)
                attr = "target=\"$modal\"";
            else if (item.Action == ActionEnum.NewWindow)
                attr = "target=\"_blank\"";

            headerAction.append($("<a href='" + item.Url.replace("https://hub." + getMainDomain(), "") + "' " + attr + ">").append('<i class="' + item.Icon + '" aria-hidden="true"></i>'));
        }
        return headerAction;
    }
    protected createAddableItems(sender: IAjaxObject, context: IBoardContext, items: IMenuDto[]) {
        const result = $(".board-addable-items-container");

        for (let i = 0; i < items.length; i++) {
            //context.resultCount++;
            result.append(this.createAddableItem(items[i], context));
        }
        return result;
    }
    protected createBoardIntro(sender: IAjaxObject, context: IBoardContext, intro: IIntroDto) {
        const result = $(".board-components-result");
        if ($(".board-image:visible").length > 0) return;
        $(".board-image").append($("<a href='" + intro.Url + "' >").append(this.showIntroImage(intro).prop('outerHTML')))
        $(".board-info").append(
            $('<div class="col-md-9"><h2 class="mb-2">' + intro.Name + '</h2>\
            <div class="text-gray">' + intro.Description + '</div></div>'))
        $('.board-header').show()

        return result;


    }

    protected relocateBoardComponentsHeaderActions() {
        const boardPanel = this.input.parent();
        let headerActions = boardPanel.find(".board-components-header-actions");
        let addablecomponents = boardPanel.find(".board-addable-items-container ");
        if (headerActions === undefined || headerActions === null || headerActions.length === 0) {
            console.log("Header Actions not found");
        }
        else {
            let newplace = boardPanel.find(".col-md-10");
            if (newplace === undefined || newplace === null || newplace.length === 0) {
                console.log("col-md-10 not found");
            }
            else {
                newplace[0].appendChild(headerActions[0]);
                newplace[0].appendChild(addablecomponents[0]);
            }
        }
    }

    protected removeBoardGap() {
        const boardPanel = this.input.parent();
        let bordercomponentsview = boardPanel.find(".border-components-view");
        if (bordercomponentsview === undefined || bordercomponentsview === null || bordercomponentsview.length === 0) {
            console.log("bordercomponentsview not found");
        }
        else {
            bordercomponentsview[0].remove();
        }
    }

    protected createManageItems(sender: IAjaxObject, context: IBoardContext, items: IMenuDto[]) {
        let result = $(".board-manage-items-container");
        if (result.length == 0) {
            result = $("<div class='board-manage-items-container'>");
            context.resultPanel.parent().append(result);
        }
        const headerLinks = $(".board-links");
        items.sort(function (a, b) {
            if (a.Name > b.Name) return 1;
            if (a.Name < b.Name) return -1;
            return 0;
        });
        for (let i = 0; i < items.length; i++) {
            var item = items[i];
            if ($("a[href='" + item.Url + "']").length > 0)
                $("a[href='" + item.Url + "']").remove();
            result.append(this.createManageItem(items[i], context));
            var attr = "";
            if (item[i].Action == ActionEnum.Popup)
                attr = "target=\"$modal\"";
            else if (item[i].Action == ActionEnum.NewWindow)
                attr = "target=\"_blank\"";
            //var link = $("<a class='btn btn-primary' href='" + this.boardPath + "?$boardContent={" + items[i].ManageUrl + "}'" + attr + ">")
            //var link = $("<a class='btn btn-primary' href='" + items[i].ManageUrl + "'" + attr + ">")
            //if (items[i].ManageUrl.contains("repositories/repos") || items[i].ManageUrl.contains("tasks/p") )
            //    var link = $("<a class='btn btn-primary' href='" + items[i].ManageUrl + "'" + " data-redirect='ajax' " + " ajax-target='board-body' " + attr + ">")
            //else
            //    var link = $("<a class='btn btn-primary' href='" + items[i].ManageUrl + "'" + attr + ">")

            var link = $("<a class='btn btn-primary' href='" + items[i].Url + "'" + " data-redirect='ajax' " + " ajax-target='board-body' " + attr + ">")

            link.append(item.Name)
            headerLinks.append(link);
            this.handelLinksClick(link)
        }
        return result;
    }
    protected addColour(color: string) {
        if (color != undefined && color != null && color != "")
            return "background-color:" + color + ";"
        return "background-color:#aaa;";
    }
    protected createInfo(item: IInfoDto, context: IBoardContext) {
        var attr = "";
        if (item.Action == ActionEnum.Popup)
            attr = "target=\"$modal\"";
        else if (item.Action == ActionEnum.NewWindow)
            attr = "target=\"_blank\"";

        return $("<tr>").append($("<td >")
            .append($("<a href='" + item.Url + "' " + attr + " >")
                .append((item.Icon === null || item.Icon === undefined) ? $("<div class='icon'>") : this.showIcon(item))
                .append($("<div>").append($("<span class=\"board-component-name\">").append(item.Name))
                    .append($("<span>").html(item.Description)))));
    }
    protected createWidgets(item: IWidgetDto, context: IBoardContext) {
        const callback = htmlContent => {
            $("td[data-url='" + item.Url + "']").html(htmlContent);
        }
        $.ajax({
            url: item.Url,
            type: 'GET',
            async: true,
            xhrFields: { withCredentials: true },
            success: (response) => {
                callback(response);
            },
            error: (response, x) => {
                console.log(response);
                console.log(x);
                callback("<br/><br/><br/><center>Failed to load <a target='_blank' href='" + this.input.attr("src") + "'>widget</a></center>");
            }
        });
    }
    protected createAddableItem(item: IMenuDto, context: IBoardContext) {
        return $("<div class=\"menu-item\">")
            .append($("<a href='" + item.Url + ">")
                .append((item.Icon === null || item.Icon === undefined) ?
                    $("<div class='icon'>") : this.showIcon(item)
                        .append(item.Name)
                        .append($("<small>")
                            .html(item.Body))));
    }

    protected createManageItem(item: IMenuDto, context: IBoardContext) {
        return $("<div class=\"menu-item\">")
            .append($("<a href='" + item.Url + ">")
                .append((item.Url === null || item.Url === undefined) ?
                    $("<div class='icon'>") : this.showIcon(item)
                        .append(item.Name)
                        .append($("<small>")
                            .html(item.Body))));
    }
    protected bindAddableItemsButtonClick(context: IBoardContext) {
        context.resultPanel.parent().find(".add-button").off("click").click(function (e) {
            e.preventDefault();
            $(".board-manage-items-container,.board-addable-items-container ").fadeOut();
            $(this).parent().parent().find(".board-addable-items-container")
                .fadeToggle();
        });

        context.resultPanel.parent().find(".manage-button").off("click").click(function (e) {
            e.preventDefault();
            $(".board-manage-items-container,.board-addable-items-container ").fadeOut();
            $(this).parent().parent().find(".board-manage-items-container")
                .fadeToggle();
        });
    }
    protected showIcon(item: any): JQuery {
        if (item.Url.indexOf("fa-") > 0) {
            return $("<div class='icon'>").append($("<i class='" + item.Url + "'></i>"));
        } else {
            return $("<div class='icon'>").append($("<img src='" + item.Url + "'>"));
        }
    }
    private generateRandomColor() {
        return "#" + Math.floor(Math.random() * 16777215).toString(16);
    }

    private generateStaticColorFromName(name) {
        if (name === null || name === undefined || name === "") {
            return "#000000";
        }
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        var colour = '#';
        for (var i = 0; i < 3; i++) {
            var value = (hash >> (i * 8)) & 0xFF;
            colour += ('00' + value.toString(16)).substr(-2);
        }
        return colour;
    }

    private getTextColor(hexcolor) {
        if (hexcolor === null || hexcolor === undefined || hexcolor === "") {
            return 'white';
        }
        hexcolor = hexcolor.replace("#", "");
        var r = parseInt(hexcolor.substr(0, 2), 16);
        var g = parseInt(hexcolor.substr(2, 2), 16);
        var b = parseInt(hexcolor.substr(4, 2), 16);
        var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? 'black' : 'white';
    }
    protected showIntroImage(intro: any): JQuery {
        var iconText = "";
        if (intro.Name !== null && intro.Name !== undefined && intro.Name !== "") {
            iconText = intro.Name.substr(0, 2);
            if (intro.Name.contains("href")) {
                iconText = intro.Name.substr(intro.Name.lastIndexOf("➝") + 2, 2);
            }
        }
        var staticColor = this.generateStaticColorFromName(intro.Name);
        var textColor = this.getTextColor(staticColor);
        var projectNameIcon = $("<div class='project-icon-text'>")
            .css("background-color", staticColor)
            .css("color", textColor)
            .append(iconText);

        if (intro.ImageUrl == null || intro.ImageUrl == "" || intro.ImageUrl == undefined) {
            return projectNameIcon;
        }
        $(projectNameIcon).addClass("d-none");
        if (intro.ImageUrl.indexOf("fa-") > 0) {
            return $("<div>").append($("<div class='icon'>").append($("<i class='" + intro.ImageUrl + "'></i>")))
                .append(projectNameIcon);
        }
        else {
            return $("<div>").append($("<div class='project-icon'>").append($("<img src='" + intro.ImageUrl + "' \
            onerror='$(this).hide();$(this).parent().parent().find(\".project-icon-text\").removeClass(\"d-none\")'>")))
                .append(projectNameIcon);
        }
    }

    private getlocalStorage() {
        if (!this.myStorage)
            this.myStorage = window.localStorage
        return this.myStorage;
    }
    private getProjectId() {
        var projectId = window.location.pathname.split('/')[window.location.pathname.split('/').length - 1]
        return projectId;
    }
    private getItem(key): any {
        this.getlocalStorage()
        var projectId = this.getProjectId()
        return JSON.parse(this.myStorage.getItem(projectId + "_" + key))
    }
    private setItem(key, value) {
        this.getlocalStorage()
        var projectId = this.getProjectId()
        this.myStorage.setItem(projectId + "_" + key, JSON.stringify(value))
    }
    protected onSuccess(sender: IAjaxObject, context: IBoardContext, result: IBoardResultDto, loadFromCaceh: boolean) {
        sender.result = result;
        var cache = this.getItem(sender.url)
        if (!loadFromCaceh && JSON.stringify(cache) === JSON.stringify(result)) return
        this.setItem(sender.url, result)
        if (result !== null && result !== undefined && typeof (result.Infos) === typeof ([])) {
            sender.state = AjaxState.success;

            const resultfiltered = result.Infos?.filter((p) => this.isValidResult(p, context)) ?? [];
            const groupBy = (array, key) => {
                // Return the end result
                return array.reduce((result, currentValue) => {
                    // If an array already present for key, push it to the array. Else create an array and push the object
                    (result[currentValue[key]] = result[currentValue[key]] || []).push(
                        currentValue
                    );
                    // Return the current iteration `result` value, this will be taken as next iteration `result` value and accumulate
                    return result;
                }, {}); // empty object is the initial value for result object
            };

            var personGroupedByType = resultfiltered.map((v) => v.BoxTitle).concat(result.Widgets?.map((v) => v.BoxTitle) ?? []).concat(result.Htmls?.map((v) => v.BoxTitle) ?? []);
            const boardBoxes = personGroupedByType.filter(this.onlyUnique)
            var that = this;
            if (boardBoxes !== undefined && boardBoxes.length > 0) {
                for (var index = 0; index < boardBoxes.length; index++) {
                    var element = boardBoxes[index]
                    var filteredInfo = resultfiltered.filter((p) => p.BoxTitle == element) ?? [];
                    var filteredWidgets = result.Widgets?.filter((p) => p.BoxTitle == element) ?? [];
                    var filteredHtmls = result.Htmls?.filter((p) => p.BoxTitle == element) ?? [];
                    var filteredButtons = result.Buttons?.filter((p) => p.BoxTitle == element) ?? [];

                    const boardItem = that.createBoardItems(sender, context, filteredInfo, filteredButtons, filteredWidgets, filteredHtmls, element);
                    if ($('.board-components-result .item[data-type="' + element + '"]').length > 0) {
                        var item = $('.board-components-result .item[data-type="' + element + '"]')
                        $(boardItem).attr('class', item.attr('class')).attr('id', $(item).attr('id'))
                        $(item).replaceWith(boardItem);
                    }
                    else if (element.startsWith("Timesheet since")) {
                        $('.board-components-result .item[data-type]').each(function () {
                            if ($(this).attr("data-type").startsWith("Timesheet since")) {
                                $(boardItem).attr('class', $(this).attr('class')).attr('id', $(this).attr('id'))
                                $(this).replaceWith(boardItem)
                            }
                        });
                    }
                    else {
                        context.boardHolder.append(boardItem);
                    }
                }
            }
            if (!loadFromCaceh)
                this.onResize();

            if (resultfiltered.length > 0 || (result.Widgets && result.Widgets.length > 0) || (result.Htmls && result.Htmls.length > 0)) {
                console.log("resultfiltered has item");
                context.resultPanel.append(context.boardHolder);
            }
            if (result !== null && result !== undefined && result.menus !== null && result.menus !== undefined && typeof (result.menus) === typeof ([])) {
                sender.state = AjaxState.success;

                var header = this.filterInput.parent();

                const managefiltered = result.menus?.filter((p) => p.Url != null && p.Url != undefined) ?? [];
                const manageItem = this.createManageItems(sender, context, managefiltered);
                const resultfiltered = result.menus?.filter((p) => p.Url != null && p.Url != undefined) ?? [];

                const addabledItem = this.createAddableItems(sender, context, resultfiltered);
            }
            if (result !== null && result !== undefined && result.Intros !== null && result.Intros !== undefined && result.Intros[0] !== null
                && result.Intros[0] !== undefined && result.Intros[0].Name !== null) {
                this.createBoardIntro(sender, context, result.Intros[0])
            }

        } else {
            sender.state = AjaxState.failed;
            console.error("ajax success but failed to decode the response -> wellform expcted response is like this: [{Title:'',Description:'',Url:'',Url:''}] ");
        }
    }
    protected isValidResult(item: IInfoDto, context: IBoardContext) {
        return true;
    }
    protected onlyUnique(value, index, self) {
        return self.indexOf(value) === index;
    }
    protected onComplete(context: IBoardContext, jqXHR: JQueryXHR) {
        context.ajaxCallCount++;

        if (context.ajaxList.filter((p) => p.state === 0).length === 0) {
            //this.waiting.hide();
            if (context.resultCount === 0) {
                const ulNothing = $("<div class=\"item\">");
                ulNothing.append("<a>").append("<span>").html("Nothing found");
                context.resultPanel.append(ulNothing);
            }
        }
        this.modalHelper.enableLink($(".board-components-result [target='$modal'][href]"));
        //window.page.services.getService("modalHelper").enableLink()
        if (context.ajaxCallCount == context.ajaxList.length) {
            var header = this.filterInput.parent();
            this.bindAddableItemsButtonClick(context);
            if (window.page.board)
                window.page.board.onResize();

            if ($(".board-addable-items-container").children().length > 0) {
                $(".add-button").show();
            }
            if ($(".board-manage-items-container").children().length > 0) {
                //$(".manage-button").fadeIn();
            }
        }
    }

    protected onError(sender: IAjaxObject, boardHolder: JQuery, jqXHR: JQueryXHR) {
        sender.state = AjaxState.failed;
        const ulFail = $("<div class=\"item\">");
        ulFail.append($("<a>")
            .html("ajax failed Loading data from source [" + sender.url + "]"));
        boardHolder.append(ulFail);
        console.error(jqXHR);
    }
}

export interface IBoardContext {
    ajaxCallCount: number;
    ajaxList: IAjaxObject[];
    resultPanel: JQuery;
    addableItemsPanel: JQuery;
    resultCount: number;
    boardHolder: JQuery;
    addabledItemsHolder: JQuery;
    beginSearchStarted: boolean;
    boardItemId: string;
    boardType: string;
}
export interface IAjaxObject {
    url: string;
    state: AjaxState;
    ajx?: JQueryXHR;
    displayMessage?: string;
    result?: IBoardResultDto;
}

export enum AjaxState {
    pending,
    success,
    failed,
}
export enum ActionEnum {
    Redirect,
    Popup,
    NewWindow,
}



export interface IInfoDto {
    BoxColour: string;
    BoxTitle: string;
    BoxColumnsCount: number;
    Url: string;
    Name: string;
    Description?: string;
    Icon?: string;
    Action: ActionEnum;
}

export interface IButtonDto {
    BoxColour: string;
    BoxTitle: string;
    Icon: string;
    Url: string;
    Text?: string;
    Tooltip?: string;
    Action: ActionEnum;
}

export interface IIntroDto {
    Url: string;
    Name: string;
    ImageUrl?: string;
    Description?: string;
}

export interface IWidgetDto {
    BoxColour: string;
    BoxTitle: string;
    Url: string;
    Result: JQuery;
}

export interface IHtmlDto {
    BoxColour: string;
    BoxTitle: string;
    RawHtml: string;
}
export interface IMenuDto {
    Url: string;
    Name: string;
    Body?: string;
    Icon?: string;
}

export interface IBoardResultDto {
    Widgets?: IWidgetDto[];
    Htmls?: IHtmlDto[];
    Buttons?: IButtonDto[];
    Infos?: IInfoDto[];
    menus?: IMenuDto[];
    Intros?: IIntroDto[];
}
//var boardComponents = new BoardComponents($(".board-components"));
