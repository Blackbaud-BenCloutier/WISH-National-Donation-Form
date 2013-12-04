(function($){

var player;

//
// Init Home.
//
mawf.initHome = function ()
{
	// preheader search icon color change
	$('.preheader .text-input')
		.focus(function(){
			$('.preheader .submit').addClass('active');
		})
		.blur(function(){
			$('.preheader .submit').removeClass('active');
		});

	$('div.slider').carousel({ 'circular': false,
								'next': 'img.left',
								'previous': 'img.right',
								'speed': 500,
								'increment': (mawf.isSmallScreen()) ? 1 : 3
							});

	// Set auto play video id to the first selection in the vid list


	// Play video
	$('div.feat-video').click(function (i) {
		var videoLinkURL = $(this).find('a.thumb').attr('href');

		$('.now-playing').removeClass('now-playing');
		$(this).addClass('now-playing');
		$('div.feat-video.selected').removeClass('selected');
		$(this).addClass('selected');
		$('.cta-play').removeClass('cta-play');
		$(this).removeClass('videoHover');

		var targetVideoID = mawf.getYouTubeID(videoLinkURL);

		if(targetVideoID)
		{
			player.loadVideoById(targetVideoID);
		}
		return false;
	});
};

//
// Get you tube id
//
mawf.getYouTubeID = function(url)
{
	if (url === undefined) { return false; }
	var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
	var match = url.match(regExp);
	if(match && match[7].length == 11)
	{
		return match[7];
	}

	return '';
};

// First this when the YouTube Api is ready.
// We setup the first video to play.
//
function onYouTubePlayerAPIReady()
{
  player = new YT.Player('ytapiplayer', {
    height: '352',
    width: '564',
    videoId: mawf.getYouTubeID( $('.feat-video').eq(0).find('.thumb').attr('href') ),
    events: {
      'onStateChange': mawf.onPlayerStateChange
    }
  });
}

//
// Call this when the player changes state.
//
mawf.onPlayerStateChange = function (event)
{
	// Possible values are unstarted (-1), ended (0), playing (1), paused (2), buffering (3), video cued (5)
	switch(event.data)
	{
		case 0:
			$('.now-playing').removeClass('now-playing');
		break;
	}
};

//
// On You Tube State
//
mawf.onytplayerStateChange = function(newState)
{
	// Possible values are unstarted (-1), ended (0), playing (1), paused (2), buffering (3), video cued (5)
	switch ( newState )
	{
		case -1:
			// Unstarted
			break;
		case 0:
			if ( this.ytVideo.currentlyPlaying )
			{
				this.ytVideo.currentlyPlaying.removeClass('videoNowPlaying');
				this.ytVideo.currentlyPlaying = null;
			}
		break;
	}
};

})(jQuery);