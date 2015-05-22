
define(['core/utils', 'core/const','core/browser', 'core/connection',
        'core/stream', 'core/getScreenId'],
    function(Utils, CONST, browser, Connection, Stream, getScreenId) {

'use strict';

browser.rtcShim();
browser.mediaShim();


var WS_MSG = CONST.SESSION.WS_MSG;


function Peer(peer_info_msg, getAllStreams) {
    var peer = this;
    this.nickname = peer_info_msg.data.nickname;
    // other property are read-onlyl
    for (var key in peer_info_msg['data']) {
        if(key === 'nickname') {
            continue;
        }
        Object.defineProperty(this, key, {
            enumerable : true,
            writable   : false,
            value      : peer_info_msg['data'][key]
        });
    }
    Object.defineProperty(this, 'streams', {
        get : function() {
            return getAllStreams().filter(function(s) {
                return s.owner === peer.id;
            });
        },
        set : Utils.readOnlyProperty('Peer.streams')
    });
};

function Session(_room_info, _options) {
    var session = this;
    var nickname = undefined;
    var self_peer_id = undefined;
    var room_info = _room_info;
    var members = [];
    var conns = [];
    var peer_infos = [];
    var streams = [];
    var ws = undefined;  // WebSocket
    var ws_msg_handlers = {};
    var pc_constraint = undefined;
    var onmessage = null;
    var logger = _options !== undefined && _options['logger'] !== undefined ?
                              _options['logger'] : console;
    var adaptable_properties = {};  //<name, handlers>
    var proxy_peer_id = undefined;

    var perror = function(e) {
        logger.error(e);
    };

    var onWsMsg = function(msg_type, handler) {
        if (typeof(msg_type) === 'string') {
            ws_msg_handlers[msg_type] = handler;
        } else {
            msg_type.forEach(function(t) {
                ws_msg_handlers[t] = handler;
            });
        }
    };
    var getStreamById = function(_sid) {
        return streams.find(function(s) {
            return s.id === _sid;
        });
    };
    var wsSend = function(msg) {
        if (ws.readyState === 1) { // open
            ws.send(JSON.stringify(msg));
        }
    };

    var stream_factory = Stream.getFactory(session, wsSend,
                                           function getAllConns() {
                                               return conns;
                                           },
                                           function removeStream(s) {
                                               var idx = streams.findIndex(function(_s) {
                                                   return _s === s;
                                               });
                                               if (idx > -1) {
                                                   streams.splice(idx, 1);
                                               }
                                           });

    var connectWebSocket = function() {
        ws = new WebSocket('wss://' + window.location.host + room_info.ws_url);
        ws.onopen = function() {
        };
        ws.onmessage = function(evt) {
            if ('data' in evt) {
                var msgs = JSON.parse(evt.data);
                msgs.forEach(function(msg) {
                    var handler = ws_msg_handlers[msg['type']];
                    if (handler !== undefined) {
                        handler(msg);
                        if (session.onwebsocketmessage !== null) {
                            session.onwebsocketmessage(msg);
                        }
                    } else {
                        logger.warn('handler for ' + msg['type'] + ' not found.');
                        logger.warn(msg);
                    }
                });
            }
        };
        ws.onerror = function(error) {
          console.log('Session: websocket error');
        };
        ws.onclose = function(evt) {
            var code = evt.code;
            if (code === 1006) { // close by server without close-frame
                session.leave();
            }
        };
    };

    var __leave = function() {
        ws.close();
    };

    // either take a peer_id or empty argument
    var __peer = function() {
        if (arguments.length === 0) {
            return peer_infos.slice();  // return a shadow copy
        }
        var target_peer_id = arguments[0];
        return peer_infos.find(function(p) {
            return p.id === target_peer_id;
        });
    };

    onWsMsg(WS_MSG.NICKNAME, function(nickname_msg) {
        var peer_id_from = nickname_msg['from'];
        var p = __peer(peer_id_from);
        if(p !== undefined) {
            p.nickname = nickname_msg['data'];
        }
    });

    onWsMsg(WS_MSG.PEER_ID, function(msg) {
        var data = msg['data'];
        self_peer_id = data;
        if (logger.name) {
            logger.name(self_peer_id);
        }
    });

    onWsMsg(WS_MSG.PEER_INFO, function(peer_info_msg) {
        var new_peer_info = new Peer(peer_info_msg, function() { return streams; });
        peer_infos.push(new_peer_info);
    });

    onWsMsg(WS_MSG.SWITCH_PROXY, function(msg) {
        var proxy_peer_id = msg['data']['new'];
        if (proxy_peer_id === self_peer_id) {
            return;
        };
    });


    onWsMsg(WS_MSG.STREAM_AVAILABLE, function(msg) {
        var stream_data = msg['data']['stream'];
        var stream = stream_factory.makeStream(stream_data.id,
                                               stream_data.owner,
                                               stream_data.type);
        streams.push(stream);
        wsSend({type : WS_MSG.STREAM_REQUEST,
                to   : msg['from'],
                data : {
                    stream: {
                        id: msg['data']['stream']['id']
                    }
                }});
    });

    onWsMsg(WS_MSG.STREAM_REVOKE, function(revoke_msg) {
        var stream = streams.find(function(s) {
            return s.id === revoke_msg['data']['stream']['id'];
        });
        if (stream !== undefined) {
            stream.close();
        }
    });

    onWsMsg(WS_MSG.STREAM_REQUEST, function(request_msg) {
        var stream_id = request_msg['data']['stream']['id'];
        var stream = streams.find(function(s) {
            return s.id === stream_id;
        });
        var conn = new Connection(Utils.uuid4(), request_msg['from'],
                                  room_info.rtc_param, wsSend, getStreamById);
        conn.attachStreamById(stream_id);
        conns.push(conn);
    });

    onWsMsg(WS_MSG.OFFER_SDP, function(offer_msg) {
        var conn = new Connection(offer_msg['data']['connection']['id'],
                                  offer_msg['from'],
                                  room_info.rtc_param, wsSend, getStreamById);
        conns.push(conn);
        conn.replyOffer(offer_msg);
    });

    onWsMsg(WS_MSG.ANSWER_SDP, function(answer_msg) {
        var conn = conns.find(function(c) {
            return c.id === answer_msg['data']['connection']['id'];
        });
        conn.acceptAnswer(answer_msg);
    });

    onWsMsg([WS_MSG.OFFER_CANDIDATE,
             WS_MSG.ANSWER_CANDIDATE], function(candidate_msg) {
        var conn = conns.find(function(c) {
            return c.id === candidate_msg['data']['connection']['id'];
        });
        conn.addCandidate(candidate_msg);
    });

    onWsMsg(WS_MSG.LEAVE, function(leave_msg) {
        var left_peer_id = leave_msg['data'];
        var idx = peer_infos.findIndex(function(p) {
            return p.id === left_peer_id;
        });
        if (idx >= 0) {
            var leaved_peer = peer_infos.splice(idx, 1);
        }
    });

    onWsMsg([WS_MSG.TEXT_MESSAGE], function(msg) {
        // do nothing, handle by UI
    });

    var uploadLog = function(data_string) {
        wsSend({type: 'ServerLog',
                data: data_string});
    };

    var broadcastStream = function(_media_type) {
        var param = undefined;
        var getUserMedia = function(param) {
            navigator.getUserMedia(param, function(native_stream) {
                var stream = stream_factory.makeStream(Utils.uuid4(),
                                                       session.self_peer_id,
                                                       _media_type);
                streams.push(stream);
                stream.open(native_stream);
            }, function(err) {
                Utils.perror(err);
            });
        };
        if (_media_type === CONST.MEDIA.AUDIO) {
            param = {audio: true, video: false};
            getUserMedia(param);
        } else if (_media_type === CONST.MEDIA.VIDEO) {
            param = {audio: false, video: true};
            getUserMedia(param);
        } else if (_media_type === CONST.MEDIA.SCREEN) {
            getScreenId(function(error, sourceId, param) {
                getUserMedia(param);
            });
        }
    };

    var postTextMessage = function(msg) {
        wsSend({type: WS_MSG.TEXT_MESSAGE, data: msg});
    };

    // define exposed objects
    this.onwebsocketmessage = null;
    this.connectWebSocket = connectWebSocket;
    this.leave = __leave;
    this.peer = __peer;
    this.uploadLog = uploadLog;
    this.postTextMessage = postTextMessage;
    this.broadcastStream = broadcastStream;
    this.wsSend = wsSend;
    Object.defineProperty(this, 'self_peer_id', {
        get : function() {
            return self_peer_id;
        },
        set : Utils.readOnlyProperty('self_peer_id')
    });
    Object.defineProperty(this, 'nickname', {
        get : function() {
            return __peer(self_peer_id).nickname;
        },
        set : function(_nickname) {
            wsSend({type: WS_MSG.NICKNAME, data: _nickname});
        }
    });
    Object.defineProperty(this, 'self', {
        get : function() {
            return __peer(self_peer_id);
        },
        set : Utils.readOnlyProperty('self')
    });

    // enum adaptable properties by name
    ['ontextmessage', 'onstreamready', 'onstreamclose'].forEach(function(name) {
        Object.defineProperty(session, name, {
            get : function() {
                if (adaptable_properties[name] === undefined ||
                    adaptable_properties[name] === null) {
                    adaptable_properties[name] = null;
                }
                return adaptable_properties[name];
            },
            set : function(new_value) {
                adaptable_properties[name] = new_value;
            }
        });
    });
};

return Session;

// end of define
});
