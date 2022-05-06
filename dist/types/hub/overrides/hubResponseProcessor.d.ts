import ResponseProcessor from "olive/mvc/responseProcessor";
export default class HubResponseProcessor extends ResponseProcessor {
    fixUrlForOpenNewWindows(url: string): string;
    fixElementForOpenNewWindows(element: JQuery): void;
    fixUrlsForOpenNewWindows(response: any): JQuery;
    processAjaxResponse(response: any, containerModule: JQuery, trigger: JQuery, args: any): void;
}
