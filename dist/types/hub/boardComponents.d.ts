import { ModalHelper } from 'olive/components/modal';
import AjaxRedirect from 'olive/mvc/ajaxRedirect';
export default class BoardComponents implements IService {
    private input;
    private urlList;
    private boardItemId;
    private boardType;
    private filterInput;
    private modalHelper;
    private ajaxRedirect;
    private timer;
    private myStorage;
    private boardPath;
    constructor(input: JQuery, modalHelper: ModalHelper, ajaxRedirect: AjaxRedirect, boardPath: string);
    protected getResultPanel(): JQuery;
    protected getAddableItemsPanel(): JQuery;
    protected createBoardComponent(urls: string[]): Promise<void>;
    onResize(): void;
    protected createBoardItems(sender: IAjaxObject, context: IBoardContext, items: IInfoDto[], addableButtons: IButtonDto[], widgets: IWidgetDto[], html: IHtmlDto[], boxTitle: string, boxOrder: number): JQuery;
    private getItemBox;
    private handelLinksClick;
    protected createHeaderAction(boxTitle: String, addableButtons: IButtonDto[]): JQuery;
    protected createAddableItems(sender: IAjaxObject, context: IBoardContext, items: IMenuDto[]): JQuery;
    protected createBoardIntro(sender: IAjaxObject, context: IBoardContext, intro: IIntroDto): JQuery;
    protected relocateBoardComponentsHeaderActions(): void;
    protected removeBoardGap(): void;
    protected createManageItems(sender: IAjaxObject, context: IBoardContext, items: IMenuDto[]): JQuery;
    protected addColour(color: string): string;
    protected createInfo(item: IInfoDto, context: IBoardContext): JQuery;
    protected createWidgets(item: IWidgetDto, context: IBoardContext): void;
    protected createAddableItem(item: IMenuDto, context: IBoardContext): JQuery;
    protected createManageItem(item: IMenuDto, context: IBoardContext): JQuery;
    protected bindAddableItemsButtonClick(context: IBoardContext): void;
    protected showIcon(item: any): JQuery;
    private generateRandomColor;
    private generateStaticColorFromName;
    private getTextColor;
    protected showIntroImage(intro: any): JQuery;
    private getlocalStorage;
    private getProjectId;
    private getItem;
    private setItem;
    protected onSuccess(sender: IAjaxObject, context: IBoardContext, result: IBoardResultDto, loadFromCaceh: boolean): void;
    protected OrderBoxes(): void;
    protected isValidResult(item: IInfoDto, context: IBoardContext): boolean;
    protected onlyUnique(value: any, index: any, self: any): boolean;
    protected onComplete(context: IBoardContext, jqXHR: JQueryXHR): void;
    protected onError(sender: IAjaxObject, boardHolder: JQuery, jqXHR: JQueryXHR): void;
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
export declare enum AjaxState {
    pending = 0,
    success = 1,
    failed = 2
}
export declare enum ActionEnum {
    Redirect = 0,
    Popup = 1,
    NewWindow = 2
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
