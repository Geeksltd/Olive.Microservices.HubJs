/// <amd-dependency path='../model/service' />
/// <amd-dependency path='../extensions' />
import Service from '../model/service';
import CurrentUser from '../model/currentUser';
import HubSettings from '../model/hubSettings';
import {
    AUDIT_LINK_TEMPLATE,
    BACK_BUTTON_TEMPLATE,
    HOME_BUTTON_TEMPLATE,
    SERVICE_ERROR_TEMPLATE,
    SERVICE_ERROR_TEMPLATE_FOR_EMPLOYEE,
    SUPPORT_EMAIL_TEMPLATE,
    SUPPORT_FALLBACK_CONTACT,
    SUPPORT_LINE_TEMPLATE
} from './errorTemplates';

// Set on every response by Olive's reference code middleware. Support can search the logs for it.
const REFERENCE_CODE_HEADER = "X-Reference-Code";

// Codes are 12 characters. The rollout that briefly allowed shorter (8-char) codes from
// not-yet-upgraded services is complete, so anything other than 12 is no longer a valid code.
const REFERENCE_CODE_FORMAT = /^REF-[A-Z2-9]{12}$/;

// A page that does not exist is not a fault. Nobody has been notified, nothing was logged for support to
// find, and offering a reference code for it invites a conversation about a bug that never happened.
const NOT_FOUND = 404;

// The audit service's Request logs page, reached through the Hub as /[service]/request-logs. It searches
// by the whole code, REF- prefix included. Its own gate is Dev, DevOps and ViewLogs, so an employee
// without one of those roles gets an access denied rather than the log — that is the audit service's
// call to make, and the code is still there to quote either way.
const AUDIT_LOG_PATH = "/request-logs?Reference=";

// The name the audit service registers itself under differs between environments, so the URL is built
// from whichever one is actually in window["services"] rather than hard-coded.
const AUDIT_SERVICE_NAMES = ["Audit", "AuditLog"];

export default class ErrorViewsNavigator {
    public static showServiceError(trigger: JQuery, service: Service, url: string, response: JQueryXHR, backUrl?: string) {
        this.showError(trigger, url, response, service.Name, backUrl);
    }

    // The same view — message, support line and reference code — for a failure whose URL maps to no
    // known service. Without this it would fall through to the base handler's bare confirm() dialog,
    // showing the user neither the reassurance nor a code to quote. One failure, one error UX, however
    // the request was routed, and matching FriendlyErrorPage in FS.Shared.Website.
    public static showGenericError(trigger: JQuery, url: string, response: JQueryXHR, backUrl?: string) {
        this.showError(trigger, url, response, null, backUrl);
    }

    private static showError(trigger: JQuery, url: string, response: JQueryXHR, serviceName: string | null, backUrl?: string) {

        let errorContent = CurrentUser.isEmployee
            ? this.fill(SERVICE_ERROR_TEMPLATE_FOR_EMPLOYEE, {
                "[#SERVICE#]": serviceName || this.hostOf(url),
                "[#STATUS#]": response.status.toString(),
                "[#URL#]": url,
                "[#RESPONSE#]": response.responseText || "No additional information is available."
            })
            : SERVICE_ERROR_TEMPLATE;

        const referenceCode = response.status == NOT_FOUND ? "" : this.getReferenceCode(response);

        errorContent = this.fill(errorContent, {
            "[#MESSAGE#]": this.getMessage(response),
            "[#SUPPORT#]": this.getSupportLine(referenceCode),
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

    // A label for the failing target when it maps to no registered service (employee diagnostic view only).
    private static hostOf(url: string): string {
        try { return new URL(url, window.location.origin).host || "the requested page"; }
        catch { return "the requested page"; }
    }

    private static getMessage(response: JQueryXHR): string {
        // A 404 is not a fault, so nobody has been notified and there is nothing to reassure anyone
        // about. Only a real failure gets the "we know" message.
        if (response.status == NOT_FOUND)
            return "The page you are looking for is not available. It may have been moved or removed.";

        return "Our technical team has been notified and is working on it. Please try again later.";
    }

    // Services running an older version of Olive do not send the header, and the response of a
    // failed cross-origin request is not necessarily one of ours, so the value is not trusted.
    private static getReferenceCode(response: JQueryXHR): string {
        let code: string;

        try { code = response.getResponseHeader(REFERENCE_CODE_HEADER); }
        catch (error) { return ""; }

        return REFERENCE_CODE_FORMAT.test(code) ? code : "";
    }

    // Small and muted, and below the buttons: a user who really is stuck needs a code to quote, but the
    // message above has already told them the team knows, so this is not an invitation to write in.
    private static getSupportLine(referenceCode: string): string {
        // With no code there is nothing for support to search for, so we say nothing at all rather than
        // inviting an email we could not act on. A service on an older Olive sends no code.
        if (!referenceCode) return "";

        const email = HubSettings.supportEmail;

        const contact = email
            ? this.fill(SUPPORT_EMAIL_TEMPLATE, {
                "[#SUPPORT_EMAIL#]": email,
                "[#SUBJECT#]": "?subject=" + encodeURIComponent("Error reference " + referenceCode)
            })
            : SUPPORT_FALLBACK_CONTACT;

        return this.fill(SUPPORT_LINE_TEMPLATE, {
            "[#CONTACT#]": contact,
            "[#REFERENCE_CODE#]": this.getReferenceCodeHtml(referenceCode)
        });
    }

    // For an employee the code is the way into the log, so it is a link. For everyone else it stays plain
    // text: the audit service would refuse them, and a link they cannot open only causes a support call.
    private static getReferenceCodeHtml(referenceCode: string): string {
        if (!CurrentUser.isEmployee) return referenceCode;

        const auditUrl = this.getAuditUrl(referenceCode);
        if (!auditUrl) return referenceCode;

        return this.fill(AUDIT_LINK_TEMPLATE, {
            "[#AUDIT_URL#]": auditUrl,
            "[#REFERENCE_CODE#]": referenceCode
        });
    }

    // Nothing is linked when the audit service is not registered in this Hub: a dead link on an error page
    // is worse than the plain code, which support can search for anyway.
    private static getAuditUrl(referenceCode: string): string {
        for (const name of AUDIT_SERVICE_NAMES) {
            let service: Service;

            // fromName throws rather than returning null when a service is not registered.
            try { service = Service.fromName(name); }
            catch (error) { continue; }

            // The Hub address of a service page, i.e. what the features menu links to.
            return service.AddressBarPrefix + AUDIT_LOG_PATH + encodeURIComponent(referenceCode);
        }

        return "";
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
