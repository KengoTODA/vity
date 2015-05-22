
define(['ui/app'], function(app) {

app.controller('VityLoginCtrl', ['$scope', function ($scope) {
    $scope.login_failed = false;
    $scope.login = function(login_id, password) {
        $.ajax({
            type: 'post',
            url: '/api/login',
            data: {login_id: login_id, password: password, via: 'default'}
        }).success(function() {
            location.pathname = '/index.html';
        }).error(function() {
            $scope.login_failed = true;
            $scope.login_id = '';
            $scope.password = '';
            $scope.$apply();
        });
    }
}]);

// end of define()
});
