#!/usr/bin/env node

var fs = require("fs");
var cp = require("child_process");
var pk = require("../package.json");

var args = process.argv.slice(2);
var cmd = args.shift().toLowerCase();
var skPath = cp.execSync("echo `npm root -g`/seekjs").toString().trim();
var viewName;

//初始化
if(cmd=="init") {
    var iniType = args.shift() || "base";
    if(iniType=="base") {
        cp.execSync(`cp -r '${skPath}/assets/base/' './'`);
        cp.execSync(`cp -r '${skPath}/src' './seekjs'`);
    }
    console.log("good, project create success!");

//更新
}else if(cmd=="update") {
    var isGlobal = args.shift() == "-g";

    //更新seekjs模块
    if (isGlobal) {
        console.log("now is updating, please wait a moment...");
        cp.exec("sudo npm update -g seekjs", function callback(error, stdout, stderr) {
            console.log(stdout);
        });

    //更新seekjs框架
    } else {
        cp.execSync(`rm -rf './seekjs'`);
        cp.execSync(`cp -r '${skPath}/src' './seekjs'`);
        console.log("seekjs framework was updated to latest!");
    }

//增加view
}else if(cmd=="addview"){
    viewName = args.shift();
    var by = args.shift();
    if(by=="by"){
        var refView = args.shift();
        cp.execSync(`cp './js/${refView}.js' './js/${viewName}.js'`);
        cp.execSync(`cp './css/${refView}.css' './css/${viewName}.css'`);
        cp.execSync(`cp './templates/${refView}.html' './templates/${viewName}.html'`);
    }else{
        cp.execSync(`touch './js/${viewName}.js'`);
        cp.execSync(`touch './css/${viewName}.css'`);
        cp.execSync(`touch './templates/${viewName}.html'`);
    }
    console.log(`add view ${viewName} success!`);

//view改名
}else if(cmd=="renameview"){
    viewName = args.shift();
    var to = args.shift();
    if(to) {
        var newName = args.shift();
        cp.execSync(`mv './js/${viewName}.js' './js/${newName}.js'`);
        cp.execSync(`mv './css/${viewName}.css' './css/${newName}.css'`);
        cp.execSync(`mv './templates/${viewName}.html' './templates/${newName}.html'`);

        console.log("rename view ${viewName} to ${newName} success!");
    }else{
        console.log("please set a new view name");
    }

//删除view
}else if(cmd=="delview"){
    viewName = args.shift();
    cp.execSync(`rm './js/${viewName}.js'`);
    cp.execSync(`rm './css/${viewName}.css'`);
    cp.execSync(`rm './templates/${viewName}.html'`);
    console.log(`delete view ${viewName} success!`);

//查看seekjs版本
}else if(cmd=="-v"){
    console.log(pk.version);

}else{
    var message = `welcome to use seekjs,\n seekjs current version is ${pk.version}!`;
    console.log(message);
}
