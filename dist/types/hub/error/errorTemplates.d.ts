declare namespace errorTemplates {
    const SERVICE = "\n<main>\n  <div class=\"error\" >\n<h2>Oops!</h2>\n   <h3>\n      Keep calm and try again later!\n   </h3>\n   <p>\n      Something went wrong in the <b>[#SERVICE#]</b> service.\n   </p>\n   <div class=\"buttons-row\">\n      <div class=\"buttons\">\n         <a name=\"ShowMeTheError\" class=\"btn btn-primary\" href=\"[#URL#]\" target=\"_blank\" default-button=\"true\">Show me the error</a>\n      </div>\n   </div>\n  </div>\n</main>\n";
}
