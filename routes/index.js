var express = require('express');
var request = require('request');
var router = express.Router();

router.get('/', function(req, res) {
	renderIndex(req, res, {});
});

router.post('/', function(req, res) {
	var options = {}
	options.uri = "http://api.remix.bestbuy.com/v1/products";
	options.json = true;
	var results = {};
	var err = {};

	var searchFilter = [];
	var i = 0;
	req.session.search.keyword = req.body.keyword || '';
	if (req.body.keyword.length > 0){
		searchFilter[i] = 'search='+req.body.keyword; i++;
	}
	req.session.search.priceMin = req.body.priceMin || '';
	if (!isNaN(req.body.priceMin) && req.body.priceMin >= 0){
		searchFilter[i] = 'salePrice>='+req.body.priceMin; i++;
	}
	req.session.search.priceMax = req.body.priceMax || '';
	if (!isNaN(req.body.priceMax) && req.body.priceMax > 0){
		searchFilter[i] = 'salePrice<='+req.body.priceMax; i++;
	}
	req.session.search.marketplace = (req.body.marketplace ? true : false);
	console.log('===mp', req.session.search.marketplace);
	if (req.body.marketplace == "on"){
		searchFilter[i] = 'marketplace=true'; i++;
	}
	req.session.search.newOnly = req.body.newOnly || false;
	if (req.body.newOnly == "on"){
		searchFilter[i] = 'new=true'; i++;
	}

	options.uri += '('+searchFilter.join("&")+')'

	// append format and API Key
	req.session.search.format = 'json';
	req.session.search.pageSize = req.body.pageSize;
	req.session.search.page = req.body.page;

	var qryObjs = {};
	qryObjs["format"] = "json";
	qryObjs["pageSize"] = req.body.pageSize;
	qryObjs["page"] = req.query.page != undefined ? req.query.page : 1;
	qryObjs["apiKey"] = req.app.get('APIKey');

	options.qs = qryObjs;

	console.log('making request... ' + options);
	request(options, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log('response body',body);
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

	if(!req.session.search){
		req.session.search = {};
		console.log('session', req.session);
	}
	data["keyword"] = req.session.search.keyword || '';
	data["priceMin"] = req.session.search.priceMin || '';
	data["priceMax"] = req.session.search.priceMax || '';
	data["marketplace"] = (req.session.search.marketplace ? true : false);
	data["newOnly"] = (req.session.search.newOnly ? true : false);
	data["pageSize"] = req.session.search.pageSize || 100;
	console.log('data', data);
	res.render('index', data);
}

serialize = function(obj) {
  var str = [];
  for(var p in obj)
    if (obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    }
  return str.join("&");
}
