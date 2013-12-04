(function($){

String.prototype.rot13 = function () {
	// thanks to Jonas Raoni Soares Silva 	
	return this.replace(/[a-zA-Z]/g, function (c) {
		return String.fromCharCode((c <= "Z" ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26);
	});
};

function de_ob(a) {
	var href = a.getAttribute('href');
	var address = href.replace(/.*contact\//i, '');
	address = address.rot13().replace(/\+\+/g, '@').replace(/\+/g, '.');
	if (href != address) {
		a.setAttribute('href', 'mailto:' + address);
	}
}

function arrayRot13(textToParse)
{
	var beforeRot;
	var afterRot;
	var textAfterRot;

	textAfterRot = textToParse;
	
	beforeRot = textToParse.match(emailRegex);
	if (beforeRot) {
		afterRot = new Array();
		for (var idx = 0; idx < beforeRot.length; idx++) {
			afterRot[idx] = beforeRot[idx].rot13().replace( /\+\+/g , '@').replace( /\+/g , '.');
			textAfterRot = textAfterRot.replace(beforeRot[idx], afterRot[idx]);
		}
	}

	return textAfterRot;
}

var emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}/igm;

function global_attach_de_ob() {
	
	var emails = $("a[href^='mailto:']");
	var idx;
	var len = emails.length;
	for (idx = 0; idx < len; idx++) {
		var href; 
		var currentInnerHtml;

		href = emails[idx].getAttribute('href');
		currentInnerHtml = emails[idx].innerHTML;
		
		emails.eq(idx).attr('href', arrayRot13(href));
		
		emails[idx].innerHTML = arrayRot13(currentInnerHtml);
		
		
	}
	
}



window.onload = function () {
	global_attach_de_ob();

};


})(jQuery);