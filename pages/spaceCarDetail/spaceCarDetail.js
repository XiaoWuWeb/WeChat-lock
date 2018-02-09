var QQMapWX = require('../../libs/qqmap-wx-jssdk.js');
var http = require('../../utils/http.js');
var app = getApp();
// Page({
//   data: {
//     rentItem: ["帅哥", "美女", "胖妞", "神仙", "魔鬼", "吴敏明"],
//     activeIndex: 0,
//   }
// });

// var initdata = function (that) {
//   var list = that.data.list
//   for (var i = 0; i < list.length; i++) {
//     list[i].txtStyle = ""
//   }
//   that.setData({ list: list })
// }

Page({
  data: {
    delBtnWidth: 180,//删除按钮宽度单位（rpx）
    list: [],
    userID: '',
    addBox: true,
    lockDownImg: '../../img/lock-down@2x.png',
    lockDownInfo: '车位锁下降',
    downNav: true,
    lockUpImg: '../../img/lock-Up@2x.png',
    lockUpInfo: '车位锁上升',
    upNav: false,
  },
  onShareAppMessage: function () {
    return {
      title: '易位智能停车',
      path: '/pages/lockMap/lockMap',
    }
  },
  onLoad: function (options) {
    wx.showShareMenu({
      withShareTicket: true
    });
    // 页面初始化 options为页面跳转所带来的参数  
    this.initEleWidth();
    var that = this;
    wx.getStorage({
      key: 'userID',
      success: function (res) {
        that.setData({
          userID: res.data
        })
      }
    })
    
  },
  onShow: function () {
    // 页面显示  
    var that = this;
    var oData = {};
    wx.getStorage({
      key: 'userID',
      success: function(res) {
        oData.userId = res.data;
        wx.getStorage({
          key: 'parkNo',
          success: function(res) {
            oData.parkNo = res.data;
            app.func.req('/appmouth/query/userInfo', oData, function (res) {
              // console.log(res);
              if (that.data.userID == res[0].shared_userId){
                that.setData({
                  addBox: true,
                  list: res
                });
              }else{
                that.setData({
                  addBox: false
                });
              }
              // console.log(that.data.addBox)
            })
          }
        })
      }
    })
    
  },
  touchS: function (e) {
    if (e.touches.length == 1) {
      this.setData({
        //设置触摸起始点水平方向位置  
        startX: e.touches[0].clientX
      });
    }
  },
  touchM: function (e) {
    var that = this
    // initdata(that)
    if (e.touches.length == 1) {
      //手指移动时水平方向位置  
      var moveX = e.touches[0].clientX;
      //手指起始点位置与移动期间的差值  
      var disX = this.data.startX - moveX;
      var delBtnWidth = this.data.delBtnWidth;
      var txtStyle = "";
      if (disX == 0 || disX < 0) {//如果移动距离小于等于0，文本层位置不变  
        txtStyle = "left:0px";
      } else if (disX > 0) {//移动距离大于0，文本层left值等于手指移动距离  
        txtStyle = "left:-" + disX + "px";
        if (disX >= delBtnWidth) {
          //控制手指移动距离最大值为删除按钮的宽度  
          txtStyle = "left:-" + delBtnWidth + "px";
        }
      }
      //获取手指触摸的是哪一项  
      var index = e.target.dataset.index;
      var list = this.data.list;
      list[index].txtStyle = txtStyle;
      //更新列表的状态  
      this.setData({
        list: list
      });
    }
  },

  touchE: function (e) {
    if (e.changedTouches.length == 1) {
      //手指移动结束后水平位置  
      var endX = e.changedTouches[0].clientX;
      //触摸开始与结束，手指移动的距离  
      var disX = this.data.startX - endX;
      var delBtnWidth = this.data.delBtnWidth;
      //如果距离小于删除按钮的1/2，不显示删除按钮  
      var txtStyle = disX > delBtnWidth / 2 ? "left:-" + delBtnWidth + "px" : "left:0px";
      //获取手指触摸的是哪一项  
      var index = e.target.dataset.index;
      var list = this.data.list;
      list[index].txtStyle = txtStyle;
      //更新列表的状态  
      this.setData({
        list: list
      });
    }
  },
  //获取元素自适应后的实际宽度  
  getEleWidth: function (w) {
    var real = 0;
    try {
      var res = wx.getSystemInfoSync().windowWidth;
      var scale = (750 / 2) / (w / 2);//以宽度750px设计稿做宽度的自适应  
      // console.log(scale);  
      real = Math.floor(res / scale);
      return real;
    } catch (e) {
      return false;
      // Do something when catch error  
    }
  },
  initEleWidth: function () {
    var delBtnWidth = this.getEleWidth(this.data.delBtnWidth);
    this.setData({
      delBtnWidth: delBtnWidth
    });
  },
  //点击删除按钮事件  
  delItem: function (e) {
    var that = this
    wx.showModal({
      title: '提示',
      content: '是否删除该成员？',
      success: function (res) {
        if (res.confirm) {
          // console.log(e);
          //获取列表中要删除项的下标  
          var index = e.target.dataset.index;
          var list = that.data.list;
          var oUserId = e.target.dataset.data.userId
          // =2&=
          wx.getStorage({
            key: 'parkNo',
            success: function(res) {
              app.func.req('/appmouth/del/user', { parkNo: res.data, userId: oUserId}, function (res) {
                // console.log(res);
                if(res.success){
                  //移除列表中下标为index的项  
                  list.splice(index, 1);
                  //更新列表的状态  
                  that.setData({
                    list: list
                  });
                }else{
                  wx.showModal({
                    title: '提示',
                    content: res.code,
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
          

        }
      }
    })

  },
  // 下降
  lockUp: function(){
    
  },
  // 上升
  lockDown: function(){
    wx.showLoading({
      title: '感应下降中...'
    });
    wx.getStorage({
      key: 'parkNo',
      success: function (res) {
        app.func.req('/control/lines', { parkingNo: res.data }, function (res) {
          // console.log(res);
          wx.hideLoading();
        })
      }
    })
    
  },
  addPerson: function(){
    wx.navigateTo({
      url: '../addSpacePerson/addSpacePerson'
    });
  }
})  