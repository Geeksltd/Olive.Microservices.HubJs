/// <amd-dependency path='../model/service' />
/// <amd-dependency path='../extensions' />
import Service from '../model/service';
import CurrentUser from '../model/currentUser';
import HubSettings from '../model/hubSettings';
import {
    ACCESS_DENIED_EYEBROW,
    ACCESS_DENIED_LEAD,
    ACCESS_DENIED_LEAD_WITH_ACCOUNT,
    ACCESS_DENIED_MODIFIER,
    ACCESS_DENIED_NEXT_ITEMS,
    ACCESS_DENIED_NEXT_TITLE,
    ACCESS_DENIED_TITLE,
    AUDIT_LINK_TEMPLATE,
    BUTTON_TEMPLATE,
    DENIED_ICON,
    EMPLOYEE_DETAIL_NO_RESPONSE_TEMPLATE,
    EMPLOYEE_DETAIL_TEMPLATE,
    EMPLOYEE_OPEN_URL_BUTTON_TEMPLATE,
    EMPLOYEE_RESPONSE_TEMPLATE,
    ERROR_CARD_TEMPLATE,
    FAULT_EYEBROW,
    FAULT_ICON,
    FAULT_LEAD,
    FAULT_MODIFIER,
    FAULT_TITLE,
    MISSING_ICON,
    NEXT_STEPS_TEMPLATE,
    NOT_FOUND_EYEBROW,
    NOT_FOUND_LEAD,
    NOT_FOUND_MODIFIER,
    NOT_FOUND_NEXT_ITEMS,
    NOT_FOUND_NEXT_TITLE,
    NOT_FOUND_TITLE,
    OFFLINE_EYEBROW,
    OFFLINE_ICON,
    OFFLINE_LEAD,
    OFFLINE_MODIFIER,
    OFFLINE_NEXT_ITEMS,
    OFFLINE_NEXT_TITLE,
    OFFLINE_TITLE,
    SUPPORT_EMAIL_TEMPLATE,
    SUPPORT_FALLBACK_CONTACT,
    SUPPORT_LINE_TEMPLATE
} from './errorTemplates';

// Set on every response by Olive's reference code middleware. Support can search the logs for it.
const REFERENCE_CODE_HEADER = "X-Reference-Code";

// Codes are 12 characters. The rollout that briefly allowed shorter (8-char) codes from
// not-yet-upgraded services is complete, so anything other than 12 is no longer a valid code.
const REFERENCE_CODE_FORMAT = /^REF-[A-Z2-9]{12}$/;

// Three of the statuses the hub lands on are not faults, and each gets its own view rather than an
// apology and a reference code, because none of them is a bug anyone could look up.
//
// A page the user is not entitled to see is exactly where they expected it to be; their account does not
// reach it, which is a different conversation from a failure.
const FORBIDDEN = 403;

// A page that does not exist is not a fault either. Nobody has been notified, nothing was logged for
// support to find, and offering a reference code invites a conversation about a bug that never happened.
const NOT_FOUND = 404;

// jQuery reports status 0 when the request got no reply at all: the connection dropped, the origin
// refused it, or the service is not running. Nothing reached a server, so nothing was logged and nobody
// was notified, and the fault view's reassurance would be untrue.
const NETWORK_FAILURE = 0;

// The audit service's Request logs page, reached through the Hub as /[service]/request-logs. It searches
// by the whole code, REF- prefix included. Its own gate is Dev, DevOps and ViewLogs, so an employee
// without one of those roles gets an access denied rather than the log — that is the audit service's
// call to make, and the code is still there to quote either way.
const AUDIT_LOG_PATH = "/request-logs?Reference=";

// The name the audit service registers itself under differs between environments, so the URL is built
// from whichever one is actually in window["services"] rather than hard-coded.
const AUDIT_SERVICE_NAMES = ["Audit", "AuditLog"];

// The parts of the shared card a view fills in. Everything optional is a whole block, so a view with
// nothing true to say in one leaves it out rather than printing an empty heading over nothing.
interface IErrorCard {
    modifier: string;
    icon: string;
    eyebrow: string;
    title: string;
    lead: string;
    next?: string;
    detail?: string;
    buttons: string;
    support?: string;
}

export default class ErrorViewsNavigator {
    public static showServiceError(trigger: JQuery, service: Service, url: string, response: JQueryXHR, backUrl?: string, retryUrl?: string): boolean {
        return this.showError(trigger, url, response, service.Name, backUrl, retryUrl);
    }

