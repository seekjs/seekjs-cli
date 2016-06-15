/**
 * 图片编码
 * Created by likaituan on 15/9/18.
 */

(function(req, exp) {
    "use strict";
    var fs = req("fs");

    //复制文件
    var copyFile = function(source, destination){
        var fileReadStream = fs.createReadStream(global.config.rootPath+"/"+source);
        var fileWriteStream = fs.createWriteStream(global.config.output+"/"+destination);
        fileReadStream.pipe(fileWriteStream);
    };

    //获取绝对路径
    var resolve = function(uri, referPath){
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
    exp.init = function(){
        exp.useCount = 0;
        exp.totalCount = 0;
        exp.shortImgs = {};
        exp.useImgs = {};
    };

    //复制使用到的图片
    exp.copyUseImg = function(){
        for(var file in exp.useImgs){
            exp.useCount++;
            copyFile(file, exp.useImgs[file]);
        }
        console.log("useImgCount/totalImgCount: "+ exp.useCount+ "/"+exp.totalCount);
    };

    //获取短路径
    exp.getShortImg = function(sourceImage, referPath){
        referPath = referPath.replace(global.config.rootPath, "").replace(/[^\/]+$/,"");
        var resolveImage = resolve(sourceImage, referPath);
        var sortImage = exp.shortImgs[resolveImage];
        if(sortImage){
            exp.useImgs[resolveImage] = sortImage;
            return sortImage + "?" + global.config.version;
        }
        console.log({sourceImage:sourceImage, referPath:referPath, resolveImage:resolveImage, sortImage:sortImage});
        throw "img [ " + sourceImage + " ] is not found in file [ " + referPath + " ]";
    };

})(require, exports);
