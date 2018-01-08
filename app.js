//参考 http://cnis.7east.com/

var http = require('http');
var url = require('url');
var querystring = require('querystring');
var fs = require('fs');


strUrl = 'http://cnis.7east.com/widget.do?type=service&ajax=yes';


getDataByAjax(strUrl + '&action=cnislist', function (data) {
  let cityCache = data;
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
 * 通过setInterval与clearInterval配合达到一次保存
 * 问题在于当某一次ajax时间过长，会导致多次保存
 * 
 * @param {any} cityCache 
 */
function w_save(cityCache) {
  clearTimeout(timer);
  clearInterval(timer);
  let timeout = 5;
  timer = setInterval(function () {
    if(timeout <= 0){
      f_save(cityCache)
      clearTimeout(timer);
      clearInterval(timer);
    }else{
      console.log('save file count down: ' + timeout);
    }
    timeout--;
  }, 1000);
  console.log('ready save');
}

/**
 * 保存数据到文件
 * 
 * @param {any} data 
 */
function f_save(data) {
  let dataJson = JSON.stringify(data, null, "\t");
  let file_name = './dist/city.json';
  fs.unlink(file_name, function () {
    fs.writeFile(file_name, dataJson, function (err) {
      if (err) throw err;
      console.log("File Saved !"); //文件被保存
    });
  });

  let mindata = dataFilter(data)
  let mindataJson = JSON.stringify(mindata, null, "\t");
  let mi_file_name = './dist/city.min.json';
  fs.unlink(mi_file_name, function () {
    fs.writeFile(mi_file_name, mindataJson, function (err) {
      if (err) throw err;
      console.log("min File Saved !"); //文件被保存
    });
  });
}
/**
 * 城市数据过滤器
 * 只保存城市部分数据
 * 
 * @param {any} Olddata 
 * @returns 
 */
function dataFilter(Olddata){
  if(!Olddata){
    return [];
  }
  let Newdata = [];
  for(let i = 0, len = Olddata.length; i < len; i++){
    let item = Olddata[i];
    Newdata[i] = {

      // code: item.code,
      // fullspell: item.fullspell,
      // layer: item.layer,
      // local_name: item.local_name,
      // luoma: item.luoma,
      // name: item.name,
      // region_id: item.region_id,
      // region_path: item.region_path,
      // shuzi: item.shuzi,
      // thinspell: item.thinspell,
      // zimu: item.zimu,
      // state: item.state,

      sub: dataFilter(item.sub),
      name: item.name,
      region_id: item.region_id

    }
  }
  return Newdata;
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
      next(data.rows)
    });
  });
  req.end();
}