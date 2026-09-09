// Every error view the hub renders is this one card with different words in it, so a user who hits two
// different failures sees one design rather than two. The parts only some views need — the next steps
// box, the employee diagnostics, the support line — are whole blocks, and a view with nothing true to
// put in one fills it with an empty string rather than carrying a second copy of the markup.
//
// Each view says only what is true of its own status. A 403 is not a fault and neither is a 404, so
// neither claims anyone has been notified; a dropped connection reached no server at all, so it does not
// offer a reference code there is no response to carry.
//
// The card is styled by the hub's base stylesheet (styles/common/components/error-card.scss in the hub
// repo), which is where its colour tokens live. Only class hooks appear here. The modifier picks the
// accent for the status; the stylesheet defaults every modifier to the same colour, so a theme that has
// not been updated still renders all four views correctly.
export const ERROR_CARD_TEMPLATE = `
<main>
  <div class="error error-card [#MODIFIER#]">
    <div class="error-card-eyebrow">
      [#ICON#]
      <span>[#EYEBROW#]</span>
    </div>

    <h1 class="error-card-title">[#TITLE#]</h1>

    <p class="error-card-lead">[#LEAD#]</p>

    [#NEXT#]

    [#DETAIL#]

    <div class="buttons-row">
      [#BUTTONS#]
    </div>

    [#SUPPORT#]
  </div>
</main>
`;

// Only offered where there is something to suggest that the buttons do not already say. The fault view
// has no box: the one useful step is to try again, and that is a button.
export const NEXT_STEPS_TEMPLATE = `
    <div class="error-card-next">
      <div class="error-card-next-title">[#NEXT_TITLE#]</div>
      <ul>
        [#NEXT_ITEMS#]
      </ul>
    </div>
`;

// One button, with the caller choosing which one carries btn-primary. The useful action differs by view —
// Home where there is nothing to retry, Try again where there is — and the primary style is what says
// which one that is. The card lays the row out with a flex gap, so no separator is needed between them.
export const BUTTON_TEMPLATE = `<a class="btn [#BUTTON_STYLE#]" href="[#BUTTON_URL#]">[#BUTTON_LABEL#]</a>`;

// 20px line icons drawn in currentColor, so the modifier's accent carries them without a second token.
export const DENIED_ICON = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="3.5" y="8.5" width="13" height="9" rx="2" stroke="currentColor" stroke-width="1.6"></rect><path d="M6.75 8.5V6.25a3.25 3.25 0 0 1 6.5 0V8.5" stroke="currentColor" stroke-width="1.6"></path></svg>`;

// A magnifier rather than a document: it says the page was looked for and not found, where a document
// on its own only says "page".
export const MISSING_ICON = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="5.5" stroke="currentColor" stroke-width="1.6"></circle><path d="M13.2 13.2 17 17" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg>`;

export const FAULT_ICON = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 3.2 2.8 16.2h14.4L10 3.2Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"></path><path d="M10 8.2v3.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><path d="M10 14.1h.01" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg>`;

export const OFFLINE_ICON = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M6.2 15.5h7.4a3.3 3.3 0 0 0 .5-6.56 4.5 4.5 0 0 0-8.2-1.7A3.4 3.4 0 0 0 6.2 15.5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"></path><path d="M3 3 17 17" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg>`;

// ---------------------------------------------------------------------------------------------------
// 403. Not a fault: nothing was logged, nobody was notified, and the page the user asked for is exactly
// where they thought it was — they simply are not entitled to it. So this view says who they are signed
// in as and what to do about it, and offers no reference code: there is nothing to look up.
// ---------------------------------------------------------------------------------------------------
export const ACCESS_DENIED_MODIFIER = `error-card--denied`;

export const ACCESS_DENIED_EYEBROW = `Not available to your account`;

export const ACCESS_DENIED_TITLE = `[#AREA#] is not open to your account`;

// Naming the account matters when someone is signed in as the wrong one of two, which is the common
// cause. The address is only shown when the server has told us what it is.
export const ACCESS_DENIED_LEAD_WITH_ACCOUNT = `You are signed in as <span class="error-card-account">[#USER_EMAIL#]</span>, and this account does not include [#AREA_MID#]. The page still exists, so the link you followed is fine.`;

export const ACCESS_DENIED_LEAD = `This account does not include [#AREA_MID#]. The page still exists, so the link you followed is fine.`;

export const ACCESS_DENIED_NEXT_TITLE = `Two things worth trying`;

export const ACCESS_DENIED_NEXT_ITEMS = `
        <li>If you have a second account with wider access, <a href="[#LOGIN_URL#]">sign in as a different user</a>.</li>
        <li>Otherwise, ask to have [#AREA_MID#] added to this account. Staff should speak to their team lead; applicants should contact Admissions.</li>
`;

// ---------------------------------------------------------------------------------------------------
// 404. Also not a fault. Nobody has been notified, nothing was logged for support to find, and offering
// a reference code for it invites a conversation about a bug that never happened. The two suggestions
// split by how the user got here, because a stale internal link and a mistyped address need different
// answers.
// ---------------------------------------------------------------------------------------------------
export const NOT_FOUND_MODIFIER = `error-card--missing`;

export const NOT_FOUND_EYEBROW = `Page not found`;

export const NOT_FOUND_TITLE = `[#AREA#] has no page at that address`;

export const NOT_FOUND_LEAD = `The link may be out of date, or the page may have been renamed or removed. Nothing has gone wrong, and nothing has been logged.`;

export const NOT_FOUND_NEXT_TITLE = `Two things worth trying`;

