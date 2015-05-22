
define(['vity_core', 'utils/sleep', 'utils/ezlog'], function(Vity, sleep, EZLog) {

var logger_1 = EZLog.getLogger({color: 'white', background: 'tomato'});
var logger_2 = EZLog.getLogger({background: 'lightblue'});
var logger_3 = EZLog.getLogger({background: 'lightgray'});
var uuid4 = Vity.Utils.uuid4;

return function() {
    var room_info = {
        room_id: "00000000-0000-0000-0000-000000000000",
        room_name: "vity",
        rtc_param: {"iceServers": [{ "url": "stun:localhost:3478" }]},
        ws_url: "wss://" + location.host + "/wss/test_peer_join_leave"
    };

    var session_1 = Vity.joinRoom(room_info, {logger: logger_1});
    var session_2 = Vity.joinRoom(room_info, {logger: logger_2});
    var session_3 = Vity.joinRoom(room_info, {logger: logger_3});
    session_1.mode = 'test';
    session_2.mode = 'test';
    session_3.mode = 'test';

    sleep(1000, function() {
        QUnit.test("peer count should be the same for all", function(assert) {
            assert.equal(session_1.peer().length, 3);
            assert.equal(session_2.peer().length, 3);
            assert.equal(session_3.peer().length, 3);
        });
        session_3.leave();
    }).sleep(500, function() {
        QUnit.test("peer count should be the same after session 3 left", function(assert) {
            assert.equal(session_1.peer().length, 2);
            assert.equal(session_2.peer().length, 2);
            assert.equal(session_1.peer().find(function(p) {
                return p.id === session_3.self_peer_id;
            }), undefined);
        });
        QUnit.test("peer.id should not be undefined", function(assert) {
            session_1.peer().forEach(function(p) {
                assert.ok(p.id !== undefined);
            });
        });
    }).sleep(500, function() {
        session_1.leave();
        session_2.leave();
        QUnit.test("session.self_peer_id != undefined even it's left", function(assert) {
            [session_1, session_2, session_3].forEach(function(s) {
                assert.ok(s.self_peer_id !== undefined);
            });
        });
    }).run();

};

// end of define
});
