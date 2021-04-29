import StandardAction from "olive/mvc/standardAction";
import Alert from 'olive/components/alert'
import Select from 'olive/plugins/select'
import Form from 'olive/components/form'
import { ModalHelper } from 'olive/components/modal'
import ResponseProcessor from "olive/mvc/responseProcessor";
import Waiting from "olive/components/waiting";
import AjaxRedirect from 'olive/mvc/ajaxRedirect'

export default class HubStandardAction extends StandardAction {
    constructor(alert: Alert, form: Form, waiting: Waiting, ajaxRedirect: AjaxRedirect, 
        responseProcessor: ResponseProcessor, select: Select, modalHelper: ModalHelper,
        serviceLocator: IServiceLocator) {
        super(alert, form, waiting, ajaxRedirect, 
            responseProcessor, select, modalHelper, serviceLocator);
    }

    protected redirect(action: any, trigger: any) {
        if (action.Target && action.Target === '_parent' && action.WithAjax === true && window.isModal())
        {
            let serviceName;
            let serviceContainer = trigger ? trigger.closest("service[of]") : $("service[of]").first();
            if (serviceContainer.length === 0)
                serviceContainer = $("service[of]").first();
            if (serviceContainer.length === 0)
                throw new Error("<service of='...' /> is not found on the page.");
            serviceName = serviceContainer.attr("of").toLocaleLowerCase();
            action.Redirect = "/" + serviceName + action.Redirect;
            window.open(action.Redirect, action.Target);
        }
        else{ 
            super.redirect(action,trigger);
        }
    }
}