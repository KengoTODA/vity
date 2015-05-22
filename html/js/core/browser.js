
define([], function() {

'use strict';

var rtcShim = function() {
    // handle prefix for different browser
    if (!window.RTCPeerConnection) {
        if (window.mozRTCPeerConnection) {
            window.RTCPeerConnection = window.mozRTCPeerConnection;
        } else if (webkitRTCPeerConnection) {
            window.RTCPeerConnection = window.webkitRTCPeerConnection;
        }
    }

    if (!window.RTCSessionDescription) {
        if (window.mozRTCSessionDescription) {
            window.RTCSessionDescription = window.mozRTCSessionDescription;
        }
    }

    if (!window.RTCIceCandidate) {
        if (window.mozRTCIceCandidate) {
            window.RTCIceCandidate = window.mozRTCIceCandidate;
        }
    }
};


var mediaShim = function() {
    //wrap functions to navigator for Chrome and Firefox
    if (!navigator.getUserMedia) {
        if (navigator.mozGetUserMedia) {
            navigator.getUserMedia = navigator.mozGetUserMedia;
        } else if (navigator.webkitGetUserMedia) {
            navigator.getUserMedia = navigator.webkitGetUserMedia;
        }
    }
    if (!window.AudioContext) {
        if (window.webkitAudioContext) {
            window.AudioContext = window.webkitAudioContext;
        }
    }
};

var notificationShim = function() {
    if(!window.Notification) {
        if(window.webkitNotifications) {
            window.Notification = window.webkitNotifications;
        }
    }
}

return {
    rtcShim: rtcShim,
    mediaShim: mediaShim,
    notificationShim: notificationShim
};

// end of define
});
