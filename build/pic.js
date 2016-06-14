/**
 * 图片编码
 * Created by likaituan on 15/9/18.
 */

(function(req, exp) {
    "use strict";
    var fs = req("fs");
    var cfg = {};

    //复制文件夹
    var copyFolder = function(path){
        var data = fs.readdirSync(path);
        data.forEach(function (item) {
            var file = path + item;
            var stats = fs.statSync(file);
            if (stats.isDirectory()){
                copyFolder(file+"/");
            }else{
                if(/^([\w\-@]+)\.(png|gif|jpg|ico)$/.test(item)){
                    exp.totalCount++;
                    var ext = "." + RegExp.$2;
                    var src = file.replace(/^public/,"");
                    var dst = ("0" + exp.totalCount.toString(36)).slice(-2) + ext;
                    exp.shortImgs[src] = dst;
                }
            }
        });
    };

    //复制文件
    var copyFile = function(source, destination){
        console.log(cfg.staticPath+source,cfg.output+"/"+destination);
        var fileReadStream = fs.createReadStream(cfg.staticPath+source);
        var fileWriteStream = fs.createWriteStream(cfg.output+"/"+destination);
        fileReadStream.pipe(fileWriteStream);
    };


    //获取绝对路径
    var resolve = function(uri, referPath){
        referPath = referPath || "./";
        referPath = referPath.replace(/^public/,"").replace(/\w+(\.\w+)*$/,"");  //public写的的有点死
        //当前路径
        if (/^\.\//.test(uri)) {
            return referPath + uri.replace("./", "");
        }
        //上层路径
        else if (/^\.\.\//.test(uri)) {
            var newUri = uri.replace(/\.\.\//g, function () {
                referPath = referPath.replace(/\w+\/$/, "");
                return "";
            });
            return referPath + newUri;
        }
        //绝对路径
        else if (/^\//.test(uri)) {
            return uri;
        }
        return referPath + uri;
    };

    //初始化
    exp.useImgs = {};
    exp.init = function(_cfg){
        cfg = _cfg;
        exp.useCount = 0;
        exp.totalCount = 0;
        exp.shortImgs = {};
        /*
        exp.useImgs = {
            //"/favicon.ico": "favicon.ico"
        };*/

        copyFolder("./");
    };

    //复制使用到的图片
    exp.copyUseImg = function(){
        console.log("useImgs=",exp.useImgs);
        for(var file in exp.useImgs){
            exp.useCount++;
            copyFile(file, exp.useImgs[file]);
        }
        console.log("useImgCount/totalImgCount: "+ exp.useCount+ "/"+exp.totalCount);
    };

    //获取短路径
    exp.getShortImg = function(uri, referPath){
        var fullImg = resolve(uri, referPath);
        var sortImg = global.config.imgList[fullImg];
        if(sortImg){
            exp.useImgs[fullImg] = sortImg;
            return sortImg + "?" + global.config.version;
        }
        console.log({srcImg:uri, referImg:referPath, fullImg:fullImg, sortImg:sortImg});
        throw "img [ " + uri + " ] is not found in file [ " + referPath + " ]";
    };

})(require, exports);
