// Make sure you require() what you need to.
restify = require('restify');
socketio = require('socket.io');
fs = require('fs');
util = require('util');
request = require('request');
mongo = require('./extra_modules/mongo.js');


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

//output all users
server.get('/users/all', function(req, res, next) {
    mongo.connect(function() {
        mongo.getUsers(function(data) {
            if (data !== false) {
                var excludes = ['_id', 'updateDate'];
                for (r = 0; r < data.length; r++) {
                    for (i = 0; i < excludes.length; i++) {
                        delete data[r][excludes[i]];
                    }
                }
                res.json(data);
                res.end();
                next();
            } else {
                res.end();
                next();
            }
        });
    });
});



//server static files from lib directory
server.get(/\/lib\/?.*/, restify.serveStatic({
    directory: __dirname,
    'default': 'index.html'
}));



server.get(/\/pdfs\/?.*/,function indexHTML(req, res, next) {
    res.setHeader('Location', '/fa/');
    res.writeHead(301);
    res.end();
    next();
});

// Serve index.html file
server.get('/', function indexHTML(req, res, next) {
		//inform piwik for download
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
});

server.get(/^\/(fa|en)$/, function indexHTML(req, res, next) {
    res.setHeader('Location', '/'+req.params[0]+'/');
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
server.listen(80, function() {
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
