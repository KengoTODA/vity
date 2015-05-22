
define(['ui/app'], function(app) {

app.directive('vityHint', function() {
    return {
        restrict: 'A',
        scope: {
            hint_text: '@vityHint'
        },
        link: function(scope, element, attrs) {
            var div = $(document.createElement('div'));
            div.addClass('hint');
            div.text(scope.hint_text);
            div.css('display', 'none');
            window.document.body.appendChild(div[0]);
            element[0].onmouseenter = function(evt) {
                div.css('display', 'inline-block');
                var left = element.offset().left + element.outerWidth() / 2 - div.width() / 2;
                if (left < 10) {
                    left = 10;
                } else if (left + div.width() >= $(document).width() ) {
                    left = $(document).width() - div.width() - 10;
                }
                div.css('left', left);
                var top = element.offset().top - element.height() - 2; // 2 pixels up
                div.css('top', top);
                element[0].onmouseleave = function(evt) {
                    div.css('display', 'none');
                };
            };
        }
    };
});


// end of define()
});
