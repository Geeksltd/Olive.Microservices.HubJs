import Form from "olive/components/form";
import Url from "olive/components/url";
import Validate from "olive/components/validate";
import Waiting from "olive/components/waiting";
import AjaxRedirect from "olive/mvc/ajaxRedirect";
export default class HubForm extends Form {
    constructor(url: Url, validate: Validate, waiting: Waiting, ajaxRedirect: AjaxRedirect);
    currentRequestUrlProvider: () => string;
}
