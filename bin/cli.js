#!/usr/bin/env node

(function(req, exp) {
    var fs = require("fs");
    var path = require("path");
    var cp = require("child_process");
    var pk = require("../package.json");
    var isLinuxLike = require("os").type() != "window";
    var prefix = isLinuxLike ? "sudo " : "";

    //初始化
    exp.init = function(){
        var type = args.type || "base";
        var project = args.project || "hello-seek";
        cp.execSync(`cp -r '${skPath}/assets/${type}' './${project}'`);
        //cp.execSync(`npm install seekjs --save`);
        console.log("good, project create success!");
        args.open && cp.execSync(`open ${project}/index.html`);
    };

    //更新
    exp.update = function(){
        console.log("now is updating, please wait a moment...");
        cp.exec(`${prefix}npm update -g seek-cli`, function callback(error, stdout, stderr) {
            console.log(stdout);
        });
    };

    //重新安装
    exp.install = function(){
        console.log("now is reinstalling, please wait a moment...");
        cp.exec(`${prefix}npm install -g seek-cli`, function callback(error, stdout, stderr) {
            console.log(stdout);
        });
    };

    //增加view
    exp.addview = function(){
        viewName = args.shift();
        var by = args.shift();
        if (by == "by") {
            var refView = args.shift();
            cp.execSync(`cp './js/${refView}.js' './js/${viewName}.js'`);
            cp.execSync(`cp './css/${refView}.css' './css/${viewName}.css'`);
            cp.execSync(`cp './templates/${refView}.html' './templates/${viewName}.html'`);
        } else {
            cp.execSync(`touch './js/${viewName}.js'`);
            cp.execSync(`touch './css/${viewName}.css'`);
            cp.execSync(`touch './templates/${viewName}.html'`);
        }
        console.log(`add view ${viewName} success!`);
    };

    //view改名
    exp.renameview = function(){
        viewName = args.shift();
        var to = args.shift();
        if (to) {
            var newName = args.shift();
            cp.execSync(`mv './js/${viewName}.js' './js/${newName}.js'`);
            cp.execSync(`mv './css/${viewName}.css' './css/${newName}.css'`);
            cp.execSync(`mv './templates/${viewName}.html' './templates/${newName}.html'`);

            console.log("rename view ${viewName} to ${newName} success!");
        } else {
            console.log("please set a new view name");
        }
    };

    //删除view
    exp.delview = function(){
        viewName = args.shift();
        cp.execSync(`rm './js/${viewName}.js'`);
        cp.execSync(`rm './css/${viewName}.css'`);
        cp.execSync(`rm './templates/${viewName}.html'`);
        console.log(`delete view ${viewName} success!`);
    };

    //查看seekjs版本
    exp["-v"] = function() {
        console.log(pk.version);
    };


    var argv = process.argv.slice(2);
    var cmd = argv.shift();
    if(cmd){
        cmd = cmd.toLowerCase();
        var skPath = path.join(__dirname, "../");
        console.log("skPath=", skPath);
        var viewName;

        var args = {};
        argv.forEach(function (kv) {
            kv = kv.split("=");
            var k = kv[0];
            var v = kv[1];
            if (kv.length == 2) {
                args[k] = v;
            } else {
                args[k] = true;
            }
        });

        if(exp[cmd]){
            exp[cmd]();
        } else {
            console.log(`sorry, no such command '${cmd}'!`);
        }
    } else {
        console.log(`welcome to use seekjs,\n seekjs current version is ${pk.version}!`);
    }

})(require, exports);