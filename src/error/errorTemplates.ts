// The support line sits BELOW the buttons, small and muted: a user who is stuck needs a code to quote,
// but it is not an invitation to write in — the message above has already told them the team knows.
// The same shape as FriendlyErrorPage in FS.Shared.Website, which renders this view's equivalent when a
// request fails outside the Hub. If you change one, change the other.
export const SERVICE_ERROR_TEMPLATE = `
<main>
  <div class="error" >
   <h2>Something went wrong</h2>
   <h4>
      [#MESSAGE#]
   </h4>
   <div class="buttons-row">
      <div class="buttons">
         [#BUTTONS#]
      </div>
   </div>
   [#SUPPORT#]
   <br/>
  </div>
</main>
`;

export const SERVICE_ERROR_TEMPLATE_FOR_EMPLOYEE = `
<main>
  <div class="error" >
   <h2>Something went wrong</h2>
   <h4>
      [#MESSAGE#]
   </h4>
   <p>
      The <b>[#SERVICE#]</b> service returned status [#STATUS#].
   </p>
   <div class="buttons-row">
      <div class="buttons">
         [#BUTTONS#]
         <!-- The two diagnostic buttons do different things, so the labels have to say which is which:
              the first shows what this failed request already returned, the second re-issues the request
              in a new tab (a fresh GET, so it will not reproduce a failure that depended on the original
              request's method or body). -->
         <a class="btn btn-success" href="javascript:;" title="Show the response this failed request returned, without leaving the page." onclick="alert($('.ajax-error-content').html())">Show response details here</a>&nbsp;
         <a name="ShowMeTheError" class="btn btn-primary" href="[#URL#]" target="_blank" title="Request the failing URL again in a new tab, to see the full server error page." default-button="true">Open failing URL in a new tab</a>
      </div>
   </div>
   [#SUPPORT#]
   <br/>
  </div>
</main>
<div class="ajax-error-content d-none">
  <pre>
    <code>
      [#RESPONSE#]
    </code>
  </pre>
</div>
`;

export const BACK_BUTTON_TEMPLATE = `<a class="btn btn-primary" href="[#BACK_URL#]">Back</a>&nbsp;`;

export const HOME_BUTTON_TEMPLATE = `<a class="btn btn-secondary" href="/">Home</a>&nbsp;`;

export const SUPPORT_LINE_TEMPLATE = `<p class="support text-muted small">If you need to contact [#CONTACT#], quote reference <b>[#REFERENCE_CODE#]</b>.</p>`;

// Employees get the code as a link to the audit service's Request logs page, which looks the request
// up by exactly this code. In a new tab, so the error view (and the URL that produced it) is not lost.
export const AUDIT_LINK_TEMPLATE = `<a href="[#AUDIT_URL#]" target="_blank" title="Find this request in the audit log">[#REFERENCE_CODE#]</a>`;

export const SUPPORT_EMAIL_TEMPLATE = `<a href="mailto:[#SUPPORT_EMAIL#][#SUBJECT#]">[#SUPPORT_EMAIL#]</a>`;

export const SUPPORT_FALLBACK_CONTACT = `your system administrator`;

// A 403 is not a fault. Nothing was logged, nobody was notified, and the page the user asked for is
// exactly where they thought it was — they simply are not entitled to it. So this view says who they
// are signed in as and what to do about it, and offers no reference code: there is nothing to look up.
// The card is styled by the hub's base stylesheet (styles/common/components/access-denied.scss in
// Olive.Microservices.Hub), which is where its colour tokens live. Only class hooks appear here.
export const ACCESS_DENIED_TEMPLATE = `
<main>
  <div class="error access-denied">
    <div class="access-denied-eyebrow">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="3.5" y="8.5" width="13" height="9" rx="2" stroke="currentColor" stroke-width="1.6"></rect>
        <path d="M6.75 8.5V6.25a3.25 3.25 0 0 1 6.5 0V8.5" stroke="currentColor" stroke-width="1.6"></path>
      </svg>
      <span>Not available to your account</span>
    </div>

    <h1 class="access-denied-title">[#AREA#] is not open to your account</h1>

    <p class="access-denied-lead">[#LEAD#] The page still exists, so the link you followed is fine.</p>

    <div class="access-denied-next">
      <div class="access-denied-next-title">Two things worth trying</div>
      <ul>
        <li>If you have a second account with wider access, <a href="[#LOGIN_URL#]">sign in as a different user</a>.</li>
        <li>Otherwise, ask to have [#AREA_MID#] added to this account. Staff should speak to their team lead; applicants should contact Admissions.</li>
      </ul>
    </div>

    <div class="buttons-row">
      [#BUTTONS#]
    </div>
  </div>
</main>
`;

// Naming the account matters when someone is signed in as the wrong one of two, which is the common
// cause. The address is only shown when the server has told us what it is.
export const ACCESS_DENIED_LEAD_WITH_ACCOUNT = `You are signed in as <span class="access-denied-account">[#USER_EMAIL#]</span>, and this account does not include [#AREA_MID#].`;

export const ACCESS_DENIED_LEAD = `This account does not include [#AREA_MID#].`;

// Home leads here, unlike the fault view: there is nothing to retry on this page, so the way out is
// somewhere the user can actually go.
export const ACCESS_DENIED_HOME_BUTTON_TEMPLATE = `<a class="btn btn-primary" href="/">Home</a>`;

export const ACCESS_DENIED_BACK_BUTTON_TEMPLATE = `<a class="btn btn-secondary" href="[#BACK_URL#]">Back</a>`;
