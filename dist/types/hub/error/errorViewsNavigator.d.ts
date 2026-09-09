/// <amd-dependency path="../model/service" />
/// <amd-dependency path="../extensions" />
import Service from '../model/service';
export default class ErrorViewsNavigator {
    static showServiceError(trigger: JQuery, service: Service, url: string, response: JQueryXHR, backUrl?: string, retryUrl?: string): void;
    static showGenericError(trigger: JQuery, url: string, response: JQueryXHR, backUrl?: string): void;
    private static showError;
    private static getContent;
    private static getAccessDeniedContent;
    private static getNotFoundContent;
    private static getFaultContent;
    private static getOfflineContent;
    private static card;
    private static getNextSteps;
    private static render;
    private static getAreaName;
    private static getLoginUrl;
    private static getButtons;
    private static backButton;
    private static retryButton;
    private static button;
    private static getEmployeeDetail;
    private static getOpenUrlButton;
    private static getResponseAppendix;
    private static safeHref;
    private static escape;
    private static escapeAttribute;
    private static hostOf;
    private static getReferenceCode;
    private static getSupportLine;
    private static getReferenceCodeHtml;
    private static getAuditUrl;
    private static fill;
}
