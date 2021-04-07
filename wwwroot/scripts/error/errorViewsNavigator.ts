﻿/// <amd-dependency path='../model/service' />
/// <amd-dependency path='../error/errorTemplates' />
/// <amd-dependency path='../extensions' />
import Service from '../model/service';


export default class ErrorViewsNavigator {
    public static goToServiceError(service: Service, url: string) {
        let errorContent = errorTemplates.SERVICE.replace("[#URL#]", url).replace("[#SERVICE#]", service.Name);
        $("main").replaceWith(errorContent);
        let addressBar = url.trimHttpProtocol().replace(service.BaseUrl.trimHttpProtocol(), service.Name).withPrefix("/");
        window.history.pushState(null, service.Name, addressBar);
    }
}
