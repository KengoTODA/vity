

define(['ui/app'], function(app) {

app.controller('VityTextMsgCtrl', ['$scope', '$sce', function ($scope, $sce) {
    $scope.from = '';
    $scope.text = '';
    $scope.wrapped_text = '';

    $scope.init = function(msg) {
        $scope.from = msg['from'];
        $scope.text = msg['data'];
        var urlPattern = /((http|ftp|https):\/\/)[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;~+#-])?(\/)?/gi;
        var _unwrapped_text = $scope.text;
        var _wrapped_text = '';

        var getSafeText = function(text) {
            return text.replace(/\s/g, '&nbsp')
                       .replace(/</g, '&lt')
                       .replace(/>/g, '&gt');
        };
        angular.forEach(_unwrapped_text.match(urlPattern), function(url) {
            var _idx = _unwrapped_text.indexOf(url);
            _wrapped_text += (getSafeText(_unwrapped_text.substr(0, _idx)) +
                              '<a target="_blank" href="'+ url + '">' + url +'</a>');
            _unwrapped_text = _unwrapped_text.slice(_idx + url.length);
        });
        _wrapped_text += getSafeText(_unwrapped_text);
        $scope.wrapped_text = $sce.trustAsHtml(_wrapped_text);
    }
}]);


// end of define()
});
