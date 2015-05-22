
define(['ui/app'], function(app) {

app.directive('vityStream', function() {
    return {
        restrict: 'E',
        template: '<video autoplay controls></video><span>{{::stream.owner_nickname}}</span>',
        link: function(scope, element, attrs) {
            var stream = scope.stream;  // instance of VityStream
            stream.video_dom = element[0].querySelector('video');
            stream.video_dom.src = window.URL.createObjectURL(stream.native_stream);
            if (stream.type === 'audio') {  // hide black box for audio stream
                $(stream.video_dom).parent().css('display', 'none');
                stream.video_dom.volume = 1;  // maximum
                if (stream.is_local) {
                    setTimeout(function() {
                        stream.video_dom.volume = 0;
                    }, 3000);
                }
                scope.$on('setvolume', function(evt, data) {
                    if (stream.id !== data['stream_id'] ) {
                        return;
                    }
                    stream.video_dom.volume = data['volume'] / 100;
                });
            }
        }
    };
});
// end of define()
});
