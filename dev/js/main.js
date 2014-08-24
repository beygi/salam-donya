remoteData = {};

$(document).ready(function() {
    //request permission for displaying a notification using webNotify and notifu.js
    //Notify.requestPermission();

    //open web socket
    var socket = io('');
    socket.on('connect', function() {
        //when tweet is received from socket , prepend it to tweet's area using tweet template and handlebars
        /*
    socket.on('tweet', function(data){
        $('.tweets').prepend(tweet_tpl(data))

        //display a notify when we have a new tweet
        var myNotification = new Notify(data.name, {
            body: data.text,
            icon : data.avatar
        });
        myNotification.show();
    });
    */
    });

    //fetch all tempalates
    $.get('/lib/app/templates/main.mst', function(template) {

        //compile plain html templates to handlebar's template
        //tweet_tpl = Handlebars.compile($(template).filter('#tweetTpl').html());
        //user_tpl = Handlebars.compile($(template).filter('#userTpl').html());
        main_tpl = Handlebars.compile($(template).filter('#mainTpl').html());
        big_tpl = Handlebars.compile($(template).filter('#bigTpl').html());

        //parse URL for page name and translation
        lang = document.location.pathname.replace(/^[\/]+/, "").replace(/[\/]$/, "").split('/')[0];
        page = document.location.pathname.replace(/^[\/]+/, "").replace(/[\/]$/, "").split('/')[1] || 'index';
        console.log(lang);
        console.log(page);

        //get data.json
        $.ajax({
            dataType: "json",
            url: '/lib/data.json'
        }).done(function(data) {
            remoteData=data;
            console.log(data);
            createPage(page,lang);
            //render users
            //for (i = 0; i < data.length; i++) {
            //    if (data[i].fullname === undefined || data[i].fullname === '' || data[i].fullname === null) data[i].fullname = data[i].name;
            //    $('.users').prepend(user_tpl(data[i]));
            //}
        }).error(function(a,b,c){console.log(a,b,c);});
        //get user data and show them
        /*
        $.ajax({
            dataType: "json",
            url: '/users/all'
        }).done(function(data) {
            //render users
            for (i = 0; i < data.length; i++) {
                if (data[i].fullname === undefined || data[i].fullname === '' || data[i].fullname === null) data[i].fullname = data[i].name;
                $('.users').prepend(user_tpl(data[i]));
            }
        });
        */

        //find page Name
        // window.history.pushState("object or string", "Title", "/fa/index");

    });

});


function createPage(name,lang) {
  var page=findPage(name);
  page_data={};
  for(var i=0;i<page.translations.length;i++)
  {
    console.log(page.translations[i].code);
    if (page.translations[i].code===lang) {
      page_data=page.translations[i].data;
    }
  }

  buidData={};
  buidData.trans = findTranslation(lang);
  buidData.topMenus=getTopMenus(lang);
  buidData.lang = lang;
  buidData.pageData = page_data;

  if (name==='index') {
    block = findBlock('aboutMagazine',lang);
    buidData.first = {title :block.title ,text : block.text};
    buidData.magazine=findLastMagazineData(lang);
    buidData.magazine.cover=remoteData.magazines[remoteData.magazines.length-1].cover;
    buidData.magazine.num=remoteData.magazines[remoteData.magazines.length-1].num;
    buidData.magazine.pdf=remoteData.magazines[remoteData.magazines.length-1].pdf;
    $('.content').html(main_tpl(buidData));
  }else
  {
    $('.content').html(big_tpl(buidData));
  }
  document.title = page_data.title;
}

function findPage(page) {
  for (var i=0;i<remoteData.pages.length;i++) {
    if (page===remoteData.pages[i].url) {

      return remoteData.pages[i];
    }
  }
  return false;
}


function findBlock(name,lang) {
  for (var i=0;i<remoteData.staticBlocks.length;i++) {
    if (name===remoteData.staticBlocks[i].name) {
      for(var j=0;j<remoteData.staticBlocks[i].translations.length;j++)
        if (remoteData.staticBlocks[i].translations[j].code===lang)return remoteData.staticBlocks[i].translations[j].data;
      }
  }
  return false;
}

function findTranslation(lang) {
  for (var i=0;i<remoteData.translations.length;i++) {
        if (remoteData.translations[i].code===lang)return remoteData.translations[i].data;
  }
  return false;
}

function findLastMagazineData(lang) {
  for(var j=0;j<remoteData.magazines[remoteData.magazines.length-1].translations.length;j++)
  {
        if (remoteData.magazines[remoteData.magazines.length-1].translations[j].code===lang)
          return remoteData.magazines[remoteData.magazines.length-1].translations[j].data;
  }
  return false;
}

function getTopMenus(lang)
{
  var menus=[];
  for(var i=0;i<remoteData.TopLinks.length;i++)
  {
      for(var j=0;j<remoteData.TopLinks[i].translations.length;j++)
      {
        if (remoteData.TopLinks[i].translations[j].code===lang)
        {
          var menu=remoteData.TopLinks[i].translations[j].data;
          menu.url=remoteData.TopLinks[i].url;
          menu.lang = lang;
          menus.push(menu);
        }
      }
  }
  return menus;
}