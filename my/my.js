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

        glob.my = factory();
    }
}(function (undefined) {
    'use strict';


/*********************************************************************
*                    原型拓展                                  *
**********************************************************************/

// js中String添加replaceAll 方法
    String.prototype.replaceAll = function (a, b) {
        var reg = new RegExp(a, "g");
        return this.replace(reg, b);
    };
// js中String添加startWith方法
    String.prototype.startWith = function (str) {
        var reg = new RegExp("^" + str);
        return reg.test(this);
    }
// js中String添加endWith方法
    String.prototype.endWith = function (str) {
        var reg = new RegExp(str + "$");
        return reg.test(this);
    }




/*********************************************************************
*                    常用封装                                  *
**********************************************************************/

    var my = {};

    //IE cache问题还未解决
    my.ajax=function(conf){
        var xhr = window.XMLHttpRequest ? new XMLHttpRequest : new ActiveXObject("Microsoft.XMLHTTP");

        var url=conf.url;
        var type=conf.type || "get";
        var data=conf.data || "";

        var enctype=conf.enctype ;

        var success=conf.success;
        var complete=conf.complete ;
        var error=conf.error;

        var uploadProgress=conf.uploadProgress;


//html5,未兼容
        if(xhr.upload && uploadProgress) {
            xhr.upload.addEventListener("progress", function (evt) {
                uploadProgress.call(this, evt);
            }, false);
        }

        xhr.open(type, url, true);  //设置false是要等待文件名返回

        enctype && xhr.setRequestHeader("Content-Type",enctype);
        xhr.send(data);
        xhr.onreadystatechange=(function(){
            if(xhr.readyState==4){
                if(xhr.status==200){
                    var data='';

                    //  json 解析  还要加入，！！！
                    if(xhr.responseText.startWith('{') && xhr.responseText.endWith('}')){
                        data=eval("("+xhr.responseText+")");
                    }
                    else
                        data =xhr.responseText;

                    success && success.call(this,data);
                }
                else {
                    complete && complete.call();
                }
            }
        })


    };

    my.badClone=function(obj){
        return JSON.parse(JSON.stringify(obj));
    }


    my.deepClone=function(p,c){
        var c = c || {};
        for (var i in p) {
            if(! p.hasOwnProperty(i)){
                continue;
            }
            if (typeof p[i] === 'object') {
                c[i] = (p[i].constructor === Array) ? [] : {};
                my.deepClone(p[i], c[i]);
            } else {
                c[i] = p[i];
            }
        }
        return c;
    }



    return my;
}));

