/**
 * 图片转base64
 * Created by likaituan on 15/11/10.
 */

(function(req, exp) {
    "use strict";
    var fs = req("fs");

    exp.init = function(path){
        var startTime = Date.now();

        var o = {};
        var id = 'sys.ui.'+path+'.pic';
        path = "public/seekjs/ui/"+path+"/";
        var data = fs.readdirSync(path);
        data.forEach(function (fileName) {
            if(/^(\w+)\.(gif|jpg|png|bmp)$/.test(fileName)){
                var imageBuf = fs.readFileSync(path+fileName);
                o[RegExp.$1] = "data:image/"+RegExp.$2+";base64,"+imageBuf.toString("base64")+"==";
            }
        });
        var code = 'define("'+id+'", '+JSON.stringify(o)+');';
        fs.writeFileSync(path+"pic.js", code);

        var endTime = Date.now();
        var time = endTime - startTime;
        console.log("merge complete, use time "+time+"ms");
    };

    exp.init(process.env.ui);

})(require, exports);
