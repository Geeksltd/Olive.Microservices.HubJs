import Url from "olive/components/url";
import ResponseProcessor from "olive/mvc/responseProcessor";
import Modal, { ModalHelper } from 'olive/components/modal'
import AjaxRedirect from "olive/mvc/ajaxRedirect";

export default class HubModal extends ModalHelper {

    constructor(private hubUrl: Url, private hubAjaxRedirect: AjaxRedirect, private hubresponseProcessor: ResponseProcessor) {
        super(hubUrl, hubAjaxRedirect, hubresponseProcessor);
    }

    protected openWithUrl(): void {

        let url = this.hubUrl.removeQuery(this.hubUrl.current(), "_modal");

        let serviceName = `[${$("service").attr('of')}]`;

        url = serviceName + "/" + this.hubUrl.makeRelative(this.hubUrl.removeQuery(this.hubUrl.current(), "_modal")).split("/")[1];

        this.hubAjaxRedirect.go(this.hubUrl.effectiveUrlProvider(url, null), $('main'), undefined, false, false, false, () => {
            new Modal(this.hubUrl, this.hubAjaxRedirect, this, null, this.hubUrl.getQuery("_modal")).open(false);
        });
    }
}
