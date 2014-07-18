var port = 3000;
var util = require('util');
var io = require('socket.io').listen(port);
var _ = require('underscore');

//コネクションが確立した時
io.sockets.on("connection", function (socket) {
	console.log("connected");
	/**
	 * 各種イベントの登録
	 */
	//メッセージ送信
	socket.on("send", function (data) {
		console.log("send: " + util.inspect(data));
		//全員に送信
		// io.sockets.emit("receive", data);
		//メッセージ送信者以外に送る
		// socket.broadcast.to().emit("receive", data);
		//同じルーム内にいるユーザー全員に対してメッセージを送る
		var room = get_first_joined_room(socket.store.id, socket.manager.rooms);
		//未入室なら何もしない
		if (!room) return;
		console.log('test:'+util.inspect(room));
		io.sockets.in(room).emit("receive", data);
	});
	//ルーム一覧取得
	socket.on("rooms", function (data) {
		//送信者1人に対して送信
		io.sockets.socket(socket.id).emit('room_list', get_rooms(io.rooms));
	});
	//ルームに入室
	socket.on("join", function (data) {
		socket.join(data.room);
		console.log('test '+util.inspect(socket.manager));
		io.sockets.socket(socket.id).emit('joined', {response_code:0, joined_room:data.room});
	});
	//ルームから退出
	socket.on("leave", function (data) {
		socket.leave(data.room);
		io.sockets.socket(socket.id).emit('leaved', {response_code:0, msg:'success'});
	});
	/**
	 * コネクション切断時のイベント
	 */
	socket.on("disconnect", function () {
		io.sockets.emit("message", {value:"user disconnected"});
	});
});


//args1:io.rooms
function get_rooms(rooms) {
	var ret = {};
	for (key in rooms) {
		ret[key.slice(1)] = rooms[key].length;
	}
	delete ret[''];
	return ret;
}

//roomsからsocket_idが入室している(hashの)一番はじめの部屋を返します
//args1:socket.store.id
//args2:socket.manager.rooms
function get_first_joined_room(socket_id, rooms) {
	for (var key in rooms) {
		if (key == '') continue;
		if (rooms[key].indexOf(socket_id) >= 0) {
			return key.slice(1);
		}
	}
	return false;
}
