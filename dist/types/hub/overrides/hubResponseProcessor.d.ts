import ResponseProcessor from "olive/mvc/responseProcessor";
export default class HubResponseProcessor extends ResponseProcessor {
    private fixUrlForOpenNewWindows;
    private fixUrlsForOpenNewWindows;
    protected setWindowTitle(title: string): void;
    processAjaxResponse(response: any, containerModule: JQuery, trigger: JQuery, args: any, ajaxTarget?: string, ajaxhref?: string): void;
}
