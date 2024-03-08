/// <amd-dependency path='../model/service' />
/// <amd-dependency path='../extensions' />
import Service from '../model/service';
import { SERVICE_ERROR_TEMPLATE } from './errorTemplates';


export default class ErrorViewsNavigator {
    public static showServiceError(trigger: JQuery, service: Service, url: string, response: JQueryXHR) {
        let errorContent = SERVICE_ERROR_TEMPLATE
            .replace("[#URL#]", url)
            .replace("[#SERVICE#]", service.Name)
            .replace("[#RESPONSE#]", response.responseText);
        if (trigger && trigger.length > 0) {
            if (trigger.prop("tagName") == "MAIN")
                trigger.html(errorContent)
            else {
                trigger = trigger.closest('main');
                trigger.html(errorContent)
            }
        }
        else if ($('[data-module-inner-container]').length > 0)
            $("[data-module-inner-container]").html(errorContent)
        else
            $("main").html(errorContent);
        // let addressBar = url.trimHttpProtocol().replace(service.BaseUrl.trimHttpProtocol(), service.Name).withPrefix("/");
        // window.history.pushState(null, service.Name, addressBar);
    }
}
