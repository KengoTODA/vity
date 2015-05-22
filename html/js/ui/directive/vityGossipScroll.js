
define(['ui/app'], function(app) {

app.directive('vityGossipScroll', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var target_div_jq = ($(element[0]).parent())[0];
            target_div_jq.scrollTop = target_div_jq.scrollHeight;
        }
    };
});

// end of define()
});
