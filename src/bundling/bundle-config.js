({
    baseUrl: "../../lib/", // comes from launchsettings
    paths: {
        // JQuery:
        "jquery": "jquery/dist/jquery",
        //"jquery-ui/ui/widget": "jquery-ui/ui/widget",
        //"jquery-ui/ui/focusable": "jquery-ui/ui/focusable",
        "jquery-ui-all": "jquery-ui/jquery-ui",
        "jquery-validate": "jquery-validation/dist/jquery.validate",
        "jquery-validate-unobtrusive": "jquery-validation-unobtrusive/src/jquery.validate.unobtrusive",
        // Jquery plugins:
        "underscore": "underscore/underscore",
        "alertify": "alertifyjs/dist/js/alertify",
        "smartmenus": "smartmenus/src/jquery.smartmenus",
        "file-upload": "jquery-file-upload/js/jquery.fileupload",
        "jquery-typeahead": "jquery-typeahead/dist/jquery.typeahead.min",
        "combodate": "combodate/src/combodate",
        "js-cookie": "js-cookie/src/js.cookie",
        "handlebars": "handlebars/handlebars",
        "hammerjs": "hammer.js/hammer",
        "jquery-mentions": "jquery-mentions-input/jquery.mentionsInput",
        "chosen": "chosen-js/chosen.jquery",
        "jquery-elastic": "jquery-mentions-input/lib/jquery.elastic",
        "jquery-events-input": "jquery-mentions-input/lib/jquery.events.input",
        //"requirejs": "requirejs/require",
        // Bootstrap
        "popper": "popper.js/dist/umd/popper",
        "bootstrap": "bootstrap/dist/js/bootstrap",
        "validation-style": "jquery-validation-bootstrap-tooltip/jquery-validate.bootstrap-tooltip",
        "file-style": "bootstrap-filestyle/src/bootstrap-filestyle",
        "spinedit": "bootstrap-spinedit/js/bootstrap-spinedit",
        "password-strength": "pwstrength-bootstrap/dist/pwstrength-bootstrap-1.2.7",
        "slider": "seiyria-bootstrap-slider/dist/bootstrap-slider.min",
        "moment": "moment/min/moment.min",
        "moment-locale": "moment/locale/en-gb",
        "datepicker": "eonasdan-bootstrap-datetimepicker/src/js/bootstrap-datetimepicker",
        "bootstrapToggle": "bootstrap-toggle/js/bootstrap-toggle",
        "bootstrap-select": "bootstrap-select/dist/js/bootstrap-select",
        "flickity": "flickity/dist/flickity.pkgd",
        "echarts":"echarts/dist/echarts",
        "zrender":"zrender/dist/zrender",
		"pako":"pako"
    },
    map: {
        "*": {
        //  "chartist":"chartist",
        //"requirejs": "requirejs",
        "echarts":"echarts",
        "zrender":"zrender",
            "popper.js": "popper",
            '../moment': 'moment',
            'olive': "olive.mvc/dist",
            "app": "../compiled",
            "jquery-validation": "jquery-validate",
            "jquery.validate.unobtrusive": "jquery-validate-unobtrusive",
            "jquery-sortable": "jquery-ui/ui/widgets/sortable",
            "jquery-ui-mouse": "jquery-ui/ui/widgets/mouse",
            "jquery-ui-touch-punch": "jquery-ui-touch-punch/jquery.ui.touch-punch"
        }
    },
    shim: {
        "underscore": {
            exports: '_'
        },
        "bootstrap": ["jquery", "popper"],//,"requirejs"
        "bootstrap-select": ['jquery', 'bootstrap'],//,"requirejs"
        "bootstrapToggle": ["jquery"],
        "jquery-validate": ['jquery'],
        "validation-style": ['jquery', "jquery-validate", "bootstrap"],
        "combodate": ['jquery'],
        "jquery-typeahead": ['jquery'],
        "file-upload": ['jquery', 'jquery-ui/ui/widget'],
        "file-style": ["file-upload"],
        "smartmenus": ['jquery'],
        "chosen": ['jquery'],
        "jquery-validate-unobtrusive": ['jquery-validate'],
        "spinedit": ['jquery'],
        "password-strength": ['jquery'],
        "moment-locale": ['moment'],
        "olive/extensions/jQueryExtensions": {
            deps: ['jquery', "jquery-validate-unobtrusive"]
        },
        // "chartist":["jquery"],
        "olive/olivePage": ["alertify", "olive/extensions/jQueryExtensions", "olive/extensions/systemExtensions", "combodate"],
        // "echarts":["zrender"],
        "app/hubEcharts":["echarts"],
        "app/hubPage": ["jquery", "olive/olivePage","echarts"],
        "app/model/service": ["app/hubPage", "olive/extensions/systemExtensions"],
        "app/boardComponents": ["app/boardComponents"],
        "app/featuresMenu/fullMenuFiltering": ["app/featuresMenu/fullMenuFiltering"],
        "app/featuresMenu/featuresMenu": ["app/model/service","app/featuresMenu/fullMenuFiltering"],
        "app/featuresMenu/breadcrumbMenu": ["app/featuresMenu/featuresMenu"],
        "app/hub": ["app/featuresMenu/breadcrumbMenu"],
        "jquery-elastic": ["jquery"],
        "jquery-events-input": ["jquery"],
        "jquery-mentions": ['jquery', "underscore", "jquery-elastic", "jquery-events-input"]
    },
    optimize: "none",
    //generateSourceMaps: false,
    //preserveLicenseComments: false,    
    name: "../compiled/hubPage",
    out: "../../dist/bundle-built.js"
});