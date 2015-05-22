
define([], function() {

'use strict';
var uuid4 = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
};
var perror = function(err) {
    console.error(err);
};

var readOnlyProperty = function() {
    var that = this;
    return function() {
        console.error(that, 'is read only');
        throw 'attemp to set a read-only property : ' + that;
        if (console.trace) {
            console.trace();
        }
    }
};

var getTimeStamp = function() {
    return (new Date()).getTime();
};

return {
    uuid4: uuid4,
    readOnlyProperty: readOnlyProperty,
    getTimeStamp: getTimeStamp,
    perror: perror
};

// end of define
});
