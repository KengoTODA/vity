
define(['vity_core'], function(Vity) {

$.ajaxSetup({
    statusCode: {
        499: function() {
            location.pathname = '/login.html';
        }
    }
});

var app = angular.module('vityApp', []);
return app;

// end of define()
});
