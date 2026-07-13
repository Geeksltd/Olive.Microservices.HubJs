/// <amd-dependency path="../model/service" />
/// <amd-dependency path="../extensions" />
import Service from '../model/service';
export default class ErrorViewsNavigator {
    static showServiceError(trigger: JQuery, service: Service, url: string, response: JQueryXHR, backUrl?: string): void;
    private static getMessage;
    private static getReferenceCode;
    private static getSupportLine;
    private static getButtons;
    private static fill;
}
