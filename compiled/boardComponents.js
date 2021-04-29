define(["require", "exports"], function (require, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AjaxState = void 0;
    class BoardComponents {
        constructor(input) {
            this.input = input;
            this.boardItemId = null;
            this.boardType = null;
            if (input == null || input.length == 0)
                return;
            var urls = input.attr("data-board-source").split(";");
            this.filterInput = this.input.parent().find(".board-components-filter");
            this.createSearchComponent(urls);
            this.filterEnable();
        }
        filterEnable() {
            this.filterInput.off("keyup.board-components-filter").on("keyup.board-components-filter", this.onChanged);
            this.filterInput.on("keydown", e => {
                if (e.keyCode == 13)
                    e.preventDefault();
            });
        }
        onChanged(event) {
            this.filterInput = this.filterInput || $(event.currentTarget);
            let keywords = this.filterInput.val().toLowerCase().split(' ');
            let rows = this.filterInput.closest('.board-components-result').find(".item");
            rows.each((index, e) => {
                let row = $(e);
                let content = row.text().toLowerCase();
                let hasAllKeywords = keywords.filter((i) => content.indexOf(i) == -1).length == 0;
                if (hasAllKeywords)
                    row.show();
                else
                    row.hide();
            });
        }
        getResultPanel() {
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
        getAddableItemsPanel() {
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
        createSearchComponent(urls) {
            this.boardItemId = this.input.attr("data-id");
            this.boardType = this.input.attr("data-boardtype");
            const resultPanel = this.getResultPanel();
            const addableItemsPanel = this.getAddableItemsPanel();
            resultPanel.empty();
            addableItemsPanel.empty();
            const boardHolder = $("<div class='list-items'>");
            const addabledItemsHolder = $("<div class='list-items'>");
            const ajaxList = urls.map((p) => {
                const icon = p.split("#")[1].trim();
                return {
                    url: p.split("#")[0].trim(),
                    icon,
                    state: AjaxState.pending,
                };
            });
            const context = {
                ajaxList,
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
                if ($(e.target).is($("#AddableItemsButton")))
                    $(".board-addable-items-container").fadeOut();
            });
        }
        createSearchItems(sender, context, items) {
            for (let i = 0; i < items.length && i < 10; i++) {
                context.resultCount++;
                context.boardHolder.append(this.createItem(items[i], context));
            }
            if (items.length === 0) {
                context.boardHolder.addClass("d-none");
            }
        }
        createAddableItems(sender, context, items) {
            for (let i = 0; i < items.length && i < 10; i++) {
                //context.resultCount++;
                context.addabledItemsHolder.append(this.createItem(items[i], context));
            }
            if (items.length === 0) {
                context.addabledItemsHolder.addClass("d-none");
            }
        }
        createItem(item, context) {
            return $("<div class=\"item\">")
                .append($("<a href='" + item.Url + "'>")
                .append((item.IconUrl === null || item.IconUrl === undefined) ?
                $("<div class='icon'>") : this.showIcon(item))
                .append(item.Name)
                .append($("<small>")
                .html(item.Body)));
        }
        createAddableItem(item, context) {
            return $("<div class=\"item\">")
                .append($("<a href='" + item.Url + "'>")
                .append((item.IconUrl === null || item.IconUrl === undefined) ?
                $("<div class='icon'>") : this.showIcon(item)
                .append(item.Name)
                .append($("<small>")
                .html(item.Body))));
        }
        createAddableButton(context) {
            return $("<div class=\"item\">")
                .append($("<a href='#' id=\"AddableItemsButton\">")
                .append($("<div class='icon'>").append($("<i class='fas fa-plus'></i>")))
                .append($("<small>")));
        }
        bindAddableItemsButtonClick() {
            $("#AddableItemsButton").click(function (e) {
                e.preventDefault();
                var top = $(e.target).is("a") ? $(e.target).position().top : $(e.target).closest("a").position().top;
                $(".board-addable-items-container")
                    .css("left", $(e.target).position().left + $(e.target).width())
                    .css("top", top + 15)
                    .fadeToggle();
            });
        }
        showIcon(item) {
            if (item.IconUrl.indexOf("fa-") > 0) {
                return $("<div class='icon'>").append($("<i class='" + item.IconUrl + "'></i>"));
            }
            else {
                return $("<div class='icon'>").append($("<img src='" + item.IconUrl + "'>"));
            }
        }
        onSuccess(sender, context, result) {
            sender.result = result.Results;
            if (result !== null && result !== undefined && typeof (result.Results) === typeof ([])) {
                sender.state = AjaxState.success;
                const resultfiltered = result.Results.filter((p) => this.isValidResult(p, context));
                const boardItem = this.createSearchItems(sender, context, resultfiltered);
                //context.boardHolder.append(boardItem);
                if (context.beginSearchStarted && resultfiltered.length > 0) {
                    context.beginSearchStarted = false;
                    context.resultPanel.append(context.boardHolder);
                }
                if (result !== null && result !== undefined && typeof (result.AddabledItems) === typeof ([])) {
                    sender.state = AjaxState.success;
                    const resultfiltered = result.AddabledItems.filter((p) => this.isValidResult(p, context));
                    const addabledItem = this.createAddableItems(sender, context, resultfiltered);
                    //context.addabledItemsHolder.append(addabledItem);
                    if (resultfiltered.length > 0) {
                        context.addableItemsPanel.append(context.addabledItemsHolder);
                    }
                }
            }
            else {
                sender.state = AjaxState.failed;
                console.error("ajax success but failed to decode the response -> wellform expcted response is like this: [{Title:'',Description:'',IconUrl:'',Url:''}] ");
            }
        }
        isValidResult(item, context) {
            let resfilter = false;
            if (context.boardItemId) {
                if ((item.Body !== null &&
                    item.Body !== undefined)) {
                    resfilter = true;
                }
            }
            else {
                resfilter = true;
            }
            return resfilter;
        }
        onComplete(context, jqXHR) {
            if (context.ajaxList.filter((p) => p.state === 0).length === 0) {
                //this.waiting.hide();
                if (context.resultCount === 0) {
                    const ulNothing = $("<div class=\"item\">");
                    ulNothing.append("<a>").append("<span>").html("Nothing found");
                    context.resultPanel.append(ulNothing);
                }
            }
            if (this.input.parent().find(".board-components-result .list-items .item").length == context.ajaxList.length) {
                context.boardHolder.append(this.createAddableButton(context));
                this.bindAddableItemsButtonClick();
            }
        }
        onError(sender, boardHolder, jqXHR) {
            sender.state = AjaxState.failed;
            const ulFail = $("<div class=\"item\">");
            ulFail.append($("<a>")
                .html("ajax failed Loading data from source [" + sender.url + "]"));
            boardHolder.append(ulFail);
            console.error(jqXHR);
        }
    }
    exports.default = BoardComponents;
    var AjaxState;
    (function (AjaxState) {
        AjaxState[AjaxState["pending"] = 0] = "pending";
        AjaxState[AjaxState["success"] = 1] = "success";
        AjaxState[AjaxState["failed"] = 2] = "failed";
    })(AjaxState = exports.AjaxState || (exports.AjaxState = {}));
    var boardComponents = new BoardComponents($(".board-components"));
});
//# sourceMappingURL=boardComponents.js.map