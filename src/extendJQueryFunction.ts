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

        /**
* jquery-masonry-grid 1.0.0 by @ny64
* Author: Peter Breitzler
* URL: https://github.com/ny64/jquery-masonry-grid
* License: MIT
*/

        $.fn.masonryGrid = function (options) {

            // Get options
            var settings = $.extend({
                columns: 3,
                breakpoint: 767
            }, options);

            var $this = $(this),
                currentColumn = 1,
                i = 1,
                itemCount = 1,
                isDesktop = true;
            if ($this.hasClass('masonry-grid-origin')) {
                itemCount=$this.children().length
                destroyMasonry();
            }
            // Add class to already existent items
            $this.addClass('masonry-grid-origin');
            $this.css('display','flex').css('flex-wrap','wrap');
            $this.find(".item:visible").addClass('masonry-grid-item');
           
            function createMasonry() {

                currentColumn = 1;

                $(this).append('<div class="masonry-grid-multicolumn"></div>');

                // Add columns
                for (var columnCount = 1; columnCount <= settings.columns; columnCount++) {
                    $this.each(function () {
                        $(this).append('<div class="masonry-grid-column masonry-grid-column-' + columnCount + '"></div>');
                    });
                }

                $this.each(function () {

                    var currentGrid = $(this);

                    currentGrid.find('.masonry-grid-item:not([class*="item-col"])').each(function () {
                        // Reset current column
                        if (currentColumn > settings.columns) currentColumn = 1;

                        // Add ident to element and put it in a column
                        $(this).attr('id', 'masonry_grid_item_' + itemCount)
                            .appendTo(currentGrid.find('.masonry-grid-column-' + currentColumn));

                        // Increase current column and item count
                        currentColumn++;
                        itemCount++;
                    });

                    currentGrid.find('[class*="item-col"]').each(function() {
                        $(this).appendTo(currentGrid.find('.masonry-grid-multicolumn'));
                    });
                });
            }

            function destroyMasonry() {

                // Put items back in first level of origin container
                $this.each(function () {
                    while ($('.masonry-grid-item').length > 0)
                            $('.masonry-grid-item').appendTo($this).removeAttr("id").removeClass('masonry-grid-item');
                    // Remove columns
                    $(this).find('.masonry-grid-column').remove();
                    $(this).find('.masonry-grid-multicolumn').remove();

                    // Remove basic styles
                    $(this).css('display', 'block').removeClass('masonry-grid-origin').find('.masonry-grid-column').css('width', 'auto')
                });
            }

            // Call functions
            if ($(window).width() > settings.breakpoint) {
                isDesktop = true;
                createMasonry();
            } else if ($(window).width() <= settings.breakpoint) {
                isDesktop = false;
                destroyMasonry();
            }
            
        }

    }

}