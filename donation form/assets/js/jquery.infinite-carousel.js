/**
* Written by: Glenn Peters (http://aenigma.com/)
* Based on code by: Stéphane Roucheray
* * @extends jQuery
*
* Expects: jquery.jswipe.js
*/

(function ($) {
    $.fn.carousel = function (options) {
        $this = $(this);
        if ($this.size() === 0) { return false; } // short circ slider call if no slider elements present

        // Create some defaults, extending them with any options that were provided
        var settings = $.extend({
            'circular': true,
            'listSelect': 'ul',
            'itemType': 'li',
            'speed': 500,
            'next': '',
            'previous': '',
            'count': '', 					// Selector to write changing count to (no attempt if blank)
            'start': 0, 					// First element visible (by zero-based index)
            'controlOn': 'sliderControlActive', // CSS Class applied to make buttons active (and visible)
            'controlOff': 'sliderControlDisable', // CSS Class applied to make disable buttons
            'increment': 1 // number of elements to move at once.
        }, options);

        var sliderList = $this.find(settings.listSelect),
			next = $this.find(settings.next),
			previous = $this.find(settings.previous),
			rightEnabled = false,
			leftEnabled = false,
			swipeThreshold = { x: 100, y: 30 };

        settings.count = $this.find(settings.count);


        var methods = {
            init: function (options) {
                //console.log('Carousel init method called');
            },

            writeCount: function () {
                if (settings.count) {
                    if (firstElementOnViewPort > itemCount) {
                        settings.count.text((firstElementOnViewPort - itemCount) + '/' + itemCount);
                        mawf.draw_dots(itemCount, (firstElementOnViewPort - itemCount), '.controls-mobile');
                    } else {
                        settings.count.text(firstElementOnViewPort + '/' + itemCount);
                        mawf.draw_dots(itemCount, firstElementOnViewPort, '.controls-mobile');
                    }
                }
            },

            moveLeft: function (event) {
                //if ( console ) console.log("moveLeft: Carousel firstElementOnViewPort: " + firstElementOnViewPort );
                if (!rightEnabled) {
                    rightEnabled = true;
                    next.removeClass(settings.controlOff);
                }
                if (!isAnimating && leftEnabled) {
                    /*
                    if ( ( firstElementOnViewPort + shownInViewport - 1 ) > itemCount )
                    {
                    previous.removeClass( settings.controlOff );
                    leftEnabled  = false;
                    }
                    else {
                    */
                    firstElementOnViewPort++;

                    //if ( console ) console.log("Carousel firstElementOnViewPort: " + firstElementOnViewPort );

                    sliderList.animate({
                        left: "-=" + increment,
                        y: 0,
                        queue: true
                    }, settings.speed, function () {
                        isAnimating = false;
                        methods['writeCount']();
                        methods['setButtonStates']();
                    });
                    isAnimating = true;
                    /*					} */

                }

                return false;
            },

            moveRight: function (event) {
                //if ( console ) console.log("moveRight: Carousel firstElementOnViewPort: " + firstElementOnViewPort );
                if (!leftEnabled) {
                    leftEnabled = true;
                    previous.removeClass(settings.controlOff);
                }
                if (!isAnimating && rightEnabled) {
                    firstElementOnViewPort--;

                    sliderList.animate({
                        left: "+=" + increment,
                        y: 0,
                        queue: true
                    }, settings.speed, function () {
                        isAnimating = false;
                        methods['writeCount']();
                        methods['setButtonStates']();
                    });
                    isAnimating = true;

                    methods['writeCount']();
                }

                return false;
            },

            moveLeftCircular: function (event) {
                if (!isAnimating) {
                    if (firstElementOnViewPort == 1) {
                        jQuery(sliderList).css('left', "-" + itemCount * sizeFirstElmnt + "px");
                        firstElementOnViewPort = itemCount;
                    }
                    else {
                        firstElementOnViewPort--;
                    }

                    sliderList.animate({
                        left: "+=" + increment,
                        y: 0,
                        queue: true
                    }, settings.speed, function () {
                        isAnimating = false;
                        methods['writeCount']();
                    });
                    isAnimating = true;

                }

                return false;
            },

            moveRightCircular: function (event) {
                if (!isAnimating) {
                    if (firstElementOnViewPort > itemCount) {
                        firstElementOnViewPort = 2;
                        jQuery(sliderList).css('left', "0px");
                    }
                    else {
                        firstElementOnViewPort++;
                    }

                    //if ( console ) console.log("Carousel firstElementOnViewPort: " + firstElementOnViewPort );

                    $(sliderList).animate({
                        left: "-=" + increment,
                        y: 0,
                        queue: true
                    }, settings.speed, function () {
                        isAnimating = false;
                        methods['writeCount']();
                    });
                    isAnimating = true;

                    //methods['writeCount']();
                }

                return false;
            },

            enableLeft: function () {
                //console.log('enableLeft');

                previous.addClass(settings.controlOn);
                next.removeClass(settings.controlOff);
                leftEnabled = true;
            },

            enableRight: function () {
                //console.log('enableRight');

                next.addClass(settings.controlOn);
                next.removeClass(settings.controlOff);
                rightEnabled = true;
            },

            disableLeft: function () {
                previous.addClass(settings.controlOff);
                leftEnabled = false;
            },

            disableRight: function () {
                next.addClass(settings.controlOff);
                rightEnabled = false;
            },

            reachedLeftEnd: function () {
                //console.log("reachedLeftEnd called");

                return (firstElementOnViewPort <= 1);
                //return false;
            },

            reachedRightEnd: function () {
                var total_right = sliderList.find(settings.itemType).length / settings.increment;
                return firstElementOnViewPort >= total_right;
            },

            setButtonStates: function () {
                if (shownInViewport < itemCount) {
                    if (this.circular) {
                        // Activate buttons
                        methods['enableLeft']();
                        methods['enableRight']();
                    } else {

                        // Limit button controls
                        if (methods['reachedLeftEnd']()) {
                            methods['disableRight']();
                        } else {
                            //	methods['enableRight']();
                        }

                        if (methods['reachedRightEnd']()) {
                            methods['disableLeft']();
                        } else {
                            //methods['enableLeft']();
                        }
                    }
                }

            }

        };

        /*
        End methods, begin code

        */

        if (sliderList) {
            var increment = ($(sliderList).children(settings.itemType).outerWidth("true") * settings.increment),
				items = sliderList.children(settings.itemType),
				itemCount = items.length,
				sizeFirstElmnt = increment,
				shownInViewport = Math.round(this.width() / sizeFirstElmnt),
				firstElementOnViewPort = 1,
				isAnimating = false;

            if (settings.start < 0 || settings.start > (itemCount - 1)) {
                settings.start = 0;
            }

            // Slider won't work without these settings
            sliderList.css('position', 'absolute');
            sliderList.css('left', (settings.start * sizeFirstElmnt) + 'px');


            if (itemCount > shownInViewport) {
                // Activate buttons
                methods['enableLeft']();
                methods['enableRight']();

                if (!settings.circular) {
                    methods['setButtonStates']();
                }

                if (!(firstElementOnViewPort > 1 || settings.circular)) {
                    next.addClass(settings.controlOff);
                }

                if (!(itemCount > (firstElementOnViewPort + shownInViewport - 1) || settings.circular)) {
                    next.addClass(settings.controlOff);
                }

                // DEBUG: putting this here because width should always be adjusted, regardless of circular setting
                sliderList.css('width', (itemCount + shownInViewport) * increment + increment + "px");

                if (settings.circular) {
                    //console.log('Running settings.circular (' + settings.circular + ') condition');

                    for (i = 0; i < shownInViewport; i++) {
                        sliderList.css('width', (itemCount + shownInViewport) * increment + increment + "px");
                        sliderList.append($(items[i]).clone(true));
                    }


                    //console.log('Slider list length is now: ' + sliderList.children().length );


                    // Bind circular button functions
                    next.click(methods['moveRightCircular']);
                    previous.click(methods['moveLeftCircular']);

					//this cause issues for the initial image count in ie8 and ie7
                    if ($.swipe && ($('html').is('not-ie') || $('html').is('lt-ie9')))
                    {
                    this.swipe({
                        swipeLeft: methods['moveRightCircular'],
                        swipeRight: methods['moveLeftCircular'],
                        threshold: swipeThreshold
                    });
                   }

                } else {
                    // Bind linear button functions
                    next.click(methods['moveRight']);
                    previous.click(methods['moveLeft']);

                    this.swipe({
                        swipeLeft: methods['moveLeft'],
                        swipeRight: methods['moveRight'],
                        threshold: swipeThreshold
                    });
                }
            } else {

                previous.addClass(settings.controlOff);
                next.addClass(settings.controlOff);

                // Bind linear button functions
                next.click(function () { return false; });
                previous.click(function () { return false; });
            }

            // Write out count of items, if available
            methods['writeCount']();
        }

    };
})(jQuery);
