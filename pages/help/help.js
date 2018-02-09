var app = getApp();
Page({
  data: {
    imgParking: true, //无数据图片，默认false，隐藏  
  },
  onShareAppMessage: function () {
    return {
      title: '易位智能停车',
      path: '/pages/lockMap/lockMap',
    }
  },
  onLoad: function () {
    wx.showShareMenu({
      withShareTicket: true
    });
  }
})