var QQMapWX = require('../../libs/qqmap-wx-jssdk.js');
var http = require('../../utils/http.js');
var app = getApp();
Page({
  data: {
    rentItem: [],
    activeIndex: 0,
    month: 1,
    token: '',
    // plateNo: '粤BBBBBB',
    lockCarId: '',
    nickName: '我',
    userID: ''
  },
  onShareAppMessage: function () {
    return {
      title: '易位智能停车',
      path: '/pages/lockMap/lockMap',
    }
  },
  onLoad: function(){
    wx.request({
      url: http.reqUrl + '/appmouth/query/money',
      data: {},
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: function (res) {
        // console.log(res.data.data[0].month)
        
        res.data.data.map(function (item) {
          item.month_fee = parseFloat(item.month_fee) / 100
          return item;
        });

        that.setData({
          rentItem: res.data.data,
          month: res.data.data[0].month
        });

      }
    })
    wx.showShareMenu({
      withShareTicket: true
    });
    var that = this;
    wx.getStorage({
      key: 'token',
      success: function(res) {
        that.setData({
          token: res.data
        });
      }
    });
    wx.getStorage({
      key: 'userID',
      success: function (res) {
        that.setData({
          userID: res.data
        });
      }
    })
    wx.getStorage({
      key: 'userInfo',
      success: function(res) {
        that.setData({
          nickName: res.data.nickName
        });
      }
    })
    wx.getStorage({
      key: 'lockCarId',
      success: function (res) {
        that.setData({
          lockCarId: res.data
        });
      }
    })
  },
  rentMoney: function(){

  },
  rentClick: function (e) {
    var that = this;
    console.log(e.currentTarget.dataset.data.month);
    console.log(e.currentTarget.id);
    that.setData({
      month: e.currentTarget.dataset.data.month,
      activeIndex: e.currentTarget.id
    });
    // if (e.currentTarget.id == 0){
    //   that.setData({
    //     month: 1,
    //     activeIndex: e.currentTarget.id
    //   });
    // } else if (e.currentTarget.id == 1) {
    //   that.setData({
    //     month: 2,
    //     activeIndex: e.currentTarget.id
    //   });
    // } else if (e.currentTarget.id == 2) {
    //   that.setData({
    //     month: 3,
    //     activeIndex: e.currentTarget.id
    //   });
    // } else if (e.currentTarget.id == 3) {
    //   that.setData({
    //     month: 6,
    //     activeIndex: e.currentTarget.id
    //   });
    // } else if (e.currentTarget.id == 4) {
    //   that.setData({
    //     month: 12,
    //     activeIndex: e.currentTarget.id
    //   });
    // } else if (e.currentTarget.id == 5) {
    //   that.setData({
    //     month: 24,
    //     activeIndex: e.currentTarget.id
    //   });
    // }
  },
  rentPay: function(){
    var that = this;
    wx.request({
      url: http.reqUrl + '/appmouth/query/mobile',
      data: {
        userId: that.data.userID
      },
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: function (res) {
        // console.log(res.data.success)
        if (res.data.success){
          wx.request({
            url: http.reqUrl + '/lock/rent',
            data: {
              parkNo: that.data.lockCarId,
              month: that.data.month,
              // carNo: that.data.plateNo
              nickName: that.data.nickName
            },
            method: 'POST',
            header: {
              'content-type': 'application/x-www-form-urlencoded',
              'token': that.data.token
            },
            success: function (res) {
              // console.log(res);
              wx.requestPayment({
                'timeStamp': res.data.data.timeStamp + '',
                'nonceStr': res.data.data.nonceStr + '',
                'package': res.data.data.package + '',
                'signType': res.data.data.signType + '',
                'paySign': res.data.data.paySign + '',
                'success': function (res) {
                  // console.log(res);
                  wx.showModal({
                    title: '提示',
                    content: '购买成功，请在个人中心我的车位查看',
                    showCancel: false,
                    success: function (res) {
                      if (res.confirm) {
                        wx.reLaunch({
                          url: '../lockMap/lockMap'
                        })
                      }
                    }
                  });
                },
                'fail': function (res) {
                  // console.log(res);
                  var oMassage = res;
                  wx.showModal({
                    title: '提示',
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
            }
          })
        }else{
          wx.showModal({
            title: '提示',
            content: '您还未绑定手机号码，请前往绑定并重新操作！',
            success: function (res) {
              if (res.confirm) {
                wx.reLaunch({
                  url: '../bindphoneSpace/bindphoneSpace'
                });
              }
            }
          })
        }
      }
    })
    
  }
});