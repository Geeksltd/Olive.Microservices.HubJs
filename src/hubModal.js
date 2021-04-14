define(["require", "exports", "olive/components/modal"], function (require, exports, modal_1) {
    Object.defineProperty(exports, "__esModule", { value: true });
    class HubModal extends modal_1.ModalHelper {
        constructor(hubUrl, hubAjaxRedirect, hubresponseProcessor) {
            super(hubUrl, hubAjaxRedirect, hubresponseProcessor);
            this.hubUrl = hubUrl;
            this.hubAjaxRedirect = hubAjaxRedirect;
            this.hubresponseProcessor = hubresponseProcessor;
        }
        openWithUrl() {
            let url = this.hubUrl.removeQuery(this.hubUrl.current(), "_modal");
            let serviceName = `[${$("service").attr('of')}]`;
            url = serviceName + "/" + this.hubUrl.makeRelative(this.hubUrl.removeQuery(this.hubUrl.current(), "_modal")).split("/")[1];
            this.hubAjaxRedirect.go(this.hubUrl.effectiveUrlProvider(url, null), $('main'), false, false, false, () => {
                new modal_1.default(this.hubUrl, this.hubAjaxRedirect, this, null, this.hubUrl.getQuery("_modal")).open(false);
            });
        }
    }
    exports.default = HubModal;
});
//# sourceMappingURL=hubModal.js.map