    // The same card for a failure whose URL maps to no known service. Without this it would fall through
    // to the base handler's bare confirm() dialog, showing the user neither the reassurance nor a code to
    // quote. One failure, one error UX, however the request was routed, and matching FriendlyErrorPage in
    // FS.Shared.Website. There is no retry URL here: nothing was pushed into the address bar, so there is
    // no hub address that would re-request the page that failed.
    public static showGenericError(trigger: JQuery, url: string, response: JQueryXHR, backUrl?: string): boolean {
        return this.showError(trigger, url, response, null, backUrl);
    }

    // True when the card replaced the page itself, which is what leaves the window title and the
    // breadcrumb describing something the user can no longer see. A card confined to a named main tag
    // replaced one region of a page that is still on screen and still correctly named, so the caller
    // is told to leave both alone.
    private static showError(trigger: JQuery, url: string, response: JQueryXHR, serviceName: string | null, backUrl?: string, retryUrl?: string): boolean {

        // jQuery reports status 0 for a request the page itself cancelled as well as for one that never
        // got a reply, so the abort is checked before the status is. A user who clicked away mid
        // navigation has not hit an error and must not be shown one.
        if (response.statusText == "abort") return false;

        // The content is built first: it reads the breadcrumb of the page the user came from, which
        // this render is about to replace.
        const target = this.render(trigger, this.getContent(url, response, serviceName, backUrl, retryUrl));
        const name = target.attr("name");

        return !name || name[0] !== "$";
    }

    // What the window is called while the card is up. The card's own eyebrow, so the tab and the page
    // say the same thing, and short enough to still read well behind a service name.
    public static getWindowTitle(status: number): string {
        switch (status) {
            case FORBIDDEN: return ACCESS_DENIED_EYEBROW;
            case NOT_FOUND: return NOT_FOUND_EYEBROW;
            case NETWORK_FAILURE: return OFFLINE_EYEBROW;
            default: return FAULT_EYEBROW;
        }
    }

    private static getContent(url: string, response: JQueryXHR, serviceName: string | null, backUrl?: string, retryUrl?: string): string {
        switch (response.status) {
            case FORBIDDEN: return this.getAccessDeniedContent(serviceName, backUrl);
            case NOT_FOUND: return this.getNotFoundContent(url, response, serviceName, backUrl);
            case NETWORK_FAILURE: return this.getOfflineContent(url, response, serviceName, backUrl, retryUrl);
            default: return this.getFaultContent(url, response, serviceName, backUrl, retryUrl);
        }
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

        return this.card({
            modifier: ACCESS_DENIED_MODIFIER,
            icon: DENIED_ICON,
            eyebrow: ACCESS_DENIED_EYEBROW,
            title: this.fill(ACCESS_DENIED_TITLE, { "[#AREA#]": areaStart }),
            lead: lead,
            next: this.getNextSteps(ACCESS_DENIED_NEXT_TITLE, this.fill(ACCESS_DENIED_NEXT_ITEMS, {
                "[#LOGIN_URL#]": this.escapeAttribute(this.getLoginUrl()),
                "[#AREA_MID#]": areaMid
            })),
            buttons: this.getButtons(backUrl)
        });
    }

    // Nothing broke here either: the address simply has no page behind it. The two suggestions split by
    // how the user got here, because a stale internal link and a mistyped address need different answers.
    private static getNotFoundContent(url: string, response: JQueryXHR, serviceName: string | null, backUrl?: string): string {

        const area = this.getAreaName(serviceName);
        const areaStart = area || "The hub";
        const areaMid = area || "the hub";

        return this.card({
            modifier: NOT_FOUND_MODIFIER,
            icon: MISSING_ICON,
            eyebrow: NOT_FOUND_EYEBROW,
            title: this.fill(NOT_FOUND_TITLE, { "[#AREA#]": areaStart }),
            lead: NOT_FOUND_LEAD,
            next: this.getNextSteps(NOT_FOUND_NEXT_TITLE, this.fill(NOT_FOUND_NEXT_ITEMS, { "[#AREA_MID#]": areaMid })),
            detail: this.getEmployeeDetail(url, response, serviceName),
            buttons: this.getButtons(backUrl)
        }) + this.getResponseAppendix(response);
    }

    // Something did break: the team has been notified and the user gets a code to quote. There is no next
    // steps box, because the one useful step is to try again and that is already a button — a box saying
    // so again would be padding.
    private static getFaultContent(url: string, response: JQueryXHR, serviceName: string | null, backUrl?: string, retryUrl?: string): string {

        const area = this.getAreaName(serviceName);
        const areaStart = area || "The service";
        const areaMid = area || "the service";

        return this.card({
            modifier: FAULT_MODIFIER,
            icon: FAULT_ICON,
            eyebrow: FAULT_EYEBROW,
            title: this.fill(FAULT_TITLE, { "[#AREA#]": areaStart }),
            lead: this.fill(FAULT_LEAD, { "[#AREA_MID#]": areaMid }),
            detail: this.getEmployeeDetail(url, response, serviceName),
            buttons: this.getButtons(backUrl, retryUrl),
            support: this.getSupportLine(this.getReferenceCode(response))
        }) + this.getResponseAppendix(response);
    }

    // The request never got a reply, so no reference code exists and no support line is offered: there is
    // nothing for support to search for. The likely cause is the user's own connection, which is the one
    // thing on the page they can act on themselves.
    private static getOfflineContent(url: string, response: JQueryXHR, serviceName: string | null, backUrl?: string, retryUrl?: string): string {

        const area = this.getAreaName(serviceName);
        const areaMid = area || "the service";

        return this.card({
            modifier: OFFLINE_MODIFIER,
            icon: OFFLINE_ICON,
            eyebrow: OFFLINE_EYEBROW,
            title: this.fill(OFFLINE_TITLE, { "[#AREA_MID#]": areaMid }),
            lead: this.fill(OFFLINE_LEAD, { "[#AREA_MID#]": areaMid }),
            next: this.getNextSteps(OFFLINE_NEXT_TITLE, OFFLINE_NEXT_ITEMS),
            detail: this.getEmployeeDetail(url, response, serviceName),
            buttons: this.getButtons(backUrl, retryUrl)
        });
    }

    private static card(card: IErrorCard): string {
        return this.fill(ERROR_CARD_TEMPLATE, {
            "[#MODIFIER#]": card.modifier,
            "[#ICON#]": card.icon,
            "[#EYEBROW#]": card.eyebrow,
            "[#TITLE#]": card.title,
            "[#LEAD#]": card.lead,
            "[#NEXT#]": card.next || "",
            "[#DETAIL#]": card.detail || "",
            "[#BUTTONS#]": card.buttons,
            "[#SUPPORT#]": card.support || ""
        });
    }

    private static getNextSteps(title: string, items: string): string {
        return this.fill(NEXT_STEPS_TEMPLATE, {
            "[#NEXT_TITLE#]": title,
            "[#NEXT_ITEMS#]": items
        });
    }

    private static render(trigger: JQuery, errorContent: string): JQuery {
        const target = this.renderTarget(trigger);
        target.html(errorContent);

        return target;
    }

    // Where the card goes: the main tag the failing request was aimed at, or the page's own content
    // when the request came from outside one.
    private static renderTarget(trigger: JQuery): JQuery {

        if (trigger && trigger.length > 0) {
            if (trigger.prop("tagName") == "MAIN") return trigger;

            const main = trigger.closest('main');
            if (main && main.length > 0) return main;
        }

        if ($('[data-module-inner-container]').length > 0) return $("[data-module-inner-container]");

        return $("main");
    }

    // The name of what they could not reach, as the user knows it. The service the failing URL belongs to
    // is the reliable source: Service.fromUrl resolved it from that URL, so it always describes the right
    // thing. The breadcrumb is only a fallback, because it still describes the page the user came FROM —
    // it is rebuilt on a successful navigation, and this navigation did not succeed. Empty when neither
    // is known, and each view supplies its own wording for that case.
    private static getAreaName(serviceName: string | null): string {
        if (serviceName) return this.escape(serviceName);

        const breadcrumb = $(".breadcrumb").children().last().text().trim();
        return breadcrumb ? this.escape(breadcrumb) : "";
    }

    // Signing in again should land back on the page they were denied, in case the other account does
    // reach it. This is the plain returnUrl form (the one Url uses when it sends someone to the login
    // page from a query string) rather than Url's gzipped form, which needs the DI'd Url component.
    private static getLoginUrl(): string {
        const returnUrl = window.location.pathname + window.location.search;
        return "/login?returnUrl=" + encodeURIComponent(returnUrl);
    }

