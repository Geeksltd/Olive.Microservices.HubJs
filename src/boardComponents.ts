import { ModalHelper } from 'olive/components/modal'
import Url from 'olive/components/url';
import AjaxRedirect from 'olive/mvc/ajaxRedirect';
import MasonryGrid from './masonryGrid';

export default class BoardComponents implements IService {
    // When true, board AJAX is delayed 0-5s per call and 15 fake boxes are
    // injected so the masonry layout can be exercised. Defaults to localhost
    // detection; flip at runtime via `BoardComponents.isTestMode = true/false`.
    static isTestMode: boolean = (() => {
        return false;
        // if (typeof window === 'undefined') return false;
        // const host = window.location.hostname;
        // return host === 'localhost' || host === '127.0.0.1';
    })();

    private urlList: string[];
    private boardItemId: string = null;
    private boardType: string = null;
    private filterInput: JQuery;
    private modalHelper: ModalHelper
    private ajaxRedirect: AjaxRedirect
    private timer: any = null
    private myStorage: any
    private boardPath: string;
    masonryGrid: MasonryGrid;
    // Completion + teardown state. `allCompleted` gates late-AJAX recovery:
    // once the 15s safety cap (or the full AJAX+widget settle) has fired,
    // any subsequent onSuccess needs to re-enter the render pipeline itself
    // because onAllAjaxComplete has already run.
    private allCompleted: boolean = false;
    private destroyed: boolean = false;
    private context: IBoardContext;
    private safetyTimer: any = null;
    private static readonly EMPTY_STATE_CLASS = 'board-empty-state';
    private static readonly DOC_CLICK_NAMESPACE = 'click.boardComponents';
    constructor(private input: JQuery, modalHelper: ModalHelper, ajaxRedirect: AjaxRedirect, boardPath: string) {
        if (input == null || input.length == 0) return;
        this.boardPath = boardPath;
        var urls = input.attr("data-board-source").split(";");
        this.filterInput = this.input.parent().find(".board-components-filter");
        this.ajaxRedirect = ajaxRedirect;
        this.modalHelper = modalHelper;
        // If a prior BoardComponents instance was stashed on the input, tear it
        // down first so its observers / XHRs / timers don't leak into this mount.
        const prior = (input as any).data && input.data('boardComponents') as BoardComponents;
        if (prior && prior !== this) { try { prior.destroy(); } catch (e) { /* ignore */ } }
        if ((input as any).data) input.data('boardComponents', this);
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

        // Inject skeleton/widget-loader CSS into the board container up front so
        // no <style> is added to the document during the reveal (which would
        // make Chromium re-resolve all web fonts, blanking FA icons briefly).
        BoardComponents.ensureSkeletonStyle(resultPanel[0]);

        // Hide the grid until MasonryGrid signals ready, so items don't flicker
        // into view in their pre-layout positions while AJAX is still in flight.
        // (Absolute positioning is added later only on the loading-skeleton path,
        // so the cached path doesn't briefly collapse the parent height.)
        const boardHolder = $("<div class='list-items'>").css('opacity', 0);
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
            widgetPromises: [],
            widgetXhrs: [],
        };
        this.context = context;

        // In test mode, simulate a slow board with fake items for layout testing.
        const isTestMode = BoardComponents.isTestMode;

        // Phase 1: Check cache status and render cached data.
        // Skip the cache in test mode so the slow-load simulation runs every refresh.
        let allCached = !isTestMode;
        if (!isTestMode) {
            for (const ajaxObject of context.ajaxList) {
                const cache: IBoardResultDto = this.getItem(ajaxObject.url);
                if (cache) {
                    this.onSuccess(ajaxObject, context, cache, true);
                } else {
                    allCached = false;
                }
            }
        }

        // Phase 2: If all cached AND cache produced items, create MasonryGrid
        // immediately (instant layout). If all URLs were cached but every cache
        // was empty, skip the grid — boardHolder was never appended to the DOM,
        // so MasonryGrid would throw "invalid board dom structure" and retry
        // forever. The fresh AJAX calls will still fire in Phase 3.
        if (allCached && context.resultCount > 0) {
            this.initMasonryGrid();
        } else {
            // Float the grid out of normal flow so the skeletons own the
            // visible vertical space (no double-stacking with the invisible grid).
            boardHolder.css({ position: 'absolute', top: 0, left: 0, right: 0 });
            this.showLoading(context.resultPanel);
        }

