/**
 * Copyright by Alexrander Luo.
 * Create Date 2016/9/25
 * Email 496952252@qq.com
 */
(function (factory) {
    if (typeof exports === 'object') {
        // Node/CommonJS
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        // AMD
        define(factory);
    } else {
        // Browser globals (with support for web workers)
        var glob;

        try {
            glob = window;
        } catch (e) {
            glob = self;
        }

        glob.Encoder = factory();
    }
}(function (undefined) {
    'use strict';
    var Encoder={};
    Encoder={


        getUnicode:function(text){
            var str="";
            for (var i = 0; i < text.length; i++) {
                str +="\\u"+text.charCodeAt(i).toString(16);
            }
            return str;
        },



        getChines:function(unicode){
            var str="";
            str=unicode.replace(/\\u[0-9a-f]{4}/gi,function(word){
                return String.fromCharCode(parseInt(word.substring(2),16));
            })
            return str;
        }

    };


    return Encoder;
}));

