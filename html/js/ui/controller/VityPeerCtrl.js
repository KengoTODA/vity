
define(['ui/app'], function(app) {

app.controller('VityPeerCtrl', ['$scope', '$rootScope',  function ($scope, $rootScope) {

    $scope.nickname = '';
    $scope.id = '';
    $scope.region = '';
    $scope.ip;
    $scope.audio_id = undefined;   // if it's broadcasting it's audio
    $scope.data = {};

    $scope.init = function(peer, self_peer_id) {
        ['nickname', 'ip', 'id', 'region', 'audio_id'].forEach(function(key) {
            $scope[key] = key in peer ? peer[key] : '';
        });
        $scope.data.volume = peer.id === self_peer_id ? 0 : 100;
    };

    $scope.setVolume = function() {
        $rootScope.$broadcast('setvolume',
            {'stream_id': $scope.audio_id, 'volume': $scope.data.volume});
    };

}]);  // end of app.controller

// end of define
});
