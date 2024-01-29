/// <amd-dependency path='../model/service' />
/// <amd-dependency path='../extensions' />
import Service from '../model/service';
import { SERVICE_ERROR_TEMPLATE } from './errorTemplates';


export default class ErrorViewsNavigator {
    public static goToServiceError(service: Service, url: string, response: JQueryXHR) {
        let errorContent = SERVICE_ERROR_TEMPLATE
            .replace("[#URL#]", url)
            .replace("[#SERVICE#]", service.Name)
            .replace("[#RESPONSE#]", response.responseText);
        if ($('[data-module-inner-container]').length > 0)
            $("[data-module-inner-container]").html(errorContent)
        else
            $("main").replaceWith(errorContent);
        let addressBar = url.trimHttpProtocol().replace(service.BaseUrl.trimHttpProtocol(), service.Name).withPrefix("/");
        window.history.pushState(null, service.Name, addressBar);
    }
}
