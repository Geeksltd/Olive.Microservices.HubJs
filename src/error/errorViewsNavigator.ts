/// <amd-dependency path='../model/service' />
/// <amd-dependency path='../extensions' />
import Service from '../model/service';
import CurrentUser from '../model/currentUser';
import HubSettings from '../model/hubSettings';
import {
    ACCESS_DENIED_BACK_BUTTON_TEMPLATE,
    ACCESS_DENIED_HOME_BUTTON_TEMPLATE,
    ACCESS_DENIED_LEAD,
    ACCESS_DENIED_LEAD_WITH_ACCOUNT,
    ACCESS_DENIED_TEMPLATE,
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

// Nor is a page the user is not entitled to see. A 403 means the page is exactly where they expected
// and their account does not reach it, which is a different conversation from a fault, so it gets its
// own view rather than an apology and a reference code.
const FORBIDDEN = 403;

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

        const errorContent = response.status == FORBIDDEN
            ? this.getAccessDeniedContent(serviceName, backUrl)
            : this.getFaultContent(url, response, serviceName, backUrl);

        this.render(trigger, errorContent);
    }

    // Something broke: the team has been notified and the user gets a code to quote.
    private static getFaultContent(url: string, response: JQueryXHR, serviceName: string | null, backUrl?: string): string {

        let errorContent = CurrentUser.isEmployee
            ? this.fill(SERVICE_ERROR_TEMPLATE_FOR_EMPLOYEE, {
                "[#SERVICE#]": serviceName || this.hostOf(url),
                "[#STATUS#]": response.status.toString(),
                "[#URL#]": url,
                "[#RESPONSE#]": response.responseText || "No additional information is available."
            })
            : SERVICE_ERROR_TEMPLATE;

        const referenceCode = response.status == NOT_FOUND ? "" : this.getReferenceCode(response);

        return this.fill(errorContent, {
            "[#MESSAGE#]": this.getMessage(response),
            "[#SUPPORT#]": this.getSupportLine(referenceCode),
            "[#BUTTONS#]": this.getButtons(backUrl)
        });
    }

    // Nothing broke: the page is fine and this account does not reach it. No reference code and no
    // "we have been notified", because neither is true — the way out is a different account or an
    // access request, and the view says so instead of apologising for a fault that did not happen.
    private static getAccessDeniedContent(serviceName: string | null, backUrl?: string): string {

        const area = this.getAreaName(serviceName);

        // With no name for it the sentences still have to read, so the wording falls back to "this page"
        // — capitalised where it opens the headline, lower case where it sits mid-sentence.
        const areaStart = area || "This page";
        const areaMid = area || "this page";

        const lead = CurrentUser.email
            ? this.fill(ACCESS_DENIED_LEAD_WITH_ACCOUNT, {
                "[#USER_EMAIL#]": this.escape(CurrentUser.email),
                "[#AREA_MID#]": areaMid
            })
            : this.fill(ACCESS_DENIED_LEAD, { "[#AREA_MID#]": areaMid });

        return this.fill(ACCESS_DENIED_TEMPLATE, {
            "[#AREA#]": areaStart,
            "[#AREA_MID#]": areaMid,
            "[#LOGIN_URL#]": this.getLoginUrl(),
            "[#BUTTONS#]": this.getAccessDeniedButtons(backUrl),
            "[#LEAD#]": lead
        });
    }

    private static render(trigger: JQuery, errorContent: string) {

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

    // The name of what they cannot reach, as the user knows it: the page they were heading for, which
    // the breadcrumb names, falling back to the service it belongs to. Empty when neither is known.
    private static getAreaName(serviceName: string | null): string {
        const breadcrumb = $(".breadcrumb").children().last().text().trim();
        if (breadcrumb) return this.escape(breadcrumb);

        return serviceName ? this.escape(serviceName) : "";
    }

    // Signing in again should land back on the page they were denied, in case the other account does
    // reach it. This is the plain returnUrl form (the one Url uses when it sends someone to the login
    // page from a query string) rather than Url's gzipped form, which needs the DI'd Url component.
    private static getLoginUrl(): string {
        const returnUrl = window.location.pathname + window.location.search;
        return "/login?returnUrl=" + encodeURIComponent(returnUrl);
    }

    // Home comes first and takes the primary style here: there is nothing to retry on this page, so the
    // useful action is leaving it, not going back to whatever linked here.
    private static getAccessDeniedButtons(backUrl: string): string {
        const back = backUrl
            ? this.fill(ACCESS_DENIED_BACK_BUTTON_TEMPLATE, { "[#BACK_URL#]": backUrl })
            : "";

        return ACCESS_DENIED_HOME_BUTTON_TEMPLATE + back;
    }

    // The address and the area name are rendered into markup, and neither is ours to trust: the address
    // comes from the server and the area name from whatever the breadcrumb happens to hold.
    private static escape(value: string): string {
        return $("<div/>").text(value).html();
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
