/**
 * 活动处理
 * Created by likaituan on 15/9/18.
 */

(function(req, exp){
    "use strict";
    var fs = req("fs");
    var js = req("./js");
    var view = req("./view");

    //解析活动
    exp.getCode = function(item, a, adPath){
        var o = {};
        o.js = "";
        o.css = "";
        if(a.length>1){
            var path = adPath + a.join("") + "/";
            fs.readdirSync(path).forEach(function (file) {
                file = file.split(".");
                if(file[1] && file[1]=="js"){
                    o.js += js.getCode(item+file[0], path+file[0]);
                }
            });
            fs.readdirSync(path+"js/").forEach(function (file) {
                file = file.split(".");
                if(file[1] && file[1]=="js"){
                    var oo = view.getCode(item+"js/"+file[0], path, file[0]);
                    o.js += oo.js;
                    o.css += oo.css;
                }
            });
        }else{
            o.js += js.getCode(item, adPath + a[0]);
        }
        return o;
    };


})(require, exports);
