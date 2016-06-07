define(function(req,exp,mod){
	"use strict";
	var service = req("service");
	
	exp.form = {
		dep: "BJP",
		dst: "WHN",
		depDate: "2016-02-05",
		passengerType: "ADULT",
		data: []
	};

	exp.stateMap = {
		BJP: "北京",
		WHN: "武汉"
	};

	exp.query = function(){
		service.getSurplusTicketCount(exp.form, function(rs){
			if(rs.success){
				exp.queryResult.render();
			}else{
				exp.alert(rs.message);
			}
		});
	};
});
