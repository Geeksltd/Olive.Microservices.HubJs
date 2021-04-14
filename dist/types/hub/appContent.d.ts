import Waiting from "olive/components/waiting";
import AjaxRedirect from "olive/mvc/ajaxRedirect";
export default class AppContent implements IService {
    private waiting;
    private ajaxRedirect;
    private input?;
    enableContentBlock(selector: JQuery): void;
    enableHelp(selector: JQuery): void;
    constructor(waiting: Waiting, ajaxRedirect: AjaxRedirect, input?: JQuery);
    private enableContentBlockImpl;
    private enableHelpImpl;
    private checkInput;
}
