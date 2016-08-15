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
    var includes = {};
    var reExpects;
    var reIncludes;

    //Step1 - 获取系统路径和入口文件
    var getSysPathAndEntryFile = function() {
        var indexFile = `${cfg.rootPath}/${cfg.index}`;
        indexCode = fs.readFileSync(indexFile).toString();
        //替换JS地址
        indexCode = indexCode.replace(/\s*src\s*=\s*\"(.*?)seek\.js\"\s*/i, function(_, sysPath){
            if(!cfg.sysPath) {
                cfg.sysPath = sysPath && cfg.rootPath + "/" + sysPath.replace(/\/$/, "") || "";
            }
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
        entryCode = entryCode.replace(/^[\s\S]*?define\s*\(/, "define(");
        //console.log(entryCode);

        global.seekjs = {
            config: function(config){
                cfg.shortcut = {};
                cfg.shortPaths = [];
                for(var nk in config.ns){
                    cfg.shortcut[config.ns[nk]] = nk;
                }
                for(var ak in config.alias){
                    cfg.shortcut[config.alias[ak]] = ak;
                }
                for(var pk in config.paths){
                    cfg.shortPaths.push(pk);
                }
                //console.log("shortcut=",cfg.shortcut, "\n\n");
            },
            resolve: function(jsPath){
                return jsPath.replace(/^\W+/,"").replace(/\W+$/,"").replace(/\//g,".");
            }
        };
        global.define = function(){};

        var entryFile = path.resolve(cfg.entry.path);
        require(entryFile);
    };

    //Step3 遍历文件夹
    var eachFolder = function(currentPath, isFilterJs){
        var data = fs.readdirSync(currentPath);
        data.forEach(function (item) {
            var fullPath = currentPath + item;
            var stats = fs.statSync(fullPath);
            if (stats.isDirectory()) {
                if(/seekjs/i.test(currentPath)==false || item=="core"){
                    //新增一层判断
                    var cpath = fullPath.replace(cfg.rootPath+"/", "")+"/";

                    if(reExpects.test(cpath)==false || reIncludes.test(cpath)==true) {
                        eachFolder(fullPath + "/", isFilterJs);
                    }
                }
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
                    var mid;
                    var rootPath = cfg.rootPath+"/";
                    var tmpPath = currentPath.replace(rootPath, "");
                    var tmpKey = tmpPath.split("/")[0];
                    if(tmpKey && cfg.shortPaths.includes(tmpKey)) {
                        mid = tmpPath.replace(/\/$/,"") + "/" + fileName;
                        //console.log(tmpKey, mid);
                    }else{
                        if (currentPath == rootPath) {
                            ns = "root";
                        } else if (currentPath == cfg.sysPath + "/core/") {
                            ns = "sys";
                        } else {
                            ns = currentPath.replace(cfg.rootPath, "").replace(/^\W+/, "").replace(/\W+$/, "").replace(/\//g, ".");
                        }
                        mid = ns + "." + fileName;
                        if (cfg.shortcut[mid]) {
                            mid = cfg.shortcut[mid];
                        } else {
                            ns = cfg.shortcut[ns] || ns;
                            mid = ns + "." + fileName;
                        }
                    }
                    var isExpects = cfg.expects[ns+".*"] || cfg.expects[mid];
                    var isIncludes = cfg.includes[ns+".*"] || cfg.includes[mid];
                    if (!isExpects || isIncludes) {
                        if (ns == "js" || /(.+?)\/js\//.test(currentPath)) { //此处先写死
                            var viewPath = ns=="js" ? global.config.rootPath : RegExp.$1;
                            cfg.viewList[mid] = [viewPath, fileName];
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
            { name: "sys.lib.zepto"},
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
                //console.log(plugin.name);
                var mid = cfg.shortcut[plugin.name] || plugin.name;
                cfg.jsList[mid] = `${cfg.sysPath}/${uri}.js`;
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
        //console.log(`${cfg.assetsPath}/define.js`);
        jsCode += js.getJs("", `${cfg.assetsPath}/define.js`);
        jsCode += js.getJs("sys.template", `${cfg.assetsPath}/template.js`);
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
            var [viewPath, viewName] = cfg.viewList[viewItem];
            jsCode += view.getCode(viewItem, viewPath, viewName).js;
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
        var fav = `${global.config.rootPath}/favicon.ico`;
        fs.existsSync(fav) && cp.execSync(`cp ${fav} ${global.config.output}/favicon.ico`);
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

    var getRe = function(arr){
        var re = [];
        (arr||[]).forEach(function(item){
            item = item.replace(/\./g,"\\.").replace(/\//g,"\\/").replace(/\*/g,".*");
            re.push(item);
        });
        re = new RegExp("^(" + (re.join("|")||".*") + ")", "i");
        //console.log(re);
        return re;
    };

    //初始化
    exp.init = function(_cfg, args){
        var pkg = req(path.resolve("./package.json"));

        cfg = global.config = _cfg;
              global.args = args;
        cfg.jsList = {};
        cfg.viewList = {};
        cfg.uiList = {};
        cfg.cssList = [];
        cfg.shortcut = {};
        cfg.re = new RegExp("^"+cfg.rootPath.replace(/\./g,"\\.").replace(/\//g,"\\/"));
        cfg.version = +pkg.version.replace(/\./g,"");
        cfg.index = cfg.index || "index.html";
        cfg.assetsPath = path.join(__dirname,"../assets");

        cfg.expects = (cfg.expects||[]).concat([
            "sys.template"
        ]);
        cfg.expects.forEach(function(item){
            expects[item] = true;
        });

        cfg.includes = cfg.includes || [];
        if(typeof cfg.includes=="function"){
            cfg.includes = cfg.includes({
                getCode: function(file){
                    return fs.readFileSync(file).toString().trim();
                }
            });
        }
        cfg.includes.forEach(function(item){
            includes[item] = true;
        });

        reExpects = getRe(cfg.expects);
        reIncludes = getRe(cfg.includes);

        pic.init();
        getSysPathAndEntryFile();
        getShortcut();
        eachFolder(cfg.rootPath+"/");
        addPlugin();
        upIndex();
        upEntry();
        upJs();
        upCss();
        //args.tip && console.log("\ncfg=", cfg, "\n\nshortImgs=", pic.shortImgs, "\n");
        if(args.tip){
            args.jsList && console.log("\njsList=", cfg.jsList);
            args.viewList && console.log("\nviewList=", cfg.viewList);
            args.uiList && console.log("\nuiList=", cfg.uiList);
            args.cssList && console.log("\ncssList=", cfg.cssList);
            args.shortImgs && console.log("\nshortImgs=", pic.shortImgs);
        }
        var startTime = Date.now();
        fs2.rmdir(cfg.output);
        setTimeout(function(){
            fs.mkdirSync(cfg.output);
            pic.copyUseImg();
            saveApp();
            !args.noCompress && compressApp();

            var endTime = Date.now();
            var time = endTime - startTime;
            console.log("merge complete, use time "+time+"ms");

        },100);
    };

})(require, exports);