        // Phase 3: Fire ALL AJAX calls in parallel
        // In test mode, delay each response 0-5s (mixed fast/slow) so loading + layout
        // behavior can be observed.
        const ajaxPromises = context.ajaxList.map(ajaxObject => {
            const delayMs = isTestMode ? Math.floor(Math.random() * 5000) : 0;
            return new Promise<void>((resolve) => {
                ajaxObject.ajx = $.ajax({
                    dataType: "json",
                    url: ajaxObject.url,
                    xhrFields: { withCredentials: true },
                    async: true,
                    data: { id: context.boardItemId, type: context.boardType },
                    success: (result) => {
                        setTimeout(() => {
                            if (this.destroyed) { resolve(); return; }
                            this.onSuccess(ajaxObject, context, result, false);
                            resolve();
                        }, delayMs);
                    },
                    error: (jqXhr) => {
                        setTimeout(() => {
                            if (this.destroyed) { resolve(); return; }
                            // Suppress the visible error card for intentional aborts
                            // (e.g. navigation away mid-load).
                            if (jqXhr && jqXhr.statusText !== 'abort') {
                                this.onError(ajaxObject, context.boardHolder, jqXhr);
                            }
                            resolve();
                        }, delayMs);
                    }
                });
            });
        });

        // Inject 15 fake boxes in test mode so the simulated board has
        // enough cards to exercise the masonry layout. Passing
        // loadFromCache=true bypasses the cache-equality short-circuit
        // in onSuccess so the fakes always render on every refresh.
        if (isTestMode) {
            const fakeAjax: IAjaxObject = { url: '__fake_localhost__', state: AjaxState.pending };
            const fakeDelayMs = Math.floor(Math.random() * 5000);
            ajaxPromises.push(new Promise<void>((resolve) => {
                setTimeout(() => {
                    this.onSuccess(fakeAjax, context, this.buildFakeBoardResult(15), true);
                    resolve();
                }, fakeDelayMs);
            }));
        }

        // Phase 4: When ALL AJAX calls complete.
        // hideLoading() is deferred to MasonryGrid's onReady so the
        // loader stays up until the grid is laid out, not just until
        // AJAX resolves — prevents first-render card shuffling.
        // Also wait for widget fetches (fired inside onSuccess) so the
        // skeleton stays up on first load until every request has settled.
        // Whichever resolves first — the AJAX+widget gate or the 15s safety
        // cap — triggers onAllAjaxComplete exactly once. Late AJAX responses
        // after that point are handled by recoverFromLateArrival() in onSuccess.
        const completeOnce = () => {
            if (this.allCompleted || this.destroyed) return;
            this.allCompleted = true;
            this.onAllAjaxComplete(context);
        };

        Promise.all(ajaxPromises).then(() => {
            Promise.all(context.widgetPromises).then(completeOnce);
        });

        this.safetyTimer = setTimeout(completeOnce, 15000);

        // Namespaced so re-mounts replace rather than accumulate handlers.
        $(document).off(BoardComponents.DOC_CLICK_NAMESPACE)
            .on(BoardComponents.DOC_CLICK_NAMESPACE, function (e) {
                if (!$(e.target).closest("a").is($(".manage-button,.add-button")))
                    $(".board-addable-items-container,.board-manage-items-container").fadeOut();
            });

