/**
 * Copyright by Alexrander Luo.
 * Create Date 2016/10/11
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

        glob.UnderScore = factory();
    }
}(function (undefined) {
    'use strict';
    var
    UnderScore = function () {

    };

    return UnderScore;
}));

