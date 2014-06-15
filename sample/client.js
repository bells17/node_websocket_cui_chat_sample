var WebSocketClient = require('websocket').client;
var client = new WebSocketClient();
var util = require('util');
var port = 3000;

//接続エラーイベント
client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});
//接続時イベント
client.on('connect', function(connection) {
  console.log('WebSocket client connected');
  //エラーイベント
  connection.on('error', function(error) {
    console.log("Connection Error: " + error.toString());
  });
  //接続切断時イベント
  connection.on('close', function() {
    console.log('echo-protocol Connection Closed');
  });
  //メッセージイベント
  //websocketではイベントを自由に登録できないのでレスポンスデータ内にイベントを定義するなどして処理を切り分ける
  connection.on('message', function(message) {
      console.log('message received: '+util.inspect(message.utf8Data));
  });
  //接続イベント時にmessageイベントを送る
  connection.sendUTF('connected!');
});
//接続を行う
client.connect('ws://localhost:'+port+'/', 'echo-protocol');
