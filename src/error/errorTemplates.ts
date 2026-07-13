export const SERVICE_ERROR_TEMPLATE = `
<main>
  <div class="error" >
   <h2>Something went wrong</h2>
   <h3>
      [#MESSAGE#]
   </h3>
   <p>
      [#SUPPORT#]
   </p>
   <div class="buttons-row">
      <div class="buttons">
         [#BUTTONS#]
      </div>
   </div>
   <br/>
  </div>
</main>
`;

export const SERVICE_ERROR_TEMPLATE_FOR_EMPLOYEE = `
<main>
  <div class="error" >
   <h2>Something went wrong</h2>
   <h3>
      [#MESSAGE#]
   </h3>
   <p>
      [#SUPPORT#]
   </p>
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

export const SUPPORT_LINE_TEMPLATE = `If the problem continues, please contact [#CONTACT#][#REFERENCE#].`;

export const SUPPORT_EMAIL_TEMPLATE = `<a href="mailto:[#SUPPORT_EMAIL#][#SUBJECT#]">[#SUPPORT_EMAIL#]</a>`;

export const SUPPORT_FALLBACK_CONTACT = `your system administrator`;

export const SUPPORT_REFERENCE_TEMPLATE = ` and quote reference <b>[#REFERENCE_CODE#]</b>`;
