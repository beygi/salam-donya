// Make sure you require() what you need to.
restify = require('restify');
socketio = require('socket.io');
fs = require('fs');
util = require('util');
request = require('request');
mongo = require('./extra_modules/mongo.js');

var config = require("./config.js");
var Twit = require('twit');
var PiwikTracker = require('piwik-tracker');
var piwik = new PiwikTracker(1, 'http://piwik.salam-donya.ir/piwik.php');
// Optional: Respond to tracking errors
piwik.on('error', function(err) {
    console.log('error tracking request: ', err);
});

// Create the restify server
var server = restify.createServer({
    formatters: {
        'application/json': myCustomFormatJSON
    }
});

//gzip response
server.use(restify.gzipResponse());

server.use(restify.bodyParser());
restify.defaultResponseHeaders = function(data) {
    this.header('Access-Control-Allow-Origin', '*');
};

// Hook socket.io and the restify server up
var io = socketio.listen(server.server);

//init twitter api and event , and send any tweets to socket io
T = new Twit({
    consumer_key: config.twitter.consumer_key,
    consumer_secret: config.twitter.consumer_secret,
    access_token: config.twitter.token,
    access_token_secret: config.twitter.token_secret
});

twitts = [];
T.get('search/tweets', {
    q: '#SalamDonya',
    count: 30
}, function(err, data, response) {
    for (var i = 0; i < data.statuses.length; i++) {
        var b = new Buffer(data.statuses[i].user.profile_image_url);
        var s = b.toString('base64');
        twitts.push({
            text: data.statuses[i].text,
            avatar: "/img/byUrl/" + s,
            name: data.statuses[i].user.screen_name,
            lang: data.statuses[i].lang
        });
    }
});

var stream = T.stream('statuses/filter', {
    track: '#SalamDonya'
});
stream.on('tweet', function(tweet) {
    //add new twitt
    var b = new Buffer(tweet.user.profile_image_url);
    var s = b.toString('base64');
    twitts.unshift({
        text: tweet.text,
        avatar: "/img/byUrl/" + s,
        name: tweet.user.screen_name,
        lang: tweet.lang
    });
    //remove one old tweet
    if (twitts.length >= 30) {
        twitts.pop();
    }
    console.log('new tweet received');
    io.emit('tweet', {
        text: tweet.text,
        avatar: "/img/byUrl/" + s,
        name: tweet.user.screen_name,
        lang: tweet.lang
    });
});

//server static files from lib directory
server.get(/\/lib\/?.*/, restify.serveStatic({
    directory: __dirname,
    'default': 'index.html'
}));

//count pdf download
server.get(/\/pdfs\/?(.*)/, function(req, res, next) {

    var file = decodeURI(req.params[0]);
	console.log(file);
    //downloadPdf(file,req,res);
	console.log();
    if (fs.existsSync(__dirname + '/pdfs/' + file)) {
        piwik.track({
			token_auth : config.piwik.token_auth,
			cip : req.connection.remoteAddress,
            url: 'http://salam-donya.ir/RealPdfDownload/' + file,
            download: 'http://salam-donya.ir/RealPdfDownload/' + file,
            ua: req.headers['user-agent'],
            action_name: 'Download pdf : ' + file
        });
        fs.readFile(__dirname + '/pdfs/' + file, function(err, data) {
            if (err) {
                next(err);
                return;
            }
            res.setHeader('Content-Type', 'application/pdf');
            res.writeHead(200);
            res.end(data);
            next();
        });
    } else {
		console.log('not exist');
        res.writeHead(404);
		res.write("404 , file not found");
        res.end();
        next();
    }


    next();
});

server.get('/', function indexHTML(req, res, next) {
    res.setHeader('Location', '/fa/');
    res.writeHead(301);
    res.end();
    next();
});

//return tweets
server.get('/tweets/all', function indexHTML(req, res, next) {
    res.json(twitts);
    res.end();
    next();
});

server.get(/^\/(fa|en)$/, function indexHTML(req, res, next) {
    res.setHeader('Location', '/' + req.params[0] + '/');
    res.writeHead(301);
    res.end();
    next();
});


server.get(/^\/(fa|en)\/(.*)?/, function(req, res, next) {
    lang = req.params[0];
    page = req.params[1];
    console.log(lang);
    //send index
    if (lang === 'fa') {
        fs.readFile(__dirname + '/index.rtl.html', function(err, data) {
            if (err) {
                next(err);
                return;
            }
            res.setHeader('Content-Type', 'text/html');
            res.writeHead(200);
            res.end(data);
            next();
        });
    }
    if (lang === 'en') {
        fs.readFile(__dirname + '/index.ltr.html', function(err, data) {
            if (err) {
                next(err);
                return;
            }
            res.setHeader('Content-Type', 'text/html');
            res.writeHead(200);
            res.end(data);
            next();
        });
    }
});


//direct outout of images
server.get(/\/img\/byUrl\/(.*)/, function(req, res, next) {
    var b = new Buffer(req.params[0], 'base64');
    var s = b.toString();
    downloadImage(s, res);
    next();
});


io.sockets.on('connection', function(socket) {
    // socket.emit('news', { hello: 'world' });
    // socket.on('my other event', function (data) {
    //      console.log(data);
    //    });
});

// Listen to port 8080
server.listen(8080, function() {
    console.log('socket.io server listening at %s', server.url);
});



//download image
var downloadImage = function(url, res) {
    request({
        url: url
    }).pipe(res);
};




//JSON formatter function
function myCustomFormatJSON(req, res, body) {
    if (!body) {
        if (res.getHeader('Content-Length') === undefined &&
            res.contentLength === undefined) {
            res.setHeader('Content-Length', 0);
        }
        return null;
    }

    if (body instanceof Error) {
        // snoop for RestError or HttpError, but don't rely on instanceof
        if ((body.restCode || body.httpCode) && body.body) {
            body = body.body;
        } else {
            body = {
                message: body.message
            };
        }
    }

    if (Buffer.isBuffer(body))
        body = body.toString('base64');

    var data = JSON.stringify(body, null, 2);

    if (res.getHeader('Content-Length') === undefined &&
        res.contentLength === undefined) {
        res.setHeader('Content-Length', Buffer.byteLength(data));
    }

    return data;
}




//download video
var downloadPdf = function(fileName, req, res) {
    var dir = __dirname + '/pdfs/';
    var path = dir + fileName;
    console.log(path);
    var stat = fs.statSync(path);
    var total = stat.size;
    if (req.headers.range) {
        var range = req.headers.range;
        var parts = range.replace(/bytes=/, "").split("-");
        var partialstart = parts[0];
        var partialend = parts[1];

        var start = parseInt(partialstart, 10);
        var end = partialend ? parseInt(partialend, 10) : total - 1;
        var chunksize = (end - start) + 1;
        console.log('RANGE: ' + start + ' - ' + end + ' = ' + chunksize);

        var file = fs.createReadStream(path, {
            start: start,
            end: end
        });
        res.writeHead(206, {
            'Content-Range': 'bytes ' + start + '-' + end + '/' + total,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'application/pdf'
        });
        file.pipe(res);
    } else {
        console.log('ALL: ' + total);
        res.writeHead(200, {
            'Content-Length': total,
            'Content-Type': 'application/pdf'
        });
        fs.createReadStream(path).pipe(res);
    }
};
