var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var async = require('async');

// 目标网址
// var url = 'http://www.ivsky.com/tupian/ziranfengguang'; // 自然风光
var url = 'http://www.ivsky.com/tupian/shiliang_t5272/';    // 设计素材 矢量图片
var url = 'http://www.ivsky.com/tupian/wupin/'; // 物品物件
// 本地存储路径
// var dir = './spider_images';
var dir = './spider_wupin_images';

var setting = require('./setting');

var timeout = 100;

// 下载量开关
var timer = null;

// 封装了一层函数
function fetchre (url) {
    requestall(url)
}

// 发送请求
function requestall (url) {
    console.log('request url:', url);
    request({
        uri: url,
        headers: setting.header
    }, function (error, response, body) {
        if(error) {
            console.log('requestall error:', error);
        } else {
            console.log('requestall response statusCode:', response.statusCode);
            if(!error && response.statusCode == 200) {
                var $ = cheerio.load(body);
                var photos = [];
                $('img').each(function () {
                    // 判断地址是否存在
                    if($(this).attr('src')) {
                        var src = $(this).attr('src');
                        console.log('src:', src)
                        var end = src.substr(-4, 4).toLocaleLowerCase();
                        if(end == '.jpg' || end == '.gif' || end == '.png' || end == '.jpeg') {
                            if(IsURL(src)) {
                                photos.push(src);
                            }
                        }
                    }
                });
                downloadImg(photos, dir, setting.download_v);
                // 递归爬虫
                $('a').each(function () {
                    var murl = $(this).attr('href');
                    if(IsURL(murl)) {
                        // console.log('isUrl false timer:', timer);
                        timer = setTimeout(function () {
                            if(timeout > 2000000) {
                                return;
                            } else {
                                fetchre(murl);
                            }
                        }, timeout);
                        timeout += setting.ajax_timeout;
                        console.log('isUrl true timeout:', timeout, timeout >= 2000000);
                        if(timeout >= 20000000) {
                            clearTimeout(timer);
                            timer = null;
                        }
                    } else {
                        // console.log('isUrl false timer:', timer);
                        timer = setTimeout(function() {
                            if(timeout > 2000000) {
                                return;
                            } else {
                                fetchre('http://www.ivsky.com/' + murl); 
                            }
                        }, timeout);
                        timeout += setting.ajax_timeout;
                        console.log('isUrl false timeout:', timeout, timeout >= 2000000);
                        if(timeout >= 20000000) {
                            clearTimeout(timer);
                            timer = null;
                        }
                    }
                })
            }
        }
    });
}

function downloadImg (photos, dir, asyncNum) {
    console.log('即将异步并发下载图片, 当前并发数量为:', asyncNum);
    async.mapLimit(photos, asyncNum, function (photo, callback) {
        var filename = (new Date().getTime()) + photo.substr(-4, 4);
        if(filename) {
            console.log('正在下载:', photo);
            // default
            // fs.createWriteStream(dir + '/' + filename);
            // 防止pipe错误
            request(photo)
                .on('error', function (err) {
                    console.log('downloadImg request err:', err)
                })
                .pipe(fs.createWriteStream(dir + '/' + filename));
                console.log('下载完成!');
                callback(null, filename);
        }
    }, function (err, result) {
        if(err) {
            console.log('downloadImg err:', err)
        } else {
            console.log('all right!');
            // console.log('downloadImg result:', result);
        }
    })
}

// 校验地址
function IsURL (str_url) {
    var strRegex = '^(https|http|ftp|rtsp|mms)?://';
    var re = new RegExp(strRegex);
    if(re.test(str_url)) {
        return (true);
    } else {
        return (false);
    }
}

requestall(url)