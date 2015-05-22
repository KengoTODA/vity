
define(['core/const', 'core/utils', 'core/browser'],
       function(CONST, Utils, browser) {


browser.rtcShim();

var uuid4 = Utils.uuid4;
var perror = Utils.perror;
var WS_MSG = CONST.SESSION.WS_MSG;

function Connection(_id, _remote_peer_id, rtc_param, wsSend, getStreamById) {
    var id = _id;
    var remote_peer_id = _remote_peer_id;
    var stream_id = undefined;
    var pc = new RTCPeerConnection(rtc_param);

    this.attachStreamById = function(_stream_id) {
        stream_id = _stream_id;
        pc.onicecandidate = function(evt) {
            if (evt.candidate) {
                wsSend({
                    type: WS_MSG.OFFER_CANDIDATE,
                    to: remote_peer_id,
                    data: {
                        connection : {
                            id: id
                        },
                        candidate : evt.candidate
                    }
                });
            }
        };
        pc.addStream(getStreamById(stream_id).native_stream);

        pc.createOffer(function(offer) {
            offer.sdp = setAudioBandwidth(offer.sdp, 50);
            offer.sdp = setVideoBandwidth(offer.sdp, 100);
            pc.setLocalDescription(
                new RTCSessionDescription(offer),
                function() {  // send offer to server
                    wsSend({
                        type: WS_MSG.OFFER_SDP,
                        to: remote_peer_id,
                        data: {
                            connection : {
                                id: id
                            },
                            stream : {
                                id: stream_id
                            },
                            offer : offer
                        }
                    });
                }, perror);
        }, perror);
    };

    this.replyOffer = function(offer_msg) {
        pc.onicecandidate = function(evt) {
            if (evt.candidate) {
                wsSend({
                    type: WS_MSG.ANSWER_CANDIDATE,
                    to: remote_peer_id,
                    data: {
                        connection : {
                            id: id
                        },
                        candidate : evt.candidate
                    }
                });
            }
        };

        stream_id = offer_msg['data']['stream']['id'];
        pc.onaddstream = function(evt) {
            getStreamById(stream_id).open(evt.stream);
        };

        pc.setRemoteDescription(
            new RTCSessionDescription(offer_msg['data']['offer']),
            function() {
                pc.createAnswer(function(answer) {
                    pc.setLocalDescription(
                    new RTCSessionDescription(answer),
                    function() {
                        wsSend({
                            type: WS_MSG.ANSWER_SDP,
                            to: remote_peer_id,
                            data: {
                                connection : {
                                    id: id
                                },
                                stream : {
                                    id: stream_id
                                },
                                answer : answer
                            }
                        });
                    }, perror);
                }, perror);
            }, perror);
    };

    this.close = function() {
        pc.close();
    };

    this.acceptAnswer = function(answer_msg) {
        var answer = answer_msg['data']['answer'];
        pc.setRemoteDescription(
            new RTCSessionDescription(answer),
            function() {
            },
            perror);
    };

    this.addCandidate = function(candidate_msg) {
        var data = candidate_msg['data']['candidate'];
        var candidate = new RTCIceCandidate({
            candidate: data.candidate,
            sdpMLineIndex: data.sdpMLineIndex,
            sdpMid: data.sdpMid
        });
        pc.addIceCandidate(candidate);
    };

    Object.defineProperty(this, 'id', {
        get : function() {
            return id;
        },
        set : Utils.readOnlyProperty('id')
    });
    Object.defineProperty(this, 'remote_peer_id', {
        get : function() {
            return remote_peer_id;
        },
        set : Utils.readOnlyProperty('remote_peer_id')
    });
    Object.defineProperty(this, 'stream_id', {
        get : function() {
            return stream_id;
        },
        set : Utils.readOnlyProperty('stream_id')
    });
};

return Connection;
// end of define
});
