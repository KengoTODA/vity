
(function() {

var paths = {
    // common libs, min version
    'jquery'    : 'lib/jquery.min',
    'bootstrap' : 'lib/bootstrap.min',
    'angular'   : 'lib/angular.min',
    'es5-shim'  : 'lib/es5-shim.min',
    'es6-shim'  : 'lib/es6-shim.min',
};

// define the order for global exposed library in <script> tags
var shim = {
    'bootstrap' : ['jquery'],
    'angular'   : ['jquery'],
    'ui/app'    : ['bootstrap', 'angular']
};

if (Array.prototype.map === undefined) {  // es5-test
    shim['es6-shim'] = ['es5-shim'];
}
if (Array.prototype.findIndex === undefined) { // es6-test
    shim['angular'].push('es6-shim');
}

requirejs.config({
    baseUrl: '/js',
    urlArgs: 'bust=' +  (new Date()).getTime(),
    paths: paths,
    shim: shim
});


require([
        // arguments
        'ui/app',

        // controllers
        'ui/controller/VityCtrl',
        'ui/controller/VityTextMsgCtrl',
        'ui/controller/VityLoginCtrl',
        'ui/controller/VityPeerCtrl',
        'ui/controller/VityRoomListCtrl',

        // directives
        'ui/directive/vityStream',
        'ui/directive/vityHint',
        'ui/directive/vityGossipScroll',
        'ui/directive/vitySticker'
        ], function(app) {

    angular.bootstrap(document, [app.name])
    $('body').removeAttr('hidden');

});

})();
