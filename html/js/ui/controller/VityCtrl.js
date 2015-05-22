
define(['vity_core', 'ui/app'], function(Vity, app) {

var uuid4 = Vity.Utils.uuid4;
Vity.Browser.notificationShim();

app.controller('VityCtrl', ['$scope', '$sce', function ($scope, $sce) {

    $scope.self_peer_id = 'unknown';
    $scope.nickname = '';
    $scope.room_name = location.hash.split('@')[0].slice(1);
    $scope.peers = [];
    $scope.region = '';  // region string of this peer
    $scope.shown_streams = [];  // for shown streams only
    $scope.text_messages = [];  // {from: peer_id, data: text}
    $scope.input_text_message = '';
    $scope.self_region = '';
    $scope.broadcast_state = {
        'audio': false,
        'video': false,
        'screen': false
    };
    $scope.enable_notifications = false;

    var session = undefined;
    var invited_nicknames = [];
    var ws_msg_handlers = {};
    var WS_MSG = Vity.CONST.SESSION.WS_MSG;

    var onWsMsg = function(msg_type, handler) {
        if (typeof(msg_type) === 'string') {
            ws_msg_handlers[msg_type] = handler;
        } else {
            msg_type.forEach(function(t) {
                ws_msg_handlers[t] = handler;
            });
        }
    };

    $scope.postNickname = function() {
        session.nickname = $scope.nickname;
    }

    $scope.postTextMessage = function() {
        session.postTextMessage($scope.input_text_message);
        $scope.input_text_message = '';
    }

    var createDesktopNotification = function(msg) {
        var timeout = 3000;
        if ($scope.enable_notifications && window.Notification &&
           window.Notification.permission === 'granted') {
            var notification =  new Notification(msg['from'] + ' says', {
                body: msg['data']
            });
            notification.onshow = function () {
              setTimeout(notification.close.bind(notification), timeout);
            };
        }
    };

    $scope.flipBroadcast = function(stream_type) {
        var local_stream = $scope.shown_streams.find(function(s) {
            return s.owner === session.self_peer_id && s.type === stream_type;
        });
        if (local_stream === undefined) {
            session.broadcastStream(stream_type);
        } else {
            local_stream.close();
        }
    };

    $scope.setupNotifications = function() {
        if ($scope.enable_notifications === true) {
            if (window.Notification && window.Notification.permission !== 'granted' ) {
                window.Notification.requestPermission();
            }
        }
    };

    var sortPeers = function(peers) {
        peers.sort(function(a, b) {   // return -1 to prompt
            if (a.id !== undefined && b.id === undefined) {
                return -1
            }
            if (a.id === undefined && b.id !== undefined) {
                return 1;
            }
            if (a.id === undefined && b.id === undefined) {
                return 0;
            }
            if (a.id === session.self_peer_id && b.id !== session.self_peer_id) {
                return -1;
            }
            if (a.id !== session.self_peer_id && b.id === session.self_peer_id) {
                return 1;
            }
            var a_audio = a.streams.find(function(s) { return s.type === 'audio'; });
            var b_audio = b.streams.find(function(s) { return s.type === 'audio'; });
            if (a_audio !== undefined && b_audio === undefined) {
                return -1;
            }
            if (a_audio === undefined && b_audio !== undefined) {
                return 1;
            }
            if (a.invited === true && b.invited === false) {
                return -1;
            }
            if (a.invited === false && b.invited === true) {
                return 1;
            }
            return 0;
        });
    };

    var updatePeers = function() {
        var peers = session.peer();
        extendPeers(peers);   // it's already a shadow copy
        sortPeers(peers);
        // sync audio_id
        peers.forEach(function(p) {
            if (p.id !== undefined) {
                var audio = session.peer(p.id).streams.find(function(s) {
                    return s.type === 'audio';
                });
                if (audio !== undefined) {
                    p.audio_id = audio.id;
                } else {
                    p.audio_id = undefined;
                }
            }
        });
        $scope.peers = angular.copy(peers);
    };

    // append absent members
    var extendPeers = function(peers) {
        peers.forEach(function(peer) {
            if (invited_nicknames.indexOf(peer.nickname) >= 0) {
                peer.css_text = 'invitedJoined';
                peer.invited = true;
            } else {
                peer.css_text = 'notInvited';
                peer.invited = false;
            }
        });
        var absent_nicknames = invited_nicknames.filter(function(nickname) {
            return (peers.findIndex(function(peer) {
                        return peer.nickname === nickname;
                    }) === -1);
        });
        absent_nicknames.forEach(function(_nickname) {
            peers.push({
                id : undefined,
                nickname : _nickname,
                region : undefined,
                audio_id : undefined,
                invited : true,
                css_text : 'invitedNotJoined'
            });
        });
    };

    // Helper functions
    var init = function(room_name) {
        if (room_name === undefined || room_name === '') {
            location.pathname = '/rooms.html'
        }
        $.ajax({
            type: 'get',
            url: '/api/rooms/' + room_name,
            data: {createIfNotExists: 1},
        }).success(function(room_info) {
            room_info.rtc_param = JSON.parse(room_info.rtc_param);//TODO: move to erver side
            session = Vity.joinRoom(room_info);

            //TODO: replace `invited_nicknames` with room-associated nicknames here.

            session.onwebsocketmessage = function(msg) {
                var handler = ws_msg_handlers[msg['type']];
                if (handler !== undefined) {
                    handler(msg);
                }
                $scope.$apply();
            };
            session.onstreamready = function(new_stream) {
                updatePeers();
                $scope.shown_streams.push(new_stream);
                if (new_stream.owner === session.self_peer_id) {
                    $scope.broadcast_state[new_stream.type] = true;
                }
                $scope.$apply();
            };
            session.onstreamclose = function(closed_stream) {
                $scope.shown_streams = $scope.shown_streams.filter(function(s) {
                    return s !== closed_stream;
                });
                if (closed_stream.owner === session.self_peer_id) {
                    $scope.broadcast_state[closed_stream.type] = false;
                }
                updatePeers();
                $scope.$apply();
            };
        });
    };

    // handle websocket messages
    onWsMsg([WS_MSG.PEER_INFO, WS_MSG.LEAVE, WS_MSG.NICKNAME], function(msg) {
        updatePeers();
        if (msg['type'] === WS_MSG.PEER_INFO) {
            var peer = msg['data'];
            if (peer.id === session.self_peer_id) {
                var hash_nickname = location.hash.split('@')[1];
                if (hash_nickname !== undefined) {
                    $scope.nickname = hash_nickname;
                    $scope.postNickname();
                }
            }
        }
    });

    onWsMsg(WS_MSG.PEER_ID, function(msg) {
        $scope.self_peer_id = session.self_peer_id;
    });

    onWsMsg(WS_MSG.TEXT_MESSAGE, function(msg) {
        var msg = angular.copy(msg);
        var sender_peer_id = msg['from'];
        var peer = session.peer(msg['from']);
        if (peer !== undefined) {
            if (peer.nickname === '') {
                msg['from'] = peer.id;
            } else {
                msg['from'] = peer.nickname;
            }
            if (peer.id !== session.self.id) {
                createDesktopNotification(msg);
            }
        }
        $scope.text_messages.push(msg);
    });

    window.addEventListener('hashchange', function() {
      location.reload();
    });

    init($scope.room_name);


}]);


// end of define()
});
