(function($){

//
// Init the Wishes page
//
mawf.wishes_init = function() {
	if ( window.mawf && $('#js-storyid').size() > 0 ) {
		var $this;

		mawf.storyId         = $('#js-storyid').val();
		mawf.emotions        = [];
		mawf.emotionRecord   = $.jStorage.get('e/'+mawf.storyId);
		mawf.emotionsVisible = false;
		mawf.emotionsExpSecs = 365 * 24 * 60 * 60 * 1000; // TTL in milliseconds; set to one year

		$('.emo-container a').each(function() {
			$this = $(this);
			mawf.emotions.push({id: $this.attr('data-emotion-id'), $el: $this, clicked: false});
		});

console.log(mawf.storyId);
		if ( mawf.emotionRecord !== null) {						// Previously Clicked?
			mawf.showEmotionData();									// Show emotion data
			mawf.restoreEmotionState();								// Update ind. button states
		}
																// Listener
		$('.emo-container').on('click', function(e) { e.preventDefault(); mawf.handleEmotionClick(e); } );

	}
};


mawf.handleEmotionClick = function(e) {
	var $target = $(e.target),
		i, id;

	if ( $target.is('h3') ) { $target = $target.closest('a'); }
	if ( $target.is('a') === false  ) { return false; }

	id       = $target.attr('data-emotion-id');


	for ( i in  mawf.emotions ) {								// Loop array for match
		if ( id == mawf.emotions[i].id ) {
			
			if ( mawf.emotions[i].clicked ) {					// Already clicked return
				return false;

			} else {											// Not clicked
				mawf.incrementEmotion($target, i);				// Update view
				$.get(config.getService('EmotionData').endpoint+mawf.storyId+'/'+id); // Update server records
				mawf.recordEmotion(id);							// Update local records
				mawf.showEmotionData();
			}
		}
	}
};

mawf.incrementEmotion = function($target, i) {
	var $countEl = $target.find('.emotion-stat');

	mawf.emotions[i].clicked = true;				// Set status as clicked
	$target.addClass('emoted');						// Update click class
	$countEl.text( +($countEl.text()) + 1 );		// Increment view count

};

//
// Show emotion values
//
mawf.showEmotionData = function() {
	if ( mawf.emotionsVisible ) { return false; }

	$('.emotion-stat').show();
	mawf.emotionsVisible = true;
};

// Sets an ind. emotion record
mawf.recordEmotion = function(id) {
	// Set main if not set
	if ( mawf.emotionRecord === null) { $.jStorage.set('e/'+mawf.storyId, true, {TTL: mawf.emotionsExpSecs}); }

	// Set individual
	$.jStorage.set('e/'+mawf.storyId+'/'+id, true);
};

// Returns clicked state for emotion data found in local storage
mawf.restoreEmotionState = function() {
	if ( mawf.emotionRecord === null ) { return false; } // Short; no master or master expired

	var i;
	for ( i in mawf.emotions ) {
		if ( $.jStorage.get('e/'+mawf.storyId+'/'+mawf.emotions[i].id) !== null ) {
			mawf.emotions[i].$el.addClass('emoted');
			mawf.emotions[i].clicked = true;
		}
	}
};

})(jQuery);