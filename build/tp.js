/**
 * 文件合并
 * Created by likaituan on 15/9/18.
 */

(function(req, exp){
    "use strict";
    var fs = req("fs");
    var tp = req("./h5template");
    var pic = req("./pic");

    //获取模板函数代码
    exp.getFunCode = function(file){
        var code = fs.readFileSync(file).toString();

        code = exp.spParse(file, code);

        //替换图片
        code = code.replace(/src\s*=\s*\"(.+?)\"/ig, function(_,img){
            if(/\{/.test(img)){
                return _;
            }
            return 'src="' + pic.getShortImg(img, "/") + '"';
        });

        return 'function($){' + tp.getJsCode(code) + '};';
    };

    //特效处理
    exp.spParse = function(file, code){
        //非常重要
        if(file=="public/templates/pay_form.html"){
            if(process.argv[2]=="online") {
                code = code.replace("payment.htm", "authpay.htm");
                console.log("\n===========正在使用生产环境连连支付===========================\n");
            }else if(process.argv[2]=="test"){
                code = code.replace("authpay.htm", "payment.htm");
                console.log("\n============正在使用测试环境连连支付==========================\n");
            }else if(process.argv[2]=="test2") {
	            code = code.replace("authpay.htm", "payment.htm");
	            console.log("\n============正在使用测试环境2连连支付==========================\n");
            } else{
                throw "未输入参数或参数不对";
            }
            console.log(code.replace(/\<\!\-\-.+?\-\-\>/g,"").trim()+"\n");
        }

        //临时,view转part
        code = code.replace(/<div data\-view=\"(.+?)\" data\-view2part=\"true\"><\/div>/g, function(_,viewUri){
            var fileCode = fs.readFileSync(`${global.config.rootPath}/templates/${viewUri}.html`);
            return `<div data-part="${viewUri}">${fileCode}</div>`;
        });
        return code;
    };


})(require, exports);
