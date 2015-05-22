
define(['core/const', 'core/utils', 'core/session', 'core/browser', 'core/serverEventListener'],
        function(CONST, Utils, Session, Browser, ServerEventListener) {
'use strict';


var Vity = (function() {

    var joinRoom = function(_room_info, _options) {
        var session = new Session(_room_info, _options);
        session.connectWebSocket();
        return session;
    };

    var connectServerEvent = function() {
        var serverEvtListener = new ServerEventListener();
        serverEvtListener.connectWebSocket();
        return serverEvtListener;
    };

    return {
        Utils     : Utils,
        joinRoom  : joinRoom,
        connectServerEvent : connectServerEvent,
        Browser   : Browser,
        CONST  : CONST
    };
})();


return Vity;
// end of define()
});
