config = (function () {
	var services, prop,

		domain   = document.location.hostname,
		protocol = document.location.protocol + '//';



	services = {
        /**
         * PRODUCTS
         */

        'ProductPreview': {
            endpoint: '/Services/Donation.svc/GetProductById/'
        },

		/**
		 * TRANSACTIONS
		 */
        'Donation': {
            endpoint: '/Services/Donation.svc/'
        },
        'GetToken': {
            endpoint: '/Services/Donation.svc/GetToken'
        },
        'GetTransactionRecord': {
			endpoint: '/cson/ec/',
			staticDomain: 'secure.wish.org',
			alwaysSecure: true
        },
        'StandardCCTrans': {
            endpoint: '/cson/ec/',
            staticDomain: 'secure.wish.org',
            alwaysSecure: true
        },
        'PayPalCCTrans': {
            endpoint: '/cson/ec/',
            staticDomain: 'secure.wish.org',
            alwaysSecure: true
        },


		/**
		 * ADMINISTRATIVE ERROR ALERTS
		 */

        'APIError': {
            endpoint: '/Services/Donation.svc/APIError',
			alwaysSecure: true
        },


        /**
         * CHAPTER LOCATORS
         */

        'ChapterLocatorDonation': {
            endpoint: '/Services/Donation.svc/SearchChaptersForDonation/',
			alwaysSecure: true
        },
        'ChapterLocatorStandard': {
            endpoint: '/Services/Donation.svc/SearchChaptersForNewsletter/',
			alwaysSecure: true
        },
        'ChapterLocatorInternational': {
            endpoint: '/Services/Donation.svc/SearchInternationalChapter/',
			alwaysSecure: true
        },
 
        'ChapterLocatorAll': {
            endpoint: '/Services/Donation.svc/SearchChapters/',
			alwaysSecure: true
        },

        /**
         * EMAIL SIGNUPS
         */
        'WishMessengerSubscribe': {
            endpoint: '/Services/Donation.svc/SubscribeToEmailOptIn/'
        },
        'LocalNationalSubscribe': {
            endpoint: '/Services/Donation.svc/SubscribeToEmailNotifications/'
        },

        /**
         * EMOTION DATA
         */
        'EmotionData': {
            endpoint: '/Services/WebStoryService.svc/UpdateStoryReactionCounter/', // CD Hosts
			alwaysSecure: true
		}
	};
    /*
    * Use of staticDomain property -
    * 
    * If staticDomain property exists then this domain will be used otherwise
    * the current hosting domain will be used.
    *
    * Use of the alwaysUseSecure property
    *
    * Pretty self explanatory - always access via SSL
    * 
     */

    for (prop in services) {
        // Prepend domain
        if (services[prop].staticDomain) {
            services[prop].endpoint = services[prop].staticDomain + services[prop].endpoint;

		} else {
			services[prop].endpoint = domain + services[prop].endpoint;
		}
		// Prepend protocol
		services[prop].endpoint = (services[prop].alwaysSecure ? 'https://' : protocol) + services[prop].endpoint;


	}

	return {
		getService: function (strServiceName) {
			return services[strServiceName] || null;
		}
	};
})();