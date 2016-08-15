var fs = require("fs");

//get expect map list
var getExpectMaps = function(expectList){

};

//get include map list
var getIncludeMaps = function(includeList){

};



//loop all paths
var loopPathList = function(prefix, pathList){
    pathList.forEach(function(item){
        loopPathItem({
            prefix: prefix,
            items: item.split("/")
        });
    });
};

//loop one path
var loopPathItem = function(ops){
    var name = item.shift();
    if(name){
        if(name=="-") {
            loopDir(prefix);
        }else if(name=="*"){
            loopFile(prefix);
        }else{
            prefix += "/"+ name;
            loopPathItem(prefix, item);
        }
    }
};

//loop directory
var loopDir = function(dir, item){
    var dirList = fs.readDirectory(dir);
    dirList.forEach(function(subDir){
        loopPathItem(dir+"/"+subDir, item);
    });
};

//loop file
var loopFile = function(dir){
    var fileList = fs.readDirectory(dir);
    fileList.forEach(function(file){
        var view = {
            mid: item.ns ? item.ns+"."+file : item.path+"...",
            path: dir + "/" + file
        };
        exports.viewList.push(view);
    });
};


//initialize
var init = function(cfg){
    cfg.pathList = [
        {name:"js/*", ns:"js"},
        {name: "ad/-/js/*", path:"ad/"},
        {name:"pop/-/js/*", path:"pop/"}
    ];
    var expects = getExpectMaps(cfg.expects);
    var includes = getIncludeMaps(cfg.includes);
    exports.viewList = [];
    loopPathList(cfg.pathList);
};