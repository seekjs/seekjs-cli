/**
 * JS文件处理
 * Created by likaituan on 15/9/18.
 */

(function(req, exp){
    "use strict";
    var fs = req("fs");
    var pic = req("./pic");
    var gen = req("./gen");  //不知它们互相调有没有问题

    //获取Js代码
    exp.getJs = function(ns, file, callback){
        var code = fs.readFileSync(file).toString();
        return exp.getCode(ns, file, code, callback);
    };

    //获取代码
    exp.getCode = function(ns, file, code, callback){
        code = code.replace(/define\s*\(/g, "seekjs.define(").replace(/window\.define/g,"window.seekjs.define").replace(/typeof define/g,"typeof seekjs.define").replace(/([^\.])define\.amd/g,"$1seekjs.define.amd").replace(/([^\.])define\.cmd/g,"$1seekjs.define.cmd");              //define换成seekjs.define
        code = code.replace(/define\s*\(\s*([^\"])/g, "define(\""+ns+"\",$1");              //添加ID标记

        //替换模块相对路径
        code = code.replace(/module\.resolve\(\"(.+\.(?:gif|jpg|png))\"\)/, function(_,img){
            img = pic.getShortImg(img, file);
            return `"${img}"`;
        });

        //处理全局事件
        var buildJsBefore = global.config.buildJsBefore;
        if(buildJsBefore){
            code = buildJsBefore(ns, code);
        }

        //处理临时回调
        if(callback){
            code = callback(code);
        }

        //加载CSS处理
        code = code.replace(/req\(\"(\w+(?:[\.\/]\w+)*\.css)\"\);/g, function(_, ns){
            //gen.parseItem(ns);
            return "";
        });

        return code;
    };

})(require, exports);
