/**
 * 文件合并
 * Created by likaituan on 15/9/18.
 */

(function(req, exp){
    "use strict";
    var fs = req("fs");
    var js = req("./js");
    var css = req("./css");
    var tp = req("./tp");

    //解析View
    exp.getCode = function(ns, viewName){
        var jsFile = `${global.config.rootPath}/js/${viewName}.js`;
        var cssFile = `${global.config.rootPath}/css/${viewName}.css`;
        var templateFile = `${global.config.rootPath}/templates/${viewName}.html`;

        var o = {};
        o.js = js.getJs(ns, jsFile, function(code){
            if(code.indexOf('exp.cssFile = "none"')==-1){
                //o.css = css.getCode(cssFile);
                code = exp.addExp(code, "cssFile", '"none"');
            }
            if(code.indexOf('exp.templateFile = "none"')==-1) {
                var funCode = tp.getFunCode(templateFile);
                code = exp.addExp(code, "getTemplate", funCode);
            }
            return code;
        });

        return o;
    };

    //添加EXP
    exp.addExp = function(code, key, val){
        code = code.replace("\"use strict\";", "\"use strict\";\n\nexp." + key + " = "+ val +";\n\n");
        return code;
    };


})(require, exports);
