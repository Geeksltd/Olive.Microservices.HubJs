/// <amd-dependency path="../model/service" />
/// <amd-dependency path="../extensions" />
import Service from '../model/service';
export default class ErrorViewsNavigator {
    static goToServiceError(service: Service, url: string, response: JQueryXHR): void;
}
