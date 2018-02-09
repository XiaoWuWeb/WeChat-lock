var http = require('../../utils/http.js');
var app = getApp();
Page({
  data: {
    timeInput: '',
    nameInput: '',
    cheweiId: '',
    shared_userId: '',
    buyTime: '',
    expiredTime: '',
    parkingName: ''
  },
  onShareAppMessage: function () {
    return {
      title: '易位智能停车',
      path: '/pages/lockMap/lockMap',
    }
  },
  onLoad: function () {
    var that = this;
    wx.showShareMenu({
      withShareTicket: true
    });
    wx.getStorage({
      key: 'userID',
      success: function(res) {
        var oData = {
          userId: res.data
        }
        that.setData({
          shared_userId: res.data
        })
        app.func.req('/appmouth/query/user', oData, function (res) {
          // console.log(res);
          that.setData({
            buyTime: res[0].buyTime,
            cheweiId: res[0].cheweiId,
            expiredTime: res[0].expiredTime,
            parkingName: res[0].parking_name
          })
        })
      }
    })
  },

  timeInput: function (e) {
    var timeInput = e.detail.value;
    this.setData({
      timeInput: timeInput
    })
  },
  nameInput: function (e) {
    var nameInput = e.detail.value;
    this.setData({
      nameInput: nameInput
    })
  },

  payMoney: function (e) {
    var that = this;
    if (that.data.timeInput.length < 11){
      wx.showModal({
        title: '提示',
        content: '请输入手机号码',
        showCancel: false,
        success: function (res) {
          if (res.confirm) {
            // console.log('用户点击确定')
          }
        }
      });
    } else if (that.data.nameInput.length < 1){
      wx.showModal({
        title: '提示',
        content: '请输入成员昵称',
        showCancel: false,
        success: function (res) {
          if (res.confirm) {
            // console.log('用户点击确定')
          }
        }
      });
    }else{
      var oData = {
        usePhone: that.data.timeInput,
        parkNo: that.data.cheweiId,
        shared_userId: that.data.shared_userId,
        buyTime: that.data.buyTime,
        nickname: that.data.nameInput,
        expiredTime: that.data.expiredTime
      }
      wx.request({
        url: http.reqUrl + '/appmouth/add/user ',
        data: JSON.stringify(oData),
        method: 'POST',
        header: {
          'content-type': 'application/json'
        },
        success: function (res) {
          // console.log(res);
          if (res.data.success) {
            wx.navigateBack({
              delta: 1
            })
          } else {
            wx.showModal({
              title: '提示',
              content: '操作失误，请重新尝试',
              showCancel: false,
              success: function (res) {
                if (res.confirm) {
                  // console.log('用户点击确定')
                }
              }
            });
          }
        }
      });
    }
    
  }

})