var WebSocketServer = require('websocket').server;
var http = require('http');
var util = require('util');
var port = 3000;
// var event = require('./event');

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

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

//{request.key : connection}
var connections = {};
//{room_name : request.key}
var rooms = {};

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }

    var connection = request.accept('echo-protocol', request.origin);
    //コネクション管理
    connections[request.key] = connection;
    console.log((new Date()) + ' Connection accepted.');
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
          //通常メッセージ
          message = get_data(message);
          console.log(util.inspect(message));
          call_event(message.event, request.key, message.data);
          if (0) {
            console.log(util.inspect(connections));
            console.log(util.inspect(rooms));
          }
        } else if (message.type === 'binary') {
            //バイナリデータ
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
        //管理しているコネクションリストから削除
        delete connections[request.key];
        _leave(request.key);
    });
});

//本人のみに送る
function send(connection_key, event, response_object) {
  console.log('send called. '+util.inspect([connection_key, event, response_object]));
  connections[connection_key].sendUTF(create_response(event, response_object));
}

//ルーム内のユーザー全体にブロードキャストする
function broadcast_room(connection_key, event, response_object) {
  console.log('broadcast_room called. '+util.inspect([connection_key, event, response_object]));
  for (var room_name in rooms) {
    if (rooms[room_name].indexOf(connection_key) >= 0) {
      //対象ユーザーのいるルーム全体に対して送信
      for (var key in rooms[room_name]) {
        connections[rooms[room_name][key]].sendUTF(create_response(event, response_object));
      }
    }
  }
}

//コネクションを張っているユーザー全体にブロードキャストする
function broadcast(event, response_object) {
  console.log('broadcast called. '+util.inspect([event, response_object]));
  for (var key in connections) {
    connections[key].sendUTF(create_response(event, response_object));
  }
}

//成功時
function send_success(connection_key, event, response_object, type) {
  type = type ? type : 'send';
  response_object.message = 'success';
  if (type == 'send') {
      send(connection_key, event, response_object);
  } else if (type == 'broadcast') {
      broadcast(event, response_object);
  } else if (type == 'room') {
    broadcast_room(connection_key, event, response_object);
  }
}

//失敗時
function send_failed(connection_key, event, response_object, type) {
  type = type ? type : 'send';
  response_object.message = 'failed';
  if (type == 'send') {
      send(connection_key, event, response_object);
  } else if (type == 'broadcast') {
      broadcast(event, response_object);
  } else if (type == 'room') {
    broadcast_room(connection_key, event, response_object);
  }
}

//レスポンスを作る
function create_response(event, response_object) {
  var response = {
    'event' : event,
    'data'  : response_object
  };
  return JSON.stringify(response);
}

//リクエストデータから必要なオブジェクトだけを返す
function get_data(message) {
  return JSON.parse(message.utf8Data);
}

function call_event(event_name, request_key, data) {
  if (event_name == 'rooms') {
    event_rooms(request_key, data);
  } else if (event_name == 'join') {
      event_join(request_key, data);
  } else if (event_name == 'leave') {
    event_leave(request_key, data);
  } else if (event_name == 'send') {
    event_send(request_key, data);
  } else {
    console.log('event name "'+'" is not defined');
  }
}


//events

function event_rooms(request_key, data) {
  var event = 'room_list';
  var response = {};
  console.log(event+' called. '+util.inspect(data));
  var room_list = {};
  for (var key in rooms) {
    room_list[key] = rooms[key].length;
  }
  response.room_list = room_list;
  send_success(request_key, event, response);
}

function event_join(request_key, data) {
  var event = 'joined';
  var response = {};
  console.log(event+' called. '+util.inspect(data));
  if (!rooms[data.room]) {
    rooms[data.room] = [];
  }
  rooms[data.room].push(request_key);
  // send_success(request_key, event, response);
  send_success(request_key, event, response, 'room'); 
}

function event_leave(request_key, data) {
  var event = 'leaved';
  var response = {};
  console.log(event+' called. '+util.inspect(data));
  if (_leave(request_key)) {
    send_success(request_key, event, response);
  } else {
    send_failed(request_key, event, response);
  }
}

function _leave(request_key) {
  for (var key in rooms) {
    var request_key_index = rooms[key].indexOf(request_key);
    if (request_key_index >= 0) {
      delete rooms[key][request_key_index];
      if (rooms[key].length < 1) {
        delete rooms[key];
      }
      return true;
    }
  }
  return false;
}

function event_send(request_key, data) {
  var event = 'receive';
  var response = {};
  console.log(event+' called. '+util.inspect(data));
  response.send_message = data.send_message;
  send_success(request_key, event, response, 'room');
}