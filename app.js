//参考 http://cnis.7east.com/
var cityCache = null;

var http = require('http');
var url = require('url');
var querystring = require('querystring');
var fs = require('fs');

var timer = 0;
strUrl = 'http://cnis.7east.com/widget.do?type=service&ajax=yes';
getDataAjax(strUrl + '&action=cnislist', function(data){
	cityCache = data;
	for (var i = 0; i < cityCache.length; i++) {
		setTimeout(function(i){
			getDataAjax(strUrl + '&action=cnischildlist&pid=' + cityCache[i].region_id, function(data){
				cityCache[i].sub = data;
				for (var j = 0; j < cityCache[i].sub.length; j++) {
					setTimeout(function(i, j){
						getDataAjax(strUrl + '&action=cnischildlist&pid=' + cityCache[i].sub[j].region_id, function(data){
							cityCache[i].sub[j].sub = data;
							w_save()
						})
					}, 0, i, j)
				}
			});
		}, 0, i)
	}
})


function w_save(){
	clearTimeout(timer);
	timer = setTimeout(function(){
		save(cityCache)
	}, 1000 * 5);
	console.log('ready save');
}
// save();
function save(data, next, i){
	data = JSON.stringify(data)
	var file_name = 'city.js'
	fs.unlink(file_name, function() {
	    fs.writeFile(file_name, data, function(err) {
	        if (err) throw err;
	        console.log("File Saved !"); //文件被保存
	    });
});
}
function getDataAjax(strUrl, next, index){
	var parse = url.parse(strUrl);

	var options = {
	    'method': 'GET',
	    'host': parse.hostname,
	    'path': parse.path,
	    'port': parse.port,
	};
	var req = http.request(options, function(res) {
	    res.setEncoding('utf-8');
	    var resData = [];
	    res.on('data', function(chunk) {
	        resData.push(chunk);
	    }).on('end', function() {
	        var data = JSON.parse(resData.join(''));
	        var filterData = []
	        for (var i = 0; i < data.rows.length; i++) {
				// code: 140700
				// fullspell: "Jinzhong Shi"
				// layer: 2
				// local_name: "晋中市"
				// luoma: "Jinzhong Shi"
				// name: "晋中市"
				// region_id: 302
				// region_path: ",238,302,"
				// shuzi: "140700"
				// thinspell: "JZN"
				// zimu: "JZN"
				// state: 'closed'
				
				filterData[i] = {
					name: data.rows[i].name,
					region_id: data.rows[i].region_id
				}
	        }
	        next(filterData, index)
	    });
	});
	req.end();
}