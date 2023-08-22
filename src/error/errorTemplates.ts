namespace errorTemplates {
    export const SERVICE = `
<main>
  <div class="error" >
<h2>Oops!</h2>
   <h3>
      Keep calm and try again later!
   </h3>
   <p>
      Something went wrong in the <b>[#SERVICE#]</b> service.
   </p>
   <div class="buttons-row">
      <div class="buttons">
         <a class="btn btn-success" href="javascript:;" onclick="$('.ajax-error-content').toggleClass('d-none')">Show the error here</a>&nbsp;
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
  <a class="btn btn-secondary" href="#" onclick="$('.ajax-error-content').addClass('d-none')">Hide the error</a>
</div>
`;
}