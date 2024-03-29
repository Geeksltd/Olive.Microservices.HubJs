﻿export const SERVICE_ERROR_TEMPLATE = `
<main>
  <div class="error" >
<h2>Oops!</h2>
   <h3>
      [#STATUS#]
   </h3>
   <p>
      Something went wrong in the <b>[#SERVICE#]</b> service.
   </p>
   <div class="buttons-row">
      <div class="buttons">
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
