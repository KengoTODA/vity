
define(['ui/app'], function(app) {

app.directive('vitySticker', function() {
    return {
        restrict: 'A',
        link: function(scope, jqelem, attrs) {
            var elem = jqelem[0];
            var anchor = undefined;
            var resizer = undefined;
            var destroy_timeid = undefined;
            var offset_left_to_mouse = undefined;
            var offset_top_to_mouse = undefined;
            var original_document_onmousemove = document.onmousemove;
            var original_document_onmoveup = document.onmouseup;
            var anchor_height = 20;
            var start_x, start_y;
            var ratio;

            var delayDestroyAnchorResizerIfExists = function() {
                if (destroy_timeid !== undefined) {
                    return;
                }
                destroy_timeid = setTimeout(function() {
                    try {
                        jqelem[0].removeChild(anchor);
                    } catch (err) {
                        // donothing because it does not exist.
                    };
                    try {
                        jqelem[0].removeChild(resizer);
                    } catch(err) {
                        // donothing because it does not exist.
                    };
                    anchor = undefined;
                    resizer = undefined;
                    destroy_timeid = undefined;
                }, 1000);
            };

            var cancelDestroyIfExists = function() {
                if (destroy_timeid !== undefined) {
                    clearTimeout(destroy_timeid);
                    destroy_timeid = undefined;
                }
            };

            var createAnchorResizerIfNotExists = function() {
                // get the element ratio
                ratio = (jqelem.width() / jqelem.height());
                if (anchor === undefined) {
                    anchor = document.createElement('div');
                    anchor.setAttribute('class', 'anchor');

                    var jqanchor = $(anchor);
                    jqanchor.width(jqelem.width() + 2);
                    jqanchor.height(anchor_height);
                    jqanchor.css({'left': jqelem.offset().left + 'px',
                                  'top' : (jqelem.offset().top - jqanchor.height())  + 'px',
                                  'z-index': 100});
                    jqelem.css('z-index', 100);

                    anchor.onmouseenter = function(evt) {
                        cancelDestroyIfExists();
                    };

                    anchor.onmouseleave = function(evt) {
                        delayDestroyAnchorResizerIfExists();
                    };

                    anchor.onmousedown = function(evt) {
                        offset_left_to_mouse = evt.clientX - jqelem.offset().left;
                        offset_top_to_mouse = evt.clientY - jqelem.offset().top;

                        original_document_onmousemove = document.onmousemove;
                        original_document_onmoveup = document.onmouseup;

                        jqelem.width(jqelem.width());
                        jqelem.css('margin', '0em');
                        jqelem.css('bottom', 'initial');
                        jqelem.css('position', 'fixed');

                        var repositionElem = function(evt) {
                            jqelem.css('left', (evt.clientX - offset_left_to_mouse) + 'px');
                            if (evt.clientY - offset_top_to_mouse > anchor_height) {
                                jqelem.css('top', (evt.clientY - offset_top_to_mouse) + 'px');
                            }
                        };
                        repositionElem(evt);

                        document.onmousemove = function(evt) {
                            if (evt.which !== 1) {
                                return;
                            }
                            if (offset_left_to_mouse === undefined) {
                                return;
                            }

                            var jqelem = $(elem);
                            var jqanchor = $(anchor);
                            var jqresizer = $(resizer);

                            repositionElem(evt);

                            jqanchor.css('left', (jqelem.offset().left) + 'px');
                            jqanchor.css('top', (jqelem.offset().top - jqanchor.height())  + 'px');

                            jqresizer.css('left', (jqelem.offset().left + jqelem.width()) - 3 + 'px');
                            jqresizer.css('top', (jqelem.offset().top + jqelem.height()) + 3 + 'px');

                            window.getSelection().removeAllRanges();
                        };

                        document.onmouseup = function(evt) {
                            document.onmousemove = original_document_onmousemove;
                            document.onmouseup = original_document_onmoveup;
                            original_document_onmousemove = null;
                            original_document_onmoveup = null;
                            offset_left_to_mouse = undefined;
                            offset_top_to_mouse = undefined;

                        };
                    };

                    anchor.onmousemove = anchor.onmouseup = function(evt) {
                        // handle by document.mousemove and document.mouseup
                        evt.preventDefault();
                    };

                    jqelem[0].appendChild(anchor);
                }
                if(resizer === undefined) {
                    resizer = document.createElement('div');
                    resizer.setAttribute('class', 'glyphicon glyphicon-resize-full resizer');
                    var jqresizer = $(resizer);
                    jqresizer.css({
                        'left': (jqelem.offset().left + jqelem.width()) - 3 + 'px',
                        'top': (jqelem.offset().top + jqelem.height()) + 3 + 'px',
                        'z-index': 100,
                        'position': 'fixed'
                    });
                    jqelem[0].appendChild(resizer);

                    resizer.onmouseenter = function(evt) {
                        cancelDestroyIfExists();
                    };

                    resizer.onmouseleave = function(evt) {
                        delayDestroyAnchorResizerIfExists();
                    };
                    resizer.addEventListener('mousedown', setResize);
                }
            };

            var setResize = function(evt) {
                start_x = jqelem.offset().left;
                start_y = jqelem.offset().top;
                original_document_onmousemove = document.onmousemove;
                original_document_onmoveup = document.onmouseup;
                document.onmousemove = startResize;
                document.onmouseup = endResize;
            };
            var startResize = function(evt) {
                jqelem.css('width', (evt.clientX - start_x) + 'px');
                if(attrs.keepRatio === 'true') {
                    jqelem.css('height', (jqelem.width()/ratio) + 'px');
                } else {
                    jqelem.css('height', (evt.clientY - start_y) + 'px');
                }
                $(resizer).css('left', (jqelem.offset().left + jqelem.width()) - 3 + 'px');
                $(resizer).css('top', (jqelem.offset().top + jqelem.height()) + 3 + 'px');
                $(anchor).width(jqelem.width() + 2);
                evt.preventDefault();
            };
            var endResize = function(evt) {
                document.onmousemove = original_document_onmousemove;
                document.onmouseup = original_document_onmoveup;
                original_document_onmousemove = null;
                original_document_onmoveup = null;
            };

            elem.onmouseenter = function(evt) {
                cancelDestroyIfExists();
                createAnchorResizerIfNotExists();
            };

            elem.onmousemove = function(evt) {
                cancelDestroyIfExists();
                createAnchorResizerIfNotExists();
                delayDestroyAnchorResizerIfExists();
            };

            elem.onmouseleave = function(evt) {
                delayDestroyAnchorResizerIfExists();
            };
        }
    };
});


// end of define()
});
