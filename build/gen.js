/**
 * 文件合并
 * Created by likaituan on 15/9/18.
 */

(function(req, exp){
    "use strict";
    var path = req("path");
    var fs = req("fs");
    var fs2 = req("./fs2");
    var css = req("./css");
    var js = req("./js");
    var pic = req("./pic");
    var tp = req("./tp");
    var view = req("./view");
    var ui = req("./ui");
    var cp = req("child_process");

    var jsCode = "";
    var cssCode = "";

    //复制文件夹
    var copyFolder = function(cfg, currentPath){
        var data = fs.readdirSync(currentPath);
        data.forEach(function (item) {
            if(item!="output" && item!="seek.config.js") {
                var fullPath = currentPath + item;
                var stats = fs.statSync(fullPath);
                //console.log(fullPath, stats.isDirectory());
                if (stats.isDirectory()) {
                    /seekjs/i.test(currentPath)==false && copyFolder(cfg, fullPath + "/");
                } else {
                    if (/^([\w\-@]+)\.(png|gif|jpg|ico)$/.test(item)) {
                        exp.totalCount++;
                        var ext = "." + RegExp.$2;
                        var source = "/" + fullPath.replace(cfg.re, "");
                        var destination = ("0" + exp.totalCount.toString(36)).slice(-2) + ext;
                        cfg.imgList[source] = destination;
                    } else if (/^(.+)\.js$/i.test(item)) {
                        var fileName = RegExp.$1;
                        //var ns = currentPath.replace(/^\W+/,"").replace(/\W+$/,"").replace(/^node_modules\/seekjs/i, "sys").replace(/\//g,".") || "root";
                        var ns = currentPath.replace(cfg.staticPath, "").replace(/^\W+/,"").replace(/\W+$/,"").replace(/^.*seekjs/i, "sys").replace(/\//g,".") || "root";
                        ns = cfg.shortcut[ns] || ns;
                        var mid = ns + "." + fileName;
                        mid = cfg.shortcut[mid] || mid;
                        if(ns=="js") {
                            cfg.viewList[mid] = fileName;
                        }else{
                            if(item!="main.js" && item!="define.js" && item!="seek.js" && item!="genui.js") {
                                cfg.jsList[mid] = fullPath;
                            }
                        }
                    } else if (/\.css/i.test(item)) {
                        cfg.cssList.push(fullPath);
                    }
                }
            }
        });
    };

    //添加插件
    var addPLugin = function(cfg){
        cfg.plugins.forEach(function(plugin){
            if(/^sys\.ui\.(\w+)$/.test(plugin.name)){
                cfg.uiList[plugin.name] = `${cfg.sysPath}/ui/${RegExp.$1}/`;
            }else{
                var uri = plugin.name.replace(/^sys\./,"").replace(/\./g,"/");
                cfg.jsList[plugin.name] = `${cfg.sysPath}/${uri}.js`;
            }
        });
    };

    //保存文件
    exp.saveFile = function(file, code){
        fs.writeFileSync(`${global.config.output}/${file}`, code);
    };

    //初始化
    exp.init = function(cfg){
        cfg.imgList = {};
        cfg.jsList = {};
        cfg.viewList = {};
        cfg.uiList = {};
        cfg.cssList = [];
        cfg.re = new RegExp("^"+cfg.staticPath.replace(/\./g,"\\.").replace(/\//g,"\\/"));
        var pkg = req(path.resolve("./package.json"));
        cfg.version = +pkg.version.replace(/\./g,"");
        cfg.assetsPath = path.join(__dirname,"../assets");
        cfg.sysPath = path.resolve(cfg.sysPath||"./node_modules/seekjs");
        exp.totalCount = 0;
        copyFolder(cfg, cfg.staticPath);
        addPLugin(cfg);
        global.config = cfg;
        //console.log(cfg.viewList);

        var startTime = Date.now();
        fs2.rmdir(cfg.output);
        setTimeout(function(){
            fs.mkdirSync(cfg.output);

            pic.init(cfg);
            var indexPage = cfg.index || "index.html";
            var code = exp.getIndexCode(cfg.staticPath+indexPage);
            exp.saveFile(indexPage, code);

            jsCode += js.getCode("", `${cfg.assetsPath}/define.js`);
            var entryFile = cfg.entry || "./main.js";
            jsCode += exp.getEntryCode(entryFile);


            for(var jsItem in cfg.jsList) {
                jsCode += js.getCode(jsItem, cfg.jsList[jsItem]);
            }
            for(var uiItem in cfg.uiList) {
                var o = ui.getCode(uiItem, cfg.uiList[uiItem]);
                jsCode += o.js;
                //cssCode += o.css;
            }
            for(var viewItem in cfg.viewList) {
                var o = view.getCode(viewItem, cfg.viewList[viewItem]);
                jsCode += o.js;
                //cssCode += o.css;
            }
            cfg.cssList.forEach(function(cssFile){
                cssCode += css.getCode(cssFile);
            });

            //jsCode = exp.compress(jsCode);
            exp.saveFile("app.js", jsCode);
            exp.saveFile("app.css", cssCode);
            pic.copyUseImg();
            var appJs = `${global.config.output}/app.js`;
            console.log(`uglifyjs ${appJs} -o ${appJs}`);
            try{
                cp.exec(`uglifyjs '${appJs}' -m -o '${appJs}'`);
            }catch(e){
                console.log("please install uglify-js if you'll compress code!");
            }
            var endTime = Date.now();
            var time = endTime - startTime;
            console.log("merge complete, use time "+time+"ms");

            //console.log(cfg);
        },100);
    };


    //添加首页代码
    exp.getIndexCode = function(file){
        var html = fs.readFileSync(file).toString();
        //替换JS地址
        html = html.replace(/\s*src\s*=\s*\".*?seek\.js\"\s*/i, ` src="app.js?${global.config.version}" `);
        //添加CSS链接
        html = html.replace(/<\/head>/i, `\t<link href="app.css?${global.config.version}" type="text/css" rel="stylesheet">\n</head>`);
        //替换样式短路径
        html = html.replace(/url\s*\([\"\']?(.+?)[\"\']?\)\s*/ig, function(_,img) {
            return "url(" + pic.getShortImg(img, "/") + ")";
        });
        //替换HTML短路径
        html = html.replace(/\s*(src|href)\s*=\s*\"(.*\.(?:png|jpg|gif))\"\s*/i, function(_s, attr, img){
            var sortImg = pic.getShortImg(img, "/");
            return ` ${attr}="${sortImg}" `;
        });
        return html;
    };

    //获取入口文件代码
    exp.getEntryCode = function(file){
        var code = js.getCode("root.main", file);
        return code.replace(/seekjs\.config\([\s\S]+define/, 'seekjs.define');
    };


})(require, exports);