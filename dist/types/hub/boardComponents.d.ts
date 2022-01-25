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
    constructor(input: JQuery, modalHelper: ModalHelper, ajaxRedirect: AjaxRedirect);
    private filterEnable;
    private onChanged;
    protected getResultPanel(): JQuery;
    protected getAddableItemsPanel(): JQuery;
    protected createSearchComponent(urls: string[]): void;
    protected onResize(): void;
    protected createBoardItems(sender: IAjaxObject, context: IBoardContext, items: IResultItemDto[], addableItems: IAddableItemDto[]): JQuery;
    private getItemType;
    private handelLinksClick;
    protected createHeaderAction(type: String, addableItems: IAddableItemDto[]): JQuery;
    protected createAddableItems(sender: IAjaxObject, context: IBoardContext, items: IAddableItemDto[]): JQuery;
    protected createBoardIntro(sender: IAjaxObject, context: IBoardContext, intro: IBoardComponentsIntroDto): JQuery;
    protected createManageItems(sender: IAjaxObject, context: IBoardContext, items: IAddableItemDto[]): JQuery;
    protected addColour(item: IResultItemDto): string;
    protected createItem(item: IResultItemDto, context: IBoardContext): JQuery;
    protected createAddableItem(item: IAddableItemDto, context: IBoardContext): JQuery;
    protected createManageItem(item: IAddableItemDto, context: IBoardContext): JQuery;
    protected bindAddableItemsButtonClick(context: IBoardContext): void;
    protected showIcon(item: any): JQuery;
    private generateRandomColor;
    private getTextColor;
    protected showIntroImage(intro: any): JQuery;
    private getlocalStorage;
    private getProjectId;
    private getItem;
    private setItem;
    protected onSuccess(sender: IAjaxObject, context: IBoardContext, result: IBoardResultDto, loadFromCaceh: boolean): void;
    protected isValidResult(item: IResultItemDto, context: IBoardContext): boolean;
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
