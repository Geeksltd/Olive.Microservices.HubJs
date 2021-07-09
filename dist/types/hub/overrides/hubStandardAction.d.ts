import StandardAction from "olive/mvc/standardAction";
import Alert from 'olive/components/alert';
import Select from 'olive/plugins/select';
import Form from 'olive/components/form';
import { ModalHelper } from 'olive/components/modal';
import ResponseProcessor from "olive/mvc/responseProcessor";
import Waiting from "olive/components/waiting";
import AjaxRedirect from 'olive/mvc/ajaxRedirect';
export default class HubStandardAction extends StandardAction {
    constructor(alert: Alert, form: Form, waiting: Waiting, ajaxRedirect: AjaxRedirect, responseProcessor: ResponseProcessor, select: Select, modalHelper: ModalHelper, serviceLocator: IServiceLocator);
    protected redirect(action: any, trigger: any): void;
}
