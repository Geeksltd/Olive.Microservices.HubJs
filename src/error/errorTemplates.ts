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
         <a class="btn btn-success" href="javascript:;" onclick="alert($('.ajax-error-content').html())">Show the error here</a>&nbsp;
         <a name="ShowMeTheError" class="btn btn-primary" href="[#URL#]" target="_blank" default-button="true">Show me the error</a>
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

export const SUPPORT_EMAIL_TEMPLATE = `<a href="mailto:[#SUPPORT_EMAIL#][#SUBJECT#]">[#SUPPORT_EMAIL#]</a>`;

export const SUPPORT_FALLBACK_CONTACT = `your system administrator`;
