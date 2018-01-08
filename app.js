//参考 http://cnis.7east.com/
var cityCache = null;

var http = require('http');
var url = require('url');
var querystring = require('querystring');
var fs = require('fs');


strUrl = 'http://cnis.7east.com/widget.do?type=service&ajax=yes';

getDataByAjax(strUrl + '&action=cnislist', function (data) {
  cityCache = data;
  for (var i = 0; i < cityCache.length; i++) {
    setTimeout(function (i) {
      getDataByAjax(strUrl + '&action=cnischildlist&pid=' + cityCache[i].region_id, function (data) {
        cityCache[i].sub = data;
        for (var j = 0; j < cityCache[i].sub.length; j++) {
        	setTimeout(function(i, j){
        		getDataByAjax(strUrl + '&action=cnischildlist&pid=' + cityCache[i].sub[j].region_id, function(data){
        			cityCache[i].sub[j].sub = data;
        			w_save(cityCache)
        		})
        	}, 0, i, j)
        }
      });
    }, 0, i)
  }
})



// 记录setTimeout的标记
var timer = 0;
/**
 * 通过setTimeout与clearTimeout配合达到一次保存
 * 问题在于当某一次ajax时间过长，会导致多次保存
 * 
 * @param {any} cityCache 
 */
function w_save(cityCache) {
  clearTimeout(timer);
  timer = setTimeout(function () {
    f_save(cityCache)
  }, 1000 * 5);
  console.log('ready save');
}

/**
 * 保存数据到文件
 * 
 * @param {any} data 
 */
function f_save(data) {
  data = JSON.stringify(data, null, "\t");
  var file_name = './dist/city.json'
  fs.unlink(file_name, function () {
    fs.writeFile(file_name, data, function (err) {
      if (err) throw err;
      console.log("File Saved !"); //文件被保存
    });
  });
}
/**
 * 发送ajax
 * 
 * @param {any} strUrl 
 * @param {any} next 
 */
function getDataByAjax(strUrl, next) {
  var parse = url.parse(strUrl);
  var options = {
    'method': 'GET',
    'host': parse.hostname,
    'path': parse.path,
    'port': parse.port,
  };
  var req = http.request(options, function (res) {
    res.setEncoding('utf-8');
    var resData = [];
    res.on('data', function (chunk) {
      resData.push(chunk);
    }).on('end', function () {
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
      next(filterData)
    });
  });
  req.end();
}