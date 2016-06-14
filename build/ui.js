/**
 * 文件合并
 * Created by likaituan on 15/9/18.
 */

(function(req, exp){
    "use strict";
    var fs = req("fs");
    var js = req("./js");
    var css = req("./css");
    var view = req("./view");

    //解析命名空间
    exp.getCode = function(item, path){
        var o = {};
        o.js = js.getCode(item, path + "/ui.min.js", function(code){
            return view.addExp(code, "cssFile", '"none"');
        });
        //o.css = css.getCode(path + "/ui.css");
        return o;
    };


})(require, exports);
