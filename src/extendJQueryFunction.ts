import 'jquery';

export default class ExtendJQueryFunction {
    constructor() {
        this.autoGrow()
    }
    private autoGrow() {
        /*!
            http://www.technoreply.com/autogrow-textarea-plugin-3-0
        */
        ; jQuery.fn.autoGrow = function (a) { return this.each(function () { var d = jQuery.extend({ extraLine: true }, a); var e = function (g) { jQuery(g).after('<div class="autogrow-textarea-mirror"></div>'); return jQuery(g).next(".autogrow-textarea-mirror")[0] }; var b = function (g) { f.innerHTML = String(g.value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br />") + (d.extraLine ? ".<br/>." : ""); if (jQuery(g).height() != jQuery(f).height()) { jQuery(g).height(jQuery(f).height()) } }; var c = function () { b(this) }; var f = e(this); f.style.display = "none"; f.style.wordWrap = "break-word"; f.style.whiteSpace = "pre-wrap"; f.style.padding = jQuery(this).css("paddingTop") + " " + jQuery(this).css("paddingRight") + " " + jQuery(this).css("paddingBottom") + " " + jQuery(this).css("paddingLeft"); f.style.borderStyle = jQuery(this).css("borderTopStyle") + " " + jQuery(this).css("borderRightStyle") + " " + jQuery(this).css("borderBottomStyle") + " " + jQuery(this).css("borderLeftStyle"); f.style.borderWidth = jQuery(this).css("borderTopWidth") + " " + jQuery(this).css("borderRightWidth") + " " + jQuery(this).css("borderBottomWidth") + " " + jQuery(this).css("borderLeftWidth"); f.style.width = jQuery(this).css("width"); f.style.fontFamily = jQuery(this).css("font-family"); f.style.fontSize = jQuery(this).css("font-size"); f.style.lineHeight = jQuery(this).css("line-height"); f.style.letterSpacing = jQuery(this).css("letter-spacing"); this.style.overflow = "hidden"; this.style.minHeight = this.rows + "em"; this.onkeyup = c; this.onfocus = c; b(this) }) };

    }

}