import ResponseProcessor from "olive/mvc/responseProcessor";


export default class HubResponseProcessor extends ResponseProcessor {
    public processAjaxResponse(response: any, containerModule: JQuery, trigger: JQuery, args: any) {
        let asElement = $(response);
        asElement = this.fixUrlsForOpenNewWindows(response);

        if (trigger != null && trigger.is("[data-module-inner]") && asElement.is("main")) {
            let innerMadule =$("[data-module-inner-container]");
            innerMadule.replaceWith(asElement);
            trigger = asElement.find("[data-module]")
            this.onViewChanged(asElement, trigger);
            return;
        }
        if (asElement.is("main")) {
            this.navigate(asElement, trigger, args);
            return;
        }

        if (asElement.is("[data-module]") && containerModule != null) {
            containerModule.replaceWith(asElement);
            this.onViewChanged(asElement, trigger);
            return;
        }

       

        if (response.length == 1 && response[0].ReplaceView && containerModule != null) {
            asElement = $("<div/>").append(response[0].ReplaceView);
            containerModule.replaceWith(asElement);
            this.onViewChanged(asElement, trigger);
            return;
        }

        if (trigger && trigger.is("[data-add-subform]") && containerModule != null) {
            let subFormName = trigger.attr("data-add-subform");
            let container = containerModule.find("[data-subform=" + subFormName + "] > table tbody:first");

            if (container.length == 0)
                container = containerModule.find("[data-subform=" + subFormName + "]:first");

            container.append(asElement);
            // this.masterDetail.updateSubFormStates();
            this.onSubformChanged(response, trigger);
            this.onViewChanged(asElement, trigger);
            return;
        }

        // List of actions
        if (typeof (response) == typeof ([]))
            this.onNothingFoundToProcess(response, trigger);
    }
}