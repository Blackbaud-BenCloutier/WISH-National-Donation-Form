(function($){

//
// Setup the comment binding.
//
mawf.comment_init = function ()
{
	if($.uniform)
	{
		$("form.uniform input:text, form.uniform select, form.uniform input:checkbox, form.uniform input:radio, form.uniform input:file, form.uniform button, form.uniform input.submit, form.uniform input:reset").uniform();
	} else 
	{
		console.log("jQuery.uniform expected, but not found (leave-comment).");	
	}
	
	$('a.cancel').click(this.closeCommentWindow);

	$('#commentForm').submit(this.checkSubmit);
	
	$('form.uniform input:text').live('change', this.captchaClick );
	$('div.captchaDiv input.recaptcha_response_field').live('change', this.captchaClick );

	//manageHints();

	this.showCaptcha();
}

//
// Check submit.
//
mawf.checkSubmit = function ()
{
	console.log("Submitting form");
	return false;
}

//
// Setup Captcha.
//
mawf.showCaptcha = function ()
{
	try {
		if(Recaptcha && $('#captchaDiv').length)
		{
			Recaptcha.create("6LcThs8SAAAAACda67R0zhJC9Md0Ik3TmEP8_dJQ", 'captchaDiv', {
				theme: 'white',
				callback: Recaptcha.focus_response_field
			});
		}
	} catch(e){}
};

//
// Fire when captcha is clicked.
//
mawf.captchaClick = function () 
{
	console.log("Clicking on captcha input");
}

//
// Close comment window.
//
mawf.closeCommentWindow = function ()
{
	if(parent && parent.jQuery && parent.jQuery.fancybox)
	{
		parent.jQuery.fancybox.close();
	}
	
	return false;
}

})(jQuery);