export const NOT_FOUND_NEXT_ITEMS = `
        <li>If you followed a link from inside the hub, the page it pointed at has probably moved. Search [#AREA_MID#] for it by name.</li>
        <li>If you typed or pasted the address, check it for a missing or an extra character.</li>
`;

// ---------------------------------------------------------------------------------------------------
// 500 and anything else. Something did break: the team has been notified and the user gets a code to
// quote. The same shape as FriendlyErrorPage in FS.Shared.Website, which renders this view's equivalent
// when a request fails outside the Hub. If you change one, change the other.
// ---------------------------------------------------------------------------------------------------
export const FAULT_MODIFIER = `error-card--fault`;

export const FAULT_EYEBROW = `Something went wrong`;

export const FAULT_TITLE = `[#AREA#] could not load this page`;

export const FAULT_LEAD = `The request reached [#AREA_MID#] and it answered with an error. Our technical team has been notified and is working on it.`;

// ---------------------------------------------------------------------------------------------------
// Status 0. The request got no reply at all, so nothing reached us to be logged or notified about and
// saying otherwise would be a lie. The likely cause is the user's own connection, which is the one thing
// on this list they can do something about.
// ---------------------------------------------------------------------------------------------------
export const OFFLINE_MODIFIER = `error-card--offline`;

export const OFFLINE_EYEBROW = `No connection`;

export const OFFLINE_TITLE = `We could not reach [#AREA_MID#]`;

export const OFFLINE_LEAD = `The request got no reply at all, which usually means the connection dropped rather than anything being wrong with [#AREA_MID#]. Nothing has been logged, because nothing reached us.`;

export const OFFLINE_NEXT_TITLE = `Two things worth trying`;

export const OFFLINE_NEXT_ITEMS = `
        <li>Check you are still online, then try again.</li>
        <li>If you are on a VPN or a patchy connection, reconnect and try again.</li>
`;

// ---------------------------------------------------------------------------------------------------
// The employee aside. What an employee needs and a user does not: which service answered, with what, and
// two ways into the detail. It sits below the message rather than mixed into it, so the first thing an
// employee reads is still the thing the user is reading. Not shown on the access denied view: nothing is
// broken there, so there is nothing to diagnose.
// ---------------------------------------------------------------------------------------------------
export const EMPLOYEE_DETAIL_TEMPLATE = `
    <div class="error-card-detail">
      <p>The <b>[#SERVICE#]</b> service returned status [#STATUS#].</p>
      <div class="buttons-row">
        <!-- The two diagnostic buttons do different things, so the labels have to say which is which:
             the first shows what this failed request already returned, the second re-issues the request
             in a new tab (a fresh GET, so it will not reproduce a failure that depended on the original
             request's method or body). It reads .text() rather than .html() because the response body is
             escaped into the page below, and .html() would show the escaping rather than the response. -->
        <a class="btn btn-outline-secondary" href="javascript:;" title="Show the response this failed request returned, without leaving the page." onclick="alert($('.ajax-error-content').text())">Show response details here</a>
        [#OPEN_URL_BUTTON#]
      </div>
    </div>
`;

// A status 0 has no status worth printing and no body to show, and the causes are worth naming because
// they look identical from the browser.
export const EMPLOYEE_DETAIL_NO_RESPONSE_TEMPLATE = `
    <div class="error-card-detail">
      <p>The request to <b>[#SERVICE#]</b> returned no response at all, so there is nothing to show. A dropped connection, a CORS refusal and a service that is not running all look the same from here.</p>
      <div class="buttons-row">
        [#OPEN_URL_BUTTON#]
      </div>
    </div>
`;

// No default-button attribute and no btn-primary, both of which this carried while the employee view was
// a page of its own. Olive triggers [default-button]:first anywhere in the document on Enter, so leaving
// it here would make Enter open a raw service URL in a new tab instead of pressing Try again — and the
// diagnostics must not outrank the action the user is actually meant to take.
export const EMPLOYEE_OPEN_URL_BUTTON_TEMPLATE = `<a name="ShowMeTheError" class="btn btn-outline-secondary" href="[#URL#]" target="_blank" title="Request the failing URL again in a new tab, to see the full server error page.">Open failing URL in a new tab</a>`;

// Outside <main>, because it is not part of the view: it is the raw response body parked in the page for
// the "Show response details here" button to read back out.
export const EMPLOYEE_RESPONSE_TEMPLATE = `
<div class="ajax-error-content d-none">
  <pre><code>[#RESPONSE#]</code></pre>
</div>
`;

// ---------------------------------------------------------------------------------------------------
// The support line, on the fault view only. It sits BELOW the buttons, small and muted: a user who is
// stuck needs a code to quote, but it is not an invitation to write in — the message above has already
// told them the team knows.
// ---------------------------------------------------------------------------------------------------
export const SUPPORT_LINE_TEMPLATE = `<p class="support text-muted small">If you need to contact [#CONTACT#], quote reference <b>[#REFERENCE_CODE#]</b>.</p>`;

// Employees get the code as a link to the audit service's Request logs page, which looks the request
// up by exactly this code. In a new tab, so the error view (and the URL that produced it) is not lost.
export const AUDIT_LINK_TEMPLATE = `<a href="[#AUDIT_URL#]" target="_blank" title="Find this request in the audit log">[#REFERENCE_CODE#]</a>`;

export const SUPPORT_EMAIL_TEMPLATE = `<a href="mailto:[#SUPPORT_EMAIL#][#SUBJECT#]">[#SUPPORT_EMAIL#]</a>`;

export const SUPPORT_FALLBACK_CONTACT = `your system administrator`;
