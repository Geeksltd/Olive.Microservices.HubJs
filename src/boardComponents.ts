import { ModalHelper } from 'olive/components/modal'
import Url from 'olive/components/url';
import AjaxRedirect from 'olive/mvc/ajaxRedirect';

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
        this.filterEnable()
        this.modalHelper = modalHelper;
        this.createSearchComponent(urls);
    }

    private filterEnable() {
        this.filterInput.off("keyup.board-components-filter").on("keyup.board-components-filter",
            function () {
                if (this.timer != null && this.timer != undefined)
                    clearTimeout(this.timer)
                setTimeout(function () {
                    window.page.board.onChanged()
                }, 200)
            }
        );

        this.filterInput.on("keydown", e => {
            if (e.keyCode == 13) e.preventDefault();
        });
    }
    private onChanged(event: any) {
        this.filterInput = this.filterInput || $(event.currentTarget);
        let keywords = this.filterInput.val().toLowerCase().split(' ');
        let rows = $(".hub-service").find('.board-components-result .item,.olive-instant-search-item');
        rows.each((index, e) => {
            let row = $(e);
            let content = row.text().toLowerCase();
            let hasAllKeywords = keywords.filter((i) => content.indexOf(i) == -1).length == 0;
            if (hasAllKeywords) row.show(); else row.hide();
            if (index == (rows.length - 1))
                window.page.board.onResize()
        });
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

    protected createSearchComponent(urls: string[]) {
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
            const icon = p.split("#")[1].trim();
            return {
                url: p.split("#")[0].trim(),
                icon,
                state: AjaxState.pending,
            };
        });

        const context: IBoardContext = {
            ajaxList,
            ajaxCallCount: 0,
            resultCount: 0,
            resultPanel,
            addableItemsPanel,
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
                    data: { boardItemId: context.boardItemId, boardType: context.boardType },
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
    protected createBoardItems(sender: IAjaxObject, context: IBoardContext, items: IResultItemDto[], addableItems: IAddableItemDto[]) {
        if (items.length == 0) return null;
        var table = $("<table>");

        const searchItem = $("<div class='item' data-type='" + items[0].Type + "'>");
        const h3 = $('<h3 >').html(items[0].Type + "s").append(this.createHeaderAction(items[0].Type, addableItems))
        searchItem.append($("<div class='header' " + " style=\"" + this.addColour(items[0]) + "\">").append(h3))

        //table.append($("<tr>").append($("<th " + "' style=\"" + this.addColour(items[0]) + "\" " + ">")

        for (let i = 0; i < items.length; i++) {
            context.resultCount++;
            table.append(this.createItem(items[i], context));
        }
        searchItem.append($("<div>").append(table))
        return searchItem;
    }
    private getItemType(addableItem: IAddableItemDto) {
        if (addableItem.Type == null || addableItem.Type == '' || addableItem.Type == undefined)
            return addableItem.Name;
        return addableItem.Type;
    }
    private handelLinksClick(link: any) {
        var ajaxredirect = this.ajaxRedirect;
        $(link).click(function (e) {
            e.preventDefault()
            $(".board-links .btn").removeClass("active")
            $(this).addClass("active")
            var url = $(this).attr("href");
            var serviceName = ''
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
            }
            if (urlToLoad) {
                $(".board-components-result, [data-module=BoardView]").fadeOut('false', function () { $(this).remove() })
                if (!serviceName)
                    serviceName = $(this).attr("href").split('?')[0].split('/').pop()
                $("[data-module-inner]").closest("service[of]").attr("of", serviceName)
                //if (currentServiceName == serviceName)

                ajaxredirect.go(urlToLoad, $("[data-module-inner]"), false, false, false, undefined, ajaxTarget)
                // else
                //     ajaxredirect.go(serviceName + (urlToLoad.startsWith('/') ? '' : '/') + urlToLoad, $("[data-module-inner]"), false, false, false)
                return false;
            }
            ajaxredirect.go($(this).attr("href"), null, false, false, false, undefined, ajaxTarget)

            return false;
        })
    }
    protected createHeaderAction(type: String, addableItems: IAddableItemDto[]) {
        const manageFiltered = addableItems.filter((p) => p.ManageUrl != null && p.ManageUrl != undefined && this.getItemType(p) == type);
        const addFiltered = addableItems.filter((p) => p.AddUrl != null && p.AddUrl != undefined && this.getItemType(p) == type);

        const headerAction = $("<div class='header-actions'>");

        if (addFiltered.length > 0) {
            var item = addFiltered[0];
            var attr = "";
            if (item.Action == ActionEnum.Popup)
                attr = "target=\"$modal\"";
            else if (item.Action == ActionEnum.NewWindow)
                attr = "target=\"_blank\"";
            headerAction.append($("<a href='" + item.AddUrl.replace("https://hub.app.geeks.ltd", "") + "' " + attr + ">").append('<i class="fas fa-plus" aria-hidden="true"></i>'));
        }

        if (manageFiltered.length > 0) {
            var item = manageFiltered[0];
            var attr = "";
            if (item.Action == ActionEnum.Popup)
                attr = "target=\"$modal\"";
            else if (item.Action == ActionEnum.NewWindow)
                attr = "target=\"_blank\"";
            headerAction.append($("<a href='" + item.ManageUrl.replace("https://hub.app.geeks.ltd", "") + "' " + attr + ">").append('<i class="fa fa-cog" aria-hidden="true"></i>'));
        }
        return headerAction;
    }

    protected isemptystring(str: string) {
        if ((typeof str == 'undefined') || (str == null) || (!str) || (str.length === 0) || (str === "") || (!/[^\s]/.test(str)) || (/^\s*$/.test(str)) || (str.replace(/\s/g, "") === ""))
            return true;
        else
            return false;
    }

    protected createAddableItems(sender: IAjaxObject, context: IBoardContext, items: IAddableItemDto[]) {
        const result = $(".board-addable-items-container");

        for (let i = 0; i < items.length; i++) {
            //context.resultCount++;
            result.append(this.createAddableItem(items[i], context));
        }
        return result;
    }
    protected createBoardIntro(sender: IAjaxObject, context: IBoardContext, intro: IBoardComponentsIntroDto) {
        const result = $(".board-components-result");
        if ($(".board-image:visible").length > 0) return;
        $(".board-image").append($("<a href='" + intro.BoardUrl + "' >").append(this.showIntroImage(intro).prop('outerHTML')))
        $(".board-info").append(
            $('<div class="col-md-9"><h2 class="mb-2">' + intro.Name + '</h2>\
            <div class="text-gray">' + intro.Description + '</div></div>'))
        $('.board-header').show();
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

    protected createManageItems(sender: IAjaxObject, context: IBoardContext, items: IAddableItemDto[]) {
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
            if ($("a[href='" + item.ManageUrl + "']").length > 0)
                $("a[href='" + item.ManageUrl + "']").remove();
            result.append(this.createManageItem(items[i], context));
            var attr = "";
            if (item.Action == ActionEnum.Popup)
                attr = "target=\"$modal\"";
            else if (item.Action == ActionEnum.NewWindow)
                attr = "target=\"_blank\"";
            //var link = $("<a class='btn btn-primary' href='" + this.boardPath + "?$boardContent={" + items[i].ManageUrl + "}'" + attr + ">")
            //var link = $("<a class='btn btn-primary' href='" + items[i].ManageUrl + "'" + attr + ">")
            if (items[i].ManageUrl.contains("repositories/repos"))
                var link = $("<a class='btn btn-primary' href='" + items[i].ManageUrl + "'" + " data-redirect='ajax' " + " ajax-target='board-body' " + attr + ">")
            else
                var link = $("<a class='btn btn-primary' href='" + items[i].ManageUrl + "'" + attr + ">")

            link.append(item.Name)
            headerLinks.append(link);
            this.handelLinksClick(link)
        }
        return result;
    }
    protected addColour(item: IResultItemDto) {
        if (item.Colour != undefined && item.Colour != null && item.Colour != "")
            return "background-color:" + item.Colour + ";"
        return "background-color:#aaa;";
    }
    protected createItem(item: IResultItemDto, context: IBoardContext) {
        var attr = "";
        if (item.Action == ActionEnum.Popup)
            attr = "target=\"$modal\"";
        else if (item.Action == ActionEnum.NewWindow)
            attr = "target=\"_blank\"";

        return $("<tr>").append($("<td >")
            .append($("<a href='" + item.Url + "' " + attr + " >")
                .append((item.IconUrl === null || item.IconUrl === undefined) ? $("<div class='icon'>") : this.showIcon(item))
                .append($("<div>").append($("<span class=\"board-component-name\">").append(item.Name))
                    .append($("<span>").html(item.Body)))));
    }
    protected createAddableItem(item: IAddableItemDto, context: IBoardContext) {
        var attr = "";
        if (item.Action == ActionEnum.Popup)
            attr = "target=\"$modal\"";
        else if (item.Action == ActionEnum.NewWindow)
            attr = "target=\"_blank\"";
        return $("<div class=\"menu-item\">")
            .append($("<a href='" + item.AddUrl + "' " + attr + "'>")
                .append((item.IconUrl === null || item.IconUrl === undefined) ?
                    $("<div class='icon'>") : this.showIcon(item)
                        .append(item.Name)
                        .append($("<small>")
                            .html(item.Body))));
    }

    protected createManageItem(item: IAddableItemDto, context: IBoardContext) {
        var attr = "";
        if (item.Action == ActionEnum.Popup)
            attr = "target=\"$modal\"";
        else if (item.Action == ActionEnum.NewWindow)
            attr = "target=\"_blank\"";

        return $("<div class=\"menu-item\">")
            .append($("<a href='" + item.ManageUrl + "' " + attr + "'>")
                .append((item.IconUrl === null || item.IconUrl === undefined) ?
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
        if (item.IconUrl.indexOf("fa-") > 0) {
            return $("<div class='icon'>").append($("<i class='" + item.IconUrl + "'></i>"));
        } else {
            return $("<div class='icon'>").append($("<img src='" + item.IconUrl + "'>"));
        }
    }
    private generateRandomColor() {
        return "#" + Math.floor(Math.random() * 16777215).toString(16);
    }

    private generateStaticColorFromName(name) {
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
        hexcolor = hexcolor.replace("#", "");
        var r = parseInt(hexcolor.substr(0, 2), 16);
        var g = parseInt(hexcolor.substr(2, 2), 16);
        var b = parseInt(hexcolor.substr(4, 2), 16);
        var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? 'black' : 'white';
    }
    protected showIntroImage(intro: any): JQuery {
        var iconText = intro.Name.substr(0, 2);
        if (intro.Name.contains("href")) {
            iconText = intro.Name.substr(intro.Name.lastIndexOf("➝") + 2, 2);
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
        sender.result = result.Results;
        var cache = this.getItem(sender.url)
        if (!loadFromCaceh && JSON.stringify(cache) === JSON.stringify(result)) return
        this.setItem(sender.url, result)
        if (result !== null && result !== undefined && typeof (result.Results) === typeof ([])) {
            sender.state = AjaxState.success;

            const resultfiltered = result.Results.filter((p) => this.isValidResult(p, context));
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

            const personGroupedByType = groupBy(resultfiltered, 'Type');
            var that = this;
            for (var element in personGroupedByType) {
                //var element = personGroupedByType[i]
                var filterdResult = resultfiltered.filter((p) => p.Type == element);

                const boardItem = that.createBoardItems(sender, context, filterdResult, result.AddabledItems);
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
                else
                    context.boardHolder.append(boardItem);
            }

            if (!loadFromCaceh)
                this.onResize();

            if (resultfiltered.length > 0) {

                context.resultPanel.append(context.boardHolder);
            }
            if (result !== null && result !== undefined && typeof (result.AddabledItems) === typeof ([])) {
                sender.state = AjaxState.success;

                var header = this.filterInput.parent();

                const managefiltered = result.AddabledItems.filter((p) => p.ManageUrl != null && p.ManageUrl != undefined);
                const manageItem = this.createManageItems(sender, context, managefiltered);
                const resultfiltered = result.AddabledItems.filter((p) => p.AddUrl != null && p.AddUrl != undefined);

                const addabledItem = this.createAddableItems(sender, context, resultfiltered);
            }
            if (result !== null && result !== undefined && result.BoardComponentsIntro !== null
                && result.BoardComponentsIntro !== undefined && result.BoardComponentsIntro.Name) {
                this.createBoardIntro(sender, context, result.BoardComponentsIntro)
            }

        } else {
            sender.state = AjaxState.failed;
            console.error("ajax success but failed to decode the response -> wellform expcted response is like this: [{Title:'',Description:'',IconUrl:'',Url:''}] ");
        }
    }
    protected isValidResult(item: IResultItemDto, context: IBoardContext) {
        return true;
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
    icon: string;
    state: AjaxState;
    ajx?: JQueryXHR;
    displayMessage?: string;
    result?: IResultItemDto[];
}


export interface IResultItemDto {
    Name: string;
    Type: string;
    Body: string;
    IconUrl: string;
    Action: ActionEnum;
    Url: string;
    Colour: string;
}

export interface IAddableItemDto {
    Name: string;
    Type: string;
    Body: string;
    IconUrl: string;
    AddUrl: string;
    ManageUrl: string;
    Action: ActionEnum;
}
export interface IBoardComponentsIntroDto {
    Name: string;
    Description: string;
    ImageUrl: string;
    BoardUrl: string;
}
export interface IBoardResultDto {
    Results: IResultItemDto[];
    AddabledItems: IAddableItemDto[];
    BoardComponentsIntro: IBoardComponentsIntroDto;
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

//var boardComponents = new BoardComponents($(".board-components"));
