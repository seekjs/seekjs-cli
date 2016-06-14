/**
 * JS文件处理
 * Created by likaituan on 15/9/18.
 */

(function(req, exp){
    "use strict";
    var fs = req("fs");
    var pic = req("./pic");
    var gen = req("./gen");  //不知它们互相调有没有问题

    //添加Js文件
    exp.getCode = function(ns, file, callback){
        var code = fs.readFileSync(file).toString();

        code = code.replace(/define\s*\(/g, "seekjs.define(").replace(/window\.define/g,"window.seekjs.define").replace(/typeof define/g,"typeof seekjs.define").replace(/([^\.])define\.amd/g,"$1seekjs.define.amd").replace(/([^\.])define\.cmd/g,"$1seekjs.define.cmd");              //define换成seekjs.define
        code = code.replace(/define\s*\(\s*([^\"])/g, "define(\""+ns+"\",$1");              //添加ID标记
        code = exp.useShortImg(file, code);
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

    //使用图片短路径
    exp.useShortImg = function(fullPath, code){
        /*
        var jsPicList = [
            "public/ex/bankcard",
            "public/ex/viewEx",
            "public/ad/ad_config",
            "public/ad/constellation/data"
        ];

        //图片短路径
        if(jsPicList.indexOf(fullPath)>-1) {
            code = code.replace(/[\"\']([^\"\']+?\.(?:gif|jpg|png))[\"\']/ig, function(_,img){
                return '"' + pic.getShortImg(img, "/") + '"';
            });
        }

        //去掉测试数据
        else if(fullPath=="public/ex/emit") {
            code = code.replace('req("ex.testData")', '{}');
        }
        */

        //替换模块相对路径
        code = code.replace(/module\.resolve\(\"(.+\.(?:gif|jpg|png))\"\)/, function(_,img){
            img = pic.getShortImg(img, fullPath.replace(global.config.staticPath, "/"));
            return `"${img}"`;
        });

        return code;
    };

})(require, exports);