    // Try again leads where there is something to retry; Home leads where there is not. Only one button
    // ever carries the primary style, because two would say neither is the obvious one.
    private static getButtons(backUrl?: string, retryUrl?: string): string {
        const retry = this.retryButton(retryUrl);

        return retry
            ? retry + this.backButton(backUrl) + this.button("Home", "/", false)
            : this.button("Home", "/", true) + this.backButton(backUrl);
    }

    // Nothing to go back to when the user landed on the failing address directly.
    private static backButton(backUrl?: string): string {
        return backUrl ? this.button("Back", backUrl, false) : "";
    }

    // A link to the failing hub address rather than a reload. A reload is only correct on the branch
    // where HubAjaxRedirect pushed that address into the address bar; on the branch where it did not, a
    // reload would quietly re-load the previous page and look to the user like the retry had failed.
    private static retryButton(retryUrl?: string): string {
        return retryUrl ? this.button("Try again", retryUrl, true) : "";
    }

    private static button(label: string, url: string, primary: boolean): string {
        return this.fill(BUTTON_TEMPLATE, {
            "[#BUTTON_STYLE#]": primary ? "btn-primary" : "btn-secondary",
            "[#BUTTON_URL#]": this.escapeAttribute(url),
            "[#BUTTON_LABEL#]": label
        });
    }

    // What an employee needs and a user does not. Never shown on the access denied view: nothing is
    // broken there, so there is nothing to diagnose.
    private static getEmployeeDetail(url: string, response: JQueryXHR, serviceName: string | null): string {
        if (!CurrentUser.isEmployee) return "";

        const service = this.escape(serviceName || this.hostOf(url));
        const openUrlButton = this.getOpenUrlButton(url);

        if (response.status == NETWORK_FAILURE)
            return this.fill(EMPLOYEE_DETAIL_NO_RESPONSE_TEMPLATE, {
                "[#SERVICE#]": service,
                "[#OPEN_URL_BUTTON#]": openUrlButton
            });

        return this.fill(EMPLOYEE_DETAIL_TEMPLATE, {
            "[#SERVICE#]": service,
            "[#STATUS#]": response.status.toString(),
            "[#OPEN_URL_BUTTON#]": openUrlButton
        });
    }

    private static getOpenUrlButton(url: string): string {
        const href = this.safeHref(url);
        if (!href) return "";

        return this.fill(EMPLOYEE_OPEN_URL_BUTTON_TEMPLATE, { "[#URL#]": href });
    }

    // The response body is whatever the failing service chose to send, which is very often an HTML error
    // page. It is escaped rather than interpolated, so the pre shows the source an employee is looking
    // for instead of the browser rendering a third party's markup — and script in it inside the hub page.
    private static getResponseAppendix(response: JQueryXHR): string {
        if (!CurrentUser.isEmployee) return "";

        return this.fill(EMPLOYEE_RESPONSE_TEMPLATE, {
            "[#RESPONSE#]": this.escape(response.responseText || "No additional information is available.")
        });
    }

    // The failing URL goes into an href, and it is only ever worth linking when it is a web address.
    // Anything else — a scheme we did not expect, or a URL that will not parse — is dropped rather than
    // rendered, so a diagnostic button cannot become a way to run something.
    private static safeHref(url: string): string {
        try {
            const parsed = new URL(url, window.location.origin);
            if (parsed.protocol != "http:" && parsed.protocol != "https:") return "";

            return this.escapeAttribute(parsed.href);
        }
        catch { return ""; }
    }

    // Values that reach markup are not ours to trust: the address comes from the server, the area name
    // from whatever the breadcrumb happens to hold, and the response body from the failing service.
    private static escape(value: string): string {
        return $("<div/>").text(value).html();
    }

    // escape() is for text between tags. It handles &, < and >, which is everything that can start or end
    // an element, but it leaves quotes alone — harmless in a paragraph, not harmless in an attribute,
    // where one quote closes the attribute and everything after it is markup we did not write. Every URL
    // on this card comes from somewhere we do not control, so every one goes through here.
    private static escapeAttribute(value: string): string {
        return this.escape(value).split('"').join("&quot;").split("'").join("&#39;");
    }

    // A label for the failing target when it maps to no registered service (employee diagnostic view only).
    private static hostOf(url: string): string {
        try { return new URL(url, window.location.origin).host || "the requested page"; }
        catch { return "the requested page"; }
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
