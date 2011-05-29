//twitter-nodejs-websocket

var sys    = require('sys'),
    http   = require('http'),
    ws     = require("./vendor/ws"),
    base64 = require('./vendor/base64'),
    arrays = require('./vendor/arrays');

// Command line args
var USERNAME = process.ARGV[2];
var PASSWORD = process.ARGV[3];
var KEYWORD  = process.ARGV[4] || "europeanrevolution";

if (!USERNAME || !PASSWORD)
  return sys.puts("Usage: node server.js <twitter_username> <twitter_password> <keyword>");

// Authentication Headers for Twitter
var auth = base64.encode(USERNAME + ':' + PASSWORD);
var headers = {
  'Authorization' : "Basic " + auth,
  'Host'          : "stream.twitter.com"
};

var clients = [];

// Connection to Twitter's streaming API
var twitter = http.createClient(80, "stream.twitter.com");
var request = twitter.request("GET", "/1/statuses/filter.json?track=" + KEYWORD, headers);

// regexp for links
var linkregexp = /((http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?)/gi; 

request.addListener('response', function (response) {
  response.setEncoding("utf8");
  
  response.addListener("data", function (chunk) {
    // Send response to all connected clients
    //l = linkregexp.exec(chunk);
    //t = JSON.parse(chunk);
    //sys.debug(t.text);
    //if(l){
    //  	sys.debug('link:' + l[0]);
    //}
    
    clients.each(function(c) {
      c.write(chunk);
    });
  });
});
request.end();

// Websocket TCP server
ws.createServer(function (websocket) {
  clients.push(websocket);

  websocket.addListener("connect", function (resource) {
    // emitted after handshake
    sys.debug("connect: " + resource);
  }).addListener("close", function () {
    // emitted when server or client closes connection
    clients.remove(websocket);
    sys.debug("close");
  });
}).listen(8080);
