/**
 * 文件合并
 * Created by likaituan on 15/9/18.
 */

(function(req, exp){
    "use strict";
    var fs = req("fs");
    var pic = req("./pic");

    //获取CSS代码
    exp.getCss = function(file){
        var code = fs.readFileSync(file).toString();
        return exp.getCode(file, code);
    };

    //获取代码
    exp.getCode = function(file, code){
        return code.replace(/url\s*\([\"\']?(.+?)[\"\']?\)\s*/ig, function(_,img){
            if(/^data:image\//.test(img)){
                return _;
            }
            return "url(" + pic.getShortImg(img,file) + ")";
        });
    };

})(require, exports);
