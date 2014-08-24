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

        buidData = {};
        buidData.trans = findTranslation(lang);
        buidData.topMenus = getTopMenus(lang, name);
        buidData.lang = lang;
        buidData.pageData = page_data;

        if (name === 'index') {
            block = findBlock('aboutMagazine', lang);
            buidData.first = {
                title: block.title,
                text: block.text
            };
            buidData.second = {
                title: buidData.trans.twitter,
                text: "<div class='tweets'></div>"
            };
            buidData.magazine = findLastMagazineData(lang);
            buidData.magazine.cover = remoteData.magazines[remoteData.magazines.length - 1].cover;
            buidData.magazine.num = remoteData.magazines[remoteData.magazines.length - 1].num;
            buidData.magazine.pdf = remoteData.magazines[remoteData.magazines.length - 1].pdf;
            $('.content').html(main_tpl(buidData));
            //get tweets and show them
            $('img.cover').load(function(){
              $.ajax({
                  dataType: "json",
                  url: '/tweets/all'
              }).done(function(data) {
                  //render tweets
                  for (var i = data.length-1; i >= 0 ; i--) {
                      renderTweet(data[i]);
                  }
              });
            });
        } else if (name === 'magazine') {
            //get magazine by id
            var magazineId = document.location.pathname.replace(/^[\/]+/, "").replace(/[\/]$/, "").split('/')[2];
            var magazine = findMagazineByNum(magazineId, lang);
            if (magazine) {
                buidData.magazine = magazine;
                buidData.pageData = {
                    title: magazine.title,
                    text: magazine_tpl(buidData)
                };
            } else {
                buidData.pageData = {
                    title: "404",
                    text: "404"
                };
            }
            $('.content').html(big_tpl(buidData));
        } else {
            $('.content').html(big_tpl(buidData));
        }
        document.title = buidData.pageData.title;
    } else {
        buidData = {};
        buidData.pageData = {
            title: "404",
            text: "404"
        };
        $('.content').html(big_tpl(buidData));
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
                menus.push(menu);
            }
        }
    }
    return menus;
}


function renderTweet(tweet) {
    var bigger = ($('.tweets').parent().parent().prev().height()>$('.tweets').parent().parent().prev().prev().height())?$('.tweets').parent().parent().prev().height():$('.tweets').parent().parent().prev().prev().height();
    $('.tweets').css("height",bigger-60+'px');
    $('.tweets').prepend(tweet_tpl(tweet));
}
