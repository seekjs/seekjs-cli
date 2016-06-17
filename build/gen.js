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
    var indexCode = "";
    var entryCode = "";
    var cfg = {};
    var expects = {};

    //Step1 - 获取系统路径和入口文件
    var getSysPathAndEntryFile = function() {
        var indexFile = `${cfg.rootPath}/${cfg.index}`;
        indexCode = fs.readFileSync(indexFile).toString();
        //替换JS地址
        indexCode = indexCode.replace(/\s*src\s*=\s*\"(.*?)seek\.js\"\s*/i, function(_, sysPath){
            cfg.sysPath = sysPath && cfg.rootPath + "/" + sysPath.replace(/\/$/,"") || "";
            return ` src="app.js?${global.config.version}" `;
        });
        //获取入口文件
        indexCode.replace(/\s*data\-main\s*=\s*\"(.+)\"\s*/i, function(_, entryPath){
            cfg.entry = {
                ns: entryPath,
                path: entryPath.replace("root.", cfg.rootPath+"/")+".js"
            };
        });
        //添加CSS链接
        indexCode = indexCode.replace(/<\/head>/i, `\t<link href="app.css?${global.config.version}" type="text/css" rel="stylesheet">\n</head>`);
    };

    //Step2 获取短路径
    var getShortcut = function(){
        entryCode = fs.readFileSync(cfg.entry.path).toString();
        entryCode = entryCode.replace(/seekjs\.config\([\s\S]+define/, function(_, code){
            //先写死
            cfg.shortcut = {
                plugins : "plugs"//,
                //"plugs.service": "service"
            };
            return 'define';
        });
    };

    //Step3 遍历文件夹
    var eachFolder = function(currentPath, isFilterJs){
        var data = fs.readdirSync(currentPath);
        data.forEach(function (item) {
            var fullPath = currentPath + item;
            var stats = fs.statSync(fullPath);
            if (stats.isDirectory()) {
                /seekjs/i.test(currentPath)==false && eachFolder(fullPath + "/", isFilterJs);
            } else {
                if (/^([\w\-@]+)\.(png|gif|jpg|ico)$/.test(item)) {
                    pic.totalCount++;
                    var ext = "." + RegExp.$2;
                    var source = fullPath.replace(cfg.re, "");
                    var destination = ("0" + pic.totalCount.toString(36)).slice(-2) + ext;
                    pic.shortImgs[source] = destination;
                } else if (/^(.+)\.js$/i.test(item) && !isFilterJs) {
                    var fileName = RegExp.$1;
                    var ns;
                    if(currentPath==cfg.rootPath+"/"){
                        ns = "root";
                    }else if(currentPath==cfg.sysPath+"/"){
                        ns = "sys";
                    }else{
                        ns = currentPath.replace(cfg.rootPath, "").replace(/^\W+/,"").replace(/\W+$/,"").replace(/\//g,".");
                    }
                    ns = cfg.shortcut[ns] || ns;
                    var mid = ns + "." + fileName;
                    mid = cfg.shortcut[mid] || mid;
                    if(!expects[mid]) {
                        if (ns == "js") {
                            cfg.viewList[mid] = fileName;
                        } else {
                            if (item != "main.js" && item != "define.js" && item != "seek.js" && item != "genui.js") {
                                cfg.jsList[mid] = fullPath;
                            }
                        }
                    }
                } else if (/\.css/i.test(item)) {
                    cfg.cssList.push(fullPath);
                }
            }
        });
    };

    //Step4 添加插件
    var addPlugin = function(){
        cfg.plugins = (cfg.plugins||[]).concat([
            { name: "sys.lib.move", count:1, des: "good" },
            {name: "sys.lib.highcharts"},
            { name: "sys.ui.dialog" },
            { name: "sys.ui.mask" },
            { name: "sys.ui.tip" }
        ]);
        cfg.plugins.forEach(function(plugin){
            if(typeof plugin=="string"){
                plugin = {name: plugin};
            }
            if(/^sys\.ui\.(\w+)$/.test(plugin.name)){
                cfg.uiList[plugin.name] = `${cfg.sysPath}/ui/${RegExp.$1}`;
                eachFolder(cfg.uiList[plugin.name] + "/", true);
            }else{
                var uri = plugin.name.replace(/^sys\./,"").replace(/\./g,"/");
                console.log(plugin.name);
                cfg.jsList[plugin.name] = `${cfg.sysPath}/${uri}.js`;
            }
        });
    };

    //Step5 更新首页
    var upIndex = function(){
        //替换样式短路径
        indexCode  = indexCode.replace(/url\s*\([\"\']?(.+?)[\"\']?\)\s*/ig, function(_,img) {
            return "url(" + pic.getShortImg(img, "/") + ")";
        });
        //替换HTML短路径
        indexCode  = indexCode.replace(/\s*(src|href)\s*=\s*\"(.*\.(?:png|jpg|gif))\"\s*/i, function(_s, attr, img){
            var sortImg = pic.getShortImg(img, "/");
            return ` ${attr}="${sortImg}" `;
        });
    };

    //Step6 更新入口文件
    var upEntry = function(){
        jsCode += js.getJs("", `${cfg.assetsPath}/define.js`);
        jsCode += js.getCode("root.main", cfg.entry.path, entryCode);
    };

    //Step7 更新JS
    var upJs = function(){
        for(var jsItem in cfg.jsList) {
            jsCode += js.getJs(jsItem, cfg.jsList[jsItem]);
        }
        for(var uiItem in cfg.uiList) {
            jsCode += ui.getCode(uiItem, cfg.uiList[uiItem]).js;
        }
        for(var viewItem in cfg.viewList) {
            jsCode += view.getCode(viewItem, cfg.viewList[viewItem]).js;
        }
    };

    //Step8 更新CSS
    var upCss = function(){
        cfg.cssList.forEach(function(cssFile){
            cssCode += css.getCss(cssFile);
        });
    };

    //Step9 保存APP
    var saveApp = function(){
        saveFile("index.html", indexCode);
        saveFile("app.js", jsCode);
        saveFile("app.css", cssCode);
    };

    //保存文件
    var saveFile = function(file, code){
        fs.writeFileSync(`${global.config.output}/${file}`, code);
    };

    //Step10 压缩文件
    var compressApp = function(){
        var appJs = `${cfg.output}/app.js`;
        console.log(`uglifyjs ${appJs} -o ${appJs}`);
        try{
            cp.exec(`uglifyjs '${appJs}' -m -o '${appJs}'`);
        }catch(e){
            console.log("please install uglify-js if you'll compress code!");
        }
    };

    //初始化
    exp.init = function(_cfg, args){
        var pkg = req(path.resolve("./package.json"));

        cfg = global.config = _cfg;
        cfg.jsList = {};
        cfg.viewList = {};
        cfg.uiList = {};
        cfg.cssList = [];
        cfg.re = new RegExp("^"+cfg.rootPath.replace(/\./g,"\\.").replace(/\//g,"\\/"));
        cfg.version = +pkg.version.replace(/\./g,"");
        cfg.index = cfg.index || "index.html";
        cfg.assetsPath = path.join(__dirname,"../assets");

        cfg.expects = (cfg.expects||[]).concat([
            "sys.ajax",
            "sys.animate",
            "sys.compatible",
            "sys.currency",
            "sys.drag",
            "sys.history",
            "sys.promise",
            //"sys.query_new",
            "sys.session",
            "sys.store",
            //"sys.grid",
            "sys.grid_bak",
            "sys.grid_ui",
            "sys.task"//,
            //"sys.template"
        ]);
        cfg.expects.forEach(function(item){
            expects[item] = true;
        });

        pic.init();
        getSysPathAndEntryFile();
        getShortcut();
        eachFolder(cfg.rootPath+"/");
        addPlugin();
        upIndex();
        upEntry();
        upJs();
        upCss();
        args.tip && console.log("\ncfg=", cfg, "\n\nshortImgs=", pic.shortImgs, "\n");

        var startTime = Date.now();
        fs2.rmdir(cfg.output);
        setTimeout(function(){
            fs.mkdirSync(cfg.output);
            pic.copyUseImg();
            saveApp();
            args.isCompress && compressApp();

            var endTime = Date.now();
            var time = endTime - startTime;
            console.log("merge complete, use time "+time+"ms");

        },100);
    };

})(require, exports);