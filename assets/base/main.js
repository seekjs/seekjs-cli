seekjs.config({
    ns:{
        ex: seekjs.resolve("./ex/")
    },
    alias:{
        service: seekjs.resolve("./ex/service")
    }
});

define(function(req,exp,mod){
	"use strict";
	var app = req("sys.app");
	var config = req("root.config");
	
	config.ajaxSetup();
	app.viewEx = req("ex.viewEx");
	
	app.setPath({
		js: mod.resolve("./js/"),
		tp: mod.resolve("./templates/"),
		st: mod.resolve("./css/")
	});

	app.usePlugin("sys.ui.dialog");
	app.usePlugin("sys.ui.mask");

	app.init("home");

});
