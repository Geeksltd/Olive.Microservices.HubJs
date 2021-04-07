requirejs(["app/appPage"], function () { });



window.loadModule = function (path, onLoaded) {
    if (path.indexOf("/") === 0) path = "./.." + path; // To fix baseUrl
    requirejs([path], function (m) { if (onLoaded) onLoaded(m) });
};



for (let i = 0; i < document.forms.length; i++) {
    document.forms[i].onsubmit = function (e) {
        if (window["IsOliveMvcLoaded"] === undefined) return false;
    };
}