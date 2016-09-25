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

        glob.FileTool = factory();
    }
}(function (undefined) {
    'use strict';

    var defaultConf={
        fileList:[],
        method:"total",
        readAs:"text",
        chunkSize:0,
        onloadstart:"",
        onprogress:"",
        onabort:"",
        error:"",
        onloadend:""
    };

    var read=function(reader,curInfo,method,readAs){
        var file=curInfo.file;
        if(method ==='total'){
            switch (readAs){
                case "text":
                    reader.readAsText(file);
                    break;
                case "url":
                    reader.readAsDataURL(file);
                    break;
                case "binary":
                    reader.readAsBinaryString(file);
                    break;
                case "buffer":
                    reader.readAsArrayBuffer(file);
                    break;
                default:
                    reader.readAsText(file);
            }
        }
        if(method ==='chunk') {

            var cur = curInfo.curChunk;
            console.log("```````````curChunk````````````:" + cur)
            var start = (cur - 1) * curInfo.chunkSize;
            var end = start + curInfo.chunkSize >= curInfo.fileSize ? curInfo.fileSize : start + curInfo.chunkSize;
            console.log("```````````start-end``````````:" + start + "-" + end)
            var part = file.slice(start, end);


            switch (readAs) {
                case "text":
                    reader.readAsText(part);
                    break;
                case "url":
                    reader.readAsDataURL(part);
                    break;
                case "binary":
                    reader.readAsBinaryString(part);
                    break;
                case "buffer":
                    reader.readAsArrayBuffer(part);
                    break;
                default:
                    reader.readAsText(part);
            }
        }
    };



    var FileTool = function (conf) {
        var _this=this;
        conf=conf ||  defaultConf;
        this.fileList=conf.fileList || [];
        this.method=conf.method || "total";
        this.readAs=conf.readAs || 'text';
        this.chunkSize=conf.chunkSize || 2097152;

        //for test
        //this.chunkSize=conf.chunkSize || 200;


        this.curInfo={
            index:0,
            file:this.fileList[0],
            fileSize:this.fileList[0].size,
            chunkSize:this.chunkSize,
            chunkNum:Math.ceil(this.fileList[0].size / this.chunkSize),
            curChunk:1
        };

        var reader=new FileReader();
        conf.onloadstart && (reader.onloadstart =conf.onloadstart);
        conf.onprogress && (reader.onprogress =conf.onprogress);
        conf.onabort && (reader.onabort = conf.onabort);
        conf.error &&  (reader.error=conf.error);
        conf.onloadend &&  (reader.onloadend=conf.onloadend);

        if(this.method==='total'){
            reader.onload=function(){
                conf.onload &&  conf.onload.call(this,reader.result);
                if(_this.curInfo.index<_this.fileList.length-1){
                    _this.curInfo.index+=1;
                    _this.curInfo.file=_this.fileList[_this.curInfo.index];
                    read(reader,_this.curInfo,"total",_this.readAs)
                }else {
                    console.log("``````end``````")
                }
            }
        }

        if(this.method==='chunk'){
            reader.onload=function(){
                conf.onload &&  conf.onload.call(this,reader.result);
                _this.curInfo.curChunk+=1;
                if(_this.curInfo.chunkNum>=_this.curInfo.curChunk){
                    read(reader,_this.curInfo,'chunk',_this.readAs);
                }
                else {
                    console.log("----------chunkEnd----------");
                    console.log("----------NextFile----------");
                    /*todo
                     //读取下一个文件的逻辑没有写

                     */

                    //running = false;
                    //conf.chunkEnd.call();
                }
            }
        }


        this.start=function(){
            if(_this.method==='chunk'){
                read(reader,_this.curInfo,'chunk',_this.readAs);
            }
            if(_this.method==='total'){
                read(reader,_this.curInfo,"total",_this.readAs)
            }

        }




    };

    return FileTool;
}));

