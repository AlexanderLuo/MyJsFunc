/**
 * Created by luohao on 2016/10/12.
 */
var PubSub = (function() {
    var events = {};
    return {
        subscribe: function(mesId, fn) {
            if (!events[mesId]) events[mesId] = [];
            events[mesId].push(fn);
        },
        publish: function(mesId) {
            var eventQueue = events[mesId]
            if (eventQueue) {
                eventQueue.forEach(function(item) {
                    item();
                });
            }
        },
        off: function(mesId,fn) {
            var eventQueue = events[mesId];
            if (eventQueue) {
                if(fn!=null){
                    events[mesId] = eventQueue.filter(function(item) {
                        return item !== fn;
                    });
                }
                if(fn ==null){
                    events[mesId]=[];
                }

            }

        }
    }
}());