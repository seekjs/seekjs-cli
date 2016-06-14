/**
 * 文件合并
 * Created by likaituan on 15/9/18.
 */

(function(req, exp){
    "use strict";
    var fs = req("fs");
    var pic = req("./pic");

    //添加首页
    exp.getCode = function(file){
        var sourceHTML = /<script\s*src=\".*?seek\.js\"\s*data\-main=\"root\.main\"><\/script>/i;
        var targetHTML = '<script src="app.js?' + global.config.version + '" data-main="root.main"></script>\n';
         targetHTML += '\t<link  href="app.css?' + global.config.version + '" type="text/css" rel="stylesheet">';
        var html = fs.readFileSync(file).toString();
        html = html.replace(sourceHTML, targetHTML);
        html = html.replace(/url\s*\([\"\']?(.+?)[\"\']?\)\s*/ig, function(_,img) {
            return "url(" + pic.getShortImg(img, "/") + ")";
        });
        return html;
    };

})(require, exports);
