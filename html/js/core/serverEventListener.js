
define(function() {

'use strict';

var ServerEventListener = function() {
    var serverEvtListener = this;
    var ws = undefined;  // WebSocket

    var connectWebSocket = function() {
        ws = new WebSocket('wss://' + window.location.host + '/wss/__SERVER_EVENT_LISTENER__');
        ws.onopen = function() {
        };
        ws.onmessage = function(evt) {
            if('data' in evt) {
                var msgs = JSON.parse(evt.data);
                msgs.forEach(function(msg) {
                    if (serverEvtListener.onwebsocketmessage !== null) {
                        serverEvtListener.onwebsocketmessage(msg);
                    }
                });
            }
        };
        ws.onerror = function(error) {
            console.log('ServerEventListener: websocket error');
        };
        ws.onclose = function(evt) {
            var code = evt.code;
            if (code === 1006) { // close by server without close-frame
                ws.close();
            }
        };
    };

    this.connectWebSocket = connectWebSocket;
    this.onwebsocketmessage = null;
}
return ServerEventListener;
// end of define
});
