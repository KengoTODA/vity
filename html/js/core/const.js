define([], function() {
'use strict';

return {
    MEDIA : {
        AUDIO  : 'audio',
        VIDEO  : 'video',
        SCREEN : 'screen',
        ERROR  : 'error',
    },
    SESSION : {
        WS_MSG : {
            PEER_ID      : 'PeerId',
            PEER_INFO    : 'PeerInfo',
            NICKNAME     : 'Nickname',
            SWITCH_PROXY : 'SwitchProxy',
            STREAM_AVAILABLE : 'StreamAvailable',
            STREAM_REQUEST : 'StreamRequest',
            STREAM_REVOKE: 'StreamRevoke',
            OFFER_SDP    : 'OfferSDP',
            ANSWER_SDP   : 'AnswerSDP',
            OFFER_CANDIDATE : 'OfferCandidate',
            ANSWER_CANDIDATE : 'AnswerCandidate',
            LEAVE        : 'Leave',
            TEXT_MESSAGE : 'TextMessage'
        }
    }
};

// end of define
});
