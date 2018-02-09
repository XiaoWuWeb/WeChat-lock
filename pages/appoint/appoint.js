var http = require('../../utils/http.js');
var app = getApp();
Page({
  data: {
    carNum: '',
    address: '',
    plate:'编辑',
    timeInput: 0,
    money: '5.00',
    moneyAll:'5.00',
    token:'',
    timeLong: ''
  },
  onShareAppMessage: function () {
    return {
      title: '易位智能停车',
      path: '/pages/lockMap/lockMap',
    }
  },
  onLoad: function (){
    wx.showShareMenu({
      withShareTicket: true
    });
    var that = this;
    wx.getStorage({
      key: 'lockCarId',
      success: function (res) {
        that.setData({
          carNum: res.data,
        });
        wx.request({
          url: http.reqUrl + '/lock/guaranteeFee',
          data: {
            parkNo: res.data,
          },
          method: 'POST',
          header: {
            'content-type': 'application/x-www-form-urlencoded'
          },
          success: function (res) {
            // console.log(res);
            var oResult = res.data.data.guaranteeFee / 100;
            that.setData({
              timeLong: res.data.data.saveTime,
              money: that.toDecimal(oResult),
              moneyAll: that.toDecimal(oResult),
            });
          }
        })
      },
    });
    wx.getStorage({
      key: 'parkingName',
      success: function (res) {
        that.setData({
          address: res.data,
        });
      },
    })

    wx.getStorage({
      key: 'plateNo',
      success: function (res) {

        that.setData({
          plate: res.data
        })
      }
    });
  },
  toDecimal: function (x) {
    var f = parseFloat(x);
    if (isNaN(f)) {
      return false;
    }
    var f = Math.round(x * 100) / 100;
    var s = f.toString();
    var rs = s.indexOf('.');
    if (rs < 0) {
      rs = s.length;
      s += '.';
    }
    while (s.length <= rs + 2) {
      s += '0';
    }
    return s;
  },
  plateInfo:function(){

    wx.navigateTo({
      url: '../plate/plate'
    });

  },

  payMoney: function(e){
    var that = this;
    if (that.data.plate == '编辑' ){
      wx.showModal({
        title: '提示',
        content: '请编辑车牌号',
        showCancel: false,
        success: function (res) {
          if (res.confirm) {
            // console.log('用户点击确定')
          }
        }
      });
      return
    }
    if (that.data.carNum.length < 1 && that.data.address.length < 1){
      wx.showModal({
        title: '提示',
        content: '操作失误，请重新进去小程序',
        showCancel: false,
        success: function (res) {
          if (res.confirm) {
            // console.log('用户点击确定')
          }
        }
      });
    }else{
      wx.showLoading({
        title: '请求支付中...'
      });
      wx.getStorage({
        key: 'token',
        success: function (res) {
          that.setData({
            token: res.data
          });
          wx.request({
            url: http.reqUrl + '/lock/appointment',
            data: {
              parkNo: that.data.carNum,
              carNo: that.data.plate,
              parkName: that.data.address
            },
            method: 'POST',
            header: {
              'content-type': 'application/x-www-form-urlencoded',
              'token': that.data.token
            },
            success: function (res) {
              // console.log(res);
              if(res.data.success){
                wx.hideLoading();
                wx.requestPayment({
                  'timeStamp': res.data.data.timeStamp + '',
                  'nonceStr': res.data.data.nonceStr + '',
                  'package': res.data.data.package + '',
                  'signType': res.data.data.signType + '',
                  'paySign': res.data.data.paySign + '',
                  'success': function (res) {
                    wx.setStorage({
                      key: 'appointTrue',
                      data: true,
                      complete: function () {
                        wx.setStorage({
                          key: 'lockCarId',
                          data: that.data.carNum,
                          success: function (res) {
                            wx.setStorage({
                              key: 'parkingName',
                              data: that.data.address,
                              success: function (res) {
                                wx.setStorage({
                                  key: 'appointTime',
                                  data: Date.parse(new Date()) + 1800000,
                                  complete: function () {
                                    wx.reLaunch({
                                      url: '../lockMap/lockMap'
                                    });
                                  }
                                });
                              }
                            });
                          },
                        });
                      }
                    });
                  },
                  'fail': function (res) {
                    // console.log(res);
                    var oMassage = res.errMsg;
                    wx.showModal({
                      title: '警告',
                      content: oMassage,
                      showCancel: false,
                      success: function (res) {
                        if (res.confirm) {
                          // console.log('用户点击确定')
                        }
                      }
                    });
                  }

                });
              }else{
                wx.showModal({
                  title: '警告',
                  content: res.data.message,
                  showCancel: false,
                  success: function (res) {
                    if (res.confirm) {
                      // console.log('用户点击确定')
                    }
                  }
                })
              }
              

            }
          })
        }
      })


    }
  }
  
})