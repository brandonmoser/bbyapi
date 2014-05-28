var express = require('express');
var request = require('request');
var router = express.Router();

router.get('/', function(req, res) {
	if(!req.query.action){
		renderIndex(req, res, {
			marketplace: true,
			pageSize: 100
		});
	} else {
		var options = {}
		options.uri = "http://api.remix.bestbuy.com/v1/products";
		options.json = true;
		var results = {};
		var err = {};

		var searchFilter = [];
		var i = 0;
		if (req.query.keyword.length > 0){
			searchFilter[i] = 'search='+req.query.keyword; i++;
		}
		if (!isNaN(req.query.priceMin) && req.query.priceMin >= 0){
			searchFilter[i] = 'salePrice>='+req.query.priceMin; i++;
		}
		if (!isNaN(req.query.priceMax) && req.query.priceMax > 0){
			searchFilter[i] = 'salePrice<='+req.query.priceMax; i++;
		}
		if (req.query.marketplace == "on"){
			searchFilter[i] = 'marketplace=true'; i++;
		}
		if (req.query.newOnly == "on"){
			searchFilter[i] = 'new=true'; i++;
		}

		options.uri += '('+searchFilter.join("&")+')'

		// append format and API Key
		var qryObjs = {};
		qryObjs["format"] = "json";
		qryObjs["pageSize"] = req.query.pageSize;
		qryObjs["page"] = req.query.page != undefined ? req.query.page : 1;
		qryObjs["apiKey"] = req.app.get('APIKey');

		options.qs = qryObjs;

		console.log('making request... ' + JSON.stringify(options));
		request(options, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				// console.log('response body',body);
				renderIndex(req, res, {
					title: req.app.get('title') + ': Results',
					results: body
				});
			} else {
				if (!error){
					console.log('error is null');
					error = {};
					error.message = "An error occurred getting your request.";
				}
				console.log('error',error);
				renderIndex(req, res, {
					title: req.app.get('title') + ': Results',
					error: error
				});
			}
		});

		console.log('request complete');
	}
});

module.exports = router;

renderIndex = function(req, res, extendedData){
	var defaultTitle = { title: req.app.get('title') + ': Search' };
	var data = {};
	if(!("title" in extendedData)){
		data["title"] = defaultTitle["title"];
	}
	for (var attrname in extendedData) {
		data[attrname] = extendedData[attrname];
	}
	for (var q in req.query){
		data[q] = req.query[q];
	}
	data["currentURL"] = res.locals.url.replace(/(\&)?page\=[0-9](\&)?/g,"");

	console.log('data', data);
	res.render('index', data);
}

serialize = function(obj) {
	var str = [];
	for(var p in obj){
		if (obj.hasOwnProperty(p)) {
			str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
		}
	}
	return str.join("&");
}
