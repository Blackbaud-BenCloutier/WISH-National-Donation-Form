// Dev tweak
externalJS = document.location.search || true;

var mawf = mawf || {};

if (typeof console === "undefined") {
    console = {};
}

if (typeof console.log === "undefined") { 
    console.log = function() {};
    console.warn = function() {};
}

if ( typeof console.groupCollapsed === "undefined" ) {
    console.groupCollapsed = console.log;
    console.groupEnd = function () { };
    console.group = console.log;
}


// **********************************************
// Extending jQuery
// **********************************************

// Extending JQUERY with stringify for IE7 - $.stringify()
jQuery.extend({
    stringify: function stringify(obj) {
        if ("JSON" in window) {
            return JSON.stringify(obj);
        }

        var t = typeof (obj);
        if (t != "object" || obj === null) {
            // simple data type
            if (t == "string") obj = '"' + obj + '"';

            return String(obj);
        } else {
            // recurse array or object
            var n, v, json = [], arr = (obj && obj.constructor == Array);

            for (n in obj) {
                v = obj[n];
                t = typeof (v);
                if (obj.hasOwnProperty(n)) {
                    if (t == "string") {
                        v = '"' + v + '"';
                    } else if (t == "object" && v !== null) {
                        v = jQuery.stringify(v);
                    }

                    json.push((arr ? "" : '"' + n + '":') + String(v));
                }
            }

            return (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");
        }
    }
});



// Query string return
(function ($) {
    $.querystring = (function (a) {
        var i,
            p,
            b = {};
        if (a === "") { return {}; }
        for (i = 0; i < a.length; i += 1) {
            p = a[i].split('=');
            if (p.length === 2) {
                b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
            }
        }
        return b;
    } (window.location.search.substr(1).split('&')));
})(jQuery);


// jQuery.XDomainRequest.js
// Author: Jason Moon - @JSONMOON
// IE8+
if (!jQuery.support.cors && window.XDomainRequest) {
    var httpRegEx = /^https?:\/\//i;
    var getOrPostRegEx = /^get|post$/i;
    var sameSchemeRegEx = new RegExp('^' + location.protocol, 'i');
    var jsonRegEx = /\/json/i;
    var xmlRegEx = /\/xml/i;

    // ajaxTransport exists in jQuery 1.5+
    jQuery.ajaxTransport('text html xml json', function (options, userOptions, jqXHR) {
        // XDomainRequests must be: asynchronous, GET or POST methods, HTTP or HTTPS protocol, and same scheme as calling page
        if (options.crossDomain && options.async && getOrPostRegEx.test(options.type) && httpRegEx.test(options.url) && sameSchemeRegEx.test(options.url)) {
            var xdr = null;
            var userType = (userOptions.dataType || '').toLowerCase();
            return {
                send: function (headers, complete) {
                    xdr = new XDomainRequest();
                    if (/^\d+$/.test(userOptions.timeout)) {
                        xdr.timeout = userOptions.timeout;
                    }
                    xdr.ontimeout = function () {
                        complete(500, 'timeout');
                    };
                    xdr.onload = function () {
                        var allResponseHeaders = 'Content-Length: ' + xdr.responseText.length + '\r\nContent-Type: ' + xdr.contentType;
                        var status = {
                            code: 200,
                            message: 'success'
                        };
                        var responses = {
                            text: xdr.responseText
                        };
                        /*
                        if (userType === 'html') {
                        responses.html = xdr.responseText;
                        } else
                        */
                        try {
                            if ((userType === 'json') || ((userType !== 'text') && jsonRegEx.test(xdr.contentType))) {
                                try {
                                    responses.json = $.parseJSON(xdr.responseText);
                                } catch (e) {
                                    status.code = 500;
                                    status.message = 'parseerror';
                                    //throw 'Invalid JSON: ' + xdr.responseText;
                                }
                            } else if ((userType === 'xml') || ((userType !== 'text') && xmlRegEx.test(xdr.contentType))) {
                                var doc = new ActiveXObject('Microsoft.XMLDOM');
                                doc.async = false;
                                try {
                                    doc.loadXML(xdr.responseText);
                                } catch (e) {
                                    doc = undefined;
                                }
                                if (!doc || !doc.documentElement || doc.getElementsByTagName('parsererror').length) {
                                    status.code = 500;
                                    status.message = 'parseerror';
                                    throw 'Invalid XML: ' + xdr.responseText;
                                }
                                responses.xml = doc;
                            }
                        } catch (parseMessage) {
                            throw parseMessage;
                        } finally {
                            complete(status.code, status.message, responses, allResponseHeaders);
                        }
                    };

                    //set an empty handler for 'onprogress' so requests don't get aborted
                    xdr.onprogress = function () {
                    };

                    xdr.onerror = function () {
                        complete(500, 'error', {
                            text: xdr.responseText
                        });
                    };
                    var postData = (userOptions.data && $.param(userOptions.data)) || '';
                    xdr.open(options.type, options.url);
                    xdr.send(postData);
                },
                abort: function () {
                    if (xdr) {
                        xdr.abort();
                    }
                }
            };
        }
    });
}


// **********************************************
// Debugging
// **********************************************


(function ($) {

mawf.debuggerInit = function () {
    var bug;

    mawf.bug = {};
    mawf.bug._settings = {};
    mawf.bug._settings.defaults = {
        blockPageAbandon:               true, // If user leaves throw up a warning
        blockSuccessRedirect:           false,

        logComputeds:                   false, // Fire a console message everytime a computed is triggered

        logTransactionChain:            false,
        logTransDataBuild:              false,
        logTransErrorHandling:          false,
        logPostAsGet:                   false, // Takes the transaction post data, converts to GET format and logs in console

        logStepFocusing:                false,

        logLocalizationBlankOverwrites: false, // Warn if server is overwriting a default error message with a blank one
        logFormValidation:              false, // Fire a ton of logging statements as validtion takes place

        logPlatformDetection:           false, // Report platform cookie status

        logDynamicMediaModals:          false,

        logPersonalizerSyncing:         false,

        logTokenTransaction:            false,
        sessionLoadActive:              true, // Load available carts
        sessionSaveActive:              true, // Turn session saving on or off
        logSessionSaving:               false,

        logCWSIDImport:					false,

        logErrorReports:                false,
        logErrorCodes:                  false,
        sendErrorReports:               true
    },
	mawf.bug._settings.debugProfile = {
		quiet: { // shut the console up
            blockPageAbandon:       false,
            logComputeds:           false,
            logPlatformDetection:   false,
            logTransDataBuild:      false
		}
	};
	

	mawf.bug.show = function(el) {
		var rawEl, $el;

		if ( el[0] ) {
			$el = el;
			rawEl = el[0];

		} else {
			$el = $(el);
			rawEl = el;
		}

		return ( rawEl.tagName + ':' + $el.attr('type') + ' [' + rawEl.className + ']' );
	};


	mawf.markUniqueProducts = function(doMark) {
		var productLayoutCodes;

		doMark = typeof doMark === "undefined" ? true : doMark;

		if ( doMark ) {
			$('[data-prod-id^="GC"]').eq(0)
			.add($('[data-prod-id^="CR"]').eq(0))
			.add($('[data-prod-id^="CRM"]').eq(0))
			.add($('[data-prod-id^="CRW"]').eq(0))
			.add($('[data-prod-id^="TC"]').eq(0))
			.add($('[data-prod-id^="TCB"]').eq(0))
			.add($('[data-prod-id^="MC"]').eq(0))
			.add($('[data-prod-id^="ECT"]').eq(0))
			.add($('[data-prod-id^="ECM"]').eq(0))
			.css({'outline': '1px solid hotpink'})
			.each(function(){ 
				$(this)
					.find('span')
					.append( ' '+$(this).attr('data-prod-id') );
			});
			console.log('First instance of each product layout marked with border.\n');
		}

		productLayoutCodes = '\nCert codes\n';
		productLayoutCodes += 'pr-cr  - .set8 - Certificate: "Thank You (Appreciation)"\n';
		productLayoutCodes += 'pr-crm - .set7 - Certificate: "Memorial (Wish Art)"\n';
		productLayoutCodes += 'pr-crw - Certificate: "Wedding Favor (Flower)"\n';

		productLayoutCodes += '\nCard codes\n';
		productLayoutCodes += 'pr-tc  - .set4 - Card: "Classic Tribute Card"\n';
		productLayoutCodes += 'pr-tcb - .set3 - Card: "Tribute Card (Purple)"\n';
		productLayoutCodes += 'pr-gc  - .set1 - Card: "All-Occasion Card (Flowers)"\n';
		productLayoutCodes += 'pr-mc  - .set2 - Card: "Classic Memorial Card"\n';

		productLayoutCodes += '\nEcard codes\n';
		productLayoutCodes += 'pr-ect - .set5 - Ecard: "Thank You (Butterflies)"\n';
		productLayoutCodes += 'pr-ecm - .set6 - Ecard: "Memorial/Sympathy E-card"\n';

		console.log(productLayoutCodes);
	};


    // DEBUGGING VARIABLES
    //console.log('#############################################');
    //console.log('### Debugging Settings ######################');
    //console.log('#############################################');

    for (bug in mawf.bug._settings.defaults) {												// Single vars (overrides profile)
        mawf.bug[bug] = mawf.bug._settings.defaults[bug];
    //    console.log('# ' + bug + ':' + mawf.bug[bug].toString().toUpperCase() + '(default)');
    }

    //console.log('#############################################');
    // Profile set
    if ($.querystring.profile !== undefined && mawf.bug._settings.debugProfile[$.querystring.profile] !== undefined) {
        for (var prop in mawf.bug._settings.debugProfile[$.querystring.profile]) {
            mawf.bug[prop] = mawf.bug._settings.debugProfile[$.querystring.profile][prop];
    //        console.log('# ' + prop + ':' + mawf.bug._settings.debugProfile[$.querystring.profile][prop].toString().toUpperCase() + ' (profile:' + $.querystring.profile + ')');
        }
        delete ($.querystring.profile);
    }

    //console.log('#############################################');
    bug = undefined;
    for (bug in mawf.bug._settings.defaults) {												// Single vars (overrides profile)
        mawf.bug[bug] = $.querystring[bug] ? $.querystring[bug].toLowerCase() == 'true' ? true : false : mawf.bug[bug];
        if ($.querystring[bug] !== undefined) { console.log('# ' + bug + ':' + mawf.bug[bug].toString().toUpperCase() + ' (querystring)'); }
    }

    //console.log('#############################################');
};

// Init the debugger variables - this should be run immediately (not at $()) so it will be in place for all functions including those that run onload instead of onready
  mawf.debuggerInit();


/* ADDTHIS - Prevent page reload on IE */
$('.addthis_toolbox').on('click', '.addthis_button_compact', function (event) { event.stopPropagation(); });
$('.addthis_toolbox').on('click', '.addthis_button_email', function (event) { event.stopPropagation(); });

/* METAICONS - Prevent page reload on click */
$('.meta-icons').on('click', ' a', function(e) {
	if( $(this).parent().is('li') ) {
		e.preventDefault();}
});

// THANKYOU PAGE - Remove cart on paypal success
if ( document.location.pathname === '/ways-to-help/giving/donate/thank-you' && ($.querystring.CWSID ||  $.querystring.cwsid)  ) {
    var token		= $.querystring.CWSID || $.querystring.cwsid,
        sessionList	= $.jStorage.index(),
		cart,
		href,
		i,
		$a;

	for ( i in sessionList ) {											// Check existing carts against transaction cwsid
		cart = $.parseJSON( $.jStorage.get(sessionList[i]) );
		if ( cart.cwsid == token ) {									// If a cart exists with matching cwsid then we have a PP success trans
			$.jStorage.deleteKey(sessionList[i]);						// Delete this cart
		}
	}

    $a      = $('.donation').find('a').filter("[href$='/donate']");		// Add cwsid to donate button querystring
    href    = $a.attr('href') + '?cwsid=' + token;

	$a.attr("href", href);

}

mawf.chapterSearchURL = location.protocol + '//' + document.domain + '/localChapters/?keyword=';
mawf.siteSearchURL = location.protocol + '//' + document.domain + '/localChapters/?keyword=';
mawf.storySearchURL = location.protocol + '//' + document.domain + '/localChapters/?keyword=';
//
// Stuff that we load on every page load.
// We typically call this function from a
// jquery document ready.
//
mawf.page_init = function () {
	
	this.initPlaceholderShim();
	this.validateStandardFormInit();
	this.validateASPFormInit();
	this.platformDetection.init();
	this.activate_comment_links();
	this.activate_generic_iframe_links();
	this.activate_generic_modal_window();
	this.general_jquery_bindings();
	this.setup_popup_windows();
	this.comment_init();
	this.wishes_init();
	this.initHome();
	this.setup_sticky_header();
	this.intouchCheckStyling.init();
	this.confirmModal.init();
	this.standardSearch.init();
	this.locatorInit();
	this.relocatePicCredit();
	this.setUpMediaModal();
	this.wireFadingDivs();
	this.wireSelectOnFocus();
	this.checkHeroVidoeSizes();
	this.checkSlideshowMargins();
};


mawf.checkSlideshowMargins = function () {

	var divSlideshows = $('.right > .wish-slideshow-container');

	function parseHeight(sVal) {
		return parseInt(String(sVal).replace('px', ''));
	}

	divSlideshows.each(function () {
		var parent = $(this).closest('.module-borderfree-content');
		if (parent.size() > 0) {
			var left = $('.left', parent[0]).eq(0);
			var hLeft = parseHeight(left.outerHeight());
			var siblings = $('.right > *', parent[0]);
			var hAggregate = 0;
			var bGiveUp = false;
			siblings.each(function () {
				if (!bGiveUp) {
					var e = this;
					var $e = $(e);
					if ($e.is('.wish-slideshow-container')) {
						var hPadding = hLeft - hAggregate;
						if (hPadding > 0) {
							$e.css('paddingTop', hPadding);
						}
						bGiveUp = true;
					}
					else {
						hAggregate += parseHeight($e.outerHeight()) + parseHeight($e.css('marginTop')) + parseHeight($e.css('marginBottom'));
						bGiveUp = hAggregate > hLeft;
					}
				}
			});
		}
	});

};
   
/*********************************************
******* CHECK HERO VIDEO SIZES ********
*********************************************/

mawf.checkHeroVidoeSizes = function () {
    var divVideo = $('.wish-hero-video .video');

    function parseHeight(sVal) {
        return parseInt(String(sVal).replace('px', ''));
    }

    if (divVideo.size() > 0) {
        var iDiff = 12 + 48 + 3;  //  6px on top n bottom + 24px padding on bottom div + 3 px 1/2 negative margin js.
        var iMax = parseHeight(divVideo.outerHeight());
        iMax -= iDiff;
        var divMiddle = $('.wish-hero-middle');
        var iMin = iMax - parseHeight(divMiddle.outerHeight());
        var divBottom = $('.wish-hero-bottom');
        divBottom.css('minHeight', iMin);
    }
};

/*********************************************
******* WIRE SELECT ON FOCUS ELEMENTS ********
*********************************************/

mawf.wireSelectOnFocus = function () {
    var jqElements = $('.jsSelectOnFocus');
    jqElements.each(function () {
        $(this).focus(function () {
            $(this).select();
        });
    });
};



/**********************************************
******* WIRE INITIALLY HIDDEN SECTIONS ********
**********************************************/

mawf.wireFadingDivs = function () {
    var jqHiddenDivs = $('.jsHideInitially');
    var jqTriggers = $('.jsToggleHiddenTarget');
    // go ahead and hide divs.
    jqHiddenDivs.hide();
    // wire the triggers.
    jqTriggers.each(function () {
        var e = this;
        var jq = $(e);
        var jqCheckbox = $('input[type="checkbox"]', e);
        var jqTarget = $('div[target="' + jq.attr('target') + '"]');
        var fClick = function () {
            if (jqCheckbox.is(':checked')) {
				if (jqTarget.is(':hidden')) {
                    jqTarget.fadeIn();
                }
            }
            else {
				if (jqTarget.is(':visible')) {
                    jqTarget.fadeOut();
                }
            }
        };
        jq.click(fClick);
        fClick();
    });
};

/***********************************
******* RELOCATE PIC CREDIT ********
***********************************/

mawf.relocatePicCredit = function () {
	var jqPicCredits = $('.pic-credit');
	jqPicCredits.each(function () {
		var e = this;
		var jq = $(e);
		var jqParent = $(e.parentNode);
		var jqHeroImage = $('img', e.parentNode);
		var iInnerDelta = jqParent.innerWidth() - jqHeroImage.innerWidth();
		var iLeft = parseInt(iInnerDelta / 2);
		jq.css('left', iLeft);
	});
};

/***********************************
***** PLACEHOLDER SHIM INIT ********
***********************************/
mawf.initPlaceholderShim = function () {
    $('input, textarea').placeholder();
};


/***********************************
***** STANDARD FORM VALIDATION *****
***********************************/
mawf.validateStandardFormInit = function () {
    var standardFormSelector = '.jsStandardFormValidate';

    if ($(standardFormSelector).size() === 0 || mawfVal === undefined) { return false; }

    mawf.mainFormVal = new mawfVal();

    mawf.mainFormVal.init({
        formTargetSelector: standardFormSelector,
        asp_checkbox_support: true,
        scrollToFirstErrorOnSubmit: true,
        validationTiming: 'realTime',
        pseudoSubmitSel: 'input[type=button]' // Detection will fall back to block by form's submit if pseudo not found
    });
	$(document).trigger('standardValidationBound');
};


/***********************************
***** ASP FORM VALIDATION **********
***********************************/
mawf.validateASPFormInit = function () {
    var ASPFormSelector = '.jsASPForm';

    if ($(ASPFormSelector).size() === 0 || mawfVal === undefined) { return false; }

    mawf.ASPFormVal = new mawfVal();

    mawf.ASPFormVal.init({
        formTargetSelector: ASPFormSelector,
        scrollToFirstErrorOnSubmit: false,
        validationTiming: 'realTime',
		pseudoSubmitSel: 'a[href^="javascript:__doPostBack"]'
    });
	$(document).trigger('ASPValidationBound');
};


/***********************************
******* LOCATOR MANAGEMENT ********
***********************************/
mawf.locatorInit = function (isDynamic) {
    var $self,
        isPageLoad		= isDynamic ? false : true,
        isChapterSite	= mawf.CartView && ( mawf.CartView.purchaserID() !== mawf.CartView.nationalID() && mawf.CartView.purchaserID() !== mawf.CartView.internationalID() );
        broadcastFlag	= isDynamic ? false : (isChapterSite ? false : true),
        parentSelector	= isDynamic ? '.js_donationConfigurator:last ' : '.js_donationConfigurator ';

    if (mawf.CartView && mawf.CartView.donations().length > 1) { // IF this is a savevd session and ther are mult donations in the stack disable broadcast
        broadCastFlag = false;
        //console.log('Chapter locator broadcasting disabled, saved cart with more than one donations');
    } else {
        //console.log('Chap loc broadcasting passed mult donation test');
    }


    $(parentSelector).each(function () { // Loop each donation step (page load) or just the last (dynamic add)
        $self = $(this);


        $self.find('.js_chapterSearch').each(function () {
            new mawf.locator({														// DONATION CHAPTER LOCATOR
                $container: $(this),
                containerSel: '.js_chapterSearch',
                modalSel: '#js-chapter-locator',
                endpoint: config.getService('ChapterLocatorDonation').endpoint,
                broadcast: broadcastFlag
            });
        });

        $self.find('.jsinterntl').each(function () {
            new mawf.locator({														// DONATION INTERNATIONAL LOCATOR
                $container: $(this),
                containerSel: '.jsinterntl',
                modalSel: '#countryPicker',
                endpoint: config.getService('ChapterLocatorInternational').endpoint
            });
        });

    });

    if (isPageLoad) { // Init non-donation locators and only on page load
        $('.js_chapterSearch').not('.js_donationSpecific').each(function () {		// STANDARD CHAPTER LOCATOR
            new mawf.locator({
                $container: $(this),
                containerSel: '.js_chapterSearch',
                modalSel: '#js-chapter-locator',
                endpoint: config.getService('ChapterLocatorStandard').endpoint
            });

            if ( $(this).val() !== '' ) { mawf.isChapterSite = true; }	// If we are not on a donation page we don't have the data
																		// to determine if isChapterSite so we check for an autofilled
																		// chapterLocator, which is done server side and only on chapter
																		// sites, and use that to set the bool
        });
		
        $('.js_chapterSearchAll').each(function () {								// STANDARD CHAPTER LOCATOR
            new mawf.locator({
                $container: $(this),
                containerSel: '.js_chapterSearchAll',
                modalSel: '#js-chapter-locator',
                endpoint: config.getService('ChapterLocatorAll').endpoint
            });
            if ( $(this).val() !== '' ) { mawf.isChapterSite = true; }	// See note above
        });
    }
};

mawf.locator = function (o) {
    //console.log('new locator called with ',o);
    var self = this,
		classes,
		i;

	mawf.locatorReferencer().add(self);

    self.$container         = o.$container;
    self.containerSel       = o.containerSel;

    self.$taInput           = self.$container.find('input[type="text"]');
    self.$idInput           = self.$container.find('input[type="hidden"]');
    self.$taResultsList     = self.$container.find('ul');

																	// ALTERNATE CHAPTER SITE DETECTION
    if ( mawf.isChapterSite === undefined && self.$container.is('.js_donationSpecific') === false && self.$idInput.val() !== '' ) {
		console.warn('isChapterSite set by prefilled locator detection');
		mawf.isChapterSite = true;
    }
																	// CACHE DEFAULTS - on all non donation chapLocs and donation countryLocs
	if ( self.$taInput.is('.js_donationToCountry') ) {
		self.defaults = mawf.CartView.internationalID() ? {
			name : '',
			id   : mawf.CartView.internationalID()
		} : undefined;

	} else if ( mawf.isChapterSite && self.$container.is('.js_donationSpecific') === false ) {	

		if ( mawf.CartView ) { // chapter site donation - make sure to cache real vals not saved session

			self.defaults = mawf.siteID ? {
				name : mawf.siteName,
				id   : mawf.siteID
			} : undefined;

		} else {				// chapter site non donation - no saved session possible

			self.defaults = self.$idInput.val() ? {
				name : self.$taInput.val(),
				id   : self.$idInput.val()
			} : undefined;

		}

		if ( self.defaults ) {
			self.$taInput.data('guide').valTemplate.required = false;  // neuter validator if input is sticky - it can never be invalid
			self.$taInput.data('guide').valTemplate.validator = '';

		}
	}

    self.$modal            = $(o.modalSel);
    self.$modalResultsList = self.$modal.find('.right-col ul');
    self.$target           = undefined;

    self.modalSel          = o.modalSel;
    self.queryUrl          = o.endpoint;
    self.broadcast         = o.broadcast;

    self.modalOnly         = self.$container.is('.js_modalOnly');
    self.listenerEvents    = self.modalOnly ? 'click keypress'     : 'click keyup focusout focusin';    //  modalOnly variant

	// containerListener() - We are using e.target.value instead of the $ objects val() method since the placeholder shim has some unknown interaction that causes the val() method on IE7,8, and sometimes on 9 to return "" regardless of whether the input has content or not

    self.containerListener = function (e) {
        self.$target = $(e.target);
		self.$target.trigger('change');

		//console.log('Locator container listener received a ' + e.type + ' on ' + e.target.nodeName + '[' + self.$target.attr('class') + '] target('+ self.$target.val() + ') tainput('+ self.$taInput.val() + ' ) native(' + e.target.value + ')');

        // Input keyup
        if (self.$target.is('input[type="text"]')) {
            if (self.modalOnly) {		// MODAL TEXT INPUT ONLY - all event types - only responds to enter key

                if (e.type === 'keypress' && e.which === 13) {
					document.location = document.location.href.split('?')[0] + '?keyword=' + e.target.value;
                }

            } else {

				// TA - KEYPRESS
                if (e.type === 'keyup') {
                    var keyCode = e.which;

                    if ( $.inArray(keyCode, [37,38,39,40,9]) >= 0 ) { // ignore arrows and tab
                        return true;
                    }

                    self.$taResultsList.show();
                    self.$idInput.val('').trigger('change');

                    if (self.limitTAQueries(e.target.value)) {
                        self.queryService( self.queryUrl + e.target.value, function (data) {self.taReturn(data);} );

                    } else {
						self.$idInput.val('').trigger('change');
						self.$taResultsList.empty();
                    }

                // TA - BLUR
                } else if ( e.type === "focusout" && self.$target.is('[type=text]') ) {
                    //console.log('TA dropdown hide triggered by TA input blur');
                    window.setTimeout(function () {
                        //console.log('hider called');
                    
                        if (self.$idInput.val() === '') {                // User blurred field but did not set a value
                            if ( self.defaults ) {
								self.restore();

							} else {
								self.clear();
							}
                        }
                        self.$taResultsList.hide();
						self.$taResultsList.empty();
                    }, 200);

                // TA - CLICK
                } else if (e.type === 'click') {
					//console.log('click hit');
					self.$taInput[0].setSelectionRange(0,100);
                }
                
            }
            return true;

            // Anchor clicks (but not .search-btn which is modalOnly)
        } else if (self.$target.is('a') && self.$target.is('.search-btn') === false && e.type === 'click') {

            if (self.$target.is('.chapter-btn')) { // TA dropdown result click
                //console.log(' ta click logged ');
                self.populateChoiceInputs(self.$target.text(), self.$target.attr('data-office-id')); // Set ta values to inputs

            } else {								// Modal launcher btn
                self.openLocatorModal(self.modalSel, function (e) { self.modalListener(e); });
            }
            return false;
        }
        return true;
    };
    // Listener
    self.$container.on(self.listenerEvents, function (evt) {
        return self.containerListener(evt);
    });
};

/**
 * Fills an array with existing chapter locators - primarily for debugging purposes
 * @return {[type]} [description]
 */
mawf.locatorReferencer = function () {
    mawf.locatorArray = mawf.locatorArray || [];

    return {
        add: function (locatorObj) {
            return mawf.locatorArray.push(locatorObj);
        },

        remove: function (index) {
            index = index || false;
            return index ? mawf.locatorArray.splice(index, 1) : index;
        },

        get: function (index) {
            return index ? mawf.locatorArray[index] : mawf.locatorArray;
        },

        clearAll: function () {
            mawf.locatorArray = [];
            return true;
        }
    };
};

/**********************************
**** MODAL - GENERAL LOCATOR *****
**********************************/

mawf.locator.prototype.getNoMatchMsg = function() {
	var self = this;

	if ( self.taNoDataMsg ) {
		return self.taNoDataMsg;

	} else {
		var i, classes = self.$taInput.attr('class').split(' ');												// Set the 'no match' error message

		for ( i in classes ) { 
			if ( mawf.validation_errors[classes[i]] !== undefined ) {
				self.taNoDataMsg = mawf.validation_errors[classes[i]].errorInvalid;
				break;
			}
		}

		return self.taNoDataMsg ? self.taNoDataMsg : 'No matching results found!';	
	}
	
};

mawf.locator.prototype.clear = function() {
	//console.log('clear() called');
    var self = this;
	self.$taInput.val('').trigger('change');
    self.$idInput.val('').trigger('change');
};

mawf.locator.prototype.restore = function(name, id) {
    var self = this;

    id		= id   || self.defaults.id;
    name	= name || self.defaults.name;

    if ( id === undefined ) {
		console.warn('Chapter locator restore called but no cached id was found');
		return;
    }

	//console.log('restore() called');
	self.$taInput.val(name).trigger('change');
    self.$idInput.val(id).trigger('change');
};

mawf.locator.prototype.openLocatorModal = function (modalSel, listener, opts) {
    if (opts) {
        // integrate fancybox overrides if necessary
    }

    $.fancybox({
        href: modalSel,
        beforeLoad: function () { $('body').css('overflow', 'hidden'); }, // Dev edit - default callbacks
        afterClose: function (parent) {
            $('body').css('overflow', 'auto');  // This can be moved to the fb js and apply to all fb's
            parent.group[0].content.off();

        }
    });
    $(modalSel).on('click', function (e) {
        listener(e);
        return false;
    });
};

// handles button driven state lookup
mawf.locator.prototype.modalListener = function (e) {
    //console.log(e.target);
    var self = this;
    self.$target = $(e.target);

    // if COUNTRY BUTTON - query service, set tainput, close fancybox, cb fill id and ta
    if (self.$target.is('.country-btn')) {
        // if target is not selected - set as selected
        // if target has no data - query and set data
        self.modalSelectCountry(self.$target);
        $.fancybox.close();
    }
    // if STATE BUTTON - query service, cb fill results container
    else if (self.$target.is('.state-btn')) {
        if (self.modalSelectState(self.$target)) {
            self.queryService(self.queryUrl + self.$target.text(), function (data) { self.stateModalReturn(data); });
        }
    }

    // if CHAPTER BUTTON
    else if (self.$target.is('.chapter-btn')) {
        // Jump to search page for modalOnly locators
        self.$modalResultsList.find('.selected').each(function() {
            if ( $(this).is(self.$target) === false ) {
                $(this).removeClass('selected');
            }
        });
        self.$target.addClass('selected');
        if (self.modalOnly) {
            window.location = '/local-chapters?chapterid=' + self.$target.attr('data-office-id');

        } else {
            self.populateChoiceInputs(self.$target.text(), self.$target.attr('data-office-id'));
            $.fancybox.close();
        }

    // if CLOSE BUTTON
    } else if (self.$target.is('.cancel-btn')) {
        $.fancybox.close();
    }
};

/*******************************
***** MODAL CHAPTER ************
// *******************************/
// mawf.locator.prototype.startTASearch = function() {
//	console.log('startTASeach triggered by focusin on input');
//     var self = this;
//	self.clear();
//	self.$taResultsList.show();// open list
// }

mawf.locator.prototype.modalSelectState = function ($el) {
    if ($el.not('.selected')) {
        this.modalClearStates();
        $el.addClass('selected');
        return true;

    } else {
        return false;
    }
};

mawf.locator.prototype.modalClearStates = function () {
    this.$modal.find('.state-btn.selected').removeClass('selected');
};

mawf.locator.prototype.modalSelectChapter = function ($el) {
    if ($el.not('.selected')) {
        this.modalClearChapters();
        $el.addClass('selected');
    }
};

mawf.locator.prototype.modalClearChapters = function () {
    this.$modalResultsList.find('.selected').removeClass('selected');
};

mawf.locator.prototype.stateModalReturn = function (data) {
    this.$modalResultsList.html(this.locatorJsonToHtml(data));
};


/*******************************
**** MODAL - COUNTRY ***********
*******************************/

mawf.locator.prototype.modalSelectCountry = function ($el) {
    var self = this;
    if ($el.not('.selected')) {
        self.modalClearCountries();
        $el.addClass('selected');
    }
    if ($el.attr('data-country-title') === undefined) {
        self.queryService(self.queryUrl + self.$target.attr('data-country-code'), function (data) { self.countryModalReturn(data); });

    } else {
		self.countryModalReturn( [{'OfficeName': $el.attr('data-country-title'), 'OfficeID': $el.attr('data-country-id') }] );
    }
};

mawf.locator.prototype.modalClearCountries = function () {
    this.$modal.find('.country-btn.selected').removeClass('selected');
};

mawf.locator.prototype.locatorJsonToHtml = function (jsonData) {
    var htm = '';
	if ( !jsonData || $.isEmptyObject(jsonData) ) {
			htm += '<li class="noResult">' + this.getNoMatchMsg() + '</li>';

	} else {
		for (var x in jsonData) {
			htm += '<li><a href="#" data-office-id="' + jsonData[x].OfficeID + '" class="chapter-btn">' + jsonData[x].OfficeName + '</a></li>';
		}
	}
	//console.log('locatorJsonToHtml() :' + htm);
    return htm;
};

mawf.locator.prototype.countryModalReturn = function (data) {
	if ( data && data[0] && data[0].OfficeName && data[0].OfficeID ) {
		this.$taInput.val(data[0].OfficeName).trigger('change');
		this.$idInput.val(data[0].OfficeID).trigger('change');	
	}
};

/************************************
****** DATA MANIPULATION ***********
***********************************/

mawf.locator.prototype.populateChoiceInputs = function (chapterName, chapterId) {
    var $targetID, $targetName;
    // Pick target inputs - Branch depending on broadcast flag in donation
    if (this.broadcast) {
        this.broadcast = false;
        $targetName = this.$taInput.add($(this.containerSel).not('.js_donationSpecific').find('input[type="text"]'));
        $targetID = this.$idInput.add($(this.containerSel).not('.js_donationSpecific').find('input[type="hidden"]'));

    } else {
        $targetName = this.$taInput;
        $targetID = this.$idInput;
    }
    // Manually clear the title input of a possible error
    if (this.$container.is('.js_donationSpecific')) { mawf.mainFormVal.clearError($targetName.eq(0).data('guide')); }
    // Set values
    $targetName.val(chapterName).trigger('change').trigger('focusout');
    $targetID.val(chapterId).trigger('change').trigger('focusout');
};

mawf.locator.prototype.limitTAQueries = function (terms) {
    return (/^[a-zA-Z]{3}|\d{5}/).test(terms);
};

mawf.locator.prototype.queryService = function (endpoint, cb) {
    if ( mawf.locatorQuery ) {												// If user has triggered another locator query before the previous one has finished
		console.warn('Aborting locator query to prevent race condition');
        mawf.locatorQuery.abort();												// Abort the pending query
    }

    mawf.locatorQuery = $.getJSON(endpoint, function(data) {
		cb(data);																// Execute callback
		mawf.locatorQuery = undefined;											// Delete xhr tracking object
	});
};

mawf.locator.prototype.taReturn = function (data) {
    //for ( var i in data ) { console.log(data[i]); }

	var htm = this.locatorJsonToHtml(data);

	//console.log('converter: '+htm, this.$taResultsList);
    this.$taResultsList.html(htm);
};


/**
* hasActiveSession() - Looks for a cookie with a particular name, can set cookie if not found, sets a 24 hour cookie
* @param  {string} name         name of cookie
* @param  {bool} setIfNotFound	whether to set the cookie if not found, defaults to true if not provided
* @return {bool}				returns true if found, false if not found
*/
mawf.hasSavedSession = function (name, setIfNotFound) {
    setIfNotFound = setIfNotFound || true;

    if ( $.cookie(name) ) {
        return true;

    } else if (setIfNotFound) {
		$.cookie(name, '1', { expires: 1 });
    }
	
	return false;
};


/**
* Detect Platform
*
*/
mawf.platformDetection = {
	init: function () {
		var dpr = window.devicePixelRatio || 1;
		mawf.isMobile = $(window).width() < (570 / dpr);
		mawf.isIFrame = (window.frameElement != null)
	}
};

mawf.setDesktopImage = function () {
    // search for header img type
    var $this, newSrc;

    if (mawf.bug && mawf.bug.logImageSwitching) { console.log('setDesktopImage() called'); }

    $('img.jsHeroImage').each(function () {
        $this = $(this);
        newSrc = $this.attr('data-alt-src');

        if (newSrc === undefined) {
            if (mawf.bug && mawf.bug.logImageSwitching) { console.log('Platform image failed: data-alt-src not defined'); }
            return false;
        }

        if (mawf.bug && mawf.bug.logImageSwitching) { console.log('Platform image switched from ' + $this.attr('src') + ' to ' + newSrc); }
        $(this).attr('src', newSrc);
        return true;
    });
    // switch source
};

// #####################################
// ####### DATE CALCULATIONS ###########
// #####################################
// args obj - {monthNames: [...], date1: int, date2: int}
// Date variables.
mawf.initDates = function (args) {
    //console.log('mawf.initDates() called with ', args);
    var date = new Date();
    mawf.dates = {};

    if (args === undefined || args.monthNames === undefined) {
        mawf.dates.allMonthNames = [null, "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    } else {
        mawf.dates.allMonthNames = args.monthNames;
        if (mawf.dates.allMonthNames[0] !== null) {
            mawf.dates.allMonthNames.unshift(null);
        }
    }

    mawf.dates.todayDayNumber = date.getDate();
    mawf.dates.monthNumber = date.getMonth() + 1;
    mawf.dates.monthName = mawf.dates.allMonthNames[mawf.dates.monthNumber];
    mawf.dates.fullYear = date.getFullYear();
    mawf.dates.year = mawf.dates.fullYear - 2000;
    mawf.dates.todayTS = new Date( mawf.dates.fullYear, mawf.dates.monthNumber, mawf.dates.todayDayNumber ).getTime();
    mawf.dates.totalDaysInThisMonth = new Date(mawf.dates.year, mawf.dates.monthNumber, 0).getDate();

    if (args !== undefined) {

        if (args.date1 !== undefined) {		// Build donation start date 1 info
            mawf.dates.distToStartDate1 = mawf.dates.todayDayNumber > args.date1 ? (mawf.dates.totalDaysInThisMonth - mawf.dates.todayDayNumber) + args.date1 :
				args.date1 - mawf.dates.todayDayNumber;
            mawf.dates.date1IsNextMonth = mawf.dates.todayDayNumber > args.date1;
            mawf.dates.date1 = {
                number: args.date1,
                monthName: mawf.dates.date1IsNextMonth ? mawf.dates.allMonthNames[mawf.dates.monthNumber + 1] : mawf.dates.allMonthNames[mawf.dates.monthNumber],
                prettyMonthNumber: mawf.dates.date1IsNextMonth ? mawf.dates.monthNumber + 1 : mawf.dates.monthNumber,
                year: mawf.dates.date1IsNextMonth && mawf.dates.monthNumber == 12 ? mawf.dates.year + 1 : mawf.dates.year,
                needsSameDay: mawf.dates.distToStartDate1 > 14
            };
            if (mawf.dates.date1.prettyMonthNumber === 13) {
                mawf.dates.date1.prettyMonthNumber = 1;
                mawf.dates.date1.monthName = mawf.dates.allMonthNames[1];
                mawf.dates.date1.year = mawf.dates.year + 1;
            }
        }

        if (args.date2 !== undefined) {		// Build donation start date 2 info
            mawf.dates.distToStartDate2 = mawf.dates.todayDayNumber > args.date2 ? (mawf.dates.totalDaysInThisMonth - mawf.dates.todayDayNumber) + args.date2 :
									args.date2 - mawf.dates.todayDayNumber;
            mawf.dates.date2IsNextMonth = mawf.dates.todayDayNumber > args.date2;

            mawf.dates.date2 = {
                number: args.date2,
                monthName: mawf.dates.date2IsNextMonth ? mawf.dates.allMonthNames[mawf.dates.monthNumber + 1] : mawf.dates.allMonthNames[mawf.dates.monthNumber],
                prettyMonthNumber: mawf.dates.date2IsNextMonth ? mawf.dates.monthNumber + 1 : mawf.dates.monthNumber,
                year: mawf.dates.date2IsNextMonth && mawf.dates.monthNumber == 12 ? mawf.dates.year + 1 : mawf.dates.year,
                needsSameDay: mawf.dates.distToStartDate2 > 14
            };

            if (mawf.dates.date2.prettyMonthNumber === 13) {
                mawf.dates.date2.prettyMonthNumber = 1;
                mawf.dates.date2.monthName = mawf.dates.allMonthNames[1];
                mawf.dates.date2.year = mawf.dates.year + 1;
            }
        }
    }
    return mawf.dates;
};

//
// confirmModal
// Launch a fbox confirmation modal programmatically with custom message and callbacks for confirm/cancel
//
mawf.confirmModal = {
    //
    // init()
    // Binds a delegated listener at the top of the modal div to catch yes/no button clicks
    // that might occur if the modal has buttons, and a user clicks one. The button
    // clicks fire the mawf. vars that will hold callback functions set during launch()
    //
    init: function () {
        var targetBox;

        if (($targetBox = $('#js-modal-confirm')) && $targetBox.size() > 0) {

            $targetBox.click(function (evt) {					// Bind buttons to callback
                var $target = $(evt.target),
					options = mawf.confirmModal.options;

                if ($target.hasClass('js-yes')) {				// Yes button
                    $.fancybox.close();
                    options.yes_cb(options.passThruArgs);

                } else if ($target.hasClass('js-no')) {		// No button
                    if (options.no_cb !== undefined) {
                        $.fancybox.close();
                        options.no_cb(options.passThruArgs);
                    } else {
                        $.fancybox.close();
                    }
                }
                return false;
            });
        }
    },

    // launch()
    // This sets all the pertinent vars (attached to the namespace) that relate to
    // the confirmModal and then launches the modal
    launch: function (o) {
        var $modal, $cta, $stat, $img;

        o.boxSelector = o.boxSelector || '#js-modal-confirm'; // Arg defaults

        o.buttonCount = typeof o.btnCount === 'undefined' ? 2 : o.btnCount;

        o.btnYesTxt = o.btnYesTxt || 'Continue';
        o.btnNoTxt = o.btnNoTxt || 'Cancel';

        o.showGraphic = o.showGraphic || false;
        o.graphicURL = o.graphicURL || '/img/global/prog-spinner3.gif';


        $modal = $(o.boxSelector);

        $cta = $modal.find('.modal-message');
        $stat = $modal.find('.stat-msg');
        $post = $modal.find('.post-msg');

        $img = $modal.find('.modal-graphic');

        mawf.confirmModal.$modal = $modal;
        mawf.confirmModal.$cta = $cta;
        mawf.confirmModal.$stat = $stat;
        mawf.confirmModal.$post = $post;
        mawf.confirmModal.$img = $img;


        mawf.confirmModal.options = o;						// Update options in namespace

        // Args list
        // boxSelector			- select for modal content to grab for fB
        // 
        // btnCount				- int 0 - 2; sets visibilty for desired number of buttons; defaults to 2
        // btnYesTxt			- string - set button text
        // btnNoTxt				- string - set button text
        // yes_cb				- positive button press callback
        // no_cb				- negative button press callback
        // passThruArgs			- args you want to pass to callbacks
        // 
        // showGraphic			- bool - show spinner or not
        // graphicURL			- imag asset url
        // 
        // ctaMsg				- change the default modal cta message
        // statMsg				- change the stat msg

        // Pre-launch configure modal options
        if (o.message) {										// set cta html
            $cta.html(o.message);
        }

        if (o.statMsg) {										// set secondary messaging, supports on the fly creation(needed?) - needs update functionality
            $stat = $stat.size() !== 0 ? $stat.html(o.statMsg) : $cta.after('<span class="stat-msg">' + o.statMsg + '</span>');
        }

        if (o.postMsg) {
            $post.html(o.postMsg);
        } else {
            $post.html('');
        }

        $modal.removeClass('btnCount1 btnCount2').addClass('btnCount' + o.buttonCount); 
        if (o.passThruArgs) { mawf.confirmModal.passThruArgs = o.passThruArgs; } // Set args for callbacks
        if (o.yes_cb) { mawf.confirmModal.options.yes_cb = o.yes_cb; }		// Set Yes callback
        if (o.no_cb) { mawf.confirmModal.options.no_cb = o.no_cb; }		// Set No callback


        if (o.btnYesTxt) { $modal.find('.js-yes').text(o.btnYesTxt); }		// Set Yes button text
        if (o.btnNoTxt) { $modal.find('.js-no').text(o.btnNoTxt); }			// Set No button text

        if (o.showGraphic) {													// Show/hide Graphic
            $modal.addClass('showGraphic');
            $img.attr('src', o.graphicURL);
        }

        $.fancybox({											// launch modal
            href: o.boxSelector,
            autoSize: true,
            afterShow: function () { $.fancybox.inner.css('height', 'auto'); }
        });
    },

    /**
    * Overwrites the cta message with new text
    * @param  {string} txt New cta message
    * @return {undefined}
    */
    updateMessage: function (msg, msgType, mode) {
        var $target;
        msgType = msgType || 'main';

        switch (msgType) {
            case 'main':
                $target = mawf.confirmModal.$cta;
                break;
            case 'status':
                $target = mawf.confirmModal.$stat;
                break;
            case 'post':
                $target = mawf.confirmModal.$post;
                break;
        }

        if (mode && mode === 'add') {
            mawf.confirmModal.$cta.html($target.text() + msg);
        } else {
            $target.html(msg);
        }
    },


    extendMessage: function (txt) {
        mawf.confirmModal.updateMessage(txt, 'add');
    },

    /**
    * Changes modal graphic src attribute, will show the graphic if it was not visible previously 
    * and if no src arg is sent will hide graphic
    * @param  {string} src Image file source
    * @return {undefined}
    */
    updateGraphic: function (src) {
        src = src === 'spinner' ? '/img/global/prog-spinner.gif' : src;

        if (src) {
            mawf.confirmModal.$modal.addClass('showGraphic').find('.modal-graphic').attr('src', src);
        } else {
            mawf.confirmModal.$modal.removeClass('showGraphic').find('.modal-graphic').attr('src', '');
        }
    },


    showButton: function (btnQuantity) {
        mawf.confirmModal.$modal.removeClass('btnCount1 btnCount2 btnCount0');

        if (btnQuantity) {
            mawf.confirmModal.$modal.addClass('btnCount' + btnQuantity);
        } else {
            mawf.confirmModal.$modal.addClass('btnCount' + btnQuantity);
        }
    },

    closeModal: function () { $.fancybox.close(); }

};


//
// intouchCheckStyling()
// monitors checkboxes inside intouch containers and toggles a class on the container for styling
//
mawf.intouchCheckStyling = {
    init: function () {
        // bind checkbox to reveal toggle
        $('.intouch-container :checkbox').each(function () {
            var $this = $(this),
				$wrap = $this.closest('.intouch-container');

            if ($this.is(':checked')) { $wrap.addClass('selected'); } // Initial check for checked

            $this.change(function () {
                if ($this.is(':checked')) { $wrap.addClass('selected'); }
                else { $wrap.removeClass('selected'); }
            });
        });
    }
};

// #### TODO - Determine if all the search code is still needed after Jeff took control of some sevices via the backend

//
// standardSearch()
// Binds listeners to containing divs of story search and preheader generic site search,
// on return keypress or submit button click, fires search
//
mawf.standardSearch = {
	init: function () {
		$('.jsWireTarget[target]').each(function () {

			// closures
			var elem = this,
			$input = $(elem),
			$target = $('.' + $input.attr('target'), elem.parentNode);

			if ($input.attr('jsTargetWired') != 'true' && $target.size() > 0) {

				// events
				var fKeyDown = function (e) {
					e = e || window.event || {};
					var charCode = e.charCode || e.keyCode || e.which;
					var val = $input.val();
					if (charCode == 13) {
						if (val != '') {
							$target[0].click();
						}
						return false;
					}
					return true;
				};

				// init
				$input.unbind('keydown').unbind('keyup').keydown(fKeyDown);
				$input.attr('jsTargetWired', 'true');

			}

		});
	}
};

//
// Check to see if the request is small screen (mobile).
//
mawf.isSmallScreen = function () {
    return (document.documentElement.clientWidth < 720);
    //return navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/);
};

//
// Activate Generic Modal iFrame Fancybox links.
//
mawf.activate_generic_modal_window = function () {

    $('.modal-wrap').each(function () {

        //		var jqHeader = $('.modal-head', this);
        //		var jqBody = $('.modal-body', this);
        var jqClose = $('.close-btn', this);

        //		if (jqHeader.size() > 0 && jqBody.size() > 0) {

        //			jqBody.css('height', 100);
        //			var iMaxHeight = $(window).innerHeight();
        //			var iHeaderHeight = $('.modal-head').outerHeight();

        //			var iBodyHeight = iMaxHeight - iHeaderHeight;

        //			jqBody.css('height', iBodyHeight);

        //		}

        jqClose.click(function () {
            window.top.$.fancybox.close();
            return false;
        });

    });

    return true;
};

//
// Activate Generic Modal iFrame Fancybox links.
//
mawf.activate_generic_iframe_links = function () {
    if (!$.fancybox) {
        console.log("Fancybox expected, but not found.");
        return false;
    }

    // See http://fancybox.net/api for more options
    $(".jsGenericFancybox").fancybox({
        'width': 698,
        'height': 500,
        'overlayShow': true,
        'overlayOpacity': 0.8,
        'overlayColor': '#142633',
        'padding': '0px',
        'scrolling': 'no',
        'autoScale': false,
        'transitionIn': 'none',
        'transitionOut': 'none',
        'type': 'iframe'
    });

    return true;
};

//
// Activate comment links.
//
mawf.activate_comment_links = function () {
    if (!$.fancybox) {
        console.log("Fancybox expected, but not found.");
        return false;
    }

    // See http://fancybox.net/api for more options
    $(".comment-btn, .fancybox").fancybox({
        'width': 698,
        'height': 423,
        'overlayShow': true,
        'overlayOpacity': 0.8,
        'overlayColor': '#142633',
        'padding': '0px',
        'scrolling': 'no',
        'autoScale': false,
        'transitionIn': 'none',
        'transitionOut': 'none',
        'type': 'iframe',
		iframe: {
			scrolling: 'yes'
		}
    });
};

//
// General system wide jquery bindings.
//
mawf.general_jquery_bindings = function () {

	// Check Prev Pager Is Disabled.
	$('.paging .prev').click(
		function () {
			return !$(this).hasClass('prev-disabled');
		}
	);

	// Mark last content div.
	$('div.foot').prev('.content-gray, .content-gray-shadow').addClass('last-content');

	// Tooltip show
	$(".meta-icons li").hover(function () {
		$(this).find(".tooltip").toggle();
	});

	$(".buttons-wrap .button").hover(function () {
		$(this).next(".tooltip").toggle();
	});

	// Nav - Chapter search box
	$('.chapter-search-trigger').click(function () {
		$('.main-nav').toggleClass('chapt-search-open');
		return false;
	});

	// Preheader search icon color change
	$('.preheader .text-input')
		.focus(function () {
			$('.preheader .submit').addClass('active');
		})
		.blur(function () {
			$('.preheader .submit').removeClass('active');
		});

	// Initialize wish slider
	$('div.wish-hero-slider').add('div.wish-slideshow').each(function () {
		$(this).carousel({
			'circular': false,
			'previous': 'div.controls a.next', // swapping these to address #1435
			'next': 'div.controls a.prev',
			'count': 'div.controls span.count'
		});

	});

	$('#mobile-nav-trigger').click(function () {
		var $nav = $(this), $bod = $('body');

		if ($bod.hasClass('mobile-nav-shut')) {
			$nav.text('X');
			$bod
				.removeClass('mobile-nav-shut')
				.addClass('mobile-nav-open');
		} else {
			$nav.text('Menu');
			$bod
				.removeClass('mobile-nav-open')
				.addClass('mobile-nav-shut');
		}
	});

	// Generic open inline as modal hook - use class .fb-inline on your link

	$('.fb-inline').each(function () {
		var $this = $(this);
		$this.fancybox({ type: 'inline' });
	});


	// setup dots for mobile
	this.draw_dots('.controls-mobile');

	// Uniform form styling
	if (mawf.isMobile === false || mawf.isIFrame) {
		$("select, input:checkbox, input:radio, input:file").not('.jsSkipUniform').uniform();
		$(document).trigger('uniformBound');
	}

	$('.js_print').on('click', function () {
		window.print();
		return false;
	});
};


// mawf.imageDimCheck()
// Options
//	$img - image to check width on
//	checkInterval - time to wait between repeating (ms)
//	iterationLimit - number of times to check
//	curIteration - current loop iteration, can be omitted and func will set
//	success and fail are callbacks
mawf.imageDimCheck = function (o) {
    if (o.curIteration === undefined) { mawf.loaderOpts = o; } // cache to namespace because oldIE sucks
    o.checkInterval = o.checkInterval || 50; // Default interval to 50 if not set
    o.curIteration = o.curIteration || 0; 	// Init curIteration var
    o.skipFirstCheck = o.skipFirstCheck || false;

    if (mawf.bug && mawf.bug.logDynamicMediaModals) { console.log('idc called', o, o.$img.height(), o.$img.width()); }

    if (o.skipFirstCheck !== true && o.$img.height() > 0) {
        if (mawf.bug && mawf.bug.logDynamicMediaModals) { console.log('idc win'); }
        o.success();

    } else {
        o.skipFirstCheck = false;
        if (o.curIteration < o.iterationLimit) {
            if (mawf.bug && mawf.bug.logDynamicMediaModals) { console.log('idc repeat'); }
            mawf.loaderOpts.curIteration++;
            setTimeout(mawf.imageDimCheck, o.checkInterval, mawf.loaderOpts);

        } else {
            if (mawf.bug && mawf.bug.logDynamicMediaModals) { console.log('idc fail'); }
            if (o.fail) { o.fail(); }
            return false;
        }
    }
};

// setUpMediaModal()
// Create hidden modal html to hold images previews
mawf.setUpMediaModal = function () {
	var $mediaLinks = $('.fb-media'),
		dfd;

	if ($mediaLinks.length > 0) {
		if ($('#fbox-media-container').length === 0) { mawf.createFancyBoxMediaModal(); }

		$mediaLinks.each(function () {
			var $this = $(this),
			imageLink = $this.attr('href');


			$this.on('click', function () {

				if (!$.browser.msie) mawf.$fboxMediaProxyImage.attr('src', '');

				$.fancybox.showLoading(); // Show spinner

				mawf.$fboxMediaProxyImage.attr('src', imageLink);

				dfd = mawf.$fboxMediaProxyImage.imagesLoaded();

				dfd.always(function ($images, $proper, $broken) {
					$.fancybox.hideLoading();
				});

				dfd.done(function () {
					if (mawf.bug && mawf.bug.logDynamicMediaModals) { console.log('Image loaded successfully'); }
					mawf.$fboxMediaProxyImage.show();
					mawf.$fboxMediaMsg.hide();
					$.fancybox.open({
						href: '#fbox-media-container',
						autoSize: true
					});
				});

				dfd.fail(function () {
					if (mawf.bug && mawf.bug.logDynamicMediaModals) { console.log('Image load failed'); }
					mawf.$fboxMediaMsg.show().html('We are having trouble loading this image. You can try the direct link at <a href="' + imageLink + '" target="_blank">' + imageLink + '</a> or attempt to load the image later.');
					$.fancybox.open({
						href: '#fbox-media-container',
						autoSize: true 
					});
				});

				return false;
			});
		});
	}
};

mawf.createFancyBoxMediaModal = function () {
    //console.log('createFancyBoxMediaModal modal called');
    var $fbox = $('<div id="fbox-media-container"/>').hide(),
		fboxHTML = '';

    fboxHTML = '<div class="whats-this modal clearfix">\n';
    fboxHTML += '	<div class="modal-header clearfix">\n';
    fboxHTML += '		<a href="#" class="cancel-btn">Close</a>\n';
    fboxHTML += '	</div>\n';
    fboxHTML += '	<div class="modal-body clearfix"><img src="" id="fb-media-image"><span id="fb-media-msg"></span></div>\n';
    fboxHTML += '</div>\n';

    $fbox.append(fboxHTML)
		.find('.cancel-btn')
		.on('click', function () { $.fancybox.close(); return false; });

    $fbox.appendTo('body');

    mawf.$fboxMediaContainer = $fbox;
    mawf.$fboxMediaProxyImage = $fbox.find('img');
    mawf.$fboxMediaMsg = $('#fb-media-msg');
    $('#fb-media-msg').hide();
};

//
// Setup sticky Header.
//
mawf.setup_sticky_header = function () {
    // Make a sticky header that follows you down.
    //if (!mawf.isSmallScreen() && /iPad/i.test(navigator.userAgent) === false && $('.js_makeSticky').size() > 0) {
    if (!mawf.isSmallScreen() && $('.js_makeSticky').size() > 0) {
        var scroll_offset = -170;
        $.waypoints.settings.scrollThrottle = 30;

        // first, add row_12 to the .page-title block, add our anchor-links class and contain it in a .sticky-head...
        $('.page-title').css('padding-bottom', '0').addClass('row_12').append('<div><ul class="anchor-links"></ul></div>').wrap('<div class="sticky-head" />');

        // which we'll be using a lot
        var sticky = $('.sticky-head');

        // then, wrap that in a .sticky-container
        sticky.wrap('<div class="sticky-container" />');

        // set a waypoint on the container which activates .sticky, floating the element
        $('.sticky-container').waypoint(function (event, direction) {
            if (direction === "down") {
                sticky.addClass('sticky');
            } else {
                sticky.removeClass('sticky');
            }
        });

        $('#top').waypoint(function (event, direction) {
            top = false;
        });

        // loop through the h2's in .js_makeSticky, creating links, creating waypoints, and assigning the desired functionality
        $('.js_makeSticky h2').each(function (idx) {

            $(this).attr('id', 'waypoint-' + idx);
            $('.anchor-links').append('<li><a href="#waypoint-' + idx + '" class="down" >' + $(this).text() + '</a></li>');
            $(this).waypoint(function (event, direction) {
                $('.anchor-links a').removeClass('active').removeClass('down').removeClass('up');

                for (var i = $('.js_makeSticky h2').length - 1; i >= 0; i--) {
                    if (i < idx) {
                        $('.anchor-links a:eq(' + i + ')').addClass('up');
                    } else if (i === idx) {
                        $('.anchor-links a:eq(' + i + ')').addClass('active');
                    } else {
                        $('.anchor-links a:eq(' + i + ')').addClass('down');
                    }
                    if (direction === "up") {
                        $('.anchor-links a:eq(' + idx + ')').removeClass('active').addClass('down');
                        $('.anchor-links a:eq(' + eval(idx - 1) + ')').removeClass('up').addClass('active');
                    }
                }
            }, { offset: 270 });

        });

        // Add our 'Scroll to top' element
        $('.anchor-links').append('<li class="to-top"><a href="#top">Scroll to top</a></li>');

        // Attach the scrollTo action when the anchor links are clicked
        $('.anchor-links a').click(function () {
            var href = $(this).attr('href');
            $.scrollTo(href, 1000, { offset: scroll_offset });
            return false;
        });
    }
};

/*	subscribeToEmail()

DATA (All required)
	
### Standard ###
/{email}/{chapterId}/{includeNational}/{firstName/{lastName}
Elements required:
Email, chapterId, includeNational*, firstName
 
*IncludeNational = true/false

### International ###
/{email}/{firstName/{lastName}

Elements required: All

Sample call: mawf.subscribeToEmail('standard', {email: 'example@example.com',chapterID: '100-000', includeNational:'true', firstName:'joe'});
*/
mawf.subscribeToEmail = function (strSubscription, objData) {
    //console.log('subscribeToEmail() called with ', strSubscription, objData);
    var prop, endpoint, dataArray, svc,
		availableServices = {
			standard: {
				endpointRef: 'LocalNationalSubscribe',
				dataArray: ['email', 'chapterID', 'includeNational', 'firstName']
			},
			international: {
				endpointRef: 'WishMessengerSubscribe',
				dataArray: ['email', 'firstName', 'lastName']
			}
		};

	svc      = availableServices[strSubscription];
	endpoint = config.getService(svc.endpointRef).endpoint;						// Get correct endpoint

    for (prop in svc.dataArray) {													// Append allowed data
		if ( objData[svc.dataArray[prop]] !== undefined ) {
			endpoint += objData[svc.dataArray[prop]] + '/';
	
		} else {
			console.log('Missing ' + svc.dataArray[prop] + ' in the objData arg');
		}
	}

    endpoint = endpoint.substr(0, endpoint.length - 1);								// Strip last slash

    return $.ajax({																	// Perform REST call and return promise
        url: endpoint,
        type: 'GET'
    });
};

//
// Helper function to return dots for images
//
mawf.draw_dots = function (tot, sel, element) {

    var dots = '';

    for (i = 1; i <= tot; i++) {
        if (sel == i) {
            dots += '<div class="dot blue"></div>';
        } else {
            dots += '<div class="dot"></div>';
        }
    }
    $(element).html(dots);

};


// Make-a-Wish Global JavaScript Management
$(function () {
    mawf.page_init();
});
  

  
/***********************************
********* WINDOW OPENING ***********
***********************************/

//
// Setup window.open triggers
//
mawf.setup_popup_windows = function () {
	$('.win-popup').click(function () {
		var href = $(this).attr('href');
		window.open(href, '_blank', 'width=600, height=400, resizable=yes');
		return false;
	});
};

// open_win for matching gifts
function open_win(e) {
	var $e = $(e);
	var $input = $e.prev('input');
	var val = $input.val();
	if (val !== '') {
		window.open('http://www.matchinggifts.com/makeawish/giftdb.cfm?eligible=ALL&INPUT_ORGNAME=' + val, "_blank", "height=535,width=720,resizable=yes,scrollbars=yes");
	}
}

function open_airline_miles_form(obj) {
    window.open('airline-miles/airline-miles-form?airline=' + obj, "_self");
}

//helper for youtube videos in iframes so they aren't the highest z-index
	
$('.rich-text iframe[src*="youtube.com"]').each(function () {
	var ifr_source = $(this).attr('src');
	var wmode = "wmode=transparent";
	if (ifr_source.indexOf('?') != -1) $(this).attr('src', ifr_source + '&' + wmode);
	else $(this).attr('src', ifr_source + '?' + wmode);
});


})(jQuery);