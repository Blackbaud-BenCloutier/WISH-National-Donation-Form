  mawfVal = function() {
	var opt = {
		// The form
		formTargetSelector:			'',						// [string: selector] Where to look for your inputs

		// ERROR STYLING ON THE INPUT
		inpErrClass					: 'input-error',
		selectsUseUniform			: true,
		checkboxesUseUniform		: true,
		radiosUseUniform			: true,

		// ERROR STYLING ON THE LABEL
		labelErrClass				: 'label-error',
															// new system - user can explicitly define a label name
															// selector string [labelSelector] and
															// error label iterator, i.e. "2" [labelIterator]
															// iterator will be appended to err class. This allows
															// multiple elements to trigger error styling on the same
															// label but does require that iterated class names be
															// already present in css files, labelSelector and lable
															// iterator will be new properties in the validator objects

		// ERROR MESSAGES NEXT TO THE INPUTS
		errorVisibleClass			: 'errorActive',		// [string] class name that shows/hides error messaging
		errContTag					: 'p',					// [string] tag name - type of tag used by error containers
		errContClass				: 'info form-error',	// [string]	class name that marks an element as an error container
		errContSelector				: '.info.form-error',	// [string]	css selector that selects an element of an error container
		errContLocation				: 'nextSibling',		// [string] prevSibling, nextSibling or selector: script will look
															// adjacent or climb to the selector and then execute a find

		// CHAR LIMIT GLOBAL ERROR MESSAGE
		charLimitErrorMsg			: 'Oops! The personal message can only be %l characters long. Please shorten your message.',
		blockExtraChars				: true,
		showCharLimitErrors			: false,
		testCharLimitEvent			: 'keydown paste',

		// SECTIONS - Messaging on the input's section - sections are parent elements
		sectionSelector				: '',			// container the servers as a section
		sectionSkip					: '.jsNoSection',

		markErrorOnSection			: false,
		markErrorOnPageLoad			: false,
		scrollToFirstErrorOnSubmit	: false,

		sectionErrorMarkTiming		: 'onSubmit',

		markSuccessOnSection		: false,
		markSuccessOnPageLoad		: false,
		markSuccessTo				: [],				// Array of objects {target, style, rel}
		markSuccessToNextSection	: false,			// Style the next section on current section success

		sectionSuccessMarkTiming	: 'realTime',		// [onSubmit] || [realTime]
														// onSubmit generates section error msg on form submit
														// realTime generates section success msg on each blur

		// REQUIRE INPUT CLASS HOOK
		inputIsRequired :			'jsreq',			// [string] class that marks an input as required

		// INTERACTING WITH THE FORM
		generateErrorContainer		: true,				// [bool]	error container is pre-existing or should js create
														// them on the fly
		setErrorOnLabel				: true,				// [bool]	should the error class also be set on the label
		setErrorOnInput				: true,				// [bool]	should the error class also be set on the input
		setErrorOnSection			: false,
		setErrorOnGlobal			: false,

		// VALIDATION TYPE
		validationTiming			: 'onSubmit',		// [onSubmit] || [realTime]
														// Fire validation when user clicks submit button or
														// fire validation when user blurs form field

		clearErrorOn				: 'focus',			// null || [focus]
														// clear an existing error when form is new content is
														// field is blurred (after fixing content) or when user
														// focuses a errored field


		blockFormSubmission			: true,				// [true || [false]
														// Indicates whether the validator will
														// attach to the submit and control the form submission or
														// block form submission or will just return a bool for validity

		asp_checkbox_support		: true				// [true || false]
														// Support for parent span on ASP generated checkboxes														

	};

	mawfVal.customValidateDonationAmount = function(obj, showError) {
		// if ( mawf.CartView.totalDonationMonthly() === 0 && mawf.CartView.totalDonationToday() === 0 ) {
		//	// setError(obj, 'errorEmpty');
		//	return false;
		// } else {
		//	return true;
		// }
		// return true;
		return false; // This is a bit hacky but form validation is handled by both the validater and KO on this element and we don't want this to ever return true (needs attention)
	};

	
	/*   
	customValidateLegacyNamesInput([guide obj], [bool])
	*/
	mawfVal.customValidateLegacyNamesInput = function(iG, showError) {
		if ( iG.$el.is(':focus') ) { // edge case: input has focus and is blurred by click on yes radio
			return true;
		} else if (iG.$el.data('inAsyncDelay')) {
			iG.$el.data('inAsyncDelay', false);
			
			// on blur
				// if empty throw error ( on focus this input will auto check the name radio, so blurring with a blank val will be an error)
			if ( iG.$el.val() === '' && iG.inputs[ iG.index-1 ].$el.is(':checked') ) { // TODO - abstract the logic to jump around the index #ugly
				if ( showError ) { setError(iG, 'errorEmpty'); }
				return false;
			}
			// static validation (isvalid on form)
				// not needed

		} else {
			console.log('setting delay');
			iG.$el.data('inAsyncDelay', true);
			setTimeout(function() { iG.$el.trigger('blur'); }, 300);

		}
		return true;
	};
	
	/*   
	customValidateRIIR([guide obj], [bool])
	Validates a radio - input - [hidden input -] radio pattern with the first radio selection state tying to content in the input; hidden input satisfies the chapter locator 
	*/
	mawfVal.customValidateRIIR = function(iG, showError) {
		var $yesRadio    = $(iG.valTemplate.$valGroup).eq(0),
			$nameInput   = $(iG.inputs[iG.index+1].$el),
			$hiddenInput = $nameInput.siblings('[type=hidden]');

			if ($yesRadio.is(':checked') ) {				// Yes was clicked
				if ( $nameInput.val() === '' )  {				// Focus nameinput if blank ( empty check avoids nameInput focus on form isValid() )
					$nameInput.trigger('focus');
				}

			} else {										// No was clicked
				$nameInput.add($hiddenInput)					// Clear values
					.val('')
					.change();
				clearError($nameInput.data('guide'));			// Clear error

			} 
			return true;
	};

	/*
	customValidateOptionalEmail([guide obj], [bool])
	*/
	mawfVal.customValidateOptionalEmail = function(iG, showError) {
		var $input = iG.$el,
			sValue = $input.val(),
			bIsEmpty = sValue == '';
		if (bIsEmpty) {
			return true;
		}
		else {
			if (sValue.match(/^\S+@{1}\S+\.{1}\S+$/) !== null) {
				return true;
			}
			else {
				if (showError) { setError(iG, 'errorInvalid'); }
				return false;
			}
		}
	};

	/*
	customValidateEmailCompare([guide obj], [bool])
	Custom function that will compare the value of the input to the value of its immediate predecessor in the master guide obj. Used to compare email address for confirm fields. Strips any spaces before comparison
	*/
	mawfVal.customValidateEmailCompare = function(iG, showError) {
		var $input = iG.$el,
			clean1 = $input.val().replace(' ', ''),
			clean2 = iG.inputs[iG.index - 1].$el.val().replace(' ', ''),
			bRequired = iG.valTemplate.conditionalReq === true ? false : iG.valTemplate.required;
		if ( clean1 === '' && bRequired ) {
			//throw empty error
			if (showError) { setError(iG, 'errorEmpty'); }
			return false;

		} else if ( clean1 != clean2 ) {
			if (showError) {
				setError(iG, 'errorInvalid');
			}
			return false;
		}

		clearError(iG);
		return true;
	};

	/*
	customValidateLegacyChapterLocator([guide obj], [bool])
	*/
	mawfVal.customValidateLegacyChapterLocator = function(iG, showError) {
		if (iG.$el.data('inAsyncDelay')) {

            var $input      = iG.$el,
                $container  = $input.closest('.jsGiftInformation'),
                $radio      = $container.find('.js_legacyFor').eq(0),
                bRequired   = $radio.is(':checked'),
                bEmpty      = $input.val() === '';

			$input.data('inAsyncDelay', false);

			clearError(iG);

			if ( bRequired && bEmpty ) {
				//throw empty error
				if (showError) { setError(iG, 'errorEmpty'); }
				return false;
			}

		} else {
			console.log('setting delay');
			iG.$el.data('inAsyncDelay', true);
			setTimeout(function() { iG.$el.trigger('blur'); }, 300);

		}
		return true;

	};
	mawfVal.customValidateCC = function(iG, showError) {
// strip valid trash
		var $input = iG.$el,
			clean = $input.val().replace(/[ \-]/g,'');

// check for 13-16
		if ( clean.match(/^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13})$/) === null ) {
			if (showError) {
				setError(iG, 'errorInvalid');
			}
			return false;
		}
		//$input.val(clean).trigger('change');
		clearError(iG);
		return true;
	};

	mawfVal.customValidateCCExpMonth = function(iG, showError) {
if  ( mawf.bug && mawf.bug.logFormValidation ) { console.log('customValidateCCExpMonth()'); }
		var $input = iG.$el;

		// Left blank
		if ( $input.val() === '' ) {
			if ( showError ) { setError(iG, 'errorEmpty'); }
			return false;

		// Year is empty - can't validate yet
		} else if ( mawf.CartView.x_ccExpYear() === '' ) {
			return true;

		// Year is in past - definite problems
		} else if ( +(mawf.CartView.x_ccExpYear() < mawf.dates.year ) ) {
if ( mawf.bug && mawf.bug.logFormValidation ) {console.log('Month will never validate - year is in the past'); }
			if ( showError ) { setError(iG, 'errorInvalid'); }
			return false;

		// Year input is current year check the month set needs to equal or exceed current month
		} else if ( (+(mawf.CartView.x_ccExpYear()) === mawf.dates.year) && (+$input.val() < mawf.dates.monthNumber) ) {
if ( mawf.bug && mawf.bug.logFormValidation ) {console.log('Month in combination with year is in the past'); }
			if ( showError ) { setError(iG, 'errorInvalid'); }
			return false;

		} else {
			// Clear error on Year 
			clearError(iG.inputs[iG.index + 1 ]);
			return true;
		}
		// needs shared error message?
	};
	mawfVal.customValidateRequiredField = function(iG, showError) {
		if  ( mawf.bug && mawf.bug.logFormValidation ) { console.log('customValidateRequiredField()'); }
		var $input = iG.$el;
		var bHasValue = $input.val() != '';
		if (bHasValue) {
			clearError(iG);
		}
		else {
			if ( showError ) { setError(iG, 'errorEmpty'); }
		}
		return bHasValue;
	};
	mawfVal.customValidateRadioGroup = function(iG, showError) {
		if  ( mawf.bug && mawf.bug.logFormValidation ) { console.log('customValidateRadioGroup()'); }
		var $radio = iG.$el;
		var sName = $radio.attr('name').toString();
		var $radios = $('input[name="' + sName + '"]');
		var bIsChecked = false;
		$radios.each(function() {
			if($(this).is(':checked')) {
				bIsChecked = true;
			}
		});
		if (bIsChecked) {
			clearError(iG);
		}
		else {
			if ( showError ) { setError(iG, 'errorEmpty'); }
		}
		return bIsChecked;
	};

	mawfVal.customValidateNeedsAgeOptIn = function(iG, showError) {
		var inError = false;

		if ( iG.$el.is(':checked') === false ) {			// if the checkbox is check there is no way there can be an error

			$(".js_ageOptIn").find(':input').each(function(){	// avoid uniform class hook duplication
				if ( $(this).is(':checked') ) {
					inError = true;
					return;
				}
			});
				
			if ( inError && showError ) { setError(iG, 'errorInvalid'); }
		}

		return inError === false;
	};

	mawfVal.customValidateAgeVerification = function(iG, showError) { 
		if  ( mawf.bug && mawf.bug.logFormValidation ) { console.log('customValidateAgeVerification()'); }
		var $input = iG.$el;
		var bChecked = $input.is(':checked');
		var $optIn = $('.js_optIn input');
		var bIsValid = true;  // fields are opt-in, so validation is true by default.
		var bIsEmpty = true;
		
		$optIn.each(function() {
			bIsEmpty = !$(this).is(':checked') && bIsEmpty;
		});

		if (!bIsEmpty && !bChecked) {
			bIsValid = false;
			if (showError) {
				setError(iG, 'errorInvalid'); 
			}
		}
		else {
			clearError(iG);
		}
		return bIsValid;
	};
	mawfVal.customValidateOptInRequired = function(iG, showError) {
		if  ( mawf.bug && mawf.bug.logFormValidation ) { console.log('customValidateOptInRequired()'); }
		var $input      = iG.$el;
		var bOptInRequired = false;
		var bOptedIn    = false;
		var $joinMail   = $('.js_joinMailCheckbox input');
		var $joinMobile = $('.js_joinMobileCheckbox input');
		var $optIn      = $('.js_optIn input');
		var $ageCheck   = $('.js_agecheck input');

		window.bShowAgeCheckError = showError;

		if ( $joinMail.is(':checked') === false && $joinMobile.is(':checked') === false ) {
			bOptInRequired = true;
			$optIn.each(function() {
				bOptedIn = $(this).is(':checked') ? true : bOptedIn;
			});
		}

		if ($input.is('.js_optional') || $input.parent('span').is('.js_optional')) {
			bOptInRequired = false;
		}

		clearError(iG);
		if (bOptInRequired && !bOptedIn) {
			if (showError) {
				setError(iG, 'errorEmpty'); 
			}
		}

		if ($ageCheck.size() > 0) {
			setTimeout(function() {
				var iG_age = $('.js_agecheck input').data('guide');
				validateEl(iG_age, window.bShowAgeCheckError);
			}, 100);
			
		}

		var bResult = bOptInRequired ? bOptedIn : true;
		return bResult;
	};

	mawfVal.customValidateAirlineMiles = function(iG, showError) {
if  ( mawf.bug && mawf.bug.logFormValidation ) { console.log('customValidateAirlineMiles()'); }
		var $input = iG.$el;
		var value = $input.val();
		clearError(iG);
		if ( value === '' ) {
			if ( showError ) { setError(iG, 'errorEmpty'); }
			return false;
		}
		else if (!$.isNumeric(value)) {
			if ( showError ) { setError(iG, 'errorInvalid'); }
			return false;
		} else {
			var $program = $('.jsMilesProgram');
			var bIsValid = true;
			switch($program.val()) {
				case 'delta':
					bIsValid = parseInt(value, 10) >= 1000;
					break;
				case 'united':
					bIsValid = parseInt(value, 10) >= 500;
					break;
				case 'us airways':
					bIsValid = parseInt(value, 10) >= 1000;
					break;
				default: break;
			}
			if (!bIsValid && showError) {
				setError(iG, 'errorInvalid');
			}
			return bIsValid;
		}
	};

	mawfVal.customValidateAirMilesExp = function(iG, showError) {
        var $d  = $('.js_airDay'),
            $m  = $('.js_airMonth'),
            $y  = $('.js_airYear'),
            d   = $d.val(),
            m   = $m.val(),
            y   = $y.val(),
            ref,
			userDate,

		pass = function() {
			clearError($d);
			clearError($m);
			clearError($y);
			return true;
		},

		throwError = function() {
			if ( showError ) {
				setError($d, 'errorInvalid');
				setError($m, 'errorInvalid');
				setError($y, 'errorInvalid');
			}
			return false;	
		};

		if ( !y && !m && !d )	{ return pass(); }	// No entry at all							PASS
		if ( !y )				{ return throwError(); }	// Always need year, min input is year		FAIL
		if ( !m && d )			{ return throwError(); }	// Day without a month						FAIL

		ref			= mawf.dates || mawf.initDates();

		if		( y < ref.fullYear )			{ return throwError(); } // if	y fails				-> fail
		else if ( y > ref.fullYear )			{ return pass(); }
		else if ( m && m < ref.monthNumber )	{ return throwError(); } // else if m && m fails	-> fail
		else if ( m > ref.monthNumber )			{ return pass(); }
		else if ( d && d < ref.todayDayNumber ) { return throwError(); } // else if d && d fails	-> fail
		else									{ return pass();		} // else					-> pass

		
	};

	mawfVal.customValidateCCExpYear = function(iG, showError) {
if  ( mawf.bug && mawf.bug.logFormValidation ) { console.log('customValidateCCExpYear()'); }	
		var $input = iG.$el;

		if ( $input.val() === '' ) {
			if ( showError ) { setError(iG, 'errorEmpty'); }
			return false;

		} else if ( mawf.CartView.x_ccExpMonth() === '' ) {
			return true;

		} else if ( $input.val() < mawf.dates.year ) {
if  ( mawf.bug && mawf.bug.logFormValidation ) {console.log('Year selected is in the past'); }
			if ( showError ) { setError(iG, 'errorInvalid'); }
			return false;

		// if year input is this year then this month needs to equal or exceed this month	
		} else if ( (+mawf.CartView.x_ccExpMonth() < mawf.dates.monthNumber) && (+$input.val() === mawf.dates.year) ) {
if  ( mawf.bug && mawf.bug.logFormValidation ) {console.log('Year in combination with month is in the past'); }
			if ( showError ) { setError(iG, 'errorInvalid'); }
			return false;

		} else {
			// Clear month
			clearError(iG.inputs[iG.index - 1 ]);
			return true;			
		}
	};

	mawfVal.customValidateState = function(iG, showError) {
if  ( mawf.bug && mawf.bug.logFormValidation ) {console.log('customValidateState()'); }
		var val          = iG.$el.val().toLowerCase(),
			isNA         = val === 'na',
			isAPO        = $.inArray(val, ['aa','ap','ae']) !== -1,
			isState      = (isNA === false  && isAPO === false),
			countryIsSet = $.inArray(iG.parentSection.inputs[iG.index+2].$el.val().toLowerCase(), ['us','ca']) !== -1;

		if ( isState ) {																				// User picked a state
			if ( countryIsSet === false ) {																	// And country is not US or CA
				if (showError) { setError(iG.parentSection.inputs[iG.index+2], 'errorInvalid'); }			// THROW ERROR
				return false;
			}

		} else if ( isAPO || isNA ) {																	// User picked an APO or Not US or CA
			if ( countryIsSet ) {																			// And country is US or CA
				iG.parentSection.inputs[iG.index+2].$el														// Flip country to Select cta
					.val('')
					.trigger('change');
				clearError(iG.parentSection.inputs[iG.index+1]);											// Clear any zip error - not validated for non us and canada
				return false;
			}
		}
																										// Valid
		clearError(iG);																						// Clear error
		return true;	

	};
	mawfVal.customValudateConditionalRequirement = function(iG, showError) {
		if  ( mawf.bug && mawf.bug.logFormValidation ) {console.log('customValudateConditionalRequirement()'); }
		var $input = iG.$el;
		var bIsRequired = false;
		var bIsValid = true;
		var $target = $(iG.valTemplate.targetSelector);
		var sTargetTagType = 'text';
		var sVal = $target.val();

		sTargetTagType = $target.is('select') ? 'select' : sTargetTagType;
		sTargetTagType = $target.is('textarea') ? 'textarea' : sTargetTagType;
		sTargetTagType = $target.is('type["radio"]') ? 'radio' : sTargetTagType;
		sTargetTagType = $target.is('type["checkbox"]') ? 'checkbox' : sTargetTagType;

		switch (sTargetTagType) {
			case 'text' :
			case 'textarea' :
			case 'select' :
				bIsRequired = sVal != '';
				break;
			case 'radio' :
			case 'checkbox' :
				bIsRequired = $target.is(':checked');
				break;
			default: break;
		}

		if (bIsRequired) {
			bIsValid = ($input.val() !== '');
		}

		clearError(iG);
		if (!bIsValid) {
			if (showError) { setError(iG, 'errorEmpty'); }
		}

		return bIsValid;
	};

	mawfVal.customValidateZip = function(iG, showError) {
		if  ( mawf.bug && mawf.bug.logFormValidation ) { console.log('customValidateZip()'); }
		var val = iG.$el.val().replace(/[ \-]/g, ''),
			bRequired,
			countryIsSet = $.inArray(iG.parentSection.inputs[iG.index + 1].$el.val().toLowerCase(), ['us', 'ca']) !== -1;

		var bIsValid = (val.match(/(^\d{5}(\d{4})?$)|(^[ABCEGHJKLMNPRSTVXY]{1}\d{1}[A-Z]{1} *\d{1}[A-Z]{1}\d{1}$)/i) !== null);
		var bIsEmpty = val === '';

		// bRequired = countryIsSet ? true : iG.$el.hasClass('js_optional') !== true;
		bRequired = countryIsSet;

		if ( bRequired === false ) { // required here means Required and format validated because US or CA
			clearError(iG);
			return true;
		}

		clearError(iG);
		if (bRequired && bIsEmpty) {
			if (showError) { setError(iG, 'errorEmpty'); }
		}
		else if (!bIsValid) {
			if (showError) { setError(iG, 'errorInvalid'); }
		}

		return bIsValid;

	};

