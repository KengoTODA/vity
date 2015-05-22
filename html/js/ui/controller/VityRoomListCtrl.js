
define(['vity_core', 'ui/app'], function(Vity, app) {

app.controller('VityRoomListCtrl', ['$scope', function ($scope) {

    var serverEvtListener = undefined;
    var room_names = [];
    var init = function() {
        $.ajax({
            type: 'get',
            url: '/api/rooms',
            success: function(room_names) {
                serverEvtListener = Vity.connectServerEvent();
                serverEvtListener.onwebsocketmessage = function(msg) {
                    if(msg['type'] === 'RoomListPeers') {
                        var room_peers = createRoomPeerList(room_names, msg['data']);
                        $scope.rooms = room_peers;
                        $scope.$apply();
                    }
                };
            },
            dataType: 'json'
        });
    };

    var createRoomPeerList = function(room_names, active_room_peers) {
        var active_rooms = [];
        var room_peers = active_room_peers.slice(0);
        active_room_peers.forEach(function(r_peer) {
            active_rooms.push(r_peer.room_name);
        });
        room_names.forEach(function(room) {
            if(active_rooms.indexOf(room.room_name) === -1) {
                room_peers.push({'room_name' : room.room_name, 'peers' : []});
            }
        });
        return room_peers;
    };

    $scope.joinRoom = function(room_info) {
        var pathname = '/index.html';
        location.replace(pathname + '#' + room_info.room_name);
    };

    init();
}]);

// end of define()
});
