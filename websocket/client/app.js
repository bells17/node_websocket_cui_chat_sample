var WebSocketClient = require('websocket').client;
var client = new WebSocketClient();
var util = require('util');
var port = 3000;

var flg = false;

client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});

client.on('connect', function(connection) {
    console.log('WebSocket client connected');
    connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
    });
    connection.on('close', function() {
        console.log('echo-protocol Connection Closed');
    });
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
          //通常メッセージ
          message = get_data(message);
          console.log('test: '+util.inspect(message));
        } else if (message.type === 'binary') {
            //バイナリデータ
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
        }

    });

    send(connection, 'join', {'room':'aaa'});

});

client.connect('ws://localhost:'+port+'/', 'echo-protocol');


function send(connection, event, response_object) {
  response = {
    'event' : event,
    'data'  : response_object
  };
  response = JSON.stringify(response);
  connection.sendUTF(response);
}


function get_data(message) {
  return message.utf8Data;
}