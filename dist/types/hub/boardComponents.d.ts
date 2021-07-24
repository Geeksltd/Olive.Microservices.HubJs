import { ModalHelper } from 'olive/components/modal';
export default class BoardComponents implements IService {
    private input;
    private urlList;
    private boardItemId;
    private boardType;
    private filterInput;
    private modalHelper;
    constructor(input: JQuery, modalHelper: ModalHelper);
    private filterEnable;
    private onChanged;
    protected getResultPanel(): JQuery;
    protected getAddableItemsPanel(): JQuery;
    protected createSearchComponent(urls: string[]): void;
    protected createBoardItems(sender: IAjaxObject, context: IBoardContext, items: IResultItemDto[]): JQuery;
    protected createAddableItems(sender: IAjaxObject, context: IBoardContext, items: IAddableItemDto[]): JQuery;
    protected createManageItems(sender: IAjaxObject, context: IBoardContext, items: IAddableItemDto[]): JQuery;
    protected addColour(item: IResultItemDto): string;
    protected createItem(item: IResultItemDto, context: IBoardContext): JQuery;
    protected createAddableItem(item: IAddableItemDto, context: IBoardContext): JQuery;
    protected createManageItem(item: IAddableItemDto, context: IBoardContext): JQuery;
    protected bindAddableItemsButtonClick(context: IBoardContext): void;
    protected showIcon(item: any): JQuery;
    protected onSuccess(sender: IAjaxObject, context: IBoardContext, result: IBoardResultDto): void;
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
    Body: string;
    IconUrl: string;
    AddUrl: string;
    ManageUrl: string;
}
export interface IBoardResultDto {
    Results: IResultItemDto[];
    AddabledItems: IAddableItemDto[];
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
