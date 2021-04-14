import Url from "olive/components/url";
import ResponseProcessor from "olive/mvc/responseProcessor";
import { ModalHelper } from 'olive/components/modal';
import AjaxRedirect from "olive/mvc/ajaxRedirect";
export default class HubModal extends ModalHelper {
    private hubUrl;
    private hubAjaxRedirect;
    private hubresponseProcessor;
    constructor(hubUrl: Url, hubAjaxRedirect: AjaxRedirect, hubresponseProcessor: ResponseProcessor);
    protected openWithUrl(): void;
}
