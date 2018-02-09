// var rootDocment = 'http://192.168.0.114:8080/MoPark';
// var rootDocment = 'http://192.168.0.113:8080/MoPark';
var rootDocment = 'https://www.lcgxlm.com/MoPark';

function req(url, data, cb) {
  wx.request({
    url: rootDocment + url,
    data: data,
    // method: 'POST',
    header: { 'content-type': 'application/json'},
    success: function (res) {
      return typeof cb == "function" && cb(res.data)
    },
    fail: function () {
      return typeof cb == "function" && cb(false)
    }
  })
}


module.exports = {
  req: req,
  reqUrl: rootDocment
}
