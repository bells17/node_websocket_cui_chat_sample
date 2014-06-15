var WebSocketServer = require('websocket').server;
var http = require('http');
var util = require('util');
var port = 3000;

//create http server
var server = http.createServer(function(request, response) {
  console.log((new Date()) + ' Received request for ' + request.url);
  response.writeHead(404);
  response.end();
});
server.listen(port, function() {
  console.log((new Date()) + ' Server is listening on port '+port);
});

//create websocket server
wsServer = new WebSocketServer({
  httpServer: server,
  autoAcceptConnections: false
});

//コネクション確立リクエスト時
wsServer.on('request', function(request) {
  var connection = request.accept('echo-protocol', request.origin);
  console.log((new Date()) + ' Connection accepted.');
  connection.on('message', function(message) {
      console.log('request: '+util.inspect(message.utf8Data));
      connection.sendUTF('message event called');
  });
  //コネクション切断時
  connection.on('close', function(reasonCode, description) {
    console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
  });
});
