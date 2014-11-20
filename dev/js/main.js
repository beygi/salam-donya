remoteData = {};

$(document).ready(function() {
    //request permission for displaying a notification using webNotify and notifu.js
    Notify.requestPermission();

    //open web socket
    var socket = io('');
    socket.on('connect', function() {
        //when tweet is received from socket , prepend it to tweet's area using tweet template and handlebars

        socket.on('tweet', function(data) {
            renderTweet(data);
            //display a notify when we have a new tweet
            var myNotification = new Notify(data.name, {
                body: data.text,
                icon: data.avatar
            });
            myNotification.show();
        });

    });

    //fetch all tempalates
    $.get('/lib/app/templates/main.mst', function(template) {

        //compile plain html templates to handlebar's template
        //tweet_tpl = Handlebars.compile($(template).filter('#tweetTpl').html());
        //user_tpl = Handlebars.compile($(template).filter('#userTpl').html());
        main_tpl = Handlebars.compile($(template).filter('#mainTpl').html());
        big_tpl = Handlebars.compile($(template).filter('#bigTpl').html());
        magazine_tpl = Handlebars.compile($(template).filter('#magazineTpl').html());
        tweet_tpl = Handlebars.compile($(template).filter('#tweetTpl').html());
        previews_tpl = Handlebars.compile($(template).filter('#previews_tpl').html());

        //parse URL for page name and translation
        lang = document.location.pathname.replace(/^[\/]+/, "").replace(/[\/]$/, "").split('/')[0];
        page = document.location.pathname.replace(/^[\/]+/, "").replace(/[\/]$/, "").split('/')[1] || 'index';

        //get data.json
        $.ajax({
            dataType: "json",
            url: '/lib/data.json'
        }).done(function(data) {
            remoteData = data;
            createPage(page, lang);
        }).error(function(a, b, c) {
            console.log(a, b, c);
        });

        //find page Name
        // window.history.pushState("object or string", "Title", "/fa/index");

    });

});