// Double check zip and postal code on country change
	mawfVal.customValidateCountryRelativeInputs = function(iG, showError) {
if  ( mawf.bug && mawf.bug.logFormValidation ) {console.log('Country val trig'); }

	var countryIsUS_CA = $.inArray(iG.$el.val().toLowerCase(), ['us','ca']) >= 0,
		state = iG.parentSection.inputs[iG.index-2].$el.val().toLowerCase();
		
		if ( countryIsUS_CA && showError ) {														// Country set to US or CA
			
			validateEl(iG.parentSection.inputs[iG.index-1], true);										// Zip - trigger validate 
																										// State - if empty, na, or apo throw error
			if ( state === '' || state  === 'na' || $.inArray(state, ['aa','ap','ae']) >= 0 ) {
				setError(iG.parentSection.inputs[iG.index-2], 'errorInvalid');
			}


		} else if ( countryIsUS_CA === false  && showError ) {										// Country set to other than US/CA -> if  state is not NA throw errors
			
			clearError(iG.parentSection.inputs[iG.index-1]);											// Clear zip error - zip not validated for non-US/CA

			if ( state !== 'na' && $.inArray(state, ['aa','ap','ae']) === -1  ) {						// If state not NA or an apo, flip to NA
				iG.parentSection.inputs[iG.index-2].$el.val('NA').trigger('change');
			}
			clearError(iG.parentSection.inputs[iG.index-2]);											// Clear a possible pre-exising  state error msg
			
		}

		return true;
	};


