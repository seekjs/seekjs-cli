/**
 * 文件合并
 * Created by likaituan on 15/9/18.
 */

(function(req, exp){
    "use strict";
    var fs = req("fs");
    var pic = req("./pic");

    //添加CSS文件
    exp.getCode = function(file){
        var code = fs.readFileSync(file).toString();
        code = code.replace(/url\s*\([\"\']?(.+?)[\"\']?\)\s*/ig, function(_,img){
            if(/^data:image\//.test(img)){
                return _;
            }
            var resolvePath = file.replace(global.config.staticPath,"/");
            return "url(" + pic.getShortImg(img, resolvePath) + ")";
        });
        return code;
    };

})(require, exports);
