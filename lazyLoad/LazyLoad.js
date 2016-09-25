/**
 * Copyright by Alexrander Luo.
 * Create Date 2016/9/17
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

        glob.LazyLoad = factory();
    }
}(function (undefined) {
    'use strict';

    var defalutConf={
        id:false,
        lazyTime:0,
        lazyRange:100
    };


    var isLoadable=function(ele,range){
        if(typeof ele==='undefined') return false;
        // pixel of scrollTop
        var scrollTop = document.documentElement.scrollTop || window.pageYOffset || document.body.scrollTop;
        var clientHeight = scrollTop + document.documentElement.clientHeight + range;
        var offsetTop = 0;
        //似乎是个递归追溯元素街道到BODY的距离
        while(ele.tagName.toUpperCase() !== 'BODY'){
            offsetTop += ele.offsetTop;
            ele = ele.offsetParent;
        }
        console.log(clientHeight > offsetTop);
        return (clientHeight > offsetTop);

    };


    var loadImg=function(ele){
        ele.src = ele.getAttribute('data-src');
    };


    var LazyLoad=function(conf){
        var _this=this;
        conf=conf || defalutConf;
        this.id=conf.id || defalutConf.id;
        this.lazyTime=conf.lazyTime || defalutConf.lazyTime;
        this.lazyRange=conf.lazyRange || defalutConf.lazyRange;
        this.images=[];
        this.remain=[];

        var doc=this.id ? document.getElementById(this.id) : document;
        if(doc !==null) {
            this.images=doc.getElementsByTagName('img');
            for(var i = 0; i<this.images.length; i++){
                var obj = this.images[i];
                if (obj.getAttribute('data-src') !== null) {
                    if (isLoadable(obj,this.lazyRange)) {
                        loadImg(obj);
                    } else {
                        //Task Segment
                        this.remain.push(obj);
                    }
                }
            }
        }

        this.polling=function(){
            for(var i= _this.remain.length;i>0;i--){
                var obj=_this.remain[i-1];
                if(isLoadable(obj,_this.lazyRange)){
                   loadImg(obj);
                    _this.remain.splice(i-1,1)
                }
            }
            if(_this.remain.length ===0 ){
                window.removeEventListener ? window.removeEventListener("scroll", _this.polling, false) : window.detachEvent("onscroll", _this.polling);
            }
        };

        this.start=function(){
            window.removeEventListener ? window.removeEventListener("scroll", _this.polling, false) : window.detachEvent("onscroll", _this.polling);
            window.addEventListener ? window.addEventListener("scroll",_this.polling, false) : window.attachEvent("onscroll", _this.polling);
        }
    };

    return LazyLoad;
}));

