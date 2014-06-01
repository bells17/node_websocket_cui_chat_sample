var WebSocketClient = require('websocket').client;
var client = new WebSocketClient();
var util = require('util');
var port = 3000;
var util = require('util');
var shell = require('shell');
var shell_app = new shell( { chdir: __dirname } );
var connection;

//シェルの環境設定
shell_app.configure(function() {
  shell_app.use(shell.history({
    shell: shell_app
  }));
  shell_app.use(shell.completer({
    shell: shell_app
  }));
  shell_app.use(shell.router({
    shell: shell_app
  }));
  shell_app.use(shell.help({
    shell: shell_app,
    introduction: false
  }));
});

//コマンド定義
shell_app.cmd('send :msg', 'message send', function(req, res, next) {
  var msg = req.params.msg;
  send('send', {'msg':msg});
  res.prompt();
});
shell_app.cmd('rooms', 'get room list', function(req, res, next) {
  send('rooms');
  res.prompt();
});
shell_app.cmd('join :name', 'join :name room', function(req, res, next) {
  var name = req.params.name;
  send('join', {'room':name});
  res.prompt();
});
shell_app.cmd('leave', 'leave join room', function(req, res, next) {
  var name = req.params.name;
  send('leave');
  res.prompt();
});

//websocket
client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});
client.on('connect', function(_connection) {
  connection = _connection;
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
      //イベント
      if (message.event == 'receive') {
        console.log("\n"+'receive:'+util.inspect(message.data));
      } else if (message.event == 'room_list') {
        console.log("\n"+'room_list:'+util.inspect(message.data));
      } else if (message.event == 'joined') {
        console.log("\n"+'joined:'+util.inspect(message.data));
      } else if (message.event == 'leaved') {
        console.log("\n"+'leaved:'+util.inspect(message.data));
      } else {
        console.log('event "'+message.event+'" is not defined');
      }
      shell_app.prompt();
    } else if (message.type === 'binary') {
      //バイナリデータ
      console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
    }
  });
});
client.connect('ws://localhost:'+port+'/', 'echo-protocol');


function send(event, response_object) {
  var response_object = response_object ? response_object : {};
  response = {
    'event' : event,
    'data'  : response_object
  };
  response = JSON.stringify(response);
  connection.sendUTF(response);
}


function get_data(message) {
  return JSON.parse(message.utf8Data);
}



