// jquery.mawsocial.js - Modified from http://tweet.seaofclouds.com/ or https://github.com/seaofclouds/tweet
// anthonyc@me.com made a bunch of changes to original code, specific for maw purposes. some remnant from
// original code remain, but not everything will work
(function (factory) {
  if (typeof define === 'function' && define.amd)
    define(['jquery'], factory); // AMD support for RequireJS etc.
  else
    factory(jQuery);
}(function ($) {
  $.fn.mawsocial = function(o){
    var s = $.extend({
      load_from: 'twitter',                     // twitter
      image_size: 62,							// [integer]  height and width of avatar if displayed (48px max)
      count: 1,                                 // [integer]  how many posts to display?
      fetch: null,                              // [integer]  how many posts to fetch via the API (set this higher than 'count' if using the 'filter' option)
      page: 1,                                  // [integer]  which page of results to fetch (if count != fetch, you'll get unexpected results)
      retweets: true,                           // [boolean]  whether to fetch (official) retweets (not supported in all display modes)
      intro_text: null,                         // [string]   do you want text BEFORE your your posts?
      outro_text: null,                         // [string]   do you want text AFTER your posts?
      loading_text: "loading...",				// [string]   optional loading text, displayed while posts load
      refresh_interval: null,

      /* TWITTER INFO */
      twitter_account: "makeawish",             // [string or array] required unless using the 'query' option; one or
												// more twitter screen names (use 'list' option for multiple names, where possible)
      twitter_url: "twitter.com",               // [string]   custom twitter url, if any (apigee, etc.)
      twitter_api_url: "api.twitter.com",       // [string]   custom twitter api url, if any (apigee, etc.)
      /* END */
      json_post: null,                          // set in code
      out_url: null,							// set in code
      out_tooltip: null,						// set in code
      template: "{image}{text} {time}",			// [string or function] template used to construct each post <li>
												// - see code for available vars

      comparator: function(post1, post2) {		// [function] comparator used to sort posts (see Array.sort)
        return post2["post_time"] - post1["post_time"];
      },

      filter: function(postid) {                 // [function] whether or not to include a particular post (be sure to also set 'fetch')
        return true;
      }
      // You can attach callbacks to the following events using jQuery's standard .bind() mechanism:
      //   "loaded" -- triggered when posts have been fetched and rendered
    }, o);

    // See http://daringfireball.net/2010/07/improved_regex_for_matching_urls
    var url_regexp = /\b((?:https?:\/\/|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/gi;

    // Expand values inside simple string templates with {placeholders}
    function t(template, info) {
      if (typeof template === "string") {
        var result = template;
        for(var key in info) {
          var val = info[key];
          result = result.split('{'+key+'}').join(val === null ? '' : val);
        }
        return result;
      } else return template(info);
    }
    // Export the t function for use when passing a function as the 'template' option
   // $.extend({post: {t: t}});

    function replacer (regex, replacement) {
      return function() {
        var returning = [];
        this.each(function() {
          returning.push(this.replace(regex, replacement));
        });
        return $(returning);
      };
    }

    function escapeHTML(s) {
      return s.replace(/</g,"&lt;").replace(/>/g,"^&gt;");
    }

    $.fn.extend({
      linkUser: replacer(/(^|[\W])@(\w+)/gi, "$1<span class=\"at\">@</span><a href=\"http://"+s.twitter_url+"/$2\">$2</a>"),
      // Support various latin1 (\u00**) and arabic (\u06**) alphanumeric chars
      linkHash: replacer(/(?:^| )[\#]+([\w\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u00ff\u0600-\u06ff]+)/gi,
                         ' <a href="http://'+s.twitter_search_url+'/search?q=&tag=$1&lang=all'+
                         ((s.twitter_account && s.twitter_account.length == 1 && !s.list) ? '&from='+s.twitter_account.join("%2BOR%2B") : '')+
                         '" class="post_hashtag">#$1</a>'),
      makeHeart: replacer(/(&lt;)+[3]/gi, "<tt class='heart'>&#x2665;</tt>")
    });

    function linkURLs(text) {
      return text.replace(url_regexp, function(match) {
        var url = (/^[a-z]+:/i).test(match) ? match : "http://"+match;
        var text = match;
        return "<a href=\""+escapeHTML(url)+"\">"+escapeHTML(text)+"</a>";
      });
    }

    function parse_date(date_str) {
      // The non-search twitter APIs return inconsistently-formatted dates, which Date.parse
      // cannot handle in IE. We therefore perform the following transformation:
      // "Wed Apr 29 08:53:31 +0000 2009" => "Wed, Apr 29 2009 08:53:31 +0000"
      return Date.parse(date_str.replace(/^([a-z]{3})( [a-z]{3} \d\d?)(.*)( \d{4})$/i, '$1,$2$4$3'));
    }

    function extract_relative_time(date) {
      var toInt = function(val) { return parseInt(val, 10); };
      var relative_to = new Date();
      var delta = toInt((relative_to.getTime() - date) / 1000);
      if (delta < 1) delta = 0;
      return {
        days:    toInt(delta / 86400),
        hours:   toInt(delta / 3600),
        minutes: toInt(delta / 60),
        seconds: toInt(delta)
      };
    }

    function format_relative_time(time_ago) {
      if ( time_ago.days > 2 )     return 'about ' + time_ago.days + ' days ago';
      if ( time_ago.hours > 24 )   return 'about a day ago';
      if ( time_ago.hours > 2 )    return 'about ' + time_ago.hours + ' hours ago';
      if ( time_ago.minutes > 45 ) return 'about an hour ago';
      if ( time_ago.minutes > 2 )  return 'about ' + time_ago.minutes + ' minutes ago';
      if ( time_ago.seconds > 1 )  return 'about ' + time_ago.seconds + ' seconds ago';
      return 'just now';
    }

    function build_api_url() {
      var proto = ('https:' == document.location.protocol ? 'https:' : 'http:');
      var count = (s.fetch === null) ? s.count : s.fetch;

      if(s.load_from == 'twitter'){

        s.json_post = '';
        s.out_url = proto+'//'+s.twitter_url+'/'+s.twitter_account;
        s.out_tooltip = 'Follow us on twitter';
        //console.log(proto+'//'+s.twitter_api_url+'/1/statuses/user_timeline.json?screen_name='+s.twitter_account+'&count='+count+(s.retweets ? '&include_rts=1' : '')+'&page='+s.page+'&include_entities=1&callback=?');
        return proto+'//'+s.twitter_api_url+'/1/statuses/user_timeline.json?screen_name='+s.twitter_account+'&count='+count+(s.retweets ? '&include_rts=1' : '')+'&page='+s.page+'&include_entities=1&callback=?';
      }
    }

    // Convert twitter API objects into data available for
    // constructing each post <li> using a template
    function extract_template_data(item){
//      console.log(item);
      var o = {};
      if(s.load_from == 'twitter'){
        o.item = item;

        o.entities = item.entities ? (item.entities.urls || []).concat(item.entities.media || []) : [];
        o.tweet_raw_text = o.retweet ? ('RT @'+o.retweeted_screen_name+' '+item.retweeted_status.text) : item.text; // avoid '...' in long retweets

        o.post_time = parse_date(item.created_at);
        o.post_text = $([linkURLs(o.tweet_raw_text, o.entities)]).linkUser().linkHash()[0];
        o.image = '';
      }

      o.post_relative_time = format_relative_time(extract_relative_time(o.post_time));
      o.time = t('<span class="post_time"><a href="'+s.out_url+'" title="'+s.out_tooltip+'">{post_relative_time}</a></span>', o);
      o.text = t('<span class="post_text">{post_text}</span>', o);

      return o;
    }

    function load(widget) {
      var loading = $('<p class="loading">'+s.loading_text+'</p>');

      if (s.loading_text) $(widget).not(":has(.post_list)").empty().append(loading);

      $.getJSON(build_api_url(), function(data){
        var list = $('<ul class="post_list">'),
			posts;

        if(s.load_from == 'twitter'){
			posts = $.map(data.results || data, extract_template_data);
        }
        posts = $.grep(posts, s.filter).sort(s.comparator).slice(0, s.count);
        list.append($.map(posts, function(o) { return "<li>" + t(s.template, o) + "</li>"; }).join('')).
          children('li:first').addClass('post_first').end().
          children('li:odd').addClass('post_even').end().
          children('li:even').addClass('post_odd');

        $(widget).empty().append(list);

        $(widget).trigger("loaded").trigger((posts.length === 0 ? "empty" : "full"));
        if (s.refresh_interval) {
          window.setTimeout(function() { $(widget).trigger("mawsocial:load"); }, 1000 * s.refresh_interval);
        }
      });
    }

    return this.each(function(i, widget){
      if(s.twitter_account && typeof(s.twitter_account) == "string"){
        s.twitter_account = [s.twitter_account];
      }

      $(widget).unbind("mawsocial:load").bind("mawsocial:load", function(){
        load(widget);
      }).trigger("mawsocial:load");
    });
  };
}));
