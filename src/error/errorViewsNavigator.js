define(["require", "exports", "../model/service", "../error/errorTemplates", "../extensions"], function (require, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    class ErrorViewsNavigator {
        static goToServiceError(service, url) {
            let errorContent = errorTemplates.SERVICE.replace("[#URL#]", url).replace("[#SERVICE#]", service.Name);
            $("main").replaceWith(errorContent);
            let addressBar = url.trimHttpProtocol().replace(service.BaseUrl.trimHttpProtocol(), service.Name).withPrefix("/");
            window.history.pushState(null, service.Name, addressBar);
        }
    }
    exports.default = ErrorViewsNavigator;
});
//# sourceMappingURL=errorViewsNavigator.js.map