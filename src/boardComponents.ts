export default class BoardComponents implements IService {
    private urlList: string[];
    private boardItemId: string = null;
    private boardType: string = null;
    private filterInput: JQuery;

    constructor(private input: JQuery) {
        if (input == null || input.length == 0) return;
        var urls = input.attr("data-board-source").split(";");
        this.filterInput = this.input.parent().find(".board-components-filter");
        this.createSearchComponent(urls);
        this.filterEnable()
    }
    private filterEnable() {
        this.filterInput.off("keyup.board-components-filter").on("keyup.board-components-filter", this.onChanged);

        this.filterInput.on("keydown", e => {
            if (e.keyCode == 13) e.preventDefault();
        });
    }
    private onChanged(event: any) {
        this.filterInput = this.filterInput || $(event.currentTarget);
        let keywords = this.filterInput.val().toLowerCase().split(' ');
        let rows =this.filterInput.parent().parent().find('.board-components-result .item');

        rows.each((index, e) => {
            let row = $(e);
            let content = row.text().toLowerCase();
            let hasAllKeywords = keywords.filter((i) => content.indexOf(i) == -1).length == 0;
            if (hasAllKeywords) row.show(); else row.hide();
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
        resultPanel.empty();
        addableItemsPanel.empty();

        const boardHolder = $("<div class='list-items'>");
        const addabledItemsHolder = $("<div class='list-items'>");


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
            ajaxCallCount:0,
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
            ajaxObject.ajx = $
                .ajax({
                    dataType: "json",
                    url: ajaxObject.url,
                    xhrFields: { withCredentials: true },
                    async: true,
                    data: { boardItemId: context.boardItemId, boardType: context.boardType },
                    success: (result) => this.onSuccess(ajaxObject, context, result),
                    complete: (jqXhr) => this.onComplete(context, jqXhr),
                    error: (jqXhr) => this.onError(ajaxObject, context.boardHolder, jqXhr),
                });
        }
        $(document).click(function (e) {
            if (!$(e.target).closest("a").is($("#AddableItemsButton")))
                $(".board-addable-items-container").fadeOut();
        })
    }
    protected createSearchItems(sender: IAjaxObject, context: IBoardContext, items: IResultItemDto[]) {

        for (let i = 0; i < items.length; i++) {
            context.resultCount++;
            context.boardHolder.append(this.createItem(items[i], context));
        }
    }
    protected createAddableItems(sender: IAjaxObject, context: IBoardContext, items: IResultItemDto[]) {

        for (let i = 0; i < items.length; i++) {
            //context.resultCount++;
            context.addabledItemsHolder.append(this.createAddableItem(items[i], context));
        }
    }
    protected addColour(item: IResultItemDto) {
        if (item.Colour != undefined && item.Colour != null && item.Colour != "")
            return "background-color:" + item.Colour + ";"
        return "";
    }
    protected createItem(item: IResultItemDto, context: IBoardContext) {
        return $("<div class=\"item\">")
            .append($("<a href='" + item.Url + "' style=\"" + this.addColour(item) + "\" >")
                .append($("<div>").append((item.IconUrl === null || item.IconUrl === undefined) ? $("<div class='icon'>") : this.showIcon(item))
                    .append($("<span>").append(item.Type))
                    .append("<br />")
                    .append($("<span class=\"board-component-name\">").append(item.Name))
                )
                .append($("<span>").html(item.Body)));
    }
    protected createAddableItem(item: IResultItemDto, context: IBoardContext) {
        return $("<div class=\"item\">")
            .append($("<a href='" + item.Url + "'>")
                .append((item.IconUrl === null || item.IconUrl === undefined) ?
                    $("<div class='icon'>") : this.showIcon(item)
                        .append(item.Name)
                        .append($("<small>")
                            .html(item.Body))));
    }

    protected createAddableButton(context: IBoardContext) {
        return $("<div class=\"item\">")
            .append($("<a href='#' id=\"AddableItemsButton\">")
                .append($("<div class='icon'>").append($("<i class='fas fa-plus'></i>")))
                .append($("<small>")));
    }
    protected bindAddableItemsButtonClick() {
        $("#AddableItemsButton").click(function (e) {
            e.preventDefault();
            var top = $(e.target).is("a") ? $(e.target).position().top : $(e.target).closest("a").position().top;
            $(".board-addable-items-container")
                .css("left", $(e.target).position().left + $(e.target).width())
                .css("top", top + 15)
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
    protected onSuccess(sender: IAjaxObject, context: IBoardContext, result: IBoardResultDto) {
        sender.result = result.Results;
        if (result !== null && result !== undefined && typeof (result.Results) === typeof ([])) {
            sender.state = AjaxState.success;

            const resultfiltered = result.Results.filter((p) => this.isValidResult(p, context));

            const boardItem = this.createSearchItems(sender, context, resultfiltered);
            //context.boardHolder.append(boardItem);

            context.resultPanel.append(context.boardHolder);

            if (result !== null && result !== undefined && typeof (result.AddabledItems) === typeof ([])) {
                sender.state = AjaxState.success;

                const resultfiltered = result.AddabledItems.filter((p) => this.isValidResult(p, context));

                const addabledItem = this.createAddableItems(sender, context, resultfiltered);
                //context.addabledItemsHolder.append(addabledItem);

                if (resultfiltered.length > 0) {
                    context.addableItemsPanel.append(context.addabledItemsHolder);
                }

            }

        } else {
            sender.state = AjaxState.failed;
            console.error("ajax success but failed to decode the response -> wellform expcted response is like this: [{Title:'',Description:'',IconUrl:'',Url:''}] ");
        }
    }
    protected isValidResult(item: IResultItemDto, context: IBoardContext) {
        // let resfilter = false;
        // if (context.boardItemId) {
        //     if (
        //         (
        //             item.Url !== null &&
        //             item.Url !== undefined
        //         )
        //     ) {
        //         resfilter = true;
        //     }
        // } else {
        //     resfilter = true;
        // }
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
        if (context.ajaxCallCount == context.ajaxList.length) {
            context.boardHolder.append(this.createAddableButton(context))
            this.bindAddableItemsButtonClick();
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
    ajaxCallCount:number;
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
    Url: string;
    GroupTitle: string;
    Colour: string;
}

export interface IBoardResultDto {
    Results: IResultItemDto[];
    AddabledItems: IResultItemDto[];
}

export enum AjaxState {
    pending,
    success,
    failed,
}

var boardComponents = new BoardComponents($(".board-components"));
