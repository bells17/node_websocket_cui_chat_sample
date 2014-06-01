var util = require('util');
var socket = require('socket.io-client');
var socket = new socket.connect('http://localhost:3000');
var shell = require('shell');
var shell_app = new shell( { chdir: __dirname } );
var room; 
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
	socket.emit('send', {'msg':msg});
	res.prompt();
});
shell_app.cmd('rooms', 'get room list', function(req, res, next) {
	socket.emit('rooms');
	res.prompt();
});
shell_app.cmd('join :name', 'join :name room', function(req, res, next) {
	var name = req.params.name;
	socket.emit('join', {'room':name});
	res.prompt();
});
shell_app.cmd('leave', 'leave join room', function(req, res, next) {
	var name = req.params.name;
	socket.emit('leave', {'room':room});
	res.prompt();
});

//socket.io
socket.on('connect', function(){
	console.log('conneted!');

	socket.on('receive', function(data) {
		console.log("\n"+'received:'+data.msg);
		shell_app.prompt();
	});

	socket.on('room_list', function(data) {
		console.log("\n"+'room_list:'+util.inspect(data));
		shell_app.prompt();
	});

	socket.on('joined', function(data) {
		console.log("\n"+'joined:'+util.inspect(data));
		room = data.joined_room;
		shell_app.prompt();
	});

	socket.on('leaved', function(data) {
		console.log("\n"+'leaved:'+util.inspect(data));
		shell_app.prompt();
	});

	socket.on('disconnect', function(data){
		console.log('disconnected!');
	});
});