// customValidateChapterLocator()
// This validator checks the hidden id input paired with the name input. Even if the name input has content, if the id input is blank then we are invalid.
	mawfVal.customValidateChapterLocator = function(iG, showError) {
		var $idInput = iG.$el.closest('.chapter-search').find('input').find(':hidden');
		if ( $idInput.val() === '' ) {
			if ( showError ) { setError(iG, 'errorInvalid'); }
			return false;
		}
		return true;
	};

	mawfVal.customValidateSITReq = function(iG, showError) {
		if ( $('#body_2_content_0_inSubscribe').is(':checked') || $('#body_2_content_0_inchapter').is(':checked') ) {
			return true;

		} else {
			if (showError) { setError(iG, 'errorInvalid'); }
			return false;
		}
	};

/*	## SAMPLE GUIDE OBJECT w/ example data
	'js_phone' : {											// Class hook (required) - hooks input to guide

		'validator'			: /^[0-9\.\(\)\-]*$/,			// [regex|strFuncName] (opt) Regex will return a match
															// and a function will handle validation, messaging and
															// return a bool for valid/invalid

		'validatorTrigger'	: 'keyup'						// Validator timing can be overridden
															// on a input element instance level

		'required'			: false,						// [BOOL] (req) Is the element required

		'conditionalReq'	: true,							// [BOOL] (opt) Is the element required sometimes perhaps
															// defined by the setting of other inputs in the form,
															// or other external conditions? Set conditionalReq to true
															// and the input will always be sent to the custom
															// validator (As long as the element is visible) and we will
															// expect the custom validator to handle deciding
															// if the input is required and if it is in error

		'element'			: undefined,					// [$obj] (gen) Input element

		'label'				: undefined,					// [$obj] (gen) Input's label

		'pseudoSubmitSel'	: selector						// [$ selector string] For anchors with asp doPostBack submission
															// js inline in the href specify the submit button here and a
															// listener will catch the click, validate the form and control 
															// submission
															// ex: $('.myForm').find('a[href^="javascript:__doPostBack"]')

		'section'			: undefined,					// [$obj] (gen) Input's section (if used)

		'errorEmpty'		: 'Oops! Phone is required.',	// [string] (optional) Error message for this type of
															//	input, when required aError message used

		'errorInvalid'		: 'Oops! Phone number invalid'	// [string] (optional) Error message used if
															// input fails validation

		'sharedMessenger'	: 'nextSibling'					// ['prevSibling' | 'nextSibling'] optional - for elements that,
															// because of layout have to share one error messenger

		'messengerIterator'	: '1'							// [int as string] - will append the string supplied to the 
															// error class on the messenger, used with staticMessengerSel to
															// allow mutliple inputs to control the same messenger															

		'staticMessengerSel': '#someErrorContainer'			// ['#someMsgEl'] optional jquery selector string, used to 
															// target a error messenger that is pre-existing 

															// need to share the same error messenger, logic will use 
															// the next/prev input in the inputs array to pass to 
															// getMessenger() - this is a pretty rough at this point
															// and a bit brittle

		'messengerPosition'	: 'nextSibling'					// ['prevSibling'|'nextSibling' | 'afterLabel'] optional
															// for elements using
															// a layout where positioning a messenger directly after an 
															// input in the dom is not acceptable (i.e. two inputs floated
															//  side by side),

		'labelSearchType'	: 'section',					// str [section | explicit | jquery func name] Needed for shared
															// lables only, reguar labels will be found automatically via 
															// name attr matching and then closest('label') and will only be 
															// generated and added to the template at the time of an error. 
															// Shared labels use 'section' here and labelSelector set to a 
															// jquery selector.	ONLY SECTION IMPLEMENTED AT THIS TIME
															// fully implemented at this point

		labelSelector		: '[name='']',					// str [jquery selector] Allows direct specification of label
															// rather than auto find. 

															// Note: using a labelSelector and a
															// labelIterator at the same time can address instances where one 
															// label is "shared" between multiple inputs. Each inputs 
															// validation will add/remove its own error class on the label.

		labelIterator		: ''							// str [any] (ex. one label references two inputs - first/last
															// name)
	}
*/

	var	template = {
		'js_mname' : {
			required			: false,
			errorEmpty			: 'Oops! Please enter a wedding couple name.'
		},
		'js_name' : {
			required			: true,
			errorEmpty			: 'Oops! Please enter a name.',
			errorCharLimit		: 'Oops! The name field cannot contain more than %l characters. Please reduce it.',
			messengerContSelector : '.jsNameErrorContainer'
		},
		'js_site' : {
			required			: true,
			errorEmpty			: 'Oops! Please enter a url.',
			messengerContSelector : '.jsSiteErrorContainer'
		},
		'js_fname' : {
			required			: false,
			errorEmpty			: 'Oops! Please enter a first name.',
			labelSearchType		: 'section',
			labelSelector		: '[for="fname1"]',
			labelIterator		: ''
		},
		'js_fname_dependency' : {
			validator			: '',
			required			: false,
			conditionalReq		: true,
			errorEmpty			: 'Oops! Please enter a first name.'
		},
		'js_lname' : {
			required			: false,
			errorEmpty			: 'Oops! Please enter a last name.',
			labelSearchType		: 'section',
			labelSelector		: '[for="body_2_content_0_maincontent_0_fName1"]',
			labelIterator		: '1'
		},
		'js_fname1' : {
			required			: false,
			errorEmpty			: 'Oops! Please enter a first name.',
			labelSearchType		: 'section',
			labelSelector		: '[for="body_2_content_0_maincontent_0_fName1"]',
			labelIterator		: ''
		},
		'js_lname1' : {
			required			: false,
			errorEmpty			: 'Oops! Please enter a last name.',
			labelSearchType		: 'section',
			labelSelector		: '[for="body_2_content_0_maincontent_0_fName1"]',
			labelIterator		: '1'
		},
		'js_fname-legacy-radios' : {
			validator			: 'customValidateRIIR',
			required			: false,
			errorEmpty			: 'Oops! Please select an option.'
		},
		'js_fname-legacy-input' : {
			validator			: 'customValidateLegacyNamesInput',
			required			: false,
			conditionalReq		: true,
			errorEmpty			: 'Oops! Please enter a first name.'
		},
		'js_fname-pers' : {
			required			: false,
			errorEmpty			: 'Oops! First name is required.',
			labelSearchType		: 'section',
			labelSelector		: '[for="MemorialFirst_X"]',
			labelIterator		: ''
		},
		'js_lname-pers' : {
			required			: false,
			errorEmpty			: 'Oops! Last name is required.',
			labelSearchType		: 'section',
			labelSelector		: '[for="MemorialFirst_X"]',
			labelIterator		: '1'
		},
		'js_fname-pers2' : {
			required			: false,
			errorEmpty			: 'Oops! First name is required.',
			labelSearchType		: 'section',
			labelSelector		: '[for="MHFirst_X"]',
			labelIterator		: ''
		},
		'js_lname-pers2' : {
			required			: false,
			errorEmpty			: 'Oops! Last name is required.',
			labelSearchType		: 'section',
			labelSelector		: '[for="MHFirst_X"]',
			labelIterator		: '1'
		},
		'js_address' : {
			required			: false,
			errorEmpty			: 'Oops! Please enter a valid address.'
		},
		'js_city' : {
			required			: false,
			errorEmpty			: 'Oops! Please enter a city.'
		},
		'js_state' : {
			validator			: 'customValidateState',
			required			: false,
			errorEmpty			: 'Oops! Please enter a state.',
			errorInvalid		: 'Oops! State is not appropriate for your country choice.'
		},
		'js_stateonly' : {
			required			: true,
			errorEmpty			: 'Oops! Please enter a state.'
		},
		'js_ifMailCheckbox' : {
			validator			: 'customValudateConditionalRequirement',
			targetSelector		: '.js_joinMailCheckbox input',
			required			: false, // Field has conditional requirement being determined in the custom validator
			conditionalReq		: true,
			errorEmpty			: 'Oops! This field is now required.'
		},
		'js_zip' : {
			validator			: 'customValidateZip',
			required			: false, // Field has conditional requirement being determined in the custom validator
			conditionalReq		: true,
			errorEmpty			: 'Oops! Please enter a postal code.',
			errorInvalid		: 'Oops! Please enter a valid postal code.'
		},
		'js_isZip' : {
			validator			: 'customValidateZip',
			required			: false,
			optional			: true,
			standAlone			: true,
			errorInvalid		: 'Oops! Please enter a valid postal code.'
		},
		'js_ziponly' : {
			validator			: /(^\d{5}(\d{4})?$)|(^[ABCEGHJKLMNPRSTVXY]{1}\d{1}[A-Z]{1} *\d{1}[A-Z]{1}\d{1}$)/i,
			validatorTrigger	: 'blur',
			required			: true,
			errorEmpty			: 'Oops! Please enter a postal code.',
			errorInvalid		: 'Oops! Please enter a valid postal code.'
		},
		'js_legacyFor': {
			validator			: 'customValidateRIIR',
			required			: false,
			errorEmpty			: 'Oops! Please select one.'
		},
		'js_country' : {
			validator			: 'customValidateCountryRelativeInputs',
			required			: false,
			errorEmpty			: 'Oops! Please select a country.',
			errorInvalid		: 'Oops! Country is not appropriate for your selected state.'
		},
		'js_phone' : {
			validator			: /^[0-9\.\(\)\- ]*$/,
			required			: false,
			errorEmpty			: 'Oops! Please enter a valid phone number.',
			errorInvalid		: 'Oops! Please enter a valid phone number.'
		},
		'js_quesCom' : {
			required			: false,
			errorEmpty			: 'Oops! Please enter a question or comment.'
		},
		'js_relationship' : {
			required			: true,
			validatorTrigger	: 'click',
			errorEmpty			: 'Oops! Please select your relationship.',
			messengerContSelector : '.radio-input-error.error-relationship'
		},
		'js_wishtitle'			: {
			errorEmpty			: 'Oops! Please include a headline.'
		},
		'js_wishstory'			: {
			errorEmpty			: 'Oops! Please include body text to explain how the story impacted yourself or others.',
			errorCharLimit		: 'Oops! Your wish story is limited to a maximum of %l characters.'
		},
		'js_position' : {
			errorEmpty			: 'Oops! Please select your position.'
		}, 
		'js_org' : {
			validator			: 'customValidateRequiredField',
			required			: true,
			errorEmpty			: 'Oops! Please enter a company name.'
		},
		'js_companydesc' : {
			errorEmpty			: 'Oops! Please select a company description.'
		},
		'js_size' : {
			errorEmpty			: 'Oops! Please select a company size.'
		},
		'js_companyGiving' : {
			validator			: 'customValidateRadioGroup',
			required			: true,
			errorEmpty			: 'Oops! Please indicate either yes or no.'
		},
		'js_msg1' : {
			validator			: /^.{0,53}$/,
			validatorTrigger	: 'keyup',
			required			: false,
			errorInvalid		: 'Oops! This message is longer than 53 characters.'
		},
		'js_text1' : {
			validator			: /^.{0,370}$/,
			validatorTrigger	: 'keyup',
			required			: false,
			errorInvalid		: 'Oops! The personal message can only be 370 characters long. Please shorten your message.'
		},
		'js_picture' : {
			validator			: /(\.jpg|\.png|\.bmp|\.jpeg)$/i,
			required			: false,
			errorEmpty			: 'Oops! Please submit a picture.',
			errorInvalid		: 'Oops! Please select an image file.'
		},
		'js_email' : {
			validator			: /^\S+@{1}\S+\.{1}\S+$/,
			required			: false,
			errorEmpty			: 'Oops! Please enter a valid email address.',
			errorInvalid		: 'Oops! Please enter a valid email address.',
			messengerContSelector : '.jsEmailErrorContainer'
		},
		'js_emailOptional' : {
			validator			: 'customValidateOptionalEmail',
			required			: false,
			conditionalReq		: true,
			errorInvalid		: 'Oops! Please enter a valid email address.'
		},
		'js_emailCompare' : {
			validator			: 'customValidateEmailCompare',
			required			: false,
			errorEmpty			: 'Oops! Please enter an email address that matches the above email address.',
			errorInvalid		: 'Oops! Please enter an email address that matches the above email address.',
			messengerContSelector : '.jsEmailCompareErrorContainer'
		},
		'js_emailOptionalCompare' : {
			validator			: 'customValidateEmailCompare',
			required			: false,
			conditionalReq		: true,
			errorEmpty			: 'Oops! Please enter an email address that matches the above email address.',
			errorInvalid		: 'Oops! Please enter an email address that matches the above email address.'
		},
		'js_donationAmount' : {
			validator			: 'customValidateDonationAmount',
			required			: false,
			errorEmpty			: 'Oops! Please enter a donation amount.'
		},
		'js_donationDest' : {
			//validator			: 'customValidateChapterLocator',
			required			: true,
			errorEmpty			: 'Oops! Please enter a donation destination.',
			errorInvalid		: 'No matching results found!'
		},
		'js_donationDest-legacy' : {
			validator			: 'customValidateLegacyChapterLocator',
			required			: false,
			conditionalReq		: true,
			errorEmpty			: 'Oops! Please enter a donation destination.',
			errorInvalid		: 'No matching results found!'
		},
		'js_genericChapLoc' : {
            required			: true,
            errorEmpty			: 'Oops! Please select a valid chapter.',
            errorInvalid		: 'No matching results found!'
		},
		'js_url' : {
			validator			: /(http:\/\/|https:\/\/)?[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/,
			required			: false,
			errorEmpty			: 'Oops! Please enter a URL.',
			errorInvalid		: 'Oops! Please enter a valid URL.'
		},
		'js_selectreq'          : {
			required            : true,
			errorEmpty          : 'Oops! Please select one.'
		},
		'js_milesacct' : {
			required			: true,
			errorEmpty			: 'Oops! Please enter your airline account digits.'
		},
		'js_ccFName' : {
			required			: true,
			errorEmpty			: 'Oops! Card holder&rsquo;s name is required.'
		},
		'js_ccNumber' : { // validates correct number of digits for visa, mc, amex and discover
			//validator			: /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13})$/,
			validator			: 'customValidateCC',
			required			: false,
			errorEmpty			: 'Oops! Please enter a valid credit card number.',
			errorInvalid		: 'Oops! Please enter a valid credit card number.'
		},
		'js_ccSecNumber' : { // validates correct number of digits for visa, mc, amex and discover
			validator			: /^[0-9]{3,4}$/,
			required			: true,
			errorEmpty			: 'Oops! Please enter a valid security number.',
			errorInvalid		: 'Oops! Please enter a valid security number.'
		},
		'js_ccExpMonth' : {
			validator			: 'customValidateCCExpMonth',
			required			: true,
			errorEmpty			: 'Oops! Please select a valid expiration month.',
			errorInvalid		: 'Oops! Please select a valid expiration month.',
			messengerPosition	: 'nextSibling',
			staticMessengerSel	: '#expMonthErr'
		},
		'js_ccExpYear' : {
			validator			: 'customValidateCCExpYear',
			required			: true,
			errorEmpty			: 'Oops! Please select a valid expiration year.',
			errorInvalid		: 'Oops! Please select a valid expiration year.',
			labelSearchType		: 'section',
			labelSelector		: '[for="ccExpMonth"]',
			labelIterator		: '1',
			staticMessengerSel	: '#expYearErr'
		},
		'js_milesdonate' : {
			validator			: 'customValidateAirlineMiles',
			required			: true,
			errorEmpty			: 'Oops! Please enter a valid number of miles.',
			errorInvalid		: 'Oops! Please enter a valid number of miles.',
			labelSelector		: '[for="milesDonate"]'
		},
		'js_topQuestion' : {
			required			: true,
			validatorTrigger	: 'click',
			errorEmpty			: 'Oops! Please select an area of interest.',
			messengerContSelector : '.error-container.top-question'
		},
		'js_agecheck'			: {
			validator			: 'customValidateAgeVerification',
			validatorTrigger	: 'click',
			required			: false,
			conditionalReq		: true,
			messengerPosition	: 'appendToLabel',
			errorInvalid		: 'Oops! You must be at least 13 years old to receive newsletters.'
		},
		'js_ageChecker'			: {
			validator			: 'customValidateNeedsAgeOptIn',
			validatorTrigger	: '', // no trigger except during submit attempt
			required			: false,
			conditionalReq		: true,
			messengerPosition	: 'appendToLabel',
			errorInvalid		: 'Oops! You must be at least 13 years old to receive newsletters.'
		},
		'js_storyAgeCheck' : {
			errorEmpty: 'Oops! If you are under 13 years of age, please ask your parent or guardian to share your story with us.',
			messengerPosition   : 'afterLabel',
			validatorTrigger    : 'click'
		},
		// 'js_optIn': {
		//	validator			: 'customValidateOptInRequired',
		//	validatorTrigger	: 'click',
		//	required			: false, // Field has conditional requirement being determined in the custom validator
		//	conditionalReq		: true,
		//	messengerPosition	: 'appendToLabel',
		//	messengerContSelector : '.error-container.newsletter-options',
		//	errorEmpty			: 'Oops! Please select which newsletters you with to receive.'
		// },
		'js_radio-generic' : {
			errorEmpty			: 'Oops! Please select at least one option.'
		},
		'js_limitCharCount' : {
			errorCharLimit		: 'Oops! The personal message can only be %l characters long. Please shorten your message.'
		},
		'js_airDay' : {
			validator				: 'customValidateAirMilesExp',
            conditionalReq          : true,
            errorInvalid            : 'Oops! Please select a valid date.',
            staticMessengerSel : '#airDateErrMsg',
            messengerIterator		: '1',
            labelSelector			: 'label[for=body_2_content_0_maincontent_0_milesExpYr]',
            labelIterator			: '1'
		},
		'js_airMonth' : {
			validator				: 'customValidateAirMilesExp',
            conditionalReq          : true,
            errorInvalid            : 'Oops! Please select a valid date.',
            staticMessengerSel : '#airDateErrMsg',
            messengerIterator		: '2',
            labelSelector			: 'label[for=body_2_content_0_maincontent_0_milesExpYr]',
            labelIterator			: '2'

		},
		'js_airYear' : {
			validator				: 'customValidateAirMilesExp',
            conditionalReq          : true,
            errorInvalid            : 'Oops! Please select a valid date.',
            staticMessengerSel		: '#airDateErrMsg',
            messengerIterator		: '3',
            labelSelector			: 'label[for=body_2_content_0_maincontent_0_milesExpYr]',
            labelIterator			: '3'

		},
		'js_SITReq' : {
            validator				: 'customValidateSITReq',
            validatorTrigger	: 'click',
            conditionalReq			: true,
            errorInvalid			: 'Oops! Please select at least one.',
            setErrorOnLabel			: false,
            staticMessengerSel		: '#SITReqErrMsg'
		}
	},
	guide = [],
	formIsValid = true;

// Build custom form object
	/*
	categorize()
	Takes a form element and categorizes it according to master guide, attaches the new sub guide to the new custom master guide and to the input itself,
	*/
	categorize = function($el, sG, valType) {

		var prop,
			curGuide = {};												// on the master guide on the form object
			

		for ( prop in template[valType] ) {								// Copy validation template over
			curGuide[prop]	= template[valType][prop];
		}

		curGuide.required       = $el.hasClass(opt.inputIsRequired);	// Check if required
		curGuide.conditionalReq = template[valType].conditionalReq;

																		// ADD LABEL
		if (curGuide.labelSearchType !== undefined) {					// Set shared labels
			switch ( curGuide.labelSearchType ) {
				case 'section' :
					curGuide.label	= sG.$el.find(curGuide.labelSelector);
					break;
				case 'explicit' :										// Reserved for a more specific search implementation
					
					break;
				default :
					curGuide.label	= $el[curGuide.labelSearchType](curGuide.labelSelector);
			}

		} else {														// Normal label
			curGuide.label = curGuide.labelSelector ? $(curGuide.labelSelector) : getLabel($el);
		}
																		// UNIFORM ELEMENTS
		if ( $el.is('select') && opt.selectsUseUniform ) {				// Uniform select
			curGuide.tagType		= 'select';
			curGuide.styleUniform	= opt.selectsUseUniform;
			curGuide.uniEls			= $el.parents('.selector').add($el.prev('span'));

																		// Uniform checkbox
		} else if ( $el.is('[type="checkbox"]') && opt.checkboxesUseUniform ) {
			curGuide.tagType		= 'checkbox';
			curGuide.styleUniform	= opt.checkboxesUseUniform;
			curGuide.uniEls			= $el.parents('.check').add($el.prev('span'));

																		// Uniform radio groups
		} else if ( $el.is('[type="radio"]') && opt.radiosUseUniform ) {
			curGuide.tagType = 'radio';
			curGuide.$valGroup = $('[name="' + $el.attr('name') + '"]');
			if ( opt.radiosUseUniform && !$el.is('.jsSkipUniform') ) {
				curGuide.styleUniform	= opt.radiosUseUniform ;
				curGuide.uniEls			= curGuide.$valGroup.closest('label');
			}
		}

																		// INDIVIDUAL/CUSTOM VALIDATION TIMING
		if (curGuide.validatorTrigger) {
			$el = curGuide.$valGroup === undefined ? $el : curGuide.$valGroup;
			$el.on(curGuide.validatorTrigger, function() {
				var iG = $(this).data('guide');
				if ( validateEl( iG, true ) && iG.isValid === true ) {
					clearError(iG);
				}
			});
		}

		return curGuide;
	};

	// getUniErrorStylers() [input guide]
	// sets the correct elements to style for a uniform input
	getUniErrorStylers = function(iG) {
		if ( iG.valTemplate.tagType == 'select' ) {			// Uniform selects
			iG.valTemplate.uniEls = iG.$el.closest('.selector');

	} else if ( iG.valTemplate.tagType == 'radio' ) {		// Uniform radios group (label wrapped)
			iG.valTemplate.uniEls = iG.valTemplate.$valGroup.closest('.radio');

		}
	};

	// uniInputInUse()
	// returns bool if appropriated parent is hidden
	uniInputInUse = function($input) {
		// Test selects
		if ( $input.is('select') ) {
			if  ($input.parent().is(':hidden')) { return false;}

		// Test radios and checkboxes
		} else {
			if ($input.parent().parent().is(':hidden')) { return false;}
		}
		return true;
	};

	isUpdate = function($input) {
		if ( $input.hasClass(opt.required) ) { return true; }

		var jsClass;

		for (jsClass in template) {
			if ( $input.hasClass(jsClass) ) { return true; }
		}
		return false;
	};

	cleanInputValue = function(iG) {
		var template = iG.valTemplate;

		if ( template.tagType == 'radio' ) {
			return template.$valGroup.filter(':checked').val() || '';

		} else if ( template.tagType == 'checkbox' ) { 
			return iG.$el.is(':checked') ? 'isChecked' : '';

		} else {
			return iG.$el.val().replace(/^\s+|\s+$/g,'');
		}
	};

	/*
	validateForm() - loop the custom form guide, evaluate the elements for validity, and populate messages for invalid elements
	*/
	validateForm = function($target, produceErrorMsg) {  // This will need reworking to exist with new data model
if  ( mawf.bug && mawf.bug.logFormValidation ) {console.log( 'validateForm called on ' + mawf.bug.show($target), ($target) ); }
		var i, ii, sections = $target.data('sections');
		produceErrorMsg = produceErrorMsg || false;

		for ( i in sections) { // loop form's sections' guides
			for ( ii in sections[i].inputs ) { // loop  sections' inputs' guides
				if ( validateEl(sections[i].inputs[ii], produceErrorMsg) === false ) {
if  ( mawf.bug && mawf.bug.logFormValidation ) {console.log('Element found to be invalid - form invalid'); }
					return false;
				}
			}
		}
		return true;
	};

	validateUpstream = function(args) {
if  ( mawf.bug && mawf.bug.logFormValidation ) {console.log('Validate upstream called on ', args.$form); }
		var i, ii, inputs, firstErrorInput, passedValidation = true, $form = args.$form, self = args.context, sections = args.$form.data('sections');
		
		scrollToFirstError = args.scrollToFirstError || self.opt.scrollToFirstErrorOnSubmit;				// Default scrollToFirstError

		for ( i in sections) {											// Loop each section
			inputs = sections[i].inputs;								// Get inputs

			for ( ii in inputs ) {										// Loop inputs
				if ( validateEl(inputs[ii], true) === false ) {				// Validates?
					passedValidation = false;								// Flag fail
					if ( scrollToFirstError && firstErrorInput === undefined ) {
						firstErrorInput = inputs[ii].$el;						// Record first invalid input
						if  ( mawf.bug && mawf.bug.logFormValidation ) {console.log('Set firstErrorInput', firstErrorInput); }
					}
				}
			}
		}
		if (!passedValidation && scrollToFirstError ) {
			$.scrollTo(firstErrorInput, 800, {offset: -200});			// Scroll to first error
			if ( args.addFocusToErrorSection ) {
				try {
					mawf.clearFocusState();
					mawf.addFocusState(firstErrorInput.data('guide').parentSection.index);
				} catch (e) {}
			}
		}
		return passedValidation;
	};

	//
	// validateEl(inputGuide, bool) - Validates and error styles an individual element
	//
	validateEl = function(inputGuide, produceErrorMsg) {
if  ( mawf.bug && mawf.bug.logFormValidation ) {console.log('------------------------------------- \nValidating '+inputGuide.$el[0].tagName+'['+inputGuide.$el.attr('class')+']',inputGuide.$el[0]); }

		var fn, fn2,
			iG		= inputGuide,
			$input	= inputGuide.$el,
			fG		= inputGuide.valTemplate,
			clean	= cleanInputValue(iG);

			// If there is a charcount error in play then we shortcircuit the error check, once this is corrected then we can go ahead and do further evaluation but the user will have to
			// refocus the input (need focus clear block in place as well), correct the count, and then blur again and we will eval. the only reason this all works is because standard validation works on 
			// blur and char count validation works on keydown

			if ( iG.charCountIsValid === false ) {
if  ( mawf.bug && mawf.bug.logFormValidation ) {console.log( 'Failed - char count error flag is set'); }
				return false;
			}
																										// Ignore hidden inputs
		if ( ( iG.valTemplate.uniEls !== undefined && uniInputInUse($input) === false ) ||					// uni radios
			( $input.is(':hidden') && iG.valTemplate.uniEls === undefined ) ) {								// non uni hidden inputs
if  ( mawf.bug && mawf.bug.logFormValidation ) {console.log('- Shorted - input hidden'); }
			clearError(iG);																					// Possible that an input was revealed, errored, and hidden again
			iG.isValid = true;
if  ( mawf.bug && mawf.bug.logFormValidation ) {console.log('-------------------------------------'); }
			return true;
								
		} else if ( fG.conditionalReq !== true && fG.required && clean === '' ) {						// EMPTY & REQUIRED validation
if  ( mawf.bug && mawf.bug.logFormValidation ) {console.warn('- Failed: required'); }
			if ( ! produceErrorMsg ) { return false; }
			setError(iG, 'errorEmpty');
if  ( mawf.bug && mawf.bug.logFormValidation ) {console.log('-------------------------------------'); }
			return false;

		} else if ( typeof(fG.validator) === 'object' && clean.match(fG.validator) === null ) {			// REGEX validation
if  ( mawf.bug && mawf.bug.logFormValidation ) {console.warn('- Failed; regex'); }
			if ( ! produceErrorMsg ) { return false; }
			setError(iG, 'errorInvalid');
if  ( mawf.bug && mawf.bug.logFormValidation ) {console.log('-------------------------------------'); }
			return false;

		} else if ( (fn = window.mawfVal[fG.validator]) && typeof(fn) == 'function') {					// CUSTOM FUNCTION validation{
if  ( mawf.bug && mawf.bug.logFormValidation ) { console.log('Validating via custom validator: '+fG.validator+'()'); }
			if (!fn(inputGuide, produceErrorMsg)) {
				if  ( mawf.bug && mawf.bug.logFormValidation ) {
					console.warn('- Failed: custom val (' + fG.validator + ')');
					console.log('-------------------------------------');
				}
				return false;
			}
			else if ( (fn2 = window.mawfVal[fG.chainedValidator]) && typeof(fn2) == 'function' && !fn2(inputGuide, produceErrorMsg) ) {
				console.warn('- Failed: chained val (' + fG.chainedValidator + ')');
				console.log('-------------------------------------');
				return false;
			}
		} 

	if  ( mawf.bug && mawf.bug.logFormValidation ) {console.log('- Passed'); }

		//if ( fG.isValid !== undefined && ! fG.isValid ) {	// Test for previous error state and remove
		if ( iG.isValid !== undefined && ! iG.isValid ) {	// Test for previous error state and remove
			if  ( mawf.bug && mawf.bug.logFormValidation ) {console.warn('- Clearing error messaging'); }
			clearError(iG);
		}

		iG.isValid = true;
		if  ( mawf.bug && mawf.bug.logFormValidation ) {console.log('-------------------------------------'); }
		
		return true;
	};


	/*
	validateSection() - loops every input in a section, takes an option for producing 
	error messaging and returns a bool for sections overall validity
	*/
	validateSection = function(sectionGuide, produceErrorMsg) {
if  ( mawf.bug && mawf.bug.logFormValidation ) {console.log('\n-------------------------------------\n### START Validating Section '+sectionGuide.index+' ###########################\n'); }
		var i,
			sG = sectionGuide,
			sectionStatus = true,										// Flag
			sectionInputs = sG.inputs;									// Section's inputs

		for ( i = 0;  sectionInputs[i]; i++ ) {							// Validate every input in section
			if ( validateEl(sectionInputs[i], produceErrorMsg) === false ) {
				sectionStatus = false;
				if ( produceErrorMsg === false ) { 
					break;
				}
// if  ( mawf.bug && mawf.bug.logFormValidation ) {console.log('---------------------------------'); }
			}
		}
if  ( mawf.bug && mawf.bug.logFormValidation ) {console.log('\n### END Validating Section '+sectionGuide.index+' : '+ (sectionStatus ? 'Passed' : 'Failed') + ' ###################\n-------------------------------------\n'); }
		sG.isValid = sectionStatus;
		return sectionStatus;											// Return bool
	};

	// isInvalidSection()
	// takes a form obj and a section indicator (int)
	// returns a bool
	isValidSection = function($form, intSection) {
		return $form.data('sections')[intSection].isValid;
	};

	markSection = function(sectionGuide, condition, mark) {
if  ( mawf.bug && mawf.bug.logFormValidation ) {console.log('Marking section '+sectionGuide.index+' '+condition+' is '+mark); }
		var stylers, i, l, sG = sectionGuide;
		switch (condition) {
			case 'success' :
				stylers = sG.successStylers;
				break;

			case 'error' :
				stylers = sG.errorStylers;
				break;

			case 'next' :
				if ( sG.index == sG.allSections.length - 1) { return; } // last section, no next - break out
				stylers = sG.nextStylers;
		}

		i = stylers.length;

		if (mark === true) {
			while ( i-- ) {
				if ( stylers[i].unique ) { // Only one section can be styled with this at a time; remove styling on others
if  ( mawf.bug && mawf.bug.logFormValidation ) {console.log('Found unique'); }
					var sL = sG.allSections.length;
					while ( sL-- ) {
						markSection(sG.allSections[sL], condition, false);
					}
				}
				stylers[i].target.addClass( stylers[i].style );
			}

		} else if (mark === false) {
			while ( i-- ) {
				stylers[i].target.removeClass( stylers[i].style );
			}
		}
	};


	/*
	setError() - Takes the custom formGuide or an input with a form guid and a string indicating the type of error (input is empty or invalid)
	*/
	setError = function(iG, errType, strCustomMsg) {
		if  ( mawf.bug && mawf.bug.logFormValidation ) {
			console.log('setError() called with ' + errType + ' on ', mawf.bug.show(iG.$el));
		}

		iG = iG.$el ? iG : $(iG).data('guide');				// Accomodate a jquery object or even raw dom el as well as a guide

		var $msg,
            $label      = iG.valTemplate.label || getLabel(iG.$el),
            styleUni    = false;

		// Uniform library styling
		if ( iG.valTemplate.uniEls !== undefined ) {		// This is a uniform el
			if ( iG.valTemplate.uniEls.size() === 0 ) {		// Uni stylers are not set yet
				getUniErrorStylers(iG);
			}
			styleUni = true;
		}

		// Input styling
		if ( opt.setErrorOnInput ) {
			if ( styleUni ) { iG.valTemplate.uniEls.addClass(opt.inpErrClass); }
			iG.$el.addClass(opt.inpErrClass);
		}

		// Label styling
		if ( opt.setErrorOnLabel && iG.valTemplate.label && iG.valTemplate.setErrorOnLabel !== false ) {
			if ( iG.valTemplate.labelIterator !== undefined ) {
				iG.valTemplate.label.addClass(opt.labelErrClass+iG.valTemplate.labelIterator);

			} else {
				iG.valTemplate.label.addClass(opt.labelErrClass);
			}
		}

		// Message configuration
		$msg = getMessenger(iG);
		$msg.addClass( iG.valTemplate.messengerIterator ?  opt.errorVisibleClass + iG.valTemplate.messengerIterator : opt.errorVisibleClass );

		try {
			if ( strCustomMsg !== undefined ) {
				$msg.html(strCustomMsg).show();
				//$msg.html(strCustomMsg);
			} else {
				$msg.html(iG.valTemplate[errType]).show();
				//$msg.html(iG.valTemplate[errType]);
			}
		}
		catch (Err) {}

		// Infomation setting
		iG.isValid = false;
		iG.valTemplate.errorType = errType;

		formIsValid = false;
	};

	/*
	clearError([guide obj])
	Takes an input guide. Clears error classes from input and label and removes text from error messenger
	*/
	clearError = function(iG) {
		iG = iG.$el ? iG : $(iG).data('guide'); // Accept either the guide or a jquery el or a raw el
        if ( !iG ) {
            console.warn('#############################################################\n## clearError() was called with out passing an input guide ##\n#############################################################');
            return;
        }
		if ( iG.charCountIsValid === false ) {
if  ( mawf.bug && mawf.bug.logFormValidation ) { console.log('clearError() shorted because of a invalid char count in effect'); }
			return;
		}

		if  ( mawf.bug && mawf.bug.logFormValidation ) {console.log('###################### \nclearError() called on ',mawf.bug.show(iG.$el)); }
		if ( iG.isValid !== false ) {
			if  ( mawf.bug && mawf.bug.logFormValidation ) {console.log('- Shorted - not invalid \n#######################'); }
			return true;
		}			// short circuit for valid inputs

		var $input = iG.$el,
			template = iG.valTemplate,
			$label = template.label;

		iG.isValid = true;

		if ( template.uniEls !== undefined ) { template.uniEls.removeClass(opt.inpErrClass); }

		$input.removeClass(opt.inpErrClass);

		if ( $label ) {
			if ( iG.valTemplate.labelIterator !== undefined ) {
				$label.removeClass(opt.labelErrClass + iG.valTemplate.labelIterator);
				if  ( mawf.bug && mawf.bug.logFormValidation ) {console.log('Cleared '+opt.labelErrClass + iG.valTemplate.labelIterator); }
			} else {
				$label.removeClass(opt.labelErrClass);
			}
		}
		
		getMessenger(iG).text('').hide();
		//getMessenger(iG).text('');
	};

	// clearAllSectionErrors(sectionGuide)
	// Loop the input array of a sectionGuide and fire each inputGuide into clearError()
	clearAllSectionErrors = function(sG) {
		if  ( mawf.bug && mawf.bug.logFormValidation ) {console.log('ClearallsectionErrors called'); }
		var inputs = sG.inputs,
			l = inputs.length;

		while (l--) {
			if  ( mawf.bug && mawf.bug.logFormValidation ) {console.log('Clearerror called'); }
			clearError(inputs[l]);
		}
	};
/**
 * Accept an input $ el and will return its label via for/id attributes or wrapping
 * @param  {$ element} $el - a jquery ste containing the input element for which to return its macthing label
 * @return {$ element}     returns the elements label
 */
	getLabel = function($el) {
		var $label,
			$input   = $el,
			inputID = $input.attr('id');
		
		if ( inputID ) {													// Try matching attributes
			$label =  $('label').filter('[for="' + inputID + '"]');
		}

		if ( $label === undefined || $label.size() === 0 ) {								// Try a parent label
			$label = $input.closest('label');
		}

		if ( $label.size() > 0 ) {
			return $label;

		} else {
	if  ( mawf.bug && mawf.bug.logFormValidation ) { console.warn('getLabel() failed to return a label from', mawf.bug.show($el), $el); }
			return undefined;
		}
	}

	createMessenger = function() {
		var frag = document.createElement(opt.errContTag);
		return $(frag).addClass(opt.errContClass);
	};

	getMessenger = function(iG) {
		var $msg, $cont, $remote, parentSelector,
			$label = iG.valTemplate.label,
			isUserMsgContainer = false,
			$input = iG.$el, template = iG.valTemplate;	// This assumes inputs with messengerPosition set are not going to be one uniform and one not

		if ( template.$messenger !== undefined ){							// ### Messenger pre-existing in the view model
			return template.$messenger;
		}

		if ( template.staticMessengerSel && template.staticMessengerSel !== '' ) {
			$msg = $(template.staticMessengerSel);
			if ( $msg.size() > 0 ) {
				template.$messenger = $msg;
				return template.$messenger;
			}
		}

		if ( template.messengerPosition === 'nextSibling' )	{				// ### Jump to a previous or subsequent guide if the messenger
			$input = iG.inputs[iG.index + 1].$el;							// has an alternate position specified by messengerPosition

		} else if ( template.messengerPosition === 'prevSibling' )	{
			$input = iG.inputs[iG.index - 1].$el;
		}

		if ( template.tagType == 'select' && opt.selectsUseUniform ) {		// ### Adjust input if uniform select
			$input = $input.closest('.selector');

		} else if ( template.tagType == 'radio' && opt.radiosUseUniform ) {	// ### Adjust input if uniform radio
			$input = $input.closest('label').closest('div');
		}

		$msg = createMessenger();

		if (template.messengerContSelector != undefined) {
			parentSelector = template.messengerContSelector;
			$cont = $(parentSelector);
			$remote = $cont.find(opt.errContSelector);
			$msg = $remote.size() > 0 ? 
				(function (){ 
					isUserMsgContainer = true; 
					return $remote; 
				})(): 
				$msg;
			if ($cont.size() > 0) {
				template.messengerPosition = 'appendTo';
				$input = $cont;
			}
		}

		if (!isUserMsgContainer) {
			var sSwitch = template.messengerPosition || opt.errContLocation;
			switch (sSwitch) {
				case 'appendTo':				// ### For Explicit Overrides
					$msg.appendTo($input);
					break;	

				case 'insertBefore':				// ### For Explicit Overrides
					$msg.insertBefore($input);
					break;	

				case 'after':					// ### For Explicit Overrides
					$input.after($msg);
					break;

				case 'afterLabel' :				// after that targets label
					$label.after($msg);
					break;

				case 'nextSibling':					// ### Build an error container after
					if ( iG.valTemplate.$valGroup !== undefined ) {
						$msg
							.insertBefore(iG.valTemplate.$valGroup.first().closest('label'))
							.wrap('<div class="radio-input-error"></div>'); // radio group
					} else {
						$msg.insertAfter($input);
					}
					break;

				case 'prevSibling':					// ### Build an error container before
					$msg.insertBefore($input);
					break;

				case 'appendToLabel':				// ### Find label, and append to label
					if ($label.size() > 0) {
						var sCssClassName = 'block-input-error';
						sCssClassName = template.tagType == 'checkbox' ? 'checkbox-input-error' : sCssClassName;
						$msg.appendTo($label).wrap('<div class="' + sCssClassName + '"></div>');
					}
					break;
				default: break;
			}
		}

		template.$messenger = $msg;
		return $msg;
	};

	//
	// initSections()
	// First:
	// Loop each section and add the section ($el), position in sections array (index) and a blank init array to the
	// form's sections reference array
	//
	// Next:
	// Loop each section, reference that sections array entry on $form to a variable (guide) on itself.
	// Continue extending the variable with more info
	initSections = function($secs, $form) {

		$secs.each(function(i) { // Build form's section array
if  ( mawf.bug && mawf.bug.logFormValidation && i === 0 ) { console.log('#################################'); }
if  ( mawf.bug && mawf.bug.logFormValidation ) {console.log('Init section '+i+' - adding sections to sections guide '); }
			$form.data('sections').push({ '$el' : $(this), 'index' : i, inputs : []});
		})

		.each(function(i) { // Flesh out data in each section guide
if  ( mawf.bug && mawf.bug.logFormValidation && i === 0 ) { console.log('#################################'); }

if  ( mawf.bug && mawf.bug.logFormValidation ) {console.log('Init section '+i+' - adding information'); }
			var $section = $(this), guide;

			$section.data('guide',	$form.data('sections')[i]);	// Ref section guide to master guide
			guide = $section.data('guide');

			guide.allSections	= $form.data('sections');		// Ref to all sections array
			guide.index			= i;							// This section's index in sections array
			guide.inputs		= [];							// Init array for this sections inputs
			guide.$el			= $section;						// This section's $el

			if (opt.markSuccessOnSection) {
				guide.successStylers = [];
				importSectionStylers($section, opt.markSuccessTo, 'successStylers');
			}
			if (opt.markSuccessToNextSection) {
				guide.nextStylers = [];
				importSectionStylers($section, opt.markNextTo, 'nextStylers');
			}
		});
if  ( mawf.bug && mawf.bug.logFormValidation ) { console.log('#################################'); }
	};

	importSectionStylers = function($sec, stylerGroupGuide, stylerGroupName) {
if  ( mawf.bug && mawf.bug.logFormValidation ) {console.log('- Import for ' + stylerGroupName,stylerGroupGuide); }
		var i,
			target,
			stylingTargets = [],
			l = stylerGroupGuide.length,
			sG = $sec.data('guide');

		for (i=0,l; i<l; i++) {									// Loop stylers and get elements
			switch (stylerGroupGuide[i].rel) {
				case 'self' :
					target = $sec.is(stylerGroupGuide[i].target) ? $sec : undefined;
					break;

				case 'next' :
					target = sG.allSections[sG.index + 1] ? sG.allSections[sG.index +1].$el : undefined;
					break;

				case 'child' :
					break;

				case 'parent' :
					break;
			}
																// Push element and its success style onto []
			stylingTargets.push( {target: target, style: stylerGroupGuide[i].styler, unique: stylerGroupGuide[i].unique} );
		}
		sG[stylerGroupName] = stylingTargets;	// Attach data to section element
	};


	// FIND ELEMENTS & BUILD GUIDE - processAllInputs([$section])
	// Takes section guide as an arg;
	// Loops all sections and passes each to the processSectionInputs() function
	processAllInputs = function(sG) {
		var l = sG.allSections.length;

		while (l--) {
			processSectionInputs( sG.allSections[l] );
		}
	};

	processSectionInputs = function(sG) {
		var i, ii, $input, $aspEl, guide,
			charMax = false,
			supportsMaxlength = ('maxLength' in document.createElement('textarea')) ;

if  ( mawf.bug && mawf.bug.logFormValidation ) { console.groupCollapsed('processSectionInputs('+sG.index+') called'); }

		sG.$el
		.find(':input')
		.each(function(i){
			$input = $(this);

if  ( mawf.bug && mawf.bug.logFormValidation ) { console.groupCollapsed($input.attr('name'), $input[0]); }

			if ( $input.data('guide') !== undefined ) {											// ALREADY PROCESSED
if  ( mawf.bug && mawf.bug.logFormValidation ) { console.warn("Input processing shorted - input has guide and was previously processed", $input); console.groupEnd(); }
				return;
			}

			if ( opt.asp_checkbox_support ) {
				$aspEl = getASPCheckboxEl($input);

				if ( $aspEl ) {
					$input.addClass( $aspEl.attr('class') );
					$aspEl = undefined;
				}
			}

			for (var jsClass in template) {														// FILTER FOR A GUIDE

				if ( $input.hasClass(jsClass) ) {												// TODO: optimize by matching on js_ and then looking for that on the template
if  ( mawf.bug && mawf.bug.logFormValidation ) {console.log('matched: '+jsClass); }
					ii = sG.inputs.push( buildInputGuide(sG, $input, jsClass) ) - 1;
					guide = sG.inputs[ii];
					$input.data('guide', guide);

					if (guide.valTemplate.$valGroup !== undefined) {					// RADIOS - add a reference to master radio's guide to $valGroup members
						guide.valTemplate.$valGroup.not(':first').data('guide',guide);
					}
					break;
				}

			}

			// INPUT IS MARKED FOR CHAR LIMIT
			if ( $input.is('textarea') ) {
				charMax =					// find max value
					( $input.attr('class') && $input.attr('class').match(/js_char-limit-(\d*)/) ) ||
					$input.attr('maxlength') ||
					1000;

				charMax = charMax[1] ? +charMax[1] : charMax;

				if ( supportsMaxlength ) {	// Use native attr if possible
					$input.attr('maxlength', charMax);
					charMax = false;

				} else {					// Else set up validator

					charMax = opt.testCharLimitEvent.indexOf('keydown') !== -1 ? charMax - 1 : charMax;				// reduce by one for keydown
					
					// If input has no regular validator - build a blank one
					if ( $input.data('guide') === undefined ) {									
						i = sG.inputs.push( buildInputGuide(sG, $input, 'js_limitCharCount') ) - 1;
						guide = sG.inputs[i];
						guide.valTemplate.charLimit = charMax;
						$input.data('guide', guide);	
					}

					// Attach char data to guide
					guide.valTemplate.charMax = charMax;
					guide.valTemplate.errorCharLimit = '';//guide.valTemplate.errorCharLimit.replace(/%l/g, guide.valTemplate.charMax); // messaging not active

					// Setup Listener
					$input.on(opt.testCharLimitEvent,{
							iG			: guide,
							maxChar		: charMax,
							showError	: opt.showCharLimitErrors
						},
						checkCharLimit
					);
				}
			}
if  ( mawf.bug && mawf.bug.logFormValidation ) { console.groupEnd(); }
		});
if  ( mawf.bug && mawf.bug.logFormValidation ) { console.groupEnd(); }
	};

	getASPCheckboxEl = function($input) {
		var isUnified,
			$uniDiv;

		if ( $input.is('[type="checkbox"]') ) {		// Is checkbox

			$uniDiv   = $input.parent().parent();
			isUnified = $uniDiv.is('div.checker');

			if ( isUnified ) {							// Is uniform
				return $uniDiv.parent();					// Return uni parent span for comparison

			} else {									// Is standard
				return $input.parent();						// Return direct parent span for comparison
			}

		} else {									// Not appropriate
			return false;								// Return false
		}

	};

// cleanUpSectionGuide()
// Accepts either a section object or an integer representing the (0 based) section number
// Will crawl the cached section inputs and will delete any that are found to have been removed from dom
	cleanUpSectionGuide = function(section) {
if  ( mawf.bug && mawf.bug.logFormValidation ) { console.group('cleanUpSectionGuide()', section);}

		var i	= 0,
			l, sG;

		sG = typeof section === 'number' ? this.$form.data('sections')[section] : section;
		l = sG.inputs.length;
if  ( mawf.bug && mawf.bug.logFormValidation ) { console.log('- #'+l+' inputs in sG:',sG); }

		while ( i < l) {

			if ( sG.inputs[i].$el.closest('body').size() === 0 ) { // Missing input
if  ( mawf.bug && mawf.bug.logFormValidation ) { console.log('- Checking ('+i+') - NOT FOUND:',sG.inputs[i].$el.attr('name')); }
				sG.inputs.splice(i,1);								// Remove from array
				l--;												// Record new length of array

			} else {
if  ( mawf.bug && mawf.bug.logFormValidation ) { console.log('- Checking ('+i+') - FOUND:',sG.inputs[i]); }
				sG.inputs[i].index = i;								// Ensure index stays in sync
				i++;
			}
		}
if  ( mawf.bug && mawf.bug.logFormValidation ) { console.groupEnd(); }
	};

	buildInputGuide = function(sG, $input, jsClass) {
		var obj = {};
if  ( mawf.bug && mawf.bug.logFormValidation ) {console.log("buildInputGuide(" + jsClass + ")"); }
		if ( template[jsClass].isPaired ) {
			obj.isPaired = true;
			obj.$pairedEl = $(template[jsClass].pairSelector);
		}

		obj.parentSection = sG;
		obj.inputs        = sG.inputs;
		obj.$el           = $input;
		obj.index         = sG.inputs.length;
		obj.isValid       = undefined;
		obj.valTemplate   = categorize($input, sG, jsClass);

		return obj;

	};

	// APP STYLE RESTORE STATE ON PAGE LOAD - for pages that keep form state,
	// restore section success state on page load
	restoreStateOnLoad	= function($sections) {
		var section, sG, allSectionsFailed;
if  ( mawf.bug && mawf.bug.logFormValidation ) { console.log('### START restoreStateOnLoad() - section success retoring ################################# '); }
		$sections.each(function(){
			$section = $(this);
			sG = $section.data('guide');

            if ( sG.$el.is(':visible') ) {               // Sections are validated only if visible - supports apps where steps might be revealed dynamically
				if ( validateSection(sG, false) ) {
					markSection( sG, 'success', true );
					if ( opt.markSuccessToNextSection ) {
						if  ( mawf.bug && mawf.bug.logFormValidation ) {console.log('calling mark next'); }
						markSection( sG, 'next', true );
					}
					allSectionsFailed = false;
				} else {
					markSection( sG, 'success', false );
				}
            }
			
		});
if  ( mawf.bug && mawf.bug.logFormValidation ) { console.log('### END restoreStateOnLoad() #################################'); }
		return allSectionsFailed;
	};

	// setErrorClearing()
	// sets input focusin clearing of errors
	setErrorClearing = function($form) {
if  ( mawf.bug && mawf.bug.logFormValidation ) {console.log('setErrorClearing'); }
		var i, ii,
			$sectionParents = $(),
            currentSG,
			allSG = $form.data('sections');

		for ( i in allSG ) {
            currentSG = allSG[i];
			$sectionParents = $sectionParents.add(currentSG.$el.parent());

			// for ( ii in currentSG.inputs ) {
			//	if ( currentSG.inputs[ii].valTemplate.$valGroup && currentSG.inputs[ii].valTemplate.validatorTrigger == 'click' ) {
			//		currentSG.inputs[ii].valTemplate.$valGroup.on('click', function() {
			//			clearError( currentSG.inputs[ii] );
			//		});
			//	}
			// }
		}

		$sectionParents.on('focusin click', ':input', function errClearListener(e) {
			var guide = $(e.target).data('guide');
			if ( guide ) {
				if (guide.valTemplate && guide.valTemplate.validatorTrigger == 'keyup') {
					return false;
				} else {
					clearError( guide);
				}
			}
		});
	};

	// e = event; e.data = iG, maxChar, minChar, showError 
	checkCharLimit = function(e) {
		if (e.ctrlKey && e.which === 86) { return true; } // This is a cmdctrl -v paste which we can ignore since we catch subsequent paste event and that event also covers a right click paste
		if ( !e.hasBeenDeferred && e.type === 'paste' ) {
						if ( true || mawf.bug && mawf.bug.logFormValidation ) { console.log('Paste event detected with '+e.type + '|'+e.which); }

			e.hasBeenDeferred = true;
			setTimeout(function() {checkCharLimit(e);}, 0);
			return true;
		}
		var iG = e.data.iG,
			minChar = e.data.minChar || 0,
			maxChar = e.data.maxChar || 1000,
			showError = typeof e.data.showError ? e.data.showError : true; 

		if ( e.which !== 32 && e.which > 1 && e.which < 47) {	// Allow tabs, enter, arrows, backspace at all times (except 32 spaces + 1 IE ctrl)
			return true;

		} else if ( charCountIsInRange(iG, maxChar, minChar) ) {
			iG.charCountIsValid = true;
			if ( iG.isValid	=== false ) { clearError(iG); }

		} else {
			iG.isValid			= opt.blockExtraChars ? true : false;
			iG.charCountIsValid = opt.blockExtraChars ? true : false; // If blocking, char limit is always going to be good
			if ( showError && opt.blockCharEntry !== true ) { setError(iG, 'errorCharLimit'); }
			if ( opt.blockExtraChars ) { // This needs to listen on keydown to actually prevent extra chars frome being added
				if ( e.type == 'paste' ) {
					reduceCharCount(iG, maxChar); // remove extra pasted chars
					return true;
					
				} else {
					return false;					
				}
			}
		}

		return true;
	};

	reduceCharCount = function(iG, count) {
		var content = iG.$el.val();
if ( true || mawf.bug && mawf.bug.logFormValidation ) { console.log('Reducing char count from '+ iG.$el.val().length + ' to '+ count); }
		content = content.substr(0, count);
		iG.$el.val(content);
		iG.$el.trigger('change');
	};

	charCountIsInRange = function(iG, maxChar, minChar) {
		var count = iG.$el.val().length;
if ( true || mawf.bug && mawf.bug.logFormValidation ) { console.log('evaluating char limit, count at '+count); }

		return (minChar <= count) && (count <= maxChar);
	};


	return {
		init : function(userOptions) {
if  ( mawf.bug && mawf.bug.logFormValidation ) {
	console.log("\n");
	console.log('##########################################');
	console.log('### Validater init called with options ###');
	console.log('##########################################');
	console.log('Options: ', userOptions);
}
			var arg, valTypeProp, errMsgProp,  $form, $sections, allSectionsFailed, localErrorMsgs;

		// INTEGRATE USER OPTIONS
			try {
				for ( arg in userOptions ) { 
					opt[arg] = userOptions[arg];
				}
			} catch(e){}

			$form = $(opt.formTargetSelector);

			if ( $form.size() === 0 ) { return false; }	// Short circuit - form not found

			allSectionsFailed       = true;
			$sections               = !!opt.sectionSelector ? $form.find(opt.sectionSelector) : $form;
			opt.buildGuideBySection = (opt.markErrorOnSection || opt.markSuccessOnSection);
			this.$form              = $form;
			this.sG                 = null;

		// INTEGRATE SERVER LOCALIZATION
			localErrorMsgs = mawf.validation_errors;
			console.log('Local Error Message data: ',localErrorMsgs);
			for ( valTypeProp in localErrorMsgs ) {
				// loop and if key matches in validater, overwrite
				if ( template[valTypeProp] ) {
					for ( errMsgProp in localErrorMsgs[valTypeProp] ) {
					
						if ( mawf.bug && mawf.bug.logLocalizationBlankOverwrites && template[valTypeProp][errMsgProp] && !localErrorMsgs[valTypeProp][errMsgProp] ) {
							console.warn(valTypeProp + '-->' + errMsgProp + ' has a default message of '+template[valTypeProp][errMsgProp]+' but the server localization is overwriting it with a null value!');
						}

						if ( localErrorMsgs[valTypeProp][errMsgProp] ) { template[valTypeProp][errMsgProp] = localErrorMsgs[valTypeProp][errMsgProp]; }
					}
				}
			}


		// INIT SECTIONS
			$form.data('sections', []);								// Init section var; Non-sectioned forms are essentially treated as a one section form
			this.sG = $form.data('sections');						// Create a reference var to the sections guide array
			initSections($sections, $form);
			processAllInputs($sections.data('guide'));

			if ( opt.markSuccessOnSection && opt.markSuccessOnPageLoad) { allSectionsFailed = restoreStateOnLoad($sections); }

			if (opt.clearErrorOn == 'focus') { setErrorClearing($form); }


		// ### LISTENERS - Attach listener to form(s) if validationTiming is onSubmit
		// Attach listener to form, using event delegation, and fire on input blur for realTime

		// SUBMISSION BLOCKING
			if ( opt.blockFormSubmission ) {
if  ( mawf.bug && mawf.bug.logFormValidation ) { console.log('Attaching form submit listener'); }					
				
				if ( opt.pseudoSubmitSel && $form.find(opt.pseudoSubmitSel).length === 1 ) {						// Control a pseudo form with pseudo submit
if  ( mawf.bug && mawf.bug.logFormValidation ) { console.log('-- type: pseudoSubmit'); }
					

					var oc = $form.find(opt.pseudoSubmitSel).on('mousedown', null, this, function(event) {
						if ( event.data.isValid() === false ) {
if  ( mawf.bug && mawf.bug.logFormValidation ) { console.log('Validater returned false to psuedo listener'); }
							event.preventDefault();
							return false;
						} else {
							var oc = $(this).attr('cached_onlick');
							$(this).attr('onclick', oc).click();
						}
					}).attr('onclick');

					$form.find(opt.pseudoSubmitSel).attr('cached_onlick', oc).attr('onclick', '');

				} else if ( $form.is('form') ) {					// Control a real form
if  ( mawf.bug && mawf.bug.logFormValidation ) { console.log('-- type: form is form'); }					
					$form.on('submit', null, this,  function(event) {
if  ( mawf.bug && mawf.bug.logFormValidation ) { console.log('Validater returned false to direct listener'); }
						return event.data.isValid();
					});

				} else {
if  ( mawf.bug && mawf.bug.logFormValidation ) { console.log('-- type: form is closest form'); }					
					$form.closest('form').on('submit', null, this,  function(event) {
if  ( mawf.bug && mawf.bug.logFormValidation ) { console.log('Validater returned false to closest("form")'); }	
						return event.data.isValid();
					});
				}
			}
			
		// VALIDATION TIMING
			if (opt.validationTiming == 'realTime') {

				$form.live('blur click', function(evt){
					if ( $(evt.target).is(':input') === false ) {
						if  ( mawf.bug && mawf.bug.logFormValidation ) { console.log('Realtime validation listener ignored '+evt.type+' on '+ evt.target.tagName.toLowerCase()); }
						return;
					}

					if  ( mawf.bug && mawf.bug.logFormValidation ) {
						console.log('#####################################');
						console.log('RealTime validator triggered by '+evt.type+' on '+evt.target.tagName + '['+$(evt.target).attr('class')+']', evt.target);
					}

					var elValidates,
						$input = $(evt.target),
						iG     = $input.data('guide');

					// SHORT ON RADIOS - Only radios validate on click
					if ( evt.type == 'click' && ! $input.is(':radio') ) {
						if  ( mawf.bug && mawf.bug.logFormValidation ) {console.log('- Shorted: Click on non-radio(Only radios validate on click) ',mawf.bug.show(evt.target)); console.log('#####################################'); }
						return true;
					}


					// DETECT AND PROCESS DYNAMICALLY ADDED INPUTS
					if ( iG === undefined ) {
						if  ( mawf.bug && mawf.bug.logFormValidation ) {console.log('- Shorted: no guide obj attached'); } // if non-validated inputs exist this is going to fire everytime; need opt
						if ( isUpdate($input) ) {
							if  ( mawf.bug && mawf.bug.logFormValidation ) {console.log('- Re-analysing input'); }
							processSectionInputs( $input.closest(opt.sectionSelector).data('guide') );
						}
						if  ( mawf.bug && mawf.bug.logFormValidation ) {console.log('#####################################'); }
						return false;
					}


					// SHORT FOR CUSTOM TIMING - individual validatorTrigger set on a validator will override general setting
					if ( iG.valTemplate && iG.valTemplate.validatorTrigger && iG.valTemplate.validatorTrigger !== "realtTime") {
						if  ( mawf.bug && mawf.bug.logFormValidation ) {console.log('- Shorted: individual validatorTrigger set ('+iG.valTemplate.validatorTrigger+')'); console.log('#####################################'); }
						return true;
					}


					// VALIDATE
					if  ( mawf.bug && mawf.bug.logFormValidation ) {console.log('- Sending to validator'); }
					elValidates = validateEl(iG, true);


					// MARK SUCCESS
					if ( opt.markSuccessOnSection ) {

						if ( elValidates && validateSection( iG.parentSection, false) ) {
							markSection( iG.parentSection, 'success', true );

							if (opt.markSuccessToNextSection) {
								markSection( iG.parentSection, 'next', true );
							}

						} else {
							markSection(iG.parentSection, 'success', false);
							if (opt.markSuccessToNextSection) {
								markSection( iG.parentSection, 'next', false );
							}
						}
					}
					return true;
				});
			}
		},

		opt: opt,

		reset : function() {
if  ( mawf.bug && mawf.bug.logFormValidation ) {console.log('reset called'); }
			var sections = this.$form.data('sections'),
				l = sections.length;

			while (l--) {
if  ( mawf.bug && mawf.bug.logFormValidation ) {console.log(sections[l]); }
				markSection(sections[l], 'success', false);				// Clearing section marking
				markSection(sections[l], 'next', false);

				clearAllSectionErrors(sections[l]);						// Clearing input errors
			}
		},

		isValid : function($validationTarget, produceErrorMsg) {
			$validationTarget = $validationTarget === undefined ? this.$form : $validationTarget;
			produceErrorMsg = produceErrorMsg || false;

			if ( validateForm($validationTarget, produceErrorMsg) === false ) {
				validateUpstream({$form: this.$form, context: this, addFocusToErrorSection: true});
if  ( mawf.bug && mawf.bug.logFormValidation ) { console.log('Form isValid returned false'); }				
				return false;
			} else {

if  ( mawf.bug && mawf.bug.logFormValidation ) { console.log('Form isValid returned true'); }
				return true;
			}
		},

		validateEl : function(inputGuide, produceErrorMsg) {
			return validateEl(inputGuide, produceErrorMsg);
		},

		validateSection : function(sectionGuide, produceErrorMsg) {
			return validateSection(sectionGuide, produceErrorMsg);
		},

		isValidSection : function(intSection) {
			return isValidSection(this.$form, intSection);
		},

		updateSectionValidation: function(intSection) {
if  ( mawf.bug && mawf.bug.logFormValidation ) {console.log("updateSectionValidation("+intSection+")"); }
			cleanUpSectionGuide(this.$form.data('sections')[intSection]);
			processSectionInputs(this.$form.data('sections')[intSection]);
		},

		clearError : clearError,

		setError : setError,

		cleanUpSectionGuide: cleanUpSectionGuide,

		clearAllFormErrors : function($form) {
			var i, sections = $form.data('sections'), l = sections.length;
			for ( i = 0; i < l; i++ ) {
				clearAllSectionErrors( sections[i] );
			}
		}

		// STATUS()
		// Returns a bool indicating the validity of the form without firing error messaging/styling
		// used by a third part script that wants the validater to style realtime
		/*status : function() {

		}*/
	};

};
