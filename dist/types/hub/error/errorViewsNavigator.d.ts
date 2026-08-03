/// <amd-dependency path="../model/service" />
/// <amd-dependency path="../extensions" />
import Service from '../model/service';
export default class ErrorViewsNavigator {
    static showServiceError(trigger: JQuery, service: Service, url: string, response: JQueryXHR, backUrl?: string): void;
    static showGenericError(trigger: JQuery, url: string, response: JQueryXHR, backUrl?: string): void;
    private static showError;
    private static hostOf;
    private static getMessage;
    private static getReferenceCode;
    private static getSupportLine;
    private static getReferenceCodeHtml;
    private static getAuditUrl;
    private static getButtons;
    private static fill;
}
