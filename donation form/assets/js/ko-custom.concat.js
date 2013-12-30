(function($){
	
//
// Fire up KO and other bindings on page load.
//
mawf.donation_init = function (serverDefault) {
    var dtParam,
        cart                = {},
        donationData        = {},
        appDefaults,
        savedSession,
        savedSessionPresent = false,
        defaultCartName     = 'cart'; // default cart name

    this.state                    = '';
    this.CartView                 = undefined;

    this.$personalizer            = $('.personalizer');
    this.$browser                 = $('#js-product-browser');
    this.prodBrowserNavLabels     = [];
    this.prodBrowserCachedMatches = {};

    this.serverInitParams         = serverDefault; // save to global namespace


// ######################################################################
// ### CART/SESSION MANAGEMENT ##########################################
// ######################################################################

    // Set cart name
    mawf.cartName = (serverDefault.cartName ? serverDefault.cartName : defaultCartName);// + serverDefault.purchaserID.replace(/\-/g,''); // Purchaser id appending removed, 

    // Check for session cookie
    if ( mawf.hasSavedSession(mawf.cartName) ) {

if ( mawf.bug && mawf.bug.sessionSaveActive ) { console.log('Cart session cookie found'); }

        try {
            savedSession = mawf.loadSession(mawf.cartName);
            savedSession = savedSession === null ? {} : $.parseJSON(savedSession);

        } catch(e) {
            console.warn('Error in session load occurred. Flushing local storage and starting with blank session.');
            $.jStorage.flush();
            savedSession = {};
        }

    } else { 
if ( mawf.bug && mawf.bug.sessionSaveActive ) { console.log(mawf.cartName+' deleted'); }
        $.jStorage.deleteKey(mawf.cartName);
        savedSession = {};
    }

    savedSessionPresent = savedSession === {} ? false : true;


// ######################################################################
// ### INIT OPTIONS MANAGEMENT ##########################################
// ######################################################################
//
// 
// Example serverDefault
// 
// {
//     localizedCurrencySymbol: '$',                            Overwrite existing donation value - safe - should only change based on countyr which is a unique cart
//     donorIntentId: '006-000',                                Don't overwrite but set as default for future added donations
//     donorIntentName: 'Make-A-Wish Foundation® of North Texas',Don't overwrite but set as default for future added donations
//     donationType1Label: 'A Single Donation',                 Overwrite existing donation value  - fatal - should be accompanied by a reset param
//     donationType2Label: 'A Monthly Pledge',                  Overwrite existing donation value  - fatal - should be accompanied by a reset param
//     minimumDonation: '5',                                    Overwrite existing donation value  - fatal - should be accompanied by a reset param
//     donationAmt1: 30,                                        Overwrite existing donation value  - safe - if cart has setAmount but amount differs code should convert to a otherAmount
//     donationAmt2: 50,                                        Overwrite existing donation value  - fatal - should be accompanied by a reset param
//     donationAmt3: 100,                                       Overwrite existing donation value  - fatal - should be accompanied by a reset param
//     startDate1: 5,                                           Overwrite existing donation value  - fatal - should be accompanied by a reset param
//     startDate2: 20,                                          Overwrite existing donation value  - fatal - should be accompanied by a reset param
//     clearFormMessage: 'Clearing ...',                        Overwrite existing donation value  - safe
//     clearFormBtnYes: 'Yes, clear form',                      Overwrite existing donation value  - safe
//     clearFormBtnNo: 'No, take me back to the form'           Overwrite existing donation value  - safe
// }

// SEPARATE  DONATION DEFAULTS FROM MODEL DEFAULTS
// donorIntentId, donorIntentName, donationType(querystring) -  Check for, package for donation init, the remove from serverDefault obj
    if ( serverDefault.donorIntentId || serverDefault.donorIntentName ) {
        if ( (serverDefault.donorIntentId && serverDefault.donorIntentName) ) {
            mawf.donationData               = mawf.donationData || {};
            mawf.donationData.donorIntent   = serverDefault.donorIntentId;

            if ( serverDefault.donorIntentId === serverDefault.nationalID ) {
                mawf.donationData.donationDestType = 'national';

            } else if ( serverDefault.donorIntentId === '500-000') {
                mawf.donationData.donationDestType = 'international';

            } else {
                mawf.donationData.donationDestType = 'chapter';
                mawf.donationData.chapterLocation  = serverDefault.donorIntentName;
            }

            delete serverDefault.donorIntentId;
            delete serverDefault.donorIntentName;
            
        } else {                                                // If one is set and not the other just remove the one set
            if ( serverDefault.donorIntentId ) {
                delete serverDefault.donorIntentId;
            } else {
                delete serverDefault.donorIntentName;
            }
        }

        if ( $.querystring.donationType ) {                     // Get donation recurrence type from query string
            dtParam = parseInt($.querystring.donationType, 10);
            if ( isNaN(dtParam) === false ) {
                mawf.donationData.donationType = dtParam;           
            }
        }
    }

// EXTEND MODEL WITH SERVERDEFAULTS
    for (var prop in serverDefault) {                           // Integrate param data into cart model data
        savedSession[prop] = serverDefault[prop];
    }


// ######################################################################
// ### INIT MODEL BINDINGS ### ##########################################
// ######################################################################
    this.CartView = new mawf.CartViewModel(savedSession);       // Pass any saved session data to CartViewModel
    ko.applyBindings(this.CartView);                            // Bind the html bindings to CartView

    if ( savedSessionPresent ) {
        $('select').trigger('change');                          // Notify Uniform that the selects have been changed programmatically 
    }
// #########################################################################
// ### INIT FORM VALIDATORS ################################################
// #########################################################################

// Standard Donation
    mawf.mainFormArgs = {
        formTargetSelector :    '.jsDonateValidate',
        validationTiming :      'realTime',
        blockFormSubmission:    false,

        markSuccessOnSection :  true,
        markSuccessOnPageLoad : true,
        markSuccessToNextSection: true,
        scrollToFirstErrorOnSubmit: true,

        sectionSelector :       '.jsFormSection',
        markSuccessTo :         [{
                                    target: '.jsFormSection',
                                    styler: 'done',
                                    rel: 'self'
                                }],
        markNextTo :            [{
                                    target: '.jsFormSection',
                                    styler: 'next',
                                    rel: 'next',
                                    unique: true
                                }]
    };
    if ( $(mawf.mainFormArgs.formTargetSelector).size() !== 0 ) {
        mawf.mainFormVal = new mawfVal();   
        mawf.mainFormVal.init(mawf.mainFormArgs);
    }

// Product Personalizer form
    mawf.persFormArgs = {
        formTargetSelector :    '.personalizer',
        validationTiming :      'realTime',
        blockFormSubmission:    false,

        markSuccessOnSection :  false,
        markSuccessOnPageLoad : false,
        markSuccessToNextSection: false,
        scrollToFirstErrorOnSubmit: false
    };
    if ( $(mawf.persFormArgs.formTargetSelector).size() !== 0 ) {
        mawf.persFormVal = new mawfVal();
        mawf.persFormVal.init(mawf.persFormArgs);
    }

// Wish Society/AG from
 //    mawf.socFormArgs = {
 //        formTargetSelector :    '.jsSocValidate',
 //        validationTiming :      'realTime',
 //        blockFormSubmission: false,

 //        markSuccessOnSection :  true,
 //        markSuccessOnPageLoad : true,
 //        markSuccessToNextSection: true,


 //        sectionSelector :       '.jsFormSection',
 //        markSuccessTo :         [{
 //                                    target: '.jsFormSection',
 //                                    styler: 'done',
 //                                    rel: 'self'
 //                                }],
 //        markNextTo :            [{
 //                                    target: '.jsFormSection',
 //                                    styler: 'next',
 //                                    rel: 'next',
 //                                    unique: true
 //                                }]

 //    };
 //    if ( $(mawf.socFormArgs.formTargetSelector).size() !== 0 ) {
    //  mawf.mainFormVal = new mawfVal();       
    //  mawf.mainFormVal.init(mawf.socFormArgs);
    // }

// ######################################################################
// ### END FORM VALIDATORS ##############################################
// ######################################################################


// Focus Step 1 if donationSelectInProcess - initial page load
    if ( ( mawf.CartView.isMultiDonation() === false && mawf.mainFormVal.isValidSection(0) === false ) || mawf.CartView.isMultiDonation() === true && mawf.CartView.donationSelectInProcess() ) {
        $('.donate-wrap').eq(0).addClass('active');
    }

// Init - Placeholder polyfill
    //$('input, textarea').placeholder();

// Init - product browser
    mawf.initProductCategories();
    mawf.initProductCategoryMatching();


// ######################################################################
// ### LISTENERS ########################################################
// ######################################################################

// FORM SUBMISSION
    /*$('.button-submit')
        //.data( 'myForm', $(this).closest('.jsDonateValidate') )
        .click(function () {                                // Submitting
            if ( mawf.CartView.isMultiDonation() === false && mawf.CartView.donations()[0].isValid() === false ) {
                $.scrollTo(0,800);
                return false;
            }
            if ( mawf.CartView.donationSelectInProcess() === false || mawf.CartView.isMultiDonation() === false ) {
                if ( mawf.mainFormVal.isValid() ) {
                    mawf.handlingFormSubmission();
                }
            }
            return false;
    });*/


// Credit card type auto highlight
    $('.js_ccNumber').on('keyup', function (evt) {
        mawf.monitorCardType($(evt.currentTarget).val(), $('.card-grid'));
    });

// PRODUCT BROWSER LAUNCH BUTTONs
//
// TOOD - abstract the callback  and move to helpers
    $(".jsFormSection").eq(0).on('click', '.ecard-btn', function (e) {
// console.log('ecard click');
        if ( $(e.target).is('.js_ecard-edit') ) {
            mawf.CartView.productMasterState('personalizing');
            mawf.CartView.productEditState('editing');
            mawf.CartView.syncRoot('personalizer', 'in');               // Sync donation personalizer data to pers. form
            
        } else {
            mawf.CartView.productMasterState('picking');
        }
        

        $.fancybox({
            href: '#js-prod-personalizer',
            autoSize: false,
            width: '960px',
            height: '596px',
            scrolling: 'no',
            padding: 0,
            modal: true,
            closeBtn : false,
            margin: [5,5,5,5],
            afterShow: function() {
                mawf.$personalizer.find('select').trigger('change'); // Uniform needs help with session restore update of hidden selects
                $.fancybox.update();                                // Ensure fancybox resizes to be scrollable with lower resolutions  
            },
            afterClose: function() {
                mawf.shutDownProductModal();
            }
        });
        return false;
    });


// PRODUCT BROWSER BUTTONS - CATEGORY, PREVIEW/SELECT, SELECT
//
// TOOD - abstract the callback  and move to helpers
    $('#js-product-browser').on('click', function (evt) {
// console.log('Picker hit');
        var dataURL,$container, $target = $(evt.target);

        if ($target.is('.sidenav-btn')) {                           // SIDENAV NAVIGATION
            mawf.loadGridImages($target.data('grid'));
            mawf.CartView.productInPreview('');

        } else if ($target.is('.prev-btn')) {                       // PRODUCT PREVIEW
console.log('hit');
            $container = $target
                .closest('.js-prod-section')
                .find('.preview .preview')
                .html('')
                .addClass('awaitingContent');
            mawf.CartView.setProductData($target);
            dataURL = config.getService('ProductPreview').endpoint + mawf.CartView.productID();
            mawf.CartView.productInPreview(mawf.CartView.browserProductType());

            $.get(dataURL, function(data) {
                var markup = mawf.CartView.buildProductPreview(data);
                mawf.CartView.updateProductPreview($container, markup);
            })
            .error(function() {
                mawf.CartView.updateProductPreview($container, markup);
            });
                                                                    // PRODUCT SELECTION
        } else if ( $target.is('.select-btn') )  {
            mawf.CartView.setProductData($target);
            mawf.CartView.productType( mawf.CartView.browserProductType() ); // Set productType to browserProductType
            mawf.persFormVal.clearAllFormErrors(mawf.$personalizer);
            mawf.CartView.productMasterState('personalizing');      // Set master state
            $.fancybox.update();                                    // Ensure fancybox resizes to be scrollable with lower resolutions

        } else if ( $target.is('.js_sel-and-cont') )  {
            mawf.persFormVal.clearAllFormErrors(mawf.$personalizer);
            mawf.CartView.productMasterState('personalizing');      // Set master state

        } else if ( $target.is('a') && $target.parent().parent().is('.blurb') ) {
            window.open( $target.attr('href'), '_blank' );
        } 

        return false;
    });

//
// WHATS THIS MODAL
//
    $('.js-wt-launch').click(function(){
        $.fancybox({
            href: '#js-whats-this'
        });
        return false;
    });

// LEAR MORE LINK - works without this listener but subsequent dynamically added donations fail to launch the link
    $(".jsFormSection").eq(0).on('click', '.fb-inline', function (e) {
		e.preventDefault();
        var $this = $(this);
        $.fancybox.open({
            href: $this.attr('href'),
            type: 'inline'
        });
    });

// ######################################################################
// ### END LISTENERS ####################################################
// ######################################################################



// ######################################################################
// ### STEP FOCUSING ####################################################
// ######################################################################
//
// mawf.addFocusState()
// Adds the .active class (bright blue border) to a step - can be passed an integer for step number, from listener with event,
//
    mawf.addFocusState = function(arg) {
        var $step;
if ( mawf.bug && mawf.bug.logStepFocusing ) { console.log('+++ addFocusState() called by ' + arg.type + ' on ' + mawf.bug.show(arg.target), arg.target); }      

        if ( typeof arg === 'number' )  { 
            $step = mawf.mainFormVal.$form.data('sections')[arg].$el; // TODO - break reliance on form validator by caching the step sections separately
        } else {
            $step = arg.target ? $(arg.target).closest('.donate-wrap') : arg.closest('.donate-wrap');
        }

        if ( $step === undefined ) {                            // Short ciruit or apply
if ( mawf.bug && mawf.bug.logStepFocusing ) {  console.log('addFocus error; Step not found'); }
            return false;

        } else if ( $step.is('.active') === false ) {
            mawf.clearFocusState();
            $step.addClass('active');
        }
    };

//
// mawf.clearFocusState()
// Removes the .active class (bright blue border) from all steps
//
    mawf.clearFocusState = function() {
 if ( mawf.bug && mawf.bug.logStepFocusing ) { console.log('--- clearFocusState() called'); }       
        $('.donate-wrap').removeClass('active next');
    };
//
// RADIO and CHECKBOX focus listeners
// Add the blue background to a focused area when a user clicks into an input or on a radio
//

    $('.donate-wrap').on('focusin click', ':input', mawf.addFocusState);
    $('.payment-types').on('focusin click','a', function(e) { mawf.addFocusState(e);});

// ######################################################################
// ### END STEP FOCUSING ################################################
// ######################################################################    



// ######################################################################
// ### SESSION SAVING  ##################################################
// ######################################################################
// TOOD - abstract the callback  and move to helpers
    // Save session on window unload    
    if ( !mawf.bug || mawf.bug.sessionSaveActive === true ) {
        window.onbeforeunload = function (e) {
            
            if ( mawf.formIsNotModified() ) {
                if (mawf.cartName) {
                    mawf.clearSession(); // Delete the cart
                }
                return;

            } else {
                mawf.saveSession();
            }

            if ( !$.browser.msie && (!mawf.bug || mawf.bug.blockPageAbandon) )  {
                var msg = 'Are you sure you want to leave the page? Any information entered will be lost.\n\nSelect Cancel to stay on the current page, or OK to return to the main donation page.';
                e = e || window.event;

                // For IE and Firefox
                if (e) {
                    e.returnValue = msg;
                }
             
                // For Safari / chrome
                return msg;
            }
            
        };

    }
};


//
// Cart View Model
//

mawf.CartViewModel = function (sessionData) {
    var self = this,
        prop;
    
    mawf.initDates({date1: sessionData.startDate1, date2: sessionData.startDate2});
    mawf.isChapterSite = sessionData.purchaserID !== sessionData.nationalID && sessionData.purchaserID !== sessionData.internationalID;

    mawf.siteID   = mawf.isChapterSite ?  sessionData.purchaserID : sessionData.nationalID;
    mawf.siteName = mawf.isChapterSite ?  sessionData.purchaserName : sessionData.nationalName;


    if ( !mawf.isChapterSite && mawf.serverInitParams ) {   // If this is not chapter donation page, discard the sitChapter name and id -
        mawf.serverInitParams.sitChapter    = sessionData.sitChapter     = ''; // they are not preset in SIT chap locator and the server will still send them
        mawf.serverInitParams.sitChapterID  = sessionData.sitChapterID   = '';
    }

    self.oldstate = {};
    self.donatorFieldTemplate = {
        Title :     'nameTitle',
        FirstName : 'fname1',
        MI :        'nameMi',
        LastName :  'lname1',

        Address1 :  'ccSAdd1',
        Address2 :  'ccSAdd2',
        City :      'ccCity',
        State :     'ccState',
        PostalCode :'ccPostal',
        Country :   'ccCountry',

        EMail :     'eAdd',

        WorkPhone : 'ccPhone',
        BusinessName: 'orgName',

        ProductID : 'productID',

        CCHolder :  'x_ccFName',
        CCNumber :  'x_ccNumber',
        CCExpMonth :'x_ccExpMonth',
        CCExpYear : 'x_ccExpYear',
        CSC :       'x_ccSecNumber'
    };

// Dictionary table to convert app var names to correct transaction var names
    self.donationFieldTemplate = {
        ProductID :     'productID',
        Amount :        'transactionAmount',
        DonorIntent :   'donorIntent',
        DayOfMonth :    'monthlyRecurrenceDate',

        LastName :      'productFromAttr',

        MHLastName :    'productPrettyName',
        MHFirst :       ['productFirstName', 'memFirstName'],
        MHMI :          ['productMI', 'memMI'],
        MHLast :        ['productLastName', 'memLastName'],

        MemorialName :  ['memAttr', 'memName'],
        MemorialFirst : 'memFirstName',
        MemorialMI :    'memMI',
        MemorialLast :  'memLastName',
        MHEMail :       'productEmail',

        Address1 :      'productAddress1',
        Address2 :      'productAddress2',
        City :          'productCity',
        State :         'productState',
        PostalCode :    'productZip',
        Country :       'productCountry',

        Custom10 :      'productMsg1',
        Custom11 :      'productMsg2',
        Custom12 :      'productMsg3',

        Comments :      'productMsgLarge1' // TODO - both comments and custom10 are associated with the same model var, a new model var should be created to avoid sending the same data to the processor in two different processor fields


    };

    self.syncList = {
        personalizer : [
            "productType",
            "productID",
            "productTitle",
            "productThumbPath",
            "productCategory",
            "productCategoryCode",

            "leaveProductBlank",

            "productFirstName",
            "productMI",
            "productLastName",
            'productEmail',

            "productAddress1",
            "productAddress2",
            "productCity",
            "productState",
            "productZip",
            "productCountry",

            "memName",
            "memFirstName",
            "memMI",
            "memLastName",
            "memAttr",

            "memAddress1",
            "memAddress2",
            "memCity",
            "memState",
            "memZip",
            "memEmail",

            "productMsgLarge1",
            "productMsg1",
            "productMsg2",
            "productMsg3",

            "productFromFirst",
            "productFromLast",
            "productFromEmail",
            "productFromAttr"
            ],
        prodModalStates : [
            "productType",
            "product1Category",
            "product2Category",
            "product3Category"
        ],
        chapterPicker: [],
        countryPicker: [
            "countryLocation"
        ]
    };

    // Set starting observable values.
    var observables_values = {

        x_ccExpMonth            : '',                    // Prefixing with x_ to omit a var
        x_ccExpYear             : '',                    // from session saving
        x_ccFName               : '',
        x_ccNumber              : '',
        x_ccSecNumber           : '',

        ccCity                  : '',
        ccCountry               : 'US',
        ccPostal                : '',
        ccSAdd1                 : '',
        ccSAdd2                 : '',
        ccState                 : '',

        hasActiveDonation       : false,
        isMultiDonation         : true,
        hasMonthlyDonation      : false,
        donationSelectInProcess : true,
        productInPreview        : '',
        showSecondFormSection   : false,
        paymentType             : 'creditCard',
        purchaserID             : '',
        purchaserName           : '',
        cwsid                   : '',

        nameTitle               : '',
        fname1                  : '',
        lname1                  : '',
        nameMi                  : '',
        orgName                 : '',
        ccPhone                 : '',
        eAdd                    : '',
        eAddConfirm             : '',

        productID               : '',                        // also synced to donation
        productThumbPath        : '',                // also synced to donation
        productCategory         : '',                // also synced to donation
        productType             : 1,                     // also synced to donation

        browserProductType      : 1,
        product1Category        : 1,
        product2Category        : 1,
        product3Category        : 1,
        productMasterState      : '',
        productEditState        : '',

        localizedCurrencySymbol : '',
        donationAmt1            : 30,
        donationAmt2            : 50,
        donationAmt3            : 100,
        donationAmt4            : 0,
        donationAmt5            : 0,
        donationAmt6            : 0,
        donationAmt7            : 0,
        minimumDonation         : 5,

        donationType1Label      : 'Single Donation',
        donationType2Label      : 'Monthly Pledge',
        nationalID              : '',
        nationalName            : '',

        clearFormMessage        : 'Clearing the form will remove all your entered information. Are you sure you wish to proceed?',
        clearFormMessageYes     : 'Yes, clear form',
        clearFormMessageNo      : 'No, take me back to the form',

        hasInternationalIntent  : false,         // Visiblity bool for opt in
        updateInternational     : false,             // Checked? bool for opt in
        internationalName       : '',
        internationalID         : '',

        sectionAddressState     : '',
        sectionPaymentState     : '',
        sectionPersonalState    : '',
        sectionSubmitState      : '',
        sectionTypeState        : '',

        sitChapter              : '',
        sitChapterID            : '',
        updateLocal             : mawf.isChapterSite,
        updateNational          : !mawf.isChapterSite,

        startDate1              : 5,
        startDate2              : 20,

        leaveProductBlank       : false,             // Variables below this point are in the root
        productPrettyName       : '',                // soley to act as a temp repo for syncing SINGLE INSTANCE MODALS
        productFirstName        : '',                // (PRIMARILY THE PRODUCT MODAL) with an active donation
        productMI               : '',
        productLastName         : '',
        productEmail            : '',

        productAddress1         : '',
        productAddress2         : '',
        productCity             : '',
        productState            : '',
        productZip              : '',
        productCountry          : 'US',

        countryLocation         : '',                // Geo based donation dest

        productTitle            : '',
        productCategoryCode     : '',

        memName                 : '',
        memFirstName            : '',
        memMI                   : '',
        memLastName             : '',
        memAttr                 : '',

        memAddress1             : '',
        memAddress2             : '',
        memCity                 : '',
        memState                : '',
        memZip                  : '',
        memEmail                : '',

        productMsgLarge1        : '',
        productMsg1             : '',
        productMsg2             : '',
        productMsg3             : '',

        productFromFirst        : '',
        productFromLast         : '',
        productFromEmail        : '',
        productFromAttr         : ''
    };

    // Permanently update observables defaults with servers app defaults
    $.extend(observables_values, mawf.serverInitParams);


    // EXTEND MODEL WITH RESTORED DONATION DATA
    if ( ($.querystring.CWSID || $.querystring.cwsid) && $.jStorage.index().length === 0 ) {
if ( mawf.bug && mawf.bug.logCWSIDImport === true) { console.log('Restore from CWSID triggered'); }     

        var qs  = $.querystring.CWSID || $.querystring.cwsid,
            url = config.getService('GetTransactionRecord').endpoint;
        
        qs = 'CWSID=' + qs;

        $.ajax({
            'url': url + '?' + qs,
            'dataType': 'json',
            'cache': true,
            'type': 'get',
            'timeout': 1500,
            'async': false

        }).done(function(transaction){
if ( mawf.bug && mawf.bug.logCWSIDImport === true) { console.log('CWSID restore: returned',transaction); }      
            var val, prop, CW = self.donatorFieldTemplate;

            for ( prop in CW ) {

                val = transaction[prop];

                if ( CW[prop].indexOf('x_') !== 0 ) {               // Avoid private data
                    sessionData[CW[prop]] = val;
                }
            }

            sessionData.eAddConfirm =  transaction.EMail;           // Manually copy the email into the email confirm field
        });
    }


// Set observables - update observables_values with init vars; if cart is reset() then inits will not be lost
    for ( prop in observables_values ) {
        if (sessionData[prop] !== undefined) {
           self[prop] = ko.observable(sessionData[prop]);
            // save data exists - set to prev value (prev values saved to cart include default values, "", etc...)

        } else {
            self[prop] = ko.observable(observables_values[prop]);
            // no saved data - set to default value (observable - mainly used for credit card data since that is not saved, or a brand new transaction)
        }
    }

// Build donations array
    if (sessionData.donations !== undefined) {                  // If there are existing donations
        self.donations = ko.observableArray();
        for (var i in sessionData.donations) {                      // Loop and push each one onto model
            self.donations.push(new mawf.CreateDonation({
                donation: sessionData.donations[i]
            }, this));
        }

    } else {
        self.donations = ko.observableArray([                   // Else just create a blank donation
            new mawf.CreateDonation()
        ]);
    }


// Donation type pretty text titles  ## TODO: Need localization here?? ###
    self.donationTitles = [
        null,                                                       // Filler for 0 base
        'Single Donation',                                          // Single no product
        'Monthly Pledge'                                            // Monthly no product
    ];

    self.getDateSuffix = function(intDate) {
        if ( $.inArray(intDate, [1,21,31]) > -1) { return 'st'; }   // 1st 21st 31st
        else if ( $.inArray(intDate, [2,22]) > -1) { return 'nd'; } // 2nd 22nd
        else if ( $.inArray(intDate, [3,23]) > -1) { return 'rd'; } // 3rd 23rd
        else { return 'th'; }
        // 4th 5th 6th 7th 8th 9th 10th 11th 12th 13th 14th 15th 16th 
        // 17th 18th 19ht 20th 24th 25h 26th 27th 28th 29th 30th

    };
    self.getDateSuffix.functionType = 'helper';

    self.startDate1Pretty = ko.computed(function() {
if ( mawf.bug && mawf.bug.logComputeds === true) { console.log('computed startDate1Pretty fired'); }
        return self.startDate1() + self.getDateSuffix(self.startDate1()) +  ' of the month';
    });
    self.startDate1Pretty.functionType = 'computed';

    self.startDate2Pretty = ko.computed(function() {
if ( mawf.bug && mawf.bug.logComputeds === true) { console.log('computed startDate2Pretty fired'); }
        return self.startDate2() + self.getDateSuffix(self.startDate2()) +  ' of the month';
    });
    self.startDate2Pretty.functionType = 'computed';

// totalDonationToday()
// Get total donation Today Amount - loop donation arrays
    self.totalDonationToday = ko.computed(function() {
if ( mawf.bug && mawf.bug.logComputeds === true) { console.log('computed totalDonationToday fired'); }
        var pretty, i, l,
            total = 0,
            d = self.donations();

        for (i = 0, l = d.length; i < l; i++) {
            total += d[i].donationType() == 2 ? +d[i].donationAmount() + d[i].otherDonationAmount() : 0;
            total += d[i].donationType() != 2 ? +d[i].donationAmount() + d[i].otherDonationAmount() : 0;
        }

        return total;
    }, self);
    self.totalDonationToday.functionType = 'computed';

// prettyTotalDonationToday()
// If there is a decimal, ensure that it has two decimal places
    self.prettyTotalDonationToday = ko.computed(function() {
if ( mawf.bug && mawf.bug.logComputeds === true) { console.log('computed prettyTotalDonationToday fired'); }
        return mawf.prettyMoney(self.totalDonationToday());
    });
    self.prettyTotalDonationToday.functionType = 'computed';

// totalDonationMonthly()
// Get total monthly donation Amount from all donations
//     self.totalDonationMonthly = ko.computed(function() {
// if ( mawf.bug && mawf.bug.logComputeds === true) { console.log('computed totalDonationMonthly fired'); }
//     var total = 0,
//         i, l, d = self.donations();
//     for (i = 0, l = d.length; i < l; i++) {
//         total += d[i].donationType() == 2 ? +(d[i].donationAmount()) : 0;
//     }
//     return total;
//     }, self);
//     self.totalDonationMonthly.functionType = 'computed';

// Get total donation by date1
    self.totalDonationByDate1 = ko.computed(function() {
if ( mawf.bug && mawf.bug.logComputeds === true) { console.log('computed totalDonationByDate1 fired'); }
        var total = 0,
            i, l, d = self.donations();
        for (i = 0, l = d.length; i < l; i++) {
            if (d[i].donationType() == 2 && d[i].monthlyStartType() == 'date1') {
                total += +d[i].donationAmount() + d[i].otherDonationAmount();
            }
        }
        return total;
    }, self);
    self.totalDonationByDate1.functionType = 'computed';

// Get total donation by date2
    self.totalDonationByDate2 = ko.computed(function() {
if ( mawf.bug && mawf.bug.logComputeds === true) { console.log('computed totalDonationByDate2 fired'); }
        var total = 0,
            i, l, d = self.donations();
        for (i = 0, l = d.length; i < l; i++) {
            if (d[i].donationType() == 2 && d[i].monthlyStartType() == 'date2') {
                total += +d[i].donationAmount() + d[i].otherDonationAmount();
            }
        }
        return total;
    }, self);
    self.totalDonationByDate2.functionType = 'computed';


// allowAccess() - enables and disables access to the form's personal info section based
// on the viewmodels donationSelectInProcess variable
    self.allowAccess = ko.computed(function() {
if ( mawf.bug && mawf.bug.logComputeds === true) { console.log('computed allowAccess fired'); }
        if ( self.donationSelectInProcess() )  {
            $('.jsDisableWrap :input')
            .attr('disabled', '')
            .find('.button-submit')
            .addClass('disabled');
        } else  {
            $('.jsDisableWrap :input')
                .removeAttr('disabled')
                .find('.button-submit')
                .removeClass('disabled');
            $('.jsDisableWrap .disabled')   // Have to manually remove uniform's disabled class
                .removeClass('disabled');
        }
    });
    self.allowAccess.functionType = 'computed';


    self.showMasterSummarySameDay = ko.computed(function() {
        if ( self.totalDonationToday() !== 0 || (mawf.dates.todayDayNumber !== self.startDate1() && mawf.dates.todayDayNumber !== self.startDate2()) ) {
            return true;
        }

        if ( self.totalDonationToday() === 0 ) {
            if ( self.totalDonationByDate1() > 0 && mawf.dates.todayDayNumber === self.startDate1() ) {
                return false;
            }
            if ( self.totalDonationByDate2() > 0 && mawf.dates.todayDayNumber === self.startDate2() ) {
                return false;
            }
        }
        return true;
    });
    self.showMasterSummarySameDay.functionType = 'computed';

// Call this when we are done building the ecard.
    self.completeCardSelection = function () {
console.log('Completing product selection');
        var donation;

        if ( self.leaveProductBlank() === false && mawf.persFormVal.isValid(mawf.$personalizer, true) === false ) {
            return false;
        } else {
            donation = self.getOpenDonation('obj');
        }
        
        donation.ecardFinish(true);
        donation.hasProduct(true);
        
        $.fancybox.close();

        $.scrollTo($('.js_donationConfigurator').last(), 300, {offset: -100});
    };
    self.completeCardSelection.functionType = 'helper';


/**
 * Triggered by Finished button click. Sets correct leaveProductBlank bool and calls completCardSelection
 * @return {[type]} [description]
 */
    self.acceptPersonalizedProduct = function() {
        self.leaveProductBlank(false);
        self.completeCardSelection();
    };
    self.acceptPersonalizedProduct.functionType = 'helper'; 


/**
 * Triggered by leave blank button click; sets blank bool and calls completeCardSelection. TODO: Here is where we might clear pers name/address data
 * so that if the user filled any form fields we could clear them when they selected leave blank
 */
    self.acceptBlankProduct = function() {
        self.leaveProductBlank(true);
        self.completeCardSelection();
    };
    self.acceptBlankProduct.funtionType = 'helper';


    self.navigateBackToSelection = function() {
        self.productInPreview('');
        self.productMasterState('picking');
        self.clearPersonalizer(false);
    };
    self.navigateBackToSelection.functionType = 'helper';


/**
 * Hooks to cancel button on product modal - skips sync, closes fancybox
 * @return {[type]} [description]
 */
    self.cancelProductEdit = function() {
    	mawf.CartView.productEditState('canceled');
        $.fancybox.close();
    };
    self.cancelProductEdit.functionType= 'helper';


// Tidy up picker - reset categories and type to 1, and state to picking
    self.resetProductBrowser = function() {
if ( mawf.bug.logPersonalizerSyncing ) { console.log('resetProductBrowser() called'); }

        self.browserProductType(1);
        self.product1Category(1);
        self.product2Category(1);
        self.product3Category(1);
        self.productMasterState('');
    };
    self.resetProductBrowser.functionType = 'helper';

// getSelectedThumbPath
// Takes a string product id, finds the current prod section, current grid, prod
// button that matches the id and returns the img thereins src attribute
    self.getSelectedThumbPath = function(strProdID) {
        var $card;
        $card = mawf.$browser
            .find('.js-prod-section:visible')
            .find('.js-prod-cat-grid:visible')
            .find('.card-btn[data-prod-id='+strProdID+']');
        if ( $card.size() === 0 ) { // uppercase id server
            $card = mawf.$browser
                .find('.js-prod-section:visible')
                .find('.js-prod-cat-grid:visible')
                .find('.card-btn[data-prod-id='+strProdID.toUpperCase()+']');
        }
        return $card
            .find('img')
            .attr('src');
    };
    self.getSelectedThumbPath.functionType = 'helper';


// --------------------- Model Actions ---------------------- //

//
// getOpenDonation(['obj'|'int'])
// returns a donation object or its location index on the donations array or false if no donation is open
//
    self.getOpenDonation = function(returnType) {
        var l = self.donations().length;
        returnType = returnType || 'int';
        while( l-- ) {
            if ( self.donations()[l].isInProcess() ) { return returnType == 'int' ? l : self.donations()[l]; }
        }
        return false;
    };


// Reset model data.
    self.reset = function () {
        self.showSecondFormSection(false);                      // Return lower form to hidden state
        $(window).scrollTop(0);                                 // Scroll to top
        mawf.addFocusState(0);                                  // Force focus on step 1

        self.copyValues(self, observables_values);              // Reset personal data to default vals
        self.donations.removeAll();                             // Clear all donations
        self.donations.push(new mawf.CreateDonation({}));       // Insert a new donation

        self.resetUniform();                                    // Force uniform to update view
        mawf.locatorInit();                                     // Init new locator listeners
        
        $.jStorage.flush('cart');                               // Flush localStorage


       // mawf.initProductCategories();                           // Re-examine the personalizer image grids
                                                                // and ensure any visible grids have images
                                                                // preloaded - is this needed? prod preview is not held in the donation
                                                                // config markup...
    };
    self.reset.functionType = 'helper';

// Parses form for uniform els and triggers the change event on them to force them to update the view
    self.resetUniform = function() {
        $('.selector select').add('.radio input').trigger('change');

        $('div.radio .checked').removeClass('checked');         // Uniform title radios need special help (hardcoded uni els are manipulated via KO)
    };
    self.resetUniform.functionType = 'helper';

    self.copyValues = function(to, from) {
// console.warn('copyvalues called with to:',to,' from:',from);
        for (var x in from) {                                   // Reset to default values ignoring
            if ( from[x].functionType === undefined && x != 'observables_values' ) {
                to[x]( from[x] );                               // any computed or helper functions
// console.log('copyValues(): '+x);
// 
            } else {
// console.log('copyValues() SKIP '+x);
            }
        }
    };
    self.copyValues.functionType = "helper";

// Set Donation
    self.setDonationAmount = function (donation) {
        donation.x_donationAmountError(false);
        
        donation.otherDonationUserEntry('');
        donation.otherDonationActive(false);
        donation.otherDonationAmount(0);
        
        donation.isValid();
    };
    self.setDonationAmount.functionType = 'helper';



// clearChapterLocatorError()
// Clears any existing error on the Local Chapter Locator - triggered upon switching to LCL so previous errors arent showing 
    self.clearChapterLocatorError = function(evt) {
        // clear the only possible error message - 
        // set new destination id
        mawf.mainFormVal.clearError($(evt.target).parent().parent().siblings('.js_chapterSearch').find('.js_donationDest').data('guide'));
    };


// setOtherDonationError()
    self.setOtherDonationError = function(viewContext) {
        viewContext.x_donationAmountError(true);
        viewContext.x_donationAmountErrorType('odm');
        viewContext.otherDonationAmount(0);
        viewContext.donationAmount(0);
    };
    self.setOtherDonationError.functionType = 'helper';



// setOtherDonationError()
    self.clearOtherDonationError = function(viewContext) {
        if ( viewContext.x_donationAmountError() ) {
            viewContext.x_donationAmountError(false);
            viewContext.x_donationAmountErrorType('');
        }
    };
    self.clearOtherDonationError.functionType = 'helper';

// // Set the donation destination
//     self.setDest = function (viewContext, el) {
//         var $el = $(el.currentTarget),
//             $component;

//         if ($el.hasClass('jschap')) {
//             viewContext.donationDestType('chapter');


//         } else if ( $el.hasClass('jsnat') ) {                           // Is a MAW USA donation
//             viewContext.donationDestType('national');
//             viewContext.donationDest(nationalName());

//         } else if ($el.hasClass('jsinter')) {                           // Is a International donation
//             viewContext.donationDestType('international');
//             if (viewContext.countryLocation() !== '') {
//                 viewContext.donationDest( viewContext.countryLocation() );
//             } else {
//                 viewContext.donationDest('ragnar');
//             }
//         }
//     };
//     self.setDest.functionType = 'helper';

// Set chapter text with data sent from typeahead module
    self.setDonationDest = function(txt, location) {
        // find inprocess donation and set
// console.log(self.donations()[0]);
        var i = 0,
            d = self.donations;
            l = d().length;

        for (i, d, l; i < l; i++) {
            if ( d()[i].isInProcess() ) {               // Find open donation
                if (location == 'chapter') {            // Set chapterLocation or
                    d()[i].chapterLocation(txt);
                } else {
                    d()[i].countryLocation(txt);        // set countryLocation
                }
                //d()[i].donationDest(txt);             // and set donationDest
            }
        }
    };
    self.setDonationDest.functionType = 'helper';

// Cancel Donation
    self.cancelDonation = function (donation) {
        if (self.donations().length <= 1) {                                 // There is only one donation -> remove and add a blank one
            self.showSecondFormSection(false);
            self.donations.remove(donation);                                // Remove this donation
            self.donations.push(new mawf.CreateDonation({}));               // Add new donation
            mawf.CartView.donationSelectInProcess(donation, true);          // Set the master flag to indicate donation in process (removes check)
            mawf.addFocusState(0);                                              // Focus the new donation
            mawf.locatorInit(true);                                         // Catch dynamically added locators
            mawf.mainFormVal.updateSectionValidation(0);                    // Adds new locator input to validator

            $.scrollTo($('.js_donationConfigurator').last(), 300, {offset: -100});

        } else {                                                            // There are multiple donations -> remove this one
            self.donations.remove(donation);                                // Remove this donation
            self.setMasterProcessState();                                   // Update process state
            if ( !self.hasActiveDonation() ) {                                      // If no donations are in process
                self.showSecondFormSection(true);                           // Reveal other form section
                mawf.addFocusState(1);
            }
            $.scrollTo($('.summary').last(), 300, {offset: -100});          // Screwl it

            self.showSecondFormSection(true);

        }

        self.setInternationalIntent();                                      // Re-assess international intent
        mawf.determinePayPalVisibility();
        mawf.mainFormVal.cleanUpSectionGuide(0);                            // Trigger validator to re-evaluate this section (removing the inputs removed from the dom)

    };
    self.cancelDonation.functionType = 'helper';


    self.addDonation = function () {                                    // Launched from Add Another Donation button
        mawf.addFocusState(0);                                              // Apply active state on Step 1
        self.donations.push(new mawf.CreateDonation({}));               // Add new donation
        self.setMasterProcessState();
        mawf.locatorInit(true);
        mawf.mainFormVal.updateSectionValidation(0); // Bring in new inputs into validator

        $.scrollTo($('.js_donationConfigurator').last(), 300, {offset: -100});

        self.showSecondFormSection(false);

    };
    self.addDonation.functionType = 'helper';


    // We call this when Save & Add Donation is clicked.
    self.saveAndAdd = function (donation, el) {                         // When launched from Save and Add Another button
        if ( donation.isValid() === false ) {                           // we make sure the current donation is valid
            donation.x_donationAmountError(true);
            return false;
        }

        if ($(el.currentTarget).hasClass('disabled')) {                 // Short - button is disabled
            return false;
        }

        if ( donation.localChapterLocatorIsValid(donation, el) === false ) {            // Local chapter destination is set and the chapter is not chosen
            return false;
        }
                  
        donation.isInProcess(false);                                    // Close current donation isInProcess
        donation.newDonation(false);                                    // Close current donation newDonation

        self.donations.push(new mawf.CreateDonation({}));               // Add new donation
        self.setMasterProcessState();
        mawf.mainFormVal.updateSectionValidation(0);                    // Bring in new inputs into validator
        mawf.locatorInit(true);                                         // Init new locators

        $.scrollTo($('.js_donationConfigurator').last(), 300, {offset: -100});

    };
    self.saveAndAdd.functionType = 'helper';



// dupeDonation()
// Duplicates the contents of the donation obj while
// skipping helper & computed functions
//
    self.dupeDonation = function (viewContext, el) {
        var view = new mawf.CreateDonation({});
        for (var x in view) {           // skip helpers and computeds
            if ( viewContext[x].functionType === undefined ) {
                view[x]( viewContext[x]() );
            }
        }
        self.donations.push(view);
        mawf.mainFormVal.updateSectionValidation(0);                    // Bring in new inputs into validator
        mawf.locatorInit(true);

        $.scrollTo($('.summary').last(), 300, {offset: -100});          // Screwl it
    };
    self.dupeDonation.functionType = 'helper';

/**
 * Triggered when a user clicks review/edit on a rolled up donation and then selects Save Changes
 * @param  {obj} donation - donation viewContext
 * @return {undefined}
 */
    self.saveChanges = function (donation) {                        // Test chapter input
        if ( mawf.mainFormVal.validateEl( mawf.mainFormVal.$form.data('sections')[0].inputs[1], true ) === false ) {
            return false;
        }

        if ( donation.isValid() === false ) {                           // Test donation amount
            donation.x_donationAmountError(true);
            return false;
        }

        donation.isInProcess(false);                                    // Passed - lets do this
        self.donationSelectInProcess(false);

        self.setInternationalIntent();

        mawf.addFocusState(1);                                          // Focus secondary
        self.showSecondFormSection(true);                               // Reveal secondary
        
        $.scrollTo($('.summary').last(), 300, {offset: -100});          // Screwl it
        //mawf.clearPersonalizer(true);                                 // After closing up donation clean out product info from root
    };
    self.saveChanges.functionType = 'helper';

//
// discardChanges()
// When a donation is opened to edit a copy of the initial state is made in oldstate. If the discard changes button
// is clicked, the old state is used to return the donation to its original state.
//
    self.discardChanges = function (viewContext, el) {
        for (var i in self.oldstate) {
            viewContext[i](self.oldstate[i]);
        }

        self.oldstate = {};                                             // Clear oldstate

        if (viewContext.hasOwnProperty('isInProcess')) {
            viewContext.isInProcess(false);
            self.donationSelectInProcess(false);
        }

        $.scrollTo($('.summary').last(), 300, {offset: -100});          // Screwl it

        self.showSecondFormSection(true);

    };
    self.discardChanges.functionType = 'helper';

// Check to see if any donation is not valid.
    self.hasErrors = function (viewContext, state) {
        for (var i = 0, l = self.donations().length; i < l; i++) {
            if (!self.donations()[i].isValid()) {
                return true;
            }
        }

        return false;
    };
    self.hasErrors.functionType = 'helper';

// Sets individual donation process state and triggers master update
    self.setDonationProcessState = function (thisDonation, state) {
console.log('donation process state change requested to '+state);
        var noDonationIsInProgress = true,
            old = {},
            i;

        // Manually calculate masterProcessState
        for (i = 0, l = self.donations().length; i < l; i++) {          // Troll all donations and determine
            if (self.donations()[i].isInProcess()) {                    // if any are in process
                noDonationIsInProgress = false;
            }
        }

        if ( thisDonation.isInProcess() || noDonationIsInProgress ) {   // If donation accepting state change is
            self.backUpDonationState(thisDonation);                     // is the one in progress or no donations
            thisDonation.isInProcess(state);                            // are in progress, allow set state
            self.setMasterProcessState();
            self.showSecondFormSection(false);                          // Hide lower steps
            mawf.addFocusState(0);                                      // Make sure step 1 sports the blue
        }
    };
    self.setDonationProcessState.functionType = 'helper';


// backUpDonationState()
// Store the current state of the donation in an object (self.oldstate) attached to the namespace
//
    self.backUpDonationState = function(donation) {
        var i, old ={};
        for (i in donation) {                                       // Store the old state. (Moving this from the top
            if ( donation[i].functionType === undefined ) {         // of the function for perf reasons. We don't
                old[i] = donation[i]();
            }
        }
        self.oldstate = old;
    };
    self.backUpDonationState.functionType = 'helper';

// setMasterProcessState()
// Sets hasActiveDonation to either false or the number of an active donation
//
    self.setMasterProcessState = function () {
        self.hasActiveDonation( self.getOpenDonation() );
        self.donationSelectInProcess( self.hasActiveDonation() !== false );
    };
    self.setMasterProcessState.functionType = 'helper';

//
// syncRoot()
// Syncs identically named variables in root to/from open donation
//
    self.syncRoot = function(syncList, syncDirection) {
if ( mawf.bug.logPersonalizerSyncing ) { console.log('syncRoot('+syncList+', '+syncDirection+') called'); }
        var l, to, list, from;

            list = self.syncList[syncList];
            l    = list.length;
            to   = syncDirection == 'in' ? self : self.getOpenDonation('obj'),
            from = syncDirection == 'in' ? self.getOpenDonation('obj') : self;

        while ( l-- ) {
            to[list[l]]( from[list[l]]() );
        }

    };
    self.syncRoot.functionType = 'helper';


// clearPersonalizer()
// Removes all personalizer data from root or a donation, to be called on modal cancel-btn click.
// Will sync to donation via syncRoot() when donation is saved 
//
    self.clearPersonalizer = function(resetViews, donation) {
if ( mawf.bug.logPersonalizerSyncing ) { console.log('clearPersonalizer(resetViews:'+resetViews+' called on', donation); }

        var $selects    = mawf.$personalizer.find('select'),
            list        = self.syncList.personalizer,
            l           = list.length,
            targetModel;

        resetViews  = resetViews === undefined ? true : resetViews;     // defaults to true
        targetModel = donation || self;                                 // defaults to root

        // Clear values
        while (l--) {
            targetModel[list[l]]('');
        }

        // TODO: This is an awkward location to set a default, could the persoalizer list be a lookup table or used to pull in values from the vm
        self.productCountry('US');  // Default value is US 

        // Reset some defaults
        if ( resetViews ) {
            self.resetProductBrowser();
        }

        $selects.eq(0).find('option').eq(0).prop('selected',true);
        $selects.trigger('change'); // Uniform needs a change event to trigger udpate

    };

//
// getProductID($obj)
// takes a dom element inside a product "button" and returns product its product ID
    self.getProductID = function($obj) {
        var id;
        id = $obj.closest('.card-btn').attr('data-prod-id') || false;
        if ( id !== false ) { id = id.toLowerCase(); }
        return id;
    };
    self.getProductID.functionType = 'helper';

//
// getProductCategory($obj)
// Takes a dom element inside a product "button" and returns
// its form variation category
    self.getProductForm = function($obj) {
        return $obj.closest('.card-btn').attr('data-prod-cat');
    };
    self.getProductForm.functionType = 'helper';

//
//  updateProductPreview()
//  Inserts preview html into a target
    self.updateProductPreview = function($target, content) {
        if ( content ) {
            $target
                .removeClass('awaitingContent')
                .closest('.js-prod-section')
                .find('.preview .preview')
                .html(content)
                .scrollTop(0);  
        }
    };

//
//  buildProductPreview()
//  in: json obj representing product preview
//  out: product preview in html
    self.buildProductPreview = function(data) {
        var htm = '',
            json = typeof data === 'string' ? $.parseJSON(data) : data;

        try {
            // loop and parse
            htm += '<h3>'+json.Title;
            htm += json.Size && json.Size !== '' ? '<span class="card-detail">Size: '+json.Size+'</span>' : '';
            htm += '</h3>';
            for (var i = 0,l = json.Views.length, prop; i<l; i++) {
                htm += '<div class="blurb">';
                htm += json.Views[i].Media      !== '' ? '<img src="'+json.Views[i].Media+'" alt="">' : '';
                htm += json.Views[i].Head       !== '' ? '<h4>'+json.Views[i].Head+'</h4>' : '';
                htm += json.Views[i].Description!== '' ? json.Views[i].Description : '';
                htm += '</div>';
            }
        } catch(e) {
            htm += '<div class="statMsg">Oops! Preview not available at this time.</div>';
        }
        return htm;
    };

// Configure Payment
// Run validation on this donation's amounts and chapter locator 
// TODO: re-organize this so its obvious where succeed and fail is - also possible refactor all saves/savechanges/cancels so they have cohesive structures
     self.saveDonation = function (donation, evt) {
        var chapterlocatorFlag = true, 
            donationFlag = true,
            clGuide;

        chapterLocatorFlag = donation.localChapterLocatorIsValid();
        donationFlag = donation.isValid();

        if ( chapterLocatorFlag && donationFlag ) {
            donation.newDonation(false);                        // Remove new flag
            self.setDonationProcessState(donation, false);      // Remove master flag
            self.setInternationalIntent();
            mawf.addFocusState(1);
            self.showSecondFormSection(true);
            $.scrollTo($('.summary').last(), 300, {offset: -100});          // Screwl it
            return;
        } 

        // Set Errors
        if (donationFlag === false) {
            donation.x_donationAmountError(true);
        }

        if  ( chapterLocatorFlag === false ) { // clguide undefined error showing here in IE9
            clGuide = $('.js_donationConfigurator').find( '#lclName'+self.getOpenDonation()).data('guide');
            if ( clGuide.isValid !== false ) {
                mawf.mainFormVal.setError( clGuide, 'errorInvalid' );
            }
        }

        return false;
    };
    self.saveDonation.functionType = 'helper';

    // setInternationalIntent()
    // if any donation has an international donor intent reveal the donor intent opt in
    self.setInternationalIntent = function() {
// console.log('setInternationalIntent() called: ');
        for ( var i in self.donations() ) {
            if ( self.donations()[i].donationDestType() == 'international') {
                self.hasInternationalIntent(true);
                return true;
            }
        }
        self.hasInternationalIntent(false);
    };
    self.setInternationalIntent.functionType = "helper";


    //
    // setProductData($obj)
    // Takes a select-btn or prev-btn arg and extracts the product ID, product Title,
    // and product form type code and inserts that into the root model
    self.setProductData = function($target) {
        var prodID, prodTitle, formConfig;

        prodID     = self.getProductID($target);                        // Product ID
        self.productID(prodID);
console.log('extracting '+prodID);
                                                                        // Product thumb
        self.productThumbPath(self.getSelectedThumbPath(prodID));

        prodTitle = $target.closest('.card-btn').find('span').text();   // Product title
        self.productTitle(prodTitle);
                                                                        // Product form variation
        formConfig = prodID.match(/^[a-zA-Z]+/); // Extract first alpha characters from product ID to spec form config or false
        formConfig = formConfig === null ? false : 'pr-' + formConfig;
        self.productCategoryCode(formConfig);
    };
    self.setProductData.functionType = 'helper';


    //
    // clearCC()
    // Clear all credit card data in the event of a paypal transaction
    self.clearCC = function() {
console.log('clear cc called');
        mawf.CartView.x_ccExpMonth('');
        mawf.CartView.x_ccExpYear('');
        mawf.CartView.x_ccFName('');
        mawf.CartView.x_ccNumber('');
        mawf.CartView.x_ccSecNumber('');
    };
    self.clearCC.functionType = 'helper';



    self.launchWhatsThis = function() {
        if ( mawf.CartView.isMultiDonation() === false || mawf.CartView.getOpenDonation() === false ) {
            $.fancybox({
                href: '#js-whats-this'
            });
        }
    };
    self.launchWhatsThis.functionType = 'helper';


    self.jumpProductTypes = function(targetProdType) {
        var curProdType = mawf.CartView.browserProductType(),
            curCatType = mawf.CartView['product' + curProdType + 'Category'](),
            catMatch;

        catMatch = mawf.matchCategories(curProdType, curCatType, targetProdType);

        if ( catMatch !== false ) {
            console.log('Setting prod type '+targetProdType+' category to '+catMatch);
            mawf.loadGridImages([targetProdType - 1, catMatch - 1]);
            mawf.CartView['product' + targetProdType + 'Category'](catMatch);
        }
        
        mawf.CartView.browserProductType(targetProdType);

    };

//
// STATE MANAGEMENT
//
    // sectionState()
    // Uses the donationSelectInProcess flag as a shortcut to set the done check on the donation field
    self.sectionState = ko.computed(function() {
if ( mawf.bug && mawf.bug.logComputeds === true) { console.log('computed sectionState fired'); }
        // Type section
        if (self.donationSelectInProcess()) { self.sectionTypeState({current:true}); }
        else                                { self.sectionTypeState({done: true}); }
    });
    self.sectionState.functionType = 'computed';

    // Next can only be applied to step 2
    // so we eval for donations closed and step 2 without a state class of done or error
    // we only want to provide the step arrow the first time
    self.setNextState = ko.computed(function(){
        if ( self.donationSelectInProcess() === false && self.sectionPersonalState() === '' ) {
            self.sectionPersonalState({next: true});
        }
    });
    self.setNextState.functionType = 'computed';

};


//
// CreateDonation()
// returns a individual donation object
//
mawf.CreateDonation = function(args, rootContext) {
    var self = this, i;

    args = args || {};

// Set starting observable values.
    self.observables_values = {
        newDonation: true,
        isInProcess: true,
        isInReview: false,

        chapterLocation: '',
        countryLocation: '',
        donationDestType: 'national',
        donorIntent: '100-000',

        donationType: 1,
        donationID: 0,

        donationAmount: 0,
        x_donationAmountError: false,
        x_donationAmountErrorType: '', // 'odm' || 'buttons'

        otherDonationActive: false,
        otherDonationUserEntry: '',
        otherDonationAmount: 0,

        monthlyStartType: 'date1',

        hasProduct: false,
        leaveProductBlank: false,

        productType: '',
        productCategory: '',
        productCategoryCode: '',
        
        productID: '',
        productTitle: '',
        productThumbPath: '',

        ecardFinish: false,
        productToOwner: false,

        productPrettyName: '',
        productFirstName: '',
        productMI: '',
        productLastName: '',
        productEmail: '',

        productAddress1: '',
        productAddress2: '',
        productCity: '',
        productState: '',
        productZip: '',
        productCountry: 'US',

        memName: '',
        memFirstName: '',
        memMI: '',
        memLastName: '',
        memAttr: '',

        memAddress1: '',
        memAddress2: '',
        memCity: '',
        memState: '',
        memZip: '',
        memEmail: '',

        productMsgLarge1: '',
        productMsg1: '',
        productMsg2: '',
        productMsg3: '',

        productFromFirst: '',
        productFromLast: '',
        productFromEmail: '',
        productFromAttr: '',

        product1Category: 1,
        product2Category: 1,
        product3Category: 1
    };

    if ( mawf.donationData ) {                                              // Extend defaults with any dynamic defaults
        $.extend(self.observables_values, mawf.donationData);
    }

// Build model data from observable values and args values with args taking precedence
//
    if ( args.donation ) {                                                  // Extend obs with any cart session
        $.extend(self.observables_values, args.donation);
    }

    for (i in self.observables_values) {                                    // Use observables to build donation model
        self[i] = ko.observable(self.observables_values[i]);
    }

    delete self.observables_values;             // Not needed and doesn't need to be backed up during a save


// Set donation Destination
//
    self.donationDest = ko.computed(function() {
if ( mawf.bug && mawf.bug.logComputeds === true) { console.log('computed donationDest fired'); }
        switch (self.donationDestType()) {                          // Monitor donationDestType
            case 'chapter' :
            return self.chapterLocation();

            case 'national' :
            return mawf.serverInitParams.nationalName; // TOOD - extremely hacky createDonation call needs to be moved outisde of mawf.CartViewModel() so we can rely on mawf.CartView to be available

            case 'international' :
            return self.countryLocation() !== '' ?  self.countryLocation() : mawf.CartView ?  mawf.CartView.internationalName() : mawf.CartViewModel['arguments'][0].internationalName; // Blank allowed, so if blank, set to main International
        }
    }, self);
    self.donationDest.functionType = 'computed';

// transactionAmount
// Returns the *active* donation amount
    self.transactionAmount = ko.computed(function() {
        return self.otherDonationActive() ? self.otherDonationAmount() : self.donationAmount();
    });
    self.transactionAmount.functionType = 'computed';


// Triggers setOtherDonation() on a change to otherDonationUserEntry
// cartview check is needed to abort page reload check before CartView is fully defined
//     self.otherDonationUserEntryMonitor = ko.computed(function() {
// if ( mawf.bug && mawf.bug.logComputeds === true) { console.log('computed otherDonationUserEntryMonitor fired'); }

//      if ( self.otherDonationUserEntry() !== '' && self.setOtherDonation ) {
//          self.setOtherDonation();

//      } else if ( self.setOtherDonation ) {
//          self.otherDonationAmount(0);
//      }
//     }).extend({ throttle: 500 });
//     self.otherDonationUserEntryMonitor.functionType = 'computed';

// Unique ID for each donation
    self.donationID = ko.computed(function() {
        return Math.floor(Math.random()*1E16);
    });
    self.donationID.functionType = 'computed';

// The combined honor name.
    self.honorName = ko.computed(function() {
if ( mawf.bug && mawf.bug.logComputeds === true) { console.log('computed honorName fired'); }
        return self.memFirstName() + ' ' + self.memLastName();
    });
    self.honorName.functionType = 'computed';

// The combined name.
    self.fullFromName = ko.computed(function() {
if ( mawf.bug && mawf.bug.logComputeds === true) { console.log('computed fullFromName fired'); }
        return self.productFromFirst() + ' ' + self.productFromLast();
    });
    self.fullFromName.functionType = 'computed';

// Quoted to attr
    self.prettyMemAttr = ko.computed(function() {
if ( mawf.bug && mawf.bug.logComputeds === true) { console.log('computed prettyMemAttr fired'); }
        return "&ldquo; "+self.memAttr()+"&rdquo;";
    });
    self.prettyMemAttr.functionType = 'computed';

// Quoted from attr
    self.prettyProductFromAttr = ko.computed(function() {
if ( mawf.bug && mawf.bug.logComputeds === true) { console.log('computed prettyProductFromAttr fired'); }
        return "&ldquo; "+self.productFromAttr()+"&rdquo;";
    });
    self.prettyProductFromAttr.functionType = 'computed';


// The combined address
    self.fullToAddress = ko.computed(function() {
if ( mawf.bug && mawf.bug.logComputeds === true) { console.log('computed fullToAddress fired'); }
        var fta;
        fta = self.productFirstName() + ' ' + self.productMI() + ' ' + self.productLastName() + '<br>' + self.productAddress1() + '<br>';
        fta += self.productAddress2() === '' ? '' : self.productAddress2() + '<br>';
        fta += self.productCity();
        fta += self.productState() !== 'NA' ? ', ' + self.productState() + ' ' : ' ';
        fta += self.productZip() + '<br>' + self.productCountry();
        return fta;
    });
    self.fullToAddress.functionType = 'computed';

// If this is a monthly donation, set root hasMonthlyDonation to true
    self.isMonthlyDonation = ko.computed(function() {
        if ( self.donationType() === 2 && mawf.CartView ) {                                     // Trigger is recurring donation
            mawf.CartView.hasMonthlyDonation(true);

        } else if ( mawf.CartView && mawf.CartView.donations().length ===  1 ) {// Trigger was a one-time donation and is the only donation in the stack
            mawf.CartView.hasMonthlyDonation(false);

        } else {                                                                // Trigger is one-time, there is more than one donation in the stack
            mawf.determinePayPalVisibility();                                   // Call helper - check all donations for monthly
        }

    });
    self.isMonthlyDonation.functionType = 'computed';

// Set the monthly start day.
// If the donations dondationStartDate().number matches the date set in arg date obj 1; if not set to 2
    self.donationDate = ko.computed(function() {
if ( mawf.bug && mawf.bug.logComputeds === true) { console.log('computed donationDate fired'); }
        return self.monthlyStartType() == 'date1' ? mawf.dates.date1 : mawf.dates.date2;
    });
    self.donationDate.functionType = 'computed';


    self.monthlyRecurrenceDate = ko.computed(function() {
        return self.donationType() === 2 ? self.donationDate().number : '';
    });
    self.monthlyRecurrenceDate.functionType = 'computed';

// Donation amount validity evaluator
// 
    self.isValid = function () {
                                                                                    // Other Donation Amount errors
        if ( self.otherDonationActive() === true && ( self.otherDonationAmount() < mawf.CartView.minimumDonation() ) ) {
            self.x_donationAmountErrorType('odm');
            self.x_donationAmountError(true);
            return false;
        }
                                                                                    
        if (self.otherDonationActive() === false && +self.donationAmount() <= 0) {  // Button amount errors
            self.x_donationAmountErrorType('buttons');
            self.x_donationAmountError(true);
            return false;
        }

        // Passed
        self.x_donationAmountErrorType('');
        self.x_donationAmountError(false);
        return true;
    };
    self.isValid.functionType = 'helper';

// setOtherDonation()
// Takes donation context
// Fired by computed function otherDonationUserEntryMonitor()
// Uses the user entered value in the odm input, cleans input, sets the otherDonationAmount() var with variable, set donationAmount() to 0
    self.setOtherDonation = function () {
        var odm = mawf.getDollarInt( self.otherDonationUserEntry() );           // CLEAN - removes allowed characters "$," and test for validity
        //console.warn('setotherDonation triggered at :' + odm );

        self.otherDonationActive(true);

        if ( odm === '' ) {                                                     // CURRENCY SYMBOL - is only value in field
            mawf.CartView.clearOtherDonationError(self);                        // Clear possible error state
            self.otherDonationAmount(0);                                        // Clear any static value

        } else if ( odm === false && odm >= mawf.CartView.minimumDonation() ) { // BAD VALUE - has trash
            mawf.CartView.setOtherDonationError(self);

        }  else  {                                                              // GOOD VALUE
            self.otherDonationAmount(odm);
            self.isValid();                                                     // Trigger re-evaluation (messy)
        }

        self.donationAmount(0);                                                 // ALWAYS CLEAR STATIC BUTTONS - Always make sure hard code buttons are not active
    };
    self.setOtherDonation.functionType = 'helper';



// localChapterLocatorIsValid()
// Checks all local chapter locators for valid status; returns bool
    self.localChapterLocatorIsValid = function() {
        return self.donorIntent() === '' ? false : true;
    };
    self.localChapterLocatorIsValid.functionType = 'helper';  

    self.setPrettyName = ko.computed(function() {
if ( mawf.bug && mawf.bug.logComputeds === true) { console.log('computed setPrettyName fired'); }
        self.productPrettyName(self.productFirstName() + ' ' + self.productMI() + ' ' + self.productLastName() );
        if (self.productPrettyName() == '  ' ) { self.productPrettyName(''); } // Catch no names
    });
    self.setPrettyName.functionType = 'computed';

// Pretty donation amount
//
    self.prettyDonationAmount = ko.computed(function() {
if ( mawf.bug && mawf.bug.logComputeds === true) { console.log('computed prettyDonationAmount fired'); }
        var workingAmount = self.donationAmount() ? self.donationAmount() : self.otherDonationAmount();
        return mawf.prettyMoney(workingAmount);
    });
    self.prettyDonationAmount.functionType = 'computed';

// ------------------------ Products ------------------------- //

    // Select a product and move on to the configure screen. PRODUCT ID SHOLS BE SET ON FINISHED
    self.selectProduct = function (id) {
        self.productID(id);
        mawf.CartView.productMasterState('personalizing');
        $('#js-prod-personalizer').find(':input:visible').eq(0).focus(); // focus user in first input
    };
    self.selectProduct.functionType = 'helper';


// Call this to remove an ecard.
    self.removeCard = function () {
        self.ecardFinish(false);
        self.hasProduct(false);
        //mawf.CartView.clearPersonalizer(true, self);
    };
    self.removeCard.functionType = 'helper';


};

// ***********************************************
// HELPER FUNCTIONS ******************************
// ***********************************************

//
// Save cart data localstorage polyfill, omitting private data (denoted by leading underbar)
//
mawf.saveSession = function() {
if ( mawf.bug && mawf.bug.logSessionSaving ) {  console.log('----------------------------------\nsaveSession() called'); }
    var prop,
        i,
        state = ko.toJS(mawf.CartView);

    for (prop in state) {                       // Clean out sensitive data
        if (prop.indexOf('x_') === 0) {
if ( mawf.bug && mawf.bug.logSessionSaving ) {  console.log(prop + ' property removed.'); }
            delete(state[prop]);
        }
    }



    for ( i in state.donations ) {      // Remove donation amount, intent. and destnation data in incomplete donations

        for ( prop in state.donations[i] ) {                        // Clean out sensitive data
            if (prop.indexOf('x_') === 0) {
if ( mawf.bug && mawf.bug.logSessionSaving ) {  console.log(prop + ' property removed from donation '+i+'.'); }
                delete( state.donations[i][prop] );
            }
        }

        if ( state.donations[i].isInProcess ) {
if ( mawf.bug && mawf.bug.logSessionSaving ) {  console.log('Unsaved donation cleared.'); }
            delete state.donations[i].donationAmount;
            delete state.donations[i].donationAmount;

            delete state.donations[i].otherDonationActive;
            delete state.donations[i].otherDonationAmount;
            delete state.donations[i].otherDonationUserEntry;
            delete state.donations[i].donationDestType;
            delete state.donations[i].donorIntent;
        }
    }


if ( mawf.bug && mawf.bug.logSessionSaving ) {  console.log('----------------------------------\n'); }

    $.jStorage.set( mawf.cartName, $.stringify( state ) );
    $.jStorage.setTTL(mawf.cartName, 86400000); // 24 hour expiration
};


mawf.loadSession = function(cartName) {
if ( mawf.bug && mawf.bug.sessionLoadActive  === false ) { 
    console.log('loadSession() blocked by debugger setting');
    return null;
}
console.log('loadSession() called');
    if ( cartName) {
        cart = $.jStorage.get(cartName);
//console.log('Cart loaded: ',cart);

    } else {
console.log('loadSession called with undefined cartName');
        return false;
    }
    return cart;
};

mawf.clearSession = function() {
    if ( mawf.cartName ) {
        $.jStorage.deleteKey(mawf.cartName);
    }
};

//
// monitorCardType() - keyup listener that will handle the visual highlight of correct card image
//
mawf.monitorCardType = function(cardNumber, $cont) {
    // determine first char
    cardNumber += '';
    $cont.removeClass('visa amex mc discover');
    switch (cardNumber.charAt(0)) {
        case '' :
            break;
        case '3':
            $cont.addClass('amex');
            break;
        case '4':
            $cont.addClass('visa');
            break;
        case '5':
            $cont.addClass('mc');
            break;
        case '6':
            $cont.addClass('discover');
    }
};


//
// getDollarInt([string]) - Cleans and test strings representing dollar amounts of dollar signs and turn them into a number
// if failOnInvalid set to true(default) will return false if amount contains non-allowed chars; if false it return the parsefloat val or '' if parsefloat fails
mawf.getDollarInt = function(money) {
                                                    // Regexes are cached rather than recreated on every keystroke
    mawf.rxCurrencySymb = mawf.rxCurrencySymb || new RegExp( '^\\' + mawf.CartView.localizedCurrencySymbol() ); // local curr symb only allowed as first char
    mawf.rxCommaReg     = mawf.rxCommaReg || new RegExp(","); // one comma

    var tester;

    money = money.replace(mawf.rxCurrencySymb, ''); // ## Remove good cur symbol
    money = money.replace(mawf.rxCommaReg, '');     // ## Remove good comma

    tester = /^\d+\.?\d{0,2}$/.test(money);         // ## Test for bad trash
    
    return money === '' ? '' : (tester ? parseFloat(money) : false);        // ## Return clean money int or false
};


// prettyMoney()
// Takes an int - if int contains a dot it will enforce two decimal places, returns value as string or int
mawf.prettyMoney = function(amount) {
    var needsComma, needsDot, commaPos, workAmount = (amount + '');
    
    needsDecimal = workAmount.match(/\./) === null ? false : true;// Test for decimal need
    needsComma   = amount < 1000 ? false : true;                // Test for comma need
    
    if (needsDecimal) { workAmount = amount.toFixed(2); }       // Set decimal

    if (needsComma) {
        commaPos = needsDecimal ? workAmount.indexOf('.') : workAmount.length;
        commaPos -= 3;
        workAmount = workAmount.split('');
        workAmount.splice(commaPos,0,',');
        workAmount = workAmount.join('');
    }
    return workAmount;
};

//  Product init
mawf.initProductCategories = function() {
// console.log('initProdCat called');
    var $prodType = $('.js-prod-section'),                  // Product type sections (3)
        $categoryBtns,
        $grids,
        $this;

    $prodType.each(function(pi) {                           // Loop type product sections
        $this         = $(this);                                // Section
        $categoryBtns = $this.find('.js-sidenav a');            // Section category nav buttons
        $grids        = $this.find('.js-prod-cat-grid');        // Section category grids

        if ( $categoryBtns.eq(0).data('grid') === undefined ) { // Test to see if this is already been done
            $categoryBtns.each(function(ci) {                   // Loop category buttons
                $(this).data('grid', $grids.eq(ci));            // Attach a ref on navbtn to its grid
            });
        }
        
        mawf.loadGridImages($grids.eq(
            mawf.CartView['product'+(pi+1)+'Category']() - 1    // .eq is 0 based
        ));
    });
};

mawf.initProductCategoryMatching = function() {

    mawf.$browser.find('.js-sidenav').each(function(i) {                    // Map all text into a ref array

        mawf.prodBrowserNavLabels[i] = [];                                  // Init a blank

        $(this).find('a').each(function(ii) {
            mawf.prodBrowserNavLabels[i][ii] = $.trim( $(this).text() );    // Loop on labels
        });

    });
};

mawf.matchCategories = function(fromType, fromCat, toType) {

    { console.log('-----------------------------------------\n### Matching Product Cat Nav  ###'); }

    if ( fromType === toType ) {
        console.warn('matchCategories(): fromType is the same as toType'); return false;
    }

    fromType--; // Adjusting for 0 based
    fromCat--;
    toType--;

    var i,
    matchTxt = mawf.prodBrowserNavLabels[fromType][fromCat],
    cacheIndex = fromType+'_'+fromCat+'_'+toType;

    console.log('Looking for nav match for '+cacheIndex);

    if ( mawf.prodBrowserCachedMatches[cacheIndex] !== undefined ) {
        console.log('Cached value returned: '+ mawf.prodBrowserCachedMatches[cacheIndex]);
        return mawf.prodBrowserCachedMatches[cacheIndex] + 1;
    }

    i = mawf.prodBrowserNavLabels[toType].length;

    while ( mawf.prodBrowserNavLabels[toType][--i] ) {
        console.log('----Matching '+matchTxt+' against '+ mawf.prodBrowserNavLabels[toType][i] );
        if ( matchTxt === mawf.prodBrowserNavLabels[toType][i] ) {
            console.log('---Match Found');
            mawf.prodBrowserCachedMatches[cacheIndex] = i;
            console.log('Type '+fromType+' category '+fromCat+' matched '+' Type ' + toType + ' category ' + i);
            console.log('New nav val cached and returned: ' + mawf.prodBrowserCachedMatches[cacheIndex]);
            return i + 1;// Types and categories are not 0 based -> adjust
        }   
    }

    mawf.prodBrowserCachedMatches[cacheIndex] = false;
    console.log('False nav val cached:' + mawf.prodBrowserCachedMatches[cacheIndex]);
    return false;
};

/**
 * Called on closing the product browser/personalzier. Will completely clean this modal. Do all your syncing from root to donation or donation to root and then call shutDownProductModal. This will clear root state values like productEditState, etc.. remove all donation pers data from root, reset the product browser view locations and the productType
 * @return {undefined}
 */
mawf.shutDownProductModal = function() {
    if (mawf.CartView.productEditState() !== 'canceled') {      // Except in the case of a canceled edit, we want to sync from root to donation
        mawf.CartView.syncRoot('personalizer', 'out');                  // Sync root personalizer data
    }

    mawf.CartView.productEditState('');
    mawf.CartView.productInPreview('');                         // If in preview, clear preview
    mawf.CartView.productMasterState('');
    mawf.CartView.clearPersonalizer();                          // Remove product personalizer data from root
};

/**
 * Determines whether the PayPal button should be visible to the user - loops all donations, if any donation is set to monthly then hide the PP button
 * @return {undefined}
 */
mawf.determinePayPalVisibility = function() {
    if ( this.CartView === undefined ) { return; }

    var i, donationsArray =  this.CartView.donations();

    for ( i in donationsArray  ) {                      // loop all donations

        if ( donationsArray[i].donationType() === 2 ) { // Check for monthly
            this.CartView.hasMonthlyDonation(true);     // Set true
            return;                                     // Break loop
        }
    }

    this.CartView.hasMonthlyDonation(false);                            // None - set to false  
};

/**
 * [formIsNotModified description]
 * @return {bool} Returns true if significant user interaction has occurred with the form
 */
mawf.formIsNotModified = function() {
    var donations = mawf.CartView.donations();
    return (
        donations.length                      === 1 &&      // There is only one donation in the cart
        donations[0].isInProcess()            === true &&   // That donation is in the unsaved state
        donations[0].hasProduct()             === false &&  // The donation has no product
        mawf.CartView.showSecondFormSection() === false     // Steps 2-4 are not visible
    );
};
mawf.formIsNotModified.functionType = 'helper';

/**
 * Loads the product thumb images in a specified prod type's category's grid
 * @param  {jQuery obj || array} grid Either the grid object or an array containing 0 based references to the product type and grid can be passed
 * @return {undefined}      [description]
 */
mawf.loadGridImages = function(grid) {
    var $grid, $img, $images;

    $grid   = $.isArray( grid ) ? mawf.$browser.find('.js-prod-section').eq(grid[0]).find('.js-prod-cat-grid').eq(grid[1]) : grid;
    $images = $grid.find('img');

    if ( $images.size() === 0 || $images.eq(0).attr('src').match(/blank\.gif$/) === null ) {
        return false;
    }

    $images
        .each(function() {
            $img = $(this);
            $img.attr('src', $img.attr('data-src'));
    });
};


// ***********************************************
// FORM SUBMISSION HANDLING **********************
// ***********************************************


/**
 * Controller function to handle server request for a token
 * 
 * @param  {bool} clearAnyExistingToken 
 * If clearAnyExistingToken is false than any existing token will be reused, if true 
 * then any existing token will be deleted and a request for a new one initiated
 * 
 * @return {$.promise()}
 * returns a jQuery promise
 */
mawf.handlingRequestToken = function(clearAnyExistingToken) {
    if ( mawf.bug && mawf.bug.logTransactionChain ) { console.log('handlingRequestToken() called'); }
    var request, chained = $.Deferred();

    mawf.transToken = (clearAnyExistingToken === true) ? undefined : mawf.transToken;

    if ( mawf.transToken === undefined || (mawf.transToken && clearAnyExistingToken) ) {

        request = mawf.requestToken();

        request.pipe(
            function(resp) {                            // Filter the response for errors returned as valid
                try {                                   // Missing data or unexpected result code (at this 
                    if ( resp.CWSID === undefined || (resp.result !== 999 && jsonResp.resp !== 9999) ) {
                        if ( mawf.bug && mawf.bug.logTokenTransaction ) { console.warn('Missing or bad data in GetToken response', resp); }

                        chained.reject(resp);
                    }

                } catch(e) {                            // Catch json parse fail (ex. 404 page returned, 
                                                        // IIS error page returned, etc...)
                    if ( mawf.bug && mawf.bug.logTokenTransaction ) { console.warn('json parse of GetToken response failed!'); }

                    chained.reject(resp);
                }
                chained.resolve(resp);
            },
            function(resp) {
                chained.reject(resp);
            }
        );

        chained.done(
            function(resp) {
                if ( mawf.bug && mawf.bug.logTokenTransaction ) { console.log('- Request token deferred resolved', resp.CWSID); }
                mawf.tokenReqInProgress = false;
                mawf.transToken = resp.CWSID;
        });

        chained.fail(
            function(resp) {
                if ( mawf.bug && mawf.bug.logTokenTransaction ) { console.log('Request for token received no response - \nstatusText: "'+ resp.statusText + '" responseText:  "'+resp.responseText + '"'); }

                mawf.tokenReqInProgress = false;
                mawf.processTransactionError(resp);
        });

        return chained;

    } else {
        if ( mawf.bug && mawf.bug.logTransactionChain ) { console.log('- Shorting - token exists and reuse allowed called'); }      
        return chained.resolve();
    }
};

/**
 * Service provider function that makes a request to the server for a transaction token
 * @return {$.promise()} 
 * returns a promise
 */
mawf.requestToken = function() {
    if ( mawf.bug && mawf.bug.logTransactionChain ) { console.log('requestToken() called'); }

    mawf.tokenReqInProgress = true;

    return $.ajax({
        url: config.getService('GetToken').endpoint,
        cache: false,
        timeout: 30000,
        dataType: 'json',
        type: 'GET'
    });
};


//
// formatTransData()
// Takes a copy of the view model and uses the processorDataTemplate and returns an object
// containing only data the processor wants and using the processor specific names
//
mawf.formatTransData = function(model) {
    if ( mawf.bug && mawf.bug.logTransactionChain ) { console.log('formatTransData() called'); }

    var i, prop, modelVal, curDon, suffix,
        postData         = {},
        don              = model.donations(),
        donLen           = don.length,
        donatorTemplate  = model.donatorFieldTemplate,
        donationTemplate = model.donationFieldTemplate,
        
        defProductID     = 'DO02-01',
        monthlyProductID = 'MG05-01',
        purchaserID      = model.purchaserID();


    if ( mawf.bug && mawf.bug.logTransDataBuild ) { console.log('-----------------------------------------\n### Building Standard Transaction Data ###'); }

    // DONATOR FIELDS - LOOP AND ASSIGN
    if ( mawf.bug && mawf.bug.logTransDataBuild ) {console.log('### Extracting Donator Field Template Values ###');}

    for ( prop in donatorTemplate ) {
        modelVal = model[donatorTemplate[prop]]();

    if ( mawf.bug && mawf.bug.logTransDataBuild ) { console.log('CW:'+prop+' App:'+donatorTemplate[prop]+' ('+modelVal+')'); }
        if ( modelVal !== '' && modelVal !== null ) {
            postData[prop] = modelVal;
        }
    }

    // CUSTOM DATA Manipulation
    postData.CCNumber = postData.CCNumber.replace(/[ \-]/g, '');    // Strip cc dash/space in processor data
    postData.CWSID   = mawf.transToken;
    postData.Custom7 = purchaserID;
    postData.debug = 1; // Enable server debug data for failures

    //if ( postData.State.toLowerCase() == 'na' )   { postData.State = ''; }                    // If donator state is NA, don't send to CW
    //
    if ( model.updateInternational() )          { postData.SendInfo = postData.EMail; }     // National mailing list
    postData.MailingList = model.updateNational() ? "Yes" : "No";                           // National mailing list
    if ( model.updateLocal() )                  { postData.Custom1 = postData.EMail; }      // Local mailing list

    // PRODUCT  FIELDS - LOOP AND ASSIGN
    for (i=0; i < donLen; i++) {                                
        curDon = don[i];
        suffix = '_'+(i+1);

    // SET CUSTOM PRODUCT ID
        if ( curDon.donationType() === 2 ) {        // Monthly donation
            curDon.productID( monthlyProductID.toUpperCase() );

        } else if ( curDon.productID() === '' ) {   // One time donation - no product
            curDon.productID( defProductID.toUpperCase() );

        } else {
            curDon.productID( curDon.productID().toUpperCase() );
        }

    // COUNTRY - REMOVE IF NOT APPLICABLE (clear if no address 1 is set)
        if ( curDon.productAddress1() === '' ) { curDon.productCountry(''); }

    // DONATION TEMPLATE    
        if ( mawf.bug && mawf.bug.logTransDataBuild ) {console.log('### Extracting Donation Field Template Values ###');}
        for ( prop in donationTemplate ) {
            modelVal = mawf.extractDonationTemplateValue( curDon, donationTemplate[prop] );

    if ( mawf.bug && mawf.bug.logTransDataBuild ) { console.log('CW:'+ prop + '  ->  App:' + donationTemplate[prop] + '  "' + modelVal + '"'); }            
            if ( modelVal ) {                           // Skip empty fields
                postData[prop+suffix] = modelVal;
            }
        }
        // if donation has a productState === to na then delete the model Val
        //if ( curDon.productState().toLowerCase() === 'na' ) { postData['State'+suffix] = ''; }
    }

    console.log(postData);

    if ( mawf.bug && mawf.bug.logPostAsGet ) {
        var str =  '?';
        for ( prop in postData ) { str += prop + '=' + encodeURI(postData[prop]) + '&'; }
        console.log(config.getService('StandardCCTrans').endpoint + str.substr(0, str.length-1));
    }

    if ( mawf.bug && mawf.bug.logTransDataBuild ) { console.log('-----------------------------------------'); }

    return $.Deferred().resolve(postData);
};

/**
 * Takes a donation model and property variable and returns the value from the model for the property name. The property variable may be a string corresponding to the model observable name or an array of model observable names. In the case of an array it will check the values of each property name in the array on the model and the first one found to be a non-empty string or non null value will be returned. If the corresponding model observable(s) is(are) empty then the boolean false will be returned
 * @param  {ko donation model} donation knockout model view of donation object
 * @param  {string || array} property string or array of strings that are observables on the donation model
 * @return {string || false}          string if a non-empty value is found, false if empty val found
 */
mawf.extractDonationTemplateValue = function(obj, property) {
    //if ( mawf.bug && mawf.bug.logTransactionChain )   { console.log(''); }

    var i, l, val, properties;

    if ( $.isArray(property) ) {                // Lookup val is an array
        i = 0;
        l = property.length;
        properties = property;

        while ( i < l ) {
            val = obj[ properties[i] ]();
            if ( val ) {
                break;
            }
            i++;
        }

    } else {
        val = obj[property]();                  // Lookup is a string
    }

    return val ? val : false;                   // if blank return false
};

//
// formatTransData()
// Takes a copy of the view model and uses the processorDataTemplate and returns an object
// containing only data the processor wants
//
mawf.formatTransDataPP = function(model) {
    if ( mawf.bug && mawf.bug.logTransactionChain ) { console.log('formatTransDataPP() called'); }

    var i, prop, modelVal, curDon, suffix,
        postData          = {},
        don              = model.donations(),
        donLen           = don.length,
        donatorTemplate  = model.donatorFieldTemplate,
        donationTemplate = model.donationFieldTemplate,
        
        domain           = document.domain,
        transTypePP      = 'PP',
        transactionID    = mawf.transToken,
        defProductID     = 'DO02-01',
        successRedirect  = mawf.getSuccessURL(),
        purchaserID      = model.purchaserID();

    // CUSTOM DATA Manipulation
    postData.CWSID     = transactionID;                     // Static purchasing chapt ID
    postData.CCType    = transTypePP;                       // Transaction Type
    postData.Custom7   = purchaserID;                       // Purchaser ID
    postData.Custom2   = successRedirect;                   // Success redirect URL
    postData.ProductID = defProductID;                      // Add default product id to model
                                                            // If donator state is NA, don't send to CW
    //if ( postData.State.toLowerCase() == 'na' )   { postData.State = ''; }                    


    if ( mawf.bug && mawf.bug.logTransDataBuild ) { console.log('-----------------------------------------\n### Building PayPal Transaction Data ###'); }

    for ( prop in donatorTemplate ) {                       // Donator Fields - loop and assign
        if (prop !== '') { 
            modelVal = model[donatorTemplate[prop]]();

    if ( mawf.bug && mawf.bug.logTransDataBuild ) { console.log('CW:'+prop+' App:'+donatorTemplate[prop]+' ('+modelVal+')'); }
            if ( modelVal !== '' ) {                        // Skip empty values
                postData[prop] = $.trim(modelVal);
            }
        }
    }

    for (i=0; i < donLen; i++) {                            // Donation Fields - loop and assign
        curDon = don[i];
        suffix = '_'+(i+1);

        for ( prop in donationTemplate ) {

            modelVal = mawf.extractDonationTemplateValue( curDon, donationTemplate[prop] );

    if ( mawf.bug && mawf.bug.logTransDataBuild ) { console.log('CW:'+prop+'  App:'+donationTemplate[prop]+' ('+modelVal+')'); }
            if ( modelVal ) {                               // Skip empty fields
                postData[prop+suffix] = $.trim(modelVal);   // Add suffic
            }
        }
        
        if ( postData['ProductID' + suffix] === undefined ) {// If productID is empty set it to default
            postData['ProductID'+suffix] =  defProductID;

        } else {                                                // If set make sure its uppercase
            postData['ProductID'+suffix] =  postData['ProductID'+suffix].toUpperCase();         
        }
    }
    console.log(postData);

    if ( mawf.bug && mawf.bug.logTransDataBuild ) { console.log('-----------------------------------------'); }

    // return postData;

    return $.Deferred().resolve(postData);
};

mawf.buildPayPalSubmitForm = function() {
    if ( mawf.bug && mawf.bug.logTransactionChain ) { console.log('buildPayPalSubmitForm() called'); }

    var ajaxURL, prop,
        postForm = '';

    ajaxURL = config.getService('PayPalCCTrans').endpoint;
    for ( prop in mawf.transData ) {
        postForm += '<input type="hidden" name="'+prop+'" value="'+mawf.transData[prop]+'">';
    }
    $postForm = $('<form action="'+ajaxURL+'" method="post">' + postForm + '</form>');

    $postForm
        .hide()
        .appendTo('body');

    return $postForm;
};


mawf.launchTransactionModal = function() {
    if ( mawf.bug && mawf.bug.logTransactionChain ) { console.log('launchTransactionModal() called'); }

    mawf.confirmModal.launch({
        boxSelector:'#js-modal-confirm',
        message:'Transaction Processing', 
        btnCount: 0, 
        showGraphic: true
    });

    return $.Deferred().resolve();
};


mawf.handlingEmailSubs = function() {
    if ( mawf.bug && mawf.bug.logTransactionChain ) { console.log('handlingEmailSubs() called'); }

    var dfd = $.Deferred(),
        standarSignup,
        internationalSignup;

    if ( mawf.CartView.updateInternational() ) {                            // INTERNATIONAL SIGN UP
    console.log('International email sign up:');

        internationalSignup = mawf.subscribeToEmail('international', {
            email:      mawf.CartView.eAdd(),
            firstName:  mawf.CartView.fname1(),
            lastName:   mawf.CartView.lname1()
        });

    } else {
        internationalSignup = $.Deferred().resolve();
    }

    if ( mawf.CartView.updateNational() || mawf.CartView.updateLocal() ) {  // LOCAL/NATIONAL SIGN UP
    console.log('Standard email sign up:');

        standardSignup = mawf.subscribeToEmail('standard', {
            email:          mawf.CartView.eAdd(),
            chapterID:      mawf.CartView.updateLocal() ? mawf.CartView.sitChapterID() : '100-000',
            includeNational:mawf.CartView.updateNational(),
            firstName:      mawf.CartView.fname1()
        });

    } else {
        standardSignup = $.Deferred().resolve();
    }

    $.when(standardSignup, internationalSignup).then(                       // CHAIN EMAIL PROMISES
        function() {                                                        // Success - resolve
    if ( mawf.bug && mawf.bug.logTransactionChain ) { console.log('handlingEmailSubs() resolved'); }
            return dfd.resolve();
        },
        function() {                                                        // Fail - but still resolve
    if ( mawf.bug && mawf.bug.logTransactionChain ) { console.log('handlingEmailSubs() failed'); }
            return dfd.resolve();
        }
    );

    return dfd;
};


mawf.preparingFormData = function() {
    if ( mawf.bug && mawf.bug.logTransactionChain ) { console.log('preparingFormData() called'); }

    var dfd = mawf.CartView.paymentType() == 'PayPal' ? mawf.formatTransDataPP( mawf.CartView ) : mawf.formatTransData( mawf.CartView );// Format for processor

    dfd.done(
        function(resp) {
    if ( mawf.bug && mawf.bug.logTransactionChain ) { console.log('preparingFormData() resolved'); }
            mawf.transData = resp;
        }
    );

    dfd.fail(
        function(resp) {
            console.log('preparingFormData() failed with ', resp);
        }
    );
};


mawf.handlingTokenAndData = function() {
    if ( mawf.bug && mawf.bug.logTransactionChain ) { console.log('handlingTokenAndData() called'); }
    var dfd = $.Deferred();

    $.when(mawf.handlingRequestToken(true))
    .then(function() {
        $.when(mawf.preparingFormData())
        .then(
            function() {
    if ( mawf.bug && mawf.bug.logTransactionChain ) { console.log('handlingTokenAndData() resolved'); }
            dfd.resolve();
            },
            function() {
    if ( mawf.bug && mawf.bug.logTransactionChain ) { console.log('handlingTokenAndData() failed'); }
                dfd.reject();
        });
    });

    return dfd;
};


mawf.handlingFormSubmission = function() {
    if ( mawf.bug && mawf.bug.logTransactionChain ) { console.log('handlingFormSubmission() called'); }
    var dfd = $.Deferred();

    if ( mawf.bug && mawf.bug.logTransactionChain ) { console.log('- Building multi promise '); }

    $.when( mawf.launchTransactionModal(), mawf.handlingTokenAndData(), mawf.handlingEmailSubs() )
    .then(
        function() {
    if ( mawf.bug && mawf.bug.logTransactionChain ) { console.log('- Multi promise resolved'); }
            dfd.resolve();
        });

    dfd.done(
        function() {
    if ( mawf.bug && mawf.bug.logTransactionChain ) { console.log('- Chained deferred firing'); }
            mawf.execTransaction( mawf.CartView.paymentType(), mawf.transData ); // Send data

        }
    );

    dfd.fail(
        function() {
    if ( mawf.bug && mawf.bug.logTransactionChain ) { console.log('- Chained deferred failed'); }           
        }
    );
};


mawf.execTransaction = function() {
    if ( mawf.bug && mawf.bug.logTransactionChain ) { console.log('execTransaction() called'); }

    var ajaxURL,
        redirectURL = '',
        request,
        response,
        chained;

    if ( mawf.CartView.paymentType() == 'PayPal' ) {
        mawf.confirmModal.updateMessage('Redirecting to Paypal to complete your donation.');
        mawf.clearPageAbandon();
        mawf.CartView.cwsid(mawf.transToken);       // Add cwsid to model data
        mawf.saveSession();                         // Save model to session in case of fail PP site
        mawf.buildPayPalSubmitForm().submit();

    } else {
        ajaxURL = config.getService('StandardCCTrans').endpoint;
        if ( mawf.bug && mawf.bug.logTransactionChain ) { console.log('transacting standard cc using endpoint '+ajaxURL); }

        request = $.ajax({                          // Perform ajax cc transaction to CW
            url: ajaxURL,
            type: 'POST',
            timeout: 360000,
            data: mawf.transData,
            dataType: 'json'
        });

        chained = request.pipe(                     // Filter
            function(resp) {                        // Possible success
                console.log('Piping transaction req:', resp);
                try {

                    if ( resp.result === '0' || resp.result === '9999' ) {
                        if ( mawf.bug && mawf.bug.logTransactionChain ) { console.log('Transaction filtering request response with ', resp); }                      
                        return $.Deferred().resolve(resp);
                    }
                } catch(e) {
                    if ( mawf.bug && mawf.bug.logTransactionChain ) { console.log('Trans resp filter caught error with try/catch on parse of ', resp); }
                }

                return $.Deferred().reject(resp);
            }
        );
        console.log('Exec chained state: '+chained.state());
        chained.done(
            function(resp) {
                mawf.donationSuccess();
        });

        chained.fail(
            function(resp) {
                console.log('Error:' + (resp.textStatus ? 'xhr fail - ' + resp.textStatus : 'Processor fail - ' +resp.result), resp);
                mawf.processTransactionError(resp);             
        });
    }
};


mawf.getSuccessURL = function(appendToken) {
    if ( mawf.bug && mawf.bug.logTransactionChain ) { console.log('getSuccessURL() called'); }

    var protocol    = document.location.protocol,
        domain      = document.domain.match(/\.[a-z]{2,4}$/) !== null ? document.domain : 'staging.wish.org',
        page        = '/ways-to-help/giving/donate/thank-you',
        querystring = '?cwsid=' + mawf.transToken,
        url;

    appendToken = appendToken || false;

    url = protocol + '//' + domain + page;

    return appendToken ? url + querystring : url;
};


/**
 * Merges server localized transaction error messages over hardcoded ones
 * @return {[type]} [description]
 */
mawf.integrateLocalizedTransErrorMessages = function() {
    var mType,
        locals = mawf.transactional_errors,
        eGuide = mawf.adminAlertTypes;

    if ( locals === undefined ) {
        console.warn("Localizd transactional error messages missing");
        return;
    }
    for ( mType in locals ) {
        if ( eGuide[mType] && eGuide[mType].modal ) {
            eGuide[mType].modal.message = locals[mType];
            eGuide[mType].modal.postMsg = eGuide[mType].modal.postMsg ? locals.genericContactUs : '';
        }
    }
    mawf.transErrsLocalized = true;             // Set flag so this happens only once despite multiple errors
};

/**
 * Lookup table the references errors, messaging, and interface actions. Can contain templatized errors, unique errors and template pointers
 * @type {Object}
 */
mawf.adminAlertTypes = {
    'decline': {
        modal: {
            message: 'Oops! Your credit card has been declined. Please enter a different credit card number and try again.',
            postMsg: 'If you continue to receive this error message, please contact the bank that issued the card. You may also call us at 1-866-880-1382 to make your donation by phone.',
            buttonCount: 1,
            btnYesTxt: 'Return to form'
        },
        modelAction: {
            //clearModelValue: 'x_ccNumber' // space separated list of model variables to clear value of
            focusEl: '[name="ccNumber"]'
        }
    },
    'invalid_number': {
        modal: {
            message: 'Oops! You have entered an invalid credit card number.  Please enter a different credit card number and try again. ',
            postMsg: 'If you continue to receive this error message, please contact the bank that issued the card. You may also call us at 1-866-880-1382 to make your donation by phone.',
            buttonCount: 1,
            btnYesTxt: 'Return to form'
        },
        modelAction: {
            clearModelValue: 'x_ccNumber', // space separated list of model variables to clear value of
            focusEl: '[name="ccNumber"]'
        }
    },
    'invalid_exp': {
        modal: {
            message: 'Oops! You have entered an invalid expiration date.  Please check the date, reenter it and try again.',
            postMsg: 'If you continue to receive this error message, please contact the bank that issued the card. You may also call us at 1-866-880-1382 to make your donation by phone.',
            buttonCount: 1,
            btnYesTxt: 'Return to form'
        },
        modelAction: {
            clearModelValue: 'x_ccExpMonth  x_ccExpYear', // space separated list of model variables to clear value of
            triggerEls: '#ccExpMonth, #ccExpYear', // comma separate list of selectors
            focusEl: '#ccExpMonth'
        }
    },
    'invalid_csc': {
        modal: {
            message: 'Oops! Your credit card security code is invalid.  Please re-enter it and try again.',
            postMsg: 'If you continue to receive this error message, please contact the bank that issued the card. You may also call us at 1-866-880-1382 to make your donation by phone.',
            buttonCount: 1,
            btnYesTxt: 'Return to form'
        },
        modelAction: {
            clearModelValue: 'x_ccSecNumber', // space separated list of model variables to clear value of
            focusEl: '[name="ccSecNumber"]'
        }
    },
    'amount_0': {
        modal: {
            message         : 'Oops! We encountered a problem processing your donation.  Please start again.',
            postMsg         : 'If you continue to receive this error message, please contact the bank that issued the card. You may also call us at 1-866-880-1382 to make your donation by phone.',
            buttonCount     : 1,
            btnYesTxt       : 'Return to form'
        },
        modelAction: {
            clearToken      : true,
            clearModelValue : 'x_ccFName x_ccNumber x_ccExpMonth  x_ccExpYear x_ccSecNumber', // space separated list of model variables to clear value of
            triggerEls      : '#ccExpMonth, #ccExpYear', // comma separate list of selectors
            focusEl         : '#ccFName'
        },
        report: {
            message			: '(no message)'
        }
    },
    'noCCNumberSent': {
        modal: {
            message         : 'Oops! We encountered a problem processing your donation.  Please start again.',
            postMsg         : 'If you continue to receive this error message, please contact the bank that issued the card. You may also call us at 1-866-880-1382 to make your donation by phone.',
            buttonCount     : 1,
            btnYesTxt       : 'Return to form'
        },
        modelAction: {
            clearToken      : true,
            clearModelValue : 'x_ccFName x_ccNumber x_ccExpMonth  x_ccExpYear x_ccSecNumber', // space separated list of model variables to clear value of
            triggerEls      : '#ccExpMonth, #ccExpYear', // comma separate list of selectors
            focusEl         : '#ccFName'
        },
        report: {
            message			: '(no message)'
        }
    },
    'errorEncodingResponse': {
        modal: {
            message         : 'Oops! We encountered a problem processing your donation.  Please start again.',
            postMsg         : 'If you continue to receive this error message, please contact the bank that issued the card. You may also call us at 1-866-880-1382 to make your donation by phone.',
            buttonCount     : 1,
            btnYesTxt       : 'Return to form'
        },
        modelAction: {
            clearToken      : true,
            otherAction     : function() { mawf.CartView.reset(); }
        },
        report: {
            message			: '(no message)'
        }
    },
    'invalidCWSID': {
        modal: {
            message         : 'Oops! We encountered a problem processing your donation.  Please submit again.',
            postMsg         : 'If you continue to receive this error message, please contact the bank that issued the card. You may also call us at 1-866-880-1382 to make your donation by phone.',
            buttonCount     : 1,
            btnYesTxt       : 'Return to form'
        },
        modelAction: {
            clearToken: true
        },
        report: {
            message			: '(no message)'
        }
    },
    'CWInternalError': {
        modal: {
            message         : 'Oops! We encountered a problem processing your donation.  Please start again.',
            postMsg         : 'If you continue to receive this error message, please contact the bank that issued the card. You may also call us at 1-866-880-1382 to make your donation by phone.',
            buttonCount     : 1,
            btnYesTxt       : 'Return to form'
        },
        modelAction: {
            clearToken      : true,
            otherAction     : function() { mawf.CartView.reset(); }
        },
        report: {
            message			: '(no message)'
        }
    },
    'processing_incomplete': {
        modal: {
            message         : 'Oops! We encountered a problem processing your donation.  Please try submitting it again.',
            postMsg         : 'If you continue to receive this error message, please contact the bank that issued the card. You may also call us at 1-866-880-1382 to make your donation by phone.',
            buttonCount     : 1,
            btnYesTxt       : 'Return to form'
        },
        modelAction: {
            clearToken		: true,
            focusEl			: '.button-submit'
        },
        report: {
            message			: '(No message)'
        }
    },
    'timeout': {			// this is directly referenced by the textstatus parameter of the xhr error object
        modal: {
            message         : 'Oops! We encountered a problem processing your donation. Please try submitting it again.',
            postMsg         : 'If you continue to receive this error message, please contact the bank that issued the card. You may also call us at 1-866-880-1382 to make your donation by phone.',
            buttonCount     : 1,
            btnYesTxt       : 'Return to form'
        },
        modelAction: {
            focusEl:		'.button-submit'
        },
        report: {
            message:		'CharityWeb failed to respond to an API call within the expected time.'
        }
    },
    '12': {
        description: 'decline',
        generic: 'decline'
    },
    '13': {
        description: 'decline',
        generic: 'decline'
    },
    '23': {
        description: 'invalid_number',
        generic: 'invalid_number'
    },
    '24': {
        description: 'invalid_exp',
        generic: 'invalid_exp'
    },
    '114': {
        description: 'invalid_csc',
        generic: 'invalid_csc'
    },
    '232': {
        description: 'Amount was 0',
        generic: 'amount_0'
    },
    '233': {
        description: 'No credit card number supplied',
        generic: 'noCCNumberSent'
    },
    '333': {
        description: 'invalid_csc',
        generic: 'invalid_csc'
    },
    '800': {
        description: 'Charity Web internal error',
        generic: 'CWInternalError'
    },
    '801': {
        description: 'JSON response error',
        generic: 'errorEncodingResponse'
    },
    '802' : {
		description: 'Supplied CWSID is invalid',
        generic: 'invalidCWSID'
    },
    '888': {
        description: 'decline',
        generic: 'decline'
    },
    '999': {
        description: 'processing_incomplete',
        generic: 'processing_incomplete'
    },
    'functional': {
        description: 'Unexpected condition',
        generic: 'processing_incomplete'
    },
    'error': {
        description: 'Unexpected condition',
        generic: 'processing_incomplete',
        message: 'No response or request aborted'
    },
    'parseerror': {
        description: 'Unexpected condition',
        generic: 'processing_incomplete',
        message: 'Error parsing response as JSON'
    },
    'maps' : [
        {
            description: 'Charity Web internal error',
            start: 803,
            end: 887,
            to: 'CWInternalError'
        },
        {
            description: 'Charity Web internal error',
            start: 889,
            end: 899,
            to: 'CWInternalError'
        }
    ]
};

mawf.reportError = function(data, sendGenericData) {
    if ( mawf.bug && mawf.bug.logTransErrorHandling )   { console.log('reportError() called with', data, sendGenericData, arguments); }

    var reportObj,
        reportString,
        errorSvc = config.getService('APIError').endpoint;

    sendGenericData = sendGenericData === undefined ? true : false;

    reportObj = mawf.collectErrorData(data.template, data.code);

    reportObj = $.extend(reportObj, mawf.collectSanitizedTransData());

    reportObj = sendGenericData ? $.extend(reportObj, mawf.collectGenericErrorData()) : reportObj;

    reportString = mawf.packageErrorData(reportObj);

    if ( mawf.bug && mawf.bug.logErrorReports ) { console.log( 'Error report generated: '+reportString); }

    if ( mawf.bug && mawf.bug.sendErrorReports === false ) {    
        console.log('Error report sending block by flag sendErrorReports.');

    } else {
        console.warn( 'Sending error report');
        $.post(errorSvc, {'ErrData': reportString});
    }
};

/** 
 * collectGenericErrorData()
 * Creates and returns an object containing information about the user and browser.
 * Collects: users time, donor's last name, site domain, protocol, browser type info
 */
mawf.collectGenericErrorData = function() {
    if ( mawf.bug && mawf.bug.logTransErrorHandling )   { console.log('collectGenericErrorData() called'); }

    var  i, prop, data = {};

    data.domain             = window.location.hostname;         // Site domain
    data.protocol           = window.location.protocol.split(':')[0];           // Protocol
    data.userTime           = new Date().getTime();             // Date & time
    data.donor_last_name    = mawf.CartView.lname1();           // Donor last name

                                                                // Browser version
    $.browser.chrome = $.browser.chrome === undefined ? /chrome/.test(navigator.userAgent.toLowerCase()) : $.browser.chrome;
    for ( prop in $.browser ) {
        data[prop] = $.browser[prop];
    }

    return data;
};

/**
 * Creates and returns an object containing error informations specific to a transaction; templates messaging, original server sent code, template code, CWSID
 * @param  {[object]} template [error code guide template]
 * @param  {[string]} code     [description]
 * @return {[type]}          [description]
 */
mawf.collectErrorData = function(template, code) {
    if ( mawf.bug && mawf.bug.logTransErrorHandling )   { console.log('collectErrorData() called'); }

    var dataObj = {};

    dataObj.message          = template.report.message; // Administrative message string
    dataObj.originating_code = template.currentCode;    // Server sent error code
    dataObj.template         = code;                    // Template the code was matched to

    return dataObj;
};


mawf.collectSanitizedTransData = function() {
    var sanitary = $.extend({}, mawf.transData);

    delete sanitary.CCNumber;
    delete sanitary.CCHolder;
    delete sanitary.CCExpYear;
    delete sanitary.CCExpMonth;
    delete sanitary.CSC;

    return sanitary;
};


mawf.packageErrorData = function(dataObj) {
    if ( mawf.bug && mawf.bug.logTransErrorHandling )   { console.log('packageErrorData() called'); }

    var prop, reportString = '';

    for ( prop in dataObj ) {                               // Build string
        reportString += prop + '|' + (dataObj[prop] ? dataObj[prop] : 'null') + '|';
    }

    reportString = reportString.substring(0,reportString.length-1);     // Strip last pipe

    return reportString;
};


/**
 * Matches a passed code against the mawf.adminAlertTypes, if code is found, uses adminAlertTypes data about the code to launch a modal and create a callback
 * @param  {[string]} code [description]
 * @param  {[object]} xhrObj [description]
 * @return {[type]}      [description]
 */
mawf.processTransactionError = function(resp) {
    if ( mawf.bug && mawf.bug.logTransErrorHandling )   { console.log('processTransactionError() called with', resp); }

    var i, errorTemplate,
        code = resp.statusText || resp.result;

    errorTemplate = mawf.getErrorGuide(code);

    mawf.handleError(errorTemplate, resp);
};


mawf.getErrorGuide = function(serversCode) {
    var i, obj, guide, codeInt, mapfound,
        types = mawf.adminAlertTypes;
    
    var extractGuide = function(serversCode, guideCode, mapIndex) {
        obj = $.extend(true, {}, types[guideCode]);                 	// Native template

        obj.serverSentCode  = serversCode;                              // Record sent code
        obj.convertedCode   = guideCode;
        obj.mappedByIndex   = mapIndex ? mapIndex : null;               // Record map if used

        if ( obj.report && (serversCode !== guideCode) && types[serversCode].message ) {
			obj.report.message = types[serversCode].message;
        }

        return obj;
    };

    try { codeInt = parseInt(serversCode, 10); } catch(e) {}            // Get int (for mapping)


    // FILTER BLANK CODES #######################
    if ( serversCode === '' || serversCode === undefined ) {
        guide = extractGuide(serversCode, 'functional');


    // FILTER FOUND TYPES
    } else if ( types[serversCode] ) {
        if ( types[serversCode].generic ) {
            guide = extractGuide(serversCode, types[serversCode].generic);

        } else {
            guide = extractGuide(serversCode, serversCode);

        }


    // FILTER MAPPED CODE VALUES ########################
    } else if ( codeInt ) {                                             // example: 803 (mapped, not explicit)

        for ( i in types.maps ) {                                       // ### MAP - Check mapped number ranges
            if ( codeInt >=  types.maps[i].start && codeInt <= types.maps[i].end ) {
                guide = extractGuide(codeInt, types.maps[i].to, i);
                mapfound  = true;
                break;
            }
        }

        if ( !mapfound ) {                                      // ### FAILED MATCHING - UNKNOWN - FUNC
            guide = extractGuide(serversCode, 'functional');
        }

    // MFW this -> :|
    } else {
        guide = extractGuide(serversCode, 'functional');
    }

    return guide;
};


mawf.handleError = function(guide, resp) {
    var modalArgs, devMsg,
        xhrObj = resp.statusText ? resp : undefined;

    devMsg = mawf.bug && mawf.bug.logErrorCodes ? '<br><small style="color: red;">## Code sent: '+guide.serverSentCode+' Template used: '+guide.convertedCode+' ##</small>' : '';

                                                            // INTEGRATE LOCALIZED ERROR MESSAGES ONE TIME
    if ( !mawf.transErrsLocalized ) { mawf.integrateLocalizedTransErrorMessages(); }

    if ( guide.report ) {                                   // SEND ADMIN EMAIL
        mawf.reportError({template: guide, code: guide.convertedCode});
    }

    if ( guide.modal ) { // Needs cleanup - launch arg not needed, modal is always in use by trans status mg
            modalArgs = $.extend(true, {}, guide.modal);
            modalArgs.btnCount = 1;
            modalArgs.message = modalArgs.message + devMsg;
    }
    
    // Expect modal to be in use with transaction messaging
    mawf.confirmModal.updateGraphic();                                      // hide spinner
    mawf.confirmModal.updateMessage(guide.modal.message + devMsg,'main');   // change messaging
    mawf.confirmModal.updateMessage(guide.modal.postMsg,'post');            // change messaging
    mawf.confirmModal.showButton(1);                                        // Show button

    modalArgs.yes_cb = guide.modelAction ? function() { mawf.transactionErrorCB(guide.convertedCode); mawf.confirmModal.closeModal(); } : function() { mawf.confirmModal.closeModal(); };
    
    mawf.confirmModal.launch( modalArgs );          // Launch confirmation modal - this still needed to set button text and callback - needs fix
};

/**
 * Called when a trans error modal button is clicked, when user clicks Return to Form this function will complete all necessary app changes to satisfy error template
 * @param  {string} code Property from error template
 * @return {undefined}
 *
 * Note: Will only work with vars in the main model - mawf.CartView - not in donations sub models
 */
mawf.transactionErrorCB = function(code) {
    if ( mawf.bug && mawf.bug.logTransErrorHandling )   { console.log('transactionErrorCB() called'); }

    var i, ii, actions, trigger, modelVarsArr;

    actions = mawf.adminAlertTypes[code].modelAction;

    for ( i in actions ) {
        switch(i) {
            case 'clearToken' :
                mawf.transToken = '';
                break;

            case 'clearModelValue' :
                modelVarsArr = actions[i].split(' ');
                for ( ii in modelVarsArr ) {
                    if ( modelVarsArr[ii] !== '' ) { mawf.CartView[modelVarsArr[ii]](''); }
                }
                break;

            case 'otherAction' :
                actions[i]();
                break;

            case 'triggerEls' :
                $(actions[i]).trigger('change');
                break;

            case 'focusEl' :
                $(actions[i]).trigger('focus');
                break;
        }
    }
};

mawf.clearPageAbandon = function() {
    window.onbeforeunload = function() { };
};

mawf.donationSuccess = function() {
    mawf.confirmModal.updateGraphic('/img/donation/badge-check.gif');
    mawf.confirmModal.updateMessage('Thank you for your donation! <br>Your receipt will be available momentarily.');
    $.jStorage.deleteKey(mawf.cartName);
    mawf.clearPageAbandon();
    window.setTimeout(function() {
        if ( typeof mawf.bug  === undefined || (mawf.bug && mawf.bug.blockSuccessRedirect !== true) ) { window.location = mawf.getSuccessURL(true); }   
    }, 1000);
};


})(jQuery);