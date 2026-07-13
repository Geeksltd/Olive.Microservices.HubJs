/// <amd-dependency path='../model/service' />
/// <amd-dependency path='../extensions' />
import Service from '../model/service';
import CurrentUser from '../model/currentUser';
import HubSettings from '../model/hubSettings';
import {
    BACK_BUTTON_TEMPLATE,
    HOME_BUTTON_TEMPLATE,
    SERVICE_ERROR_TEMPLATE,
    SERVICE_ERROR_TEMPLATE_FOR_EMPLOYEE,
    SUPPORT_EMAIL_TEMPLATE,
    SUPPORT_FALLBACK_CONTACT,
    SUPPORT_LINE_TEMPLATE,
    SUPPORT_REFERENCE_TEMPLATE
} from './errorTemplates';

// Set on every response by Olive's reference code middleware. Support can search the logs for it.
const REFERENCE_CODE_HEADER = "X-Reference-Code";
const REFERENCE_CODE_FORMAT = /^REF-[A-Z2-9]{8}$/;

export default class ErrorViewsNavigator {
    public static showServiceError(trigger: JQuery, service: Service, url: string, response: JQueryXHR, backUrl?: string) {

        let errorContent = CurrentUser.isEmployee
            ? this.fill(SERVICE_ERROR_TEMPLATE_FOR_EMPLOYEE, {
                "[#SERVICE#]": service.Name,
                "[#STATUS#]": response.status.toString(),
                "[#URL#]": url,
                "[#RESPONSE#]": response.responseText || "No additional information is available."
            })
            : SERVICE_ERROR_TEMPLATE;

        errorContent = this.fill(errorContent, {
            "[#MESSAGE#]": this.getMessage(response),
            "[#SUPPORT#]": this.getSupportLine(this.getReferenceCode(response)),
            "[#BUTTONS#]": this.getButtons(backUrl)
        });

        if (trigger && trigger.length > 0) {
            if (trigger.prop("tagName") == "MAIN") {
                trigger.html(errorContent);
                return;
            }

            trigger = trigger.closest('main');
            if (trigger && trigger.length > 0) {
                trigger.html(errorContent);
                return;
            }
        }

        if ($('[data-module-inner-container]').length > 0) {
            $("[data-module-inner-container]").html(errorContent)
            return;
        }

        $("main").html(errorContent);
    }

    private static getMessage(response: JQueryXHR): string {
        if (response.status == 404)
            return "The page you are looking for is not available. It may have been moved or removed.";

        return "We could not load this page right now. Please try again in a few moments.";
    }

    // Services running an older version of Olive do not send the header, and the response of a
    // failed cross-origin request is not necessarily one of ours, so the value is not trusted.
    private static getReferenceCode(response: JQueryXHR): string {
        let code: string;

        try { code = response.getResponseHeader(REFERENCE_CODE_HEADER); }
        catch (error) { return ""; }

        return REFERENCE_CODE_FORMAT.test(code) ? code : "";
    }

    private static getSupportLine(referenceCode: string): string {
        const email = HubSettings.supportEmail;

        const contact = email
            ? this.fill(SUPPORT_EMAIL_TEMPLATE, {
                "[#SUPPORT_EMAIL#]": email,
                "[#SUBJECT#]": referenceCode
                    ? "?subject=" + encodeURIComponent("Error reference " + referenceCode)
                    : ""
            })
            : SUPPORT_FALLBACK_CONTACT;

        // With no code there is nothing for support to search for, so we claim nothing.
        const reference = referenceCode
            ? this.fill(SUPPORT_REFERENCE_TEMPLATE, { "[#REFERENCE_CODE#]": referenceCode })
            : "";

        return this.fill(SUPPORT_LINE_TEMPLATE, {
            "[#CONTACT#]": contact,
            "[#REFERENCE#]": reference
        });
    }

    private static getButtons(backUrl: string): string {
        const back = backUrl
            ? this.fill(BACK_BUTTON_TEMPLATE, { "[#BACK_URL#]": backUrl })
            : "";

        return back + HOME_BUTTON_TEMPLATE;
    }

    // split/join rather than replace(): it replaces every occurrence (the support email appears
    // twice), and it does not treat '$' sequences in the values (e.g. main tag urls such as
    // '?$Body=...') as replacement patterns.
    private static fill(template: string, values: { [token: string]: string }): string {
        let result = template;

        for (const token in values)
            result = result.split(token).join(values[token]);

        return result;
    }
}