        this.relocateBoardComponentsHeaderActions();
        this.removeBoardGap();
    }

    protected createBoardItems(sender: IAjaxObject, context: IBoardContext, items: IInfoDto[], addableButtons: IButtonDto[], widgets: IWidgetDto[], html: IHtmlDto[], boxTitle: string, boxOrder: number) {
        if (items.length == 0 && widgets.length == 0 && html.length == 0) return null;
        var content = $("<table>");
        if (items.length == 0 && widgets.length != 0 && html.length == 0) content = $("<div>");
        var colour = "#aaa"
        if (items.length > 0) colour = items[0].BoxColour
        else if (widgets.length > 0) colour = widgets[0].BoxColour
        else if (html.length > 0) colour = html[0].BoxColour

        const searchItem = $("<div class='item'>").attr('data-type', boxTitle).attr('box-order', boxOrder);
        const h3 = $('<h3>').html(boxTitle + (boxTitle.endsWith("s") ? "" : "s")).append(this.createHeaderAction(boxTitle, addableButtons));
        searchItem.append($("<div class='header'>").attr('style', this.addColour(colour)).append(h3));

        for (let i = 0; i < items.length; i++) {
            context.resultCount++;
            content.append(this.createInfo(items[i], context));
        }

        if (widgets.length > 0) BoardComponents.ensureSkeletonStyle(context.resultPanel[0]);

        for (let i = 0; i < widgets.length; i++) {
            context.resultCount++;
            // Build the placeholder as an element and pass it directly to
            // createWidgets — avoids a `div[data-url='${url}']` selector that
            // would break on quotes/brackets in the URL.
            const placeholder = $('<div>').attr('data-url', widgets[i].Url).html(this.widgetLoadingHtml());
            content.append(placeholder);
            this.createWidgets(widgets[i], placeholder, context);
        }
        for (let i = 0; i < html.length; i++) {
            context.resultCount++;
            // RawHtml is intentional server-provided markup — use .html() so it renders.
            content.append($('<tr>').append($('<td>').html(html[i].RawHtml)));
        }
        searchItem.append($("<div>").append(content));
        return searchItem;
    }
    private getItemBox(button: IButtonDto) {
        if (button.BoxTitle == null || button.BoxTitle == '' || button.BoxTitle == undefined)
            return button.BoxColour;
        return button.BoxTitle;
    }
    private handleLinksClick(link: any) {
        var ajaxredirect = this.ajaxRedirect;
        var self = this;
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
                // Tear down before the result panel is removed: cancels pending
                // XHRs, disconnects observers and clears the 15s safety timer
                // so nothing fires against the dead DOM.
                try { self.destroy(); } catch (err) { /* ignore */ }
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
            var item = addableButtons[i];
            const anchor = $('<a>').attr('href', item.Url);
            if (item.Action == ActionEnum.Popup) anchor.attr('target', '$modal');
            else if (item.Action == ActionEnum.NewWindow) anchor.attr('target', '_blank');
            anchor.append($('<i>').addClass(item.Icon).attr('aria-hidden', 'true'));
            headerAction.append(anchor);
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
        $(".board-image").append($('<a>').attr('href', intro.Url).append(this.showIntroImage(intro)));
        $(".board-info").append(
            $('<div class="col-md-9">')
                // Both Name and Description are server-controlled HTML
                // (Name can contain anchor tags — see showIntroImage's
                // `intro.Name.contains("href")` branch). Keep .html() so that
                // markup renders.
                .append($('<h2 class="mb-2">').html(intro.Name))
                .append($('<div class="text-gray">').html(intro.Description))
        );
        $('.board-header').show();
        $(".board-header [data-original-title]").tooltip();
        return result;
    }

    protected relocateBoardComponentsHeaderActions() {
        const boardPanel = this.input.parent();
        let headerActions = boardPanel.find(".board-components-header-actions");
        let addablecomponents = boardPanel.find(".board-addable-items-container");
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
            // Find-and-remove by exact href match via .filter so URLs with quotes
            // or brackets don't corrupt a CSS selector.
            const existing = $('a').filter(function () { return this.getAttribute('href') === item.Url; });
            if (existing.length > 0) existing.remove();
            result.append(this.createManageItem(items[i], context));

            const link = $('<a class="btn btn-primary" data-redirect="ajax" ajax-target="board-body" target="_blank">')
                .attr('href', items[i].Url)
                .html(item.Name);
            headerLinks.append(link);
            this.handleLinksClick(link);
        }

        this.sortBoardLinks(headerLinks);

        return result;
    }

    private sortBoardLinks(parent) {
        var items = parent.children().sort(function (a, b) {
            var vA = $(a).text();
            var vB = $(b).text();
            return (vA < vB) ? -1 : (vA > vB) ? 1 : 0;
        });

        parent.append(items);
    }

    protected addColour(color: string) {
        if (color != undefined && color != null && color != "")
            return "background-color:" + color + ";"
        return "background-color:#aaa;";
    }
    protected createInfo(item: IInfoDto, context: IBoardContext) {
        const anchor = $('<a>').attr('href', item.Url);
        if (item.Action == ActionEnum.Popup) anchor.attr('target', '$modal');
        else if (item.Action == ActionEnum.NewWindow) anchor.attr('target', '_blank');

        anchor
            .append((item.Icon === null || item.Icon === undefined) ? $("<div class='icon'>") : this.showIcon(item))
            .append($('<div>')
                .append($('<span class="board-component-name">').html(item.Name))
                // Description may contain controlled HTML — keep .html().
                .append($('<span>').html(item.Description)));

        return $('<tr>').append($('<td>').append(anchor));
    }
    protected createWidgets(item: IWidgetDto, placeholder: JQuery, context: IBoardContext) {
        // Track each widget fetch so the skeleton can wait for it. Always
        // resolves (never rejects) — skeleton should hide on any settled state.
        let xhr: JQueryXHR;
        const widgetPromise = new Promise<void>((resolve) => {
            xhr = $.ajax({
                url: item.Url,
                type: 'GET',
                async: true,
                xhrFields: { withCredentials: true },
                success: (response) => {
                    if (!this.destroyed) placeholder.html(response);
                    resolve();
                },
                error: (response, x) => {
                    if (this.destroyed || (response && response.statusText === 'abort')) {
                        resolve();
                        return;
                    }
                    console.log(response);
                    console.log(x);
                    // Build the failure message as elements so the fallback URL
                    // doesn't need interpolation into an HTML string.
                    const fallbackHref = this.input.attr("src") || '';
                    const fallbackLink = $('<a target="_blank">').attr('href', fallbackHref).text('widget');
                    placeholder.empty().append(
                        $('<div>').append('<br/><br/><br/>').append(
                            $('<center>').append('Failed to load ').append(fallbackLink)
                        )
                    );
                    resolve();
                }
            });
        });
        context.widgetXhrs.push(xhr);
        context.widgetPromises.push(widgetPromise);
    }
    protected createAddableItem(item: IMenuDto, context: IBoardContext) {
        return $('<div class="menu-item">')
            .append($('<a data-redirect="ajax" ajax-target="board-body" target="_blank">')
                .attr('href', item.Url)
                .append((item.Icon === null || item.Icon === undefined) ?
                    $("<div class='icon'>") : this.showIcon(item)
                        .append(item.Name)
                        .append($('<small>').html(item.Body))));
    }

    protected createManageItem(item: IMenuDto, context: IBoardContext) {
        return $('<div class="menu-item">')
            .append($('<a data-redirect="ajax" ajax-target="board-body" target="_blank">')
                .attr('href', item.Url)
                .append((item.Icon === null || item.Icon === undefined) ?
                    $("<div class='icon'>") : this.showIcon(item)
                        .append(item.Name)
                        .append($('<small>').html(item.Body))));
    }
    protected bindAddableItemsButtonClick(context: IBoardContext) {
        context.resultPanel.parent().find(".add-button").off("click").click(function (e) {
            e.preventDefault();
            $(".board-manage-items-container,.board-addable-items-container").fadeOut();
            $(this).parent().parent().find(".board-addable-items-container")
                .fadeToggle();
        });

        context.resultPanel.parent().find(".manage-button").off("click").click(function (e) {
            e.preventDefault();
            $(".board-manage-items-container,.board-addable-items-container").fadeOut();
            $(this).parent().parent().find(".board-manage-items-container")
                .fadeToggle();
        });
    }
    protected showIcon(item: any): JQuery {
        if (item.Icon.indexOf("fa-") > 0) {
            return $("<div class='icon'>").append($('<i>').addClass(item.Icon));
        } else {
            return $("<div class='icon'>").append($('<img>').attr('src', item.Icon));
        }
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
            return $('<div>').append($("<div class='icon'>").append($('<i>').addClass(intro.ImageUrl)))
                .append(projectNameIcon);
        }
        else {
            const img = $('<img>').attr('src', intro.ImageUrl).on('error', function () {
                $(this).hide();
                $(this).parent().parent().find('.project-icon-text').removeClass('d-none');
            });
            return $('<div>').append($("<div class='project-icon'>").append(img))
                .append(projectNameIcon);
        }
    }

    private buildFakeBoardResult(boxCount: number): IBoardResultDto {
        const colors = ['#4a90e2', '#e94e77', '#7ed321', '#f5a623', '#9013fe', '#50e3c2', '#bd10e0', '#ff6f00'];
        const sample = 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua';
        const Infos: IInfoDto[] = [];
        for (let b = 1; b <= boxCount; b++) {
            const boxTitle = `Demo Box ${b}`;
            const boxColour = colors[b % colors.length];
            // Vary row count 2..7 so cards have different heights — exercises the masonry packer.
            const rowCount = ((b * 7) % 6) + 2;
            for (let r = 1; r <= rowCount; r++) {
                Infos.push({
                    BoxColour: boxColour,
                    BoxTitle: boxTitle,
                    BoxOrder: b,
                    Url: '#',
                    Name: `Item ${b}.${r}`,
                    Description: sample.substr(0, 20 + ((b * r) % 80)),
                    Action: ActionEnum.Redirect
                });
            }
        }
        return { Infos };
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
    protected onSuccess(sender: IAjaxObject, context: IBoardContext, result: IBoardResultDto, loadFromCache: boolean) {
        if (this.destroyed) return;
        sender.result = result;
        var cache = this.getItem(sender.url)
        if (!loadFromCache && JSON.stringify(cache) === JSON.stringify(result)) return
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

            var personGroupedByType = resultfiltered.map((v) => ({ title: v.BoxTitle, order: v.BoxOrder }))
                .concat(result.Widgets?.map((v) => ({ title: v.BoxTitle, order: v.BoxOrder })) || [])
                .concat(result.Htmls?.map((v) => ({ title: v.BoxTitle, order: v.BoxOrder })) || [])
                .filter((b, index, self) => index === self.findIndex((v) => v.title === b.title));

            const boardBoxes = personGroupedByType.sort((a, b) => {
                const orderA = a.order !== null && a.order !== undefined ? a.order : 100;
                const orderB = b.order !== null && b.order !== undefined ? b.order : 100;
                return orderA - orderB;
            }).map((v) => v.title);

            var that = this;
            if (boardBoxes !== undefined && boardBoxes.length > 0) {
                for (var index = 0; index < boardBoxes.length; index++) {
                    var element = boardBoxes[index]
                    var filteredInfo = resultfiltered.filter((p) => p.BoxTitle == element) ?? [];
                    var filteredWidgets = result.Widgets?.filter((p) => p.BoxTitle == element) ?? [];
                    var filteredHtmls = result.Htmls?.filter((p) => p.BoxTitle == element) ?? [];
                    var filteredButtons = result.Buttons?.filter((p) => p.BoxTitle == element) ?? [];
                    var boxOrder = -1;
                    if (result.BoxOrder !== null && result.BoxOrder != undefined) {

                        boxOrder = result.BoxOrder[0];
                    }
                    const boardItem = that.createBoardItems(sender, context, filteredInfo, filteredButtons, filteredWidgets, filteredHtmls, element, boxOrder);
                    // Match existing items by exact data-type via .filter — a CSS
                    // selector with the interpolated value would break on quotes.
                    const existingItem = $('.board-components-result .item').filter(function () {
                        return this.getAttribute('data-type') === element;
                    });
                    if (existingItem.length > 0) {
                        $(boardItem).attr('class', existingItem.attr('class')).attr('id', existingItem.attr('id'));
                        existingItem.replaceWith(boardItem);
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

            if (resultfiltered.length > 0 || (result.Widgets && result.Widgets.length > 0) || (result.Htmls && result.Htmls.length > 0)) {
                // console.log("resultfiltered has item");
                context.resultPanel.append(context.boardHolder);
            }
            if (result !== null && result !== undefined && result.Menus !== null && result.Menus !== undefined && typeof (result.Menus) === typeof ([]) && result.Menus.length > 0) {
                sender.state = AjaxState.success;

                var header = this.filterInput.parent();

                const managefiltered = result.Menus?.filter((p) => p.Url != null && p.Url != undefined && p.IsDropDown != true) ?? [];
                const manageItem = this.createManageItems(sender, context, managefiltered);
                const resultfiltered = result.Menus?.filter((p) => p.Url != null && p.Url != undefined && p.IsDropDown == true) ?? [];
                const addabledItem = this.createAddableItems(sender, context, resultfiltered);
            }
            if (result !== null && result !== undefined && result.Intros !== null && result.Intros !== undefined && result.Intros[0] !== null
                && result.Intros[0] !== undefined && result.Intros[0].Name !== null) {
                this.createBoardIntro(sender, context, result.Intros[0])
            }
            if (result !== null && result !== undefined && result.BoxOrder !== null && result.BoxOrder !== undefined) {
                this.OrderBoxes();
            }

            // Fix A: late AJAX recovery. If the 15s safety cap already fired
            // (or all earlier promises settled), onAllAjaxComplete has already
            // run — which means it either appended "Nothing found" and skipped
            // masonry, or the grid was built without these new items.
            if (this.allCompleted && context.resultCount > 0) {
                this.recoverFromLateArrival(context);
            }
        }
        else {
            sender.state = AjaxState.failed;
            console.error("ajax success but failed to decode the response -> wellform expcted response is like this: [{Title:'',Description:'',Url:'',Url:''}] ");
        }
    }

    private recoverFromLateArrival(context: IBoardContext) {
        // Remove the "Nothing found" placeholder if it was shown.
        context.resultPanel.find('.' + BoardComponents.EMPTY_STATE_CLASS).remove();

        // Clear the absolute positioning that was applied while the skeleton
        // was in charge of the visible vertical space. Once real cards are
        // rendering they need to own that space back.
        context.boardHolder.css({
            opacity: '',
            position: '',
            top: '',
            left: '',
            right: ''
        });
        context.resultPanel.css('position', '');

        // Drop any lingering skeleton — this can only happen on the empty-then-late
        // path where hideLoading() already ran, but it's cheap and idempotent.
        this.hideLoading(context.resultPanel);

        if (this.masonryGrid) {
            this.masonryGrid.redraw();
        } else {
            this.initMasonryGrid();
        }
    }

    protected OrderBoxes() {

    }

    protected isValidResult(item: IInfoDto, context: IBoardContext) {
        return true;
    }
    protected onlyUnique(value, index, self) {
        return self.indexOf(value) === index;
    }
    protected onAllAjaxComplete(context: IBoardContext) {
        // Called exactly once when ALL parallel AJAX requests have completed

        if (context.resultCount === 0) {
            const ulNothing = $("<div class=\"item " + BoardComponents.EMPTY_STATE_CLASS + "\">");
            ulNothing.append("<a>").append("<span>").html("Nothing found");
            context.resultPanel.append(ulNothing);
        }

        this.bindAddableItemsButtonClick(context);

        if ($(".board-addable-items-container").children().length > 0) {
            $(".add-button").show();
        }

        this.modalHelper.enableLink($(".board-components-result [target='$modal'][href]"));

        // Empty result: no grid will be created, hide the loader directly
        // so it does not remain stuck waiting for an onReady that never fires.
        // Also clear the absolute positioning on the (empty) boardHolder so if a
        // late AJAX response arrives, it can render in normal flow immediately
        // via recoverFromLateArrival().
        if (context.resultCount === 0) {
            this.hideLoading($('.board-components-result'));
            context.boardHolder.css({ opacity: '', position: '', top: '', left: '', right: '' });
            context.resultPanel.css('position', '');
            return;
        }

        // Initialize MasonryGrid if not already created (handles non-cached case)
        this.initMasonryGrid();
    }

    protected initMasonryGrid() {
        if (this.masonryGrid) return; // Already initialized
        if (this.destroyed) return;

        const dataAttr = $('.board-components-result').attr("data-min-column-width");
        const minColumnWidth = dataAttr ? parseInt(dataAttr) : 300;

        this.masonryGrid = new MasonryGrid({
            parentSelector: '.board-components-result > .list-items',
            itemsSelector: ".item",
            minColumnWidth: minColumnWidth,
            onReady: () => {
                if (this.destroyed) return;
                this.hideLoading($('.board-components-result'));
                // Reveal the grid and restore normal flow; the .list-items
                // transition rule injected by MasonryGrid fades it in smoothly.
                $('.board-components-result > .list-items').css({
                    opacity: '',
                    position: '',
                    top: '',
                    left: '',
                    right: ''
                });
            }
        });
    }

    // Teardown — safe to call multiple times. Cancels in-flight XHRs,
    // disconnects the masonry observer, clears the safety timer, and unbinds
    // the namespaced document click handler. Called from handleLinksClick
    // before the board DOM fades out, and from the constructor when a prior
    // instance is replaced on the same input element.
    destroy() {
        if (this.destroyed) return;
        this.destroyed = true;

        if (this.safetyTimer) { clearTimeout(this.safetyTimer); this.safetyTimer = null; }

        if (this.context) {
            this.context.ajaxList?.forEach(a => {
                try { a.ajx?.abort(); } catch (e) { /* ignore */ }
            });
            this.context.widgetXhrs?.forEach(x => {
                try { x?.abort(); } catch (e) { /* ignore */ }
            });
        }

        try { this.masonryGrid?.destroy(); } catch (e) { /* ignore */ }
        this.masonryGrid = undefined;

        // Intentionally do NOT $(document).off the click namespace here — if a
        // second board is mounted it will replace the handler via .off().on(),
        // and a stale handler with no matching DOM is a no-op. Unbinding here
        // would break the click-dismiss on any co-existing board instance.

        if (this.input && (this.input as any).data) {
            const stored = this.input.data('boardComponents');
            if (stored === this) this.input.removeData('boardComponents');
        }
    }

    private static readonly SKELETON_STYLE_CLASS = 'board-loading-skeleton-style';

    // Inject the skeleton + widget-loader CSS into a board-local container
    // instead of <head>. Adding stylesheets to <head> at runtime makes Chromium
    // re-resolve every web font on the page, which briefly blanks all
    // FontAwesome glyphs (FA's font-display: block). Per-board injection keeps
    // it scoped to the board's lifecycle.
    static ensureSkeletonStyle(target: Element) {
        if (typeof document === 'undefined' || !target) return;
        if (target.querySelector('style.' + BoardComponents.SKELETON_STYLE_CLASS)) return;
        const style = document.createElement('style');
        style.className = BoardComponents.SKELETON_STYLE_CLASS;
        // Card shape mirrors the real .item: colored header bar on top,
        // then rows of [icon + name + description]. Multi-column flow gives
        // true masonry behavior so heights balance across columns.
        style.textContent = `
            /* Own the grid-row layout so the skeleton → real grid handoff has
               no visible shift. The consuming app has no CSS for .list-items /
               .column, so defining them here keeps gaps/alignment identical to
               the skeleton below. */
            .board-components-result > .list-items {
                display: flex;
                gap: 16px;
                padding: 8px 0;
                align-items: flex-start;
            }
            .board-components-result > .list-items > .column {
                flex: 1 1 0;
                min-width: 0;
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            .board-components-result > .list-items > .column > .item {
                width: 100%;
            }
            .board-loading {
                display: flex;
                gap: 16px;
                padding: 8px 0;
                align-items: flex-start;
            }
            .board-loading .skel-column {
                flex: 1 1 0;
                min-width: 0;
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            .board-loading .skel-card {
                background: #fff;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 1px 3px rgba(0,0,0,0.06);
                border: 1px solid #eee;
                width: 100%;
            }
            .board-loading .skel-card-header {
                height: 44px;
                background: linear-gradient(90deg, #d8dde2 0%, #e9edf0 50%, #d8dde2 100%);
                background-size: 200% 100%;
                animation: board-skel-shimmer 1.4s ease-in-out infinite;
            }
            .board-loading .skel-row {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 11px 14px;
                border-top: 1px solid #f3f3f3;
                height: 52px;
                box-sizing: border-box;
            }
            .board-loading .skel-icon {
                width: 18px;
                height: 18px;
                border-radius: 3px;
                flex-shrink: 0;
                order: 2;
                background: linear-gradient(90deg, #ececec 0%, #f6f7f8 50%, #ececec 100%);
                background-size: 200% 100%;
                animation: board-skel-shimmer 1.4s ease-in-out infinite;
            }
            .board-loading .skel-row-text {
                flex: 1;
                min-width: 0;
                order: 1;
            }
            .board-loading .skel-bar {
                display: block;
                height: 10px;
                border-radius: 4px;
                background: linear-gradient(90deg, #ececec 0%, #f6f7f8 50%, #ececec 100%);
                background-size: 200% 100%;
                animation: board-skel-shimmer 1.4s ease-in-out infinite;
            }
            .board-loading .skel-name { width: 55%; margin-bottom: 7px; }
            .board-loading .skel-desc { width: 78%; height: 8px; opacity: 0.7; }
            @keyframes board-skel-shimmer {
                0% { background-position: 100% 0; }
                100% { background-position: -100% 0; }
            }
            /* In-card widget loader: 3 bouncing dots, neutral palette.
               Kept small (40px) so the layout shift when the real widget
               content replaces the loader is minimised. */
            .board-widget-loading {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                min-height: 40px;
                padding: 10px;
            }
            .board-widget-loading .dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #b0b6bd;
                animation: board-widget-bounce 1.2s ease-in-out infinite both;
            }
            .board-widget-loading .dot:nth-child(1) { animation-delay: -0.32s; }
            .board-widget-loading .dot:nth-child(2) { animation-delay: -0.16s; }
            @keyframes board-widget-bounce {
                0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
                40%           { transform: scale(1);   opacity: 1; }
            }
        `;
        target.appendChild(style);
    }

    private widgetLoadingHtml(): string {
        return '<div class="board-widget-loading"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>';
    }

    protected showLoading(container: JQuery) {
        BoardComponents.ensureSkeletonStyle(container[0]);
        // Container must be position:relative so the absolutely-positioned
        // .list-items overlays this skeleton area.
        container.css('position', 'relative');

        const dataAttr = container.attr("data-min-column-width");
        const minCol = dataAttr ? parseInt(dataAttr) : 300;
        // Same column-count math MasonryGrid uses, so the skeleton matches the
        // grid we're about to render.
        const containerWidth = container[0].clientWidth || window.innerWidth;
        const colCount = Math.max(Math.floor(containerWidth / minCol), 1);
        const cardsPerCol = 3;
        // Row counts per card position — fixed pattern gives a masonry-ish
        // silhouette without wild variance (real cards typically have 2–4 rows).
        const rowPattern = [3, 2, 4, 3, 2, 4, 3, 4, 2];

        const wrap = $('<div class="board-loading">');

        for (let c = 0; c < colCount; c++) {
            const column = $('<div class="skel-column">');
            for (let i = 0; i < cardsPerCol; i++) {
                const rowCount = rowPattern[(c * cardsPerCol + i) % rowPattern.length];
                const card = $('<div class="skel-card">');
                card.append('<div class="skel-card-header"></div>');
                for (let j = 0; j < rowCount; j++) {
                    card.append(
                        '<div class="skel-row">' +
                        '<div class="skel-row-text">' +
                        '<div class="skel-bar skel-name"></div>' +
                        '<div class="skel-bar skel-desc"></div>' +
                        '</div>' +
                        '<div class="skel-icon"></div>' +
                        '</div>'
                    );
                }
                column.append(card);
            }
            wrap.append(column);
        }
        container.append(wrap);
    }

    protected hideLoading(container: JQuery) {
        container.find('.board-loading').remove();
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
    widgetPromises: Promise<void>[];
    widgetXhrs: JQueryXHR[];
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
    BoxOrder?: number;
    Url: string;
    Name: string;
    Description?: string;
    Icon?: string;
    Action: ActionEnum;
}

export interface IButtonDto {
    BoxColour: string;
    BoxTitle: string;
    BoxOrder?: number;
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
    BoxOrder?: number;
    Url: string;
    Result: JQuery;
}

export interface IHtmlDto {
    BoxColour: string;
    BoxTitle: string;
    BoxOrder?: number;
    RawHtml: string;
}
export interface IMenuDto {
    Url: string;
    Name: string;
    Body?: string;
    Icon?: string;
    IsDropDown?: boolean;
}
export interface Box {
    BoxColour: string;
    BoxTitle: string;
    BoxOrder?: number;
}

export interface IBoardResultDto {
    BoxOrder?: number[];
    Widgets?: IWidgetDto[];
    Htmls?: IHtmlDto[];
    Buttons?: IButtonDto[];
    Infos?: IInfoDto[];
    Menus?: IMenuDto[];
    Intros?: IIntroDto[];
}
//var boardComponents = new BoardComponents($(".board-components"));

// Expose on window so AMD-boxed internals can be toggled from the browser
// console (e.g. `BoardComponents.isTestMode = true`). The RequireJS closure
// otherwise hides the class from the global scope.
if (typeof window !== 'undefined') {
    (window as any).BoardComponents = BoardComponents;
}