function createPage(name, lang) {
    var page = findPage(name);
    page_data = {};
    if (page) {

        for (var i = 0; i < page.translations.length; i++) {
            if (page.translations[i].code === lang) {
                page_data = page.translations[i].data;
            }
        }

        buildData = {};
        buildData.trans = findTranslation(lang);
        buildData.topMenus = getTopMenus(lang, name);
        buildData.lang = lang;
        buildData.pageData = page_data;

        if (name === 'index') {
            block = findBlock('aboutMagazine', lang);
            buildData.first = {
                title: block.title,
                text: block.text
            };
            buildData.second = {
                title: buildData.trans.twitter,
                text: "<div class='tweets'></div>"
            };
            buildData.magazine = findLastMagazineData(lang);
            buildData.magazine.cover = remoteData.magazines[remoteData.magazines.length - 1].cover;
            buildData.magazine.num = remoteData.magazines[remoteData.magazines.length - 1].num;
            buildData.magazine.pdf = remoteData.magazines[remoteData.magazines.length - 1].pdf;
            buildData.sponsors=getSponors(lang);
            $('.content').html(main_tpl(buildData));
            //get tweets and show them
            $('img.cover').load(function() {
                $.ajax({
                    dataType: "json",
                    url: '/tweets/all'
                }).done(function(data) {
                    //render tweets
                    for (var i = data.length - 1; i >= 0; i--) {
                        renderTweet(data[i]);
                    }
                });
            });
        } else if (name === 'magazine') {
            //get magazine by id
            var magazineId = document.location.pathname.replace(/^[\/]+/, "").replace(/[\/]$/, "").split('/')[2];
            var magazine = findMagazineByNum(magazineId, lang);
            if (magazine) {
                buildData.magazine = magazine;
                buildData.pageData = {
                    title: magazine.title,
                    text: magazine_tpl(buildData)
                };
                $('.content').html(big_tpl(buildData));
                var disqus_shortname = 'salamdonya'; // required: replace example with your forum shortname

                /* * * DON'T EDIT BELOW THIS LINE * * */
                (function() {
                    var dsq = document.createElement('script');
                    dsq.type = 'text/javascript';
                    dsq.async = true;
                    dsq.src = '//' + disqus_shortname + '.disqus.com/embed.js';
                    (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
                })();
            } else {
                buildData.pageData = {
                    title: "404",
                    text: "404"
                };
                $('.content').html(big_tpl(buildData));
            }
        } else if (name === 'issues') {
          buildData.magazines=[];
          for(var j=0;j<remoteData.magazines.length;j++)
          {
            buildData.magazines.push(findMagazineByNum(remoteData.magazines[j].num, lang));
          }
          buildData.pageData.text = previews_tpl(buildData);
          $('.content').html(big_tpl(buildData));
        } else {
            $('.content').html(big_tpl(buildData));
        }
        document.title = buildData.pageData.title;

        //<!-- Piwik -->
        try {
            _paq.push(['setReferrerUrl', document.referrer]);
            _paq.push(['trackPageView', buildData.pageData.title]);
        } catch (e) {
            console.log(e);
        }
        //<!-- End Piwik Code -->


    } else {
        buildData = {};
        buildData.pageData = {
            title: "404",
            text: "404"
        };
        $('.content').html(big_tpl(buildData));
    }
}

function findPage(page) {
    for (var i = 0; i < remoteData.pages.length; i++) {
        if (page === remoteData.pages[i].url) {

            return remoteData.pages[i];
        }
    }
    return false;
}


function findBlock(name, lang) {
    for (var i = 0; i < remoteData.staticBlocks.length; i++) {
        if (name === remoteData.staticBlocks[i].name) {
            for (var j = 0; j < remoteData.staticBlocks[i].translations.length; j++)
                if (remoteData.staticBlocks[i].translations[j].code === lang) return remoteData.staticBlocks[i].translations[j].data;
        }
    }
    return false;
}

function findTranslation(lang) {
    for (var i = 0; i < remoteData.translations.length; i++) {
        if (remoteData.translations[i].code === lang) return remoteData.translations[i].data;
    }
    return false;
}

function findLastMagazineData(lang) {
    for (var j = 0; j < remoteData.magazines[remoteData.magazines.length - 1].translations.length; j++) {
        if (remoteData.magazines[remoteData.magazines.length - 1].translations[j].code === lang)
            return remoteData.magazines[remoteData.magazines.length - 1].translations[j].data;
    }
    return false;
}

function findMagazineByNum(num, lang) {
    for (var j = 0; j < remoteData.magazines.length; j++) {
        if (remoteData.magazines[j].num == num)
            for (var i = 0; i < remoteData.magazines[j].translations.length; i++) {
                if (remoteData.magazines[j].translations[i].code === lang) {
                    var magazine = {};
                    magazine = remoteData.magazines[j].translations[i].data;
                    magazine.num = remoteData.magazines[j].num;
                    magazine.cover = remoteData.magazines[j].cover;
                    magazine.pdf = remoteData.magazines[j].pdf;
                    magazine.lang = lang;
                    return magazine;
                }
            }
    }
    return false;
}

function getTopMenus(lang, page) {
    var menus = [];
    for (var i = 0; i < remoteData.TopLinks.length; i++) {
        for (var j = 0; j < remoteData.TopLinks[i].translations.length; j++) {
            if (remoteData.TopLinks[i].translations[j].code === lang) {
                var menu = remoteData.TopLinks[i].translations[j].data;
                menu.url = remoteData.TopLinks[i].url;
                menu.lang = lang;
                if (menu.url === page) {
                    menu.cssClass = 'active';
                }
                if (menu.url.indexOf('http')==-1) {
                  menu.url="/"+lang+"/"+menu.url;
                }
                menus.push(menu);
            }
        }
    }
    return menus;
}

function getSponors(lang) {
    var sponsors = [];
    for (var i = 0; i < remoteData.sponsors.length; i++) {
        for (var j = 0; j < remoteData.sponsors[i].translations.length; j++) {
            if (remoteData.sponsors[i].translations[j].code === lang) {
                var sponsor = remoteData.sponsors[i].translations[j].data;
                sponsor.web = remoteData.sponsors[i].web;
                sponsor.logo = remoteData.sponsors[i].logo;
                sponsor.lang = lang;
                sponsors.push(sponsor);
            }
        }
    }
    return sponsors;
}


function renderTweet(tweet) {
    var bigger = ($('.tweets').parent().parent().prev().height() > $('.tweets').parent().parent().prev().prev().height()) ? $('.tweets').parent().parent().prev().height() : $('.tweets').parent().parent().prev().prev().height();
    $('.tweets').css("height", bigger - 60 + 'px');
    $('.tweets').prepend(tweet_tpl(tweet));
}


//PIWIK
  var _paq = _paq || [];
  (function() {
    var u=(("https:" == document.location.protocol) ? "https" : "http") + "://piwik.salam-donya.ir/";
    _paq.push(['setTrackerUrl', u+'piwik.php']);
    _paq.push(['setSiteId', 1]);
    var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0]; g.type='text/javascript';
    g.defer=true; g.async=true; g.src=u+'piwik.js'; s.parentNode.insertBefore(g,s);
  })();
