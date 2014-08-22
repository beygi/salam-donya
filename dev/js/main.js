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

        //render main page template using handlebars
        $('.content').html(main_tpl());

        //parse URL for page name and translation
        lang = document.location.pathname.replace(/^[\/]+/, "").replace(/[\/]$/, "").split('/')[0];
        page = document.location.pathname.replace(/^[\/]+/, "").replace(/[\/]$/, "").split('/')[1] || 'index';
        console.log(lang);
        console.log(page);

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
