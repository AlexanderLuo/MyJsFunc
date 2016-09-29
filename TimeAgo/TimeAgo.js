/**
 * Copyright by Alexrander Luo.
 * Create Date 2016/9/20
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

        glob.TimeAgo = factory();
    }
}(function (undefined) {
    'use strict';

    var a='',
        indexMapEn = ['second', 'minute', 'hour', 'day', 'week', 'month', 'year'],
        indexMapZh = ['秒', '分钟', '小时', '天', '周', '月', '年'],
        languageLib={
        'en': function(number, index) {
                var unit = indexMapEn[index];
                if (number > 1) unit += 's';
                return [number + ' ' + unit + ' ago', 'in ' + number + ' ' + unit];

        },
        'zh_CN': function(number, index) {
                var unit = indexMapZh[index];
                return [number + unit + '前', number + unit + '后'];
        }
    },
    // second, minute, hour, day, week, month, year(365 days)
        SEC_ARRAY = [60, 60, 24, 7, 365/7/12, 12],
        SEC_ARRAY_LEN = 6,
        ATTR_DATETIME = 'datetime',


        TimeAgo = function (nowDate,defLanguage) {

            if (! defLanguage) {
                defLanguage = 'zh_CN';      // use default build-in language
            };


            this.format = function(date, language) {
                return translate(diffSec(date), language);
            };


            // format the diff second to *** time ago, with setting locale
            function translate(diff, language) {
                if (! languageLib[language]) {
                    language = defLanguage;
                }
                var i = 0, flag = diff < 0 ? 1 : 0;     // flag:0 age   flag:1  in


                diff = Math.abs(diff);

                //locate the time-diff area
                for (; diff >= SEC_ARRAY[i] && i < SEC_ARRAY_LEN; i++) {
                    diff /= SEC_ARRAY[i];
                }

                diff = parseInt(diff);


                return languageLib[language](diff, i)[flag].replace('%s', diff);

            }


            // calculate the diff second between date to be formated an now date.

            function diffSec(date) {
                var now;
                if (nowDate) {
                    now = toDate(nowDate);
                }else{
                    now=new Date();
                }
                return (now.getTime() - toDate(date).getTime()) / 1000;
            }


            // format Date / string / timestamp to Date instance.
            function toDate(input) {
                if (input instanceof Date) {
                    return input;
                } else if (!isNaN(input)) {
                    return new Date(parseInt(input));
                } else if (/^\d+$/.test(input)) {
                    return new Date(parseInt(input, 10));
                } else {
                    var s = (input || '').trim();
                    s = s.replace(/\.\d+/, '') // remove milliseconds
                        .replace(/-/, '/').replace(/-/, '/')
                        .replace(/T/, ' ').replace(/Z/, ' UTC')
                        .replace(/([\+\-]\d\d)\:?(\d\d)/, ' $1$2'); // -04:00 -> -0400
                    return new Date(s);
                }
            }

    };

    return TimeAgo;
}));

