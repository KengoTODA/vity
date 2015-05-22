define(['core/const', 'core/utils', 'core/browser', 'core/connection'],
        function(CONST, Utils, browser, Connection) {
'use strict';

browser.mediaShim();

var WS_MSG = CONST.SESSION.WS_MSG;

function Stream(_id, _owner, _type, _session, wsSend, getAllConns, removeStream) {
    var stream = this;
    var session = _session;
    var id = _id;
    var owner = _owner;
    var native_stream = undefined;
    var type = _type;

    this.open = function(_native_stream) {
        native_stream = _native_stream;
        if (owner === session.self_peer_id) {
            wsSend({type: WS_MSG.STREAM_AVAILABLE,
                    data: {
                        stream : {
                            type: _type,
                            id  : id,
                            owner: session.self_peer_id
                        }
                    }});
        }
        native_stream.onended = function() {
            if (owner === session.self_peer_id) {
                wsSend({type: WS_MSG.STREAM_REVOKE,
                        data: {
                           stream : {
                                id: id
                           }}});
            }
            var conns = getAllConns();
            conns.forEach(function(c) {
                if (c.stream_id === stream.id) {
                    c.close();
                }
            });
            removeStream(stream);
            if (session.onstreamclose !== null) {
                session.onstreamclose(stream);
            }
        };
        if (session.onstreamready !== null) {
            session.onstreamready(stream);
        }
    };

    this.close = function() {
        if(navigator.userAgent.search('Firefox') > -1) {
            native_stream.onended();
        } else {
            native_stream.stop();
        }
    };

    Object.defineProperty(this, 'owner', {
        get : function() {
            return owner;
        },
        set : Utils.readOnlyProperty('owner')
    });
    Object.defineProperty(this, 'id', {
        get : function() {
            return id;
        },
        set : Utils.readOnlyProperty('id')
    });
    Object.defineProperty(this, 'type', {
        get : function() {
            return type;
        },
        set : Utils.readOnlyProperty('type')
    });
    Object.defineProperty(this, 'native_stream', {
        get : function() {
            return native_stream;
        },
        set : Utils.readOnlyProperty('native_stream')
    });
    Object.defineProperty(this, 'is_local', {
        get : function() {
            return owner === session.self_peer_id;
        },
        set : Utils.readOnlyProperty('is_local')
    });
    Object.defineProperty(this, 'owner_nickname', {
        get : function() {
            return session.peer(owner).nickname;
        },
        set : Utils.readOnlyProperty('owner_nickname')
    });
};


function Factory(_session, wsSend, getAllConns, removeStream) {
    this.makeStream = function(_id, _owner, _type) {
        return new Stream(_id, _owner, _type, _session, wsSend, getAllConns, removeStream);
    };
};

return {
    getFactory: function(_session, wsSend, getAllConns, removeStream) {
        return new Factory(_session, wsSend, getAllConns, removeStream);
    }
};
// end of define
});
