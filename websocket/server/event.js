//events

module.exports.event_test = function (data) {
  console.log('event_test called');
  // send(request.key, 'test_event', {'test':'testaaabbb'});
}

module.exports = event;
/**
 * コンストラクタ
 */
function event(key, connection) {
	this.key = key;
	this.connection = connection;
}
/**
 * library共通メソッド定義
 */
event.prototype = {
	event_test = function (data) {
		console.log('event_test called');
  		// send(request.key, 'test_event', {'test':'testaaabbb'});
	}
}


function send(connection, event, response_object) {
  response = {
    'event' : event,
    'data'  : response_object
  };
  response = JSON.stringify(response);
  connection.sendUTF(response);
}
