var QQMapWX = require('../../libs/qqmap-wx-jssdk.js');
var http = require('../../utils/http.js');
var app = getApp();
var oAddress;
Page({
  data: {
    plateNo: '',
    // 车位与锁图
    carImg: '../../img/parking-p_icon_choice_default@2x.png',
    lockImg: '../../img/parking-s_icon_choice_default@2x.png',
    oLat: '',
    oLng: '',
    searchSongList: [], //放置返回数据的数组  
    isFromSearch: true,   // 用于判断searchSongList数组是不是空数组，默认true，空的数组  
    searchPageNum: 1,   // 设置加载的第几次，默认是第一次  
    itemPage: 0,      //返回数据的页面数  
    imgParking: false, //无数据图片，默认false，隐藏  
    parkShow: false, //true为显示预约信息，隐藏扫码跟停车场
    countDownMinute: '',
    countDownSecond: '',
    markers: [],
    navigationImg: '',
    navigationImgShow: false,
    userID:''
  },

  onReady: function(){
    this.mapCtx = wx.createMapContext('map')
  },
  onLoad: function () {
    
    var that = this;
    wx.getStorage({
      key: 'plateNo',
      success: function(res) {
        that.setData({
          plateNo: res.data
        })
      },
    })
    wx.getStorage({
      key: 'userID',
      success: function (res) {
        that.setData({
          userID: res.data
        })
      },
    })
  },
  onShow: function(){
    var that = this;
    app.getUserInfo(function (userInfo) {
      //更新数据
      if (!userInfo.ofoInfo) {
        // setTimeout(function () {
        //   wx.navigateTo({
        //     url: '../bindphone/bindphone'
        //   });
        // }, 300);
        // return;
      }

      that.setData({
        userInfo: userInfo
      })
    });
    wx.getStorage({
      key: 'appointTime',
      success: function (res) {
        var end = res.data;
        var interval = setInterval(function () {
          //获取当前时间 
          var date = new Date();
          var now = date.getTime();
          var leftTime = end - now;
          var m, s;
          if (leftTime >= 0) {
            m = Math.floor(leftTime / 1000 / 60 % 60);
            s = Math.floor(leftTime / 1000 % 60);
            if (m < 10) {
              m = '0' + m
            }
            if (s < 10) {
              s = '0' + s
            }
            that.setData({
              countDownMinute: m,
              countDownSecond: s,
            });
          } else {
            clearInterval(interval);
            that.setData({
              countDownMinute: '00',
              countDownSecond: '00',
            });
            wx.setStorage({
              key: 'appointTrue',
              data: false,
            });
            wx.removeStorage({
              key: 'appointTime',
              success: function (res) {
                // console.log(res.data)
              }
            });
          }
        }, 1000);
      }
    });
    wx.getStorage({
      key: 'token',
      success: function(res) {
        that.setData({
          token: res.data
        });
      },
    })
    wx.getStorage({
      key: 'appointTrue',
      success: function(res) {
        that.setData({
          parkShow: res.data
        });
      },
    })
    wx.getLocation({
      type: 'wgs84', //返回可以用于wx.openLocation的经纬度
      success: function (res) {
        var latitude = res.latitude;
        var longitude = res.longitude;
        // 实例化API核心类
        var demo = new QQMapWX({
          key: 'XKBBZ-5RKWS-4TQOB-6CMPO-U2ORF-V5BKW' // 必填
        });
        demo.reverseGeocoder({
          location: {
            latitude: latitude,
            longitude: longitude
          },
          success: function (res) {
            // 获取当前区域
            // console.log(res);
            var oLat = res.result.location.lat;
            var oLng = res.result.location.lng;
            that.setData({
              oLat: res.result.location.lat,
              oLng: res.result.location.lng,
              searchPageNum: 1,   //第一次加载，设置1  
              searchSongList: [],  //放置返回数据的数组,设为空  
              isFromSearch: true,  //第一次加载，设置true  
            });
            //oAddress = res.result.address_component.district;
            oAddress = '杨浦区';
            app.func.req('/nearby/map/parking', { areaName: oAddress }, function (res) {
              // console.log(res);
              if (res.length > 0) {
                var oArr = [];
                for (var i = 0; i < res.length; i++) {
                  var oObj = {};
                  if (res[i].sumParking == res[i].usedParking && res[i].sumParking == 0 && res[i].usedParking == 0) {
                    continue
                  } else {
                    if (res[i].sumParking === res[i].usedParking) {
                      oObj.iconPath = "../../img/parking-s_icon_choice_pressed@2x.png";
                    } else {
                      oObj.iconPath = "../../img/parking-s_icon_choice_default@2x.png";
                    }
                  }
                  oObj.id = res[i].parking_weiyi_no;
                  oObj.latitude = res[i].latitude;
                  oObj.longitude = res[i].longitude;
                  oObj.width = 28;
                  oObj.height = 31;
                  oArr.push(oObj);
                  oObj = {};
                }
                that.setData({
                  markers: oArr
                })
              }
            });
            that.fetchSearchList();
          }
        });
      }
    });
  },

  longConversion: function (long) {
    if (long > 1000) {
      long = (long / 1000).toFixed(2) + '公里'
    } else {
      long = long + '米'
    }
    return long;
  },
  //访问网络  
  fetchSearchList: function () {
    let that = this;
    let searchPageNum = that.data.searchPageNum;//把第几次加载次数作为参数  
    //访问网络  
    var oData = {
      pageIndex: searchPageNum,
      ps: 3,
      lat: that.data.oLat,
      lng: that.data.oLng
    }

    wx.request({
      url: http.reqUrl + '/nearby/parkinglat',
      data: JSON.stringify(oData),
      method: 'POST',
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        // console.log(res.data);
        let searchList = [];
        if (res.data.map.length > 0) {
          res.data.map.map(function (item) {
            item.distance = that.longConversion(item.distance);
            return item;
          });

          searchList = res.data.map
          that.data.searchSongList.concat(searchList);
          that.setData({
            itemPage: res.data.tp,
            searchSongList: that.data.searchSongList.concat(searchList) //获取数据数组  
          });
        } else {
          that.setData({
            imgParking: true,
          });
        }
      }
    });
  },
  regionchange(e) {
    // console.log(e.type)
  },
  markertap(e) {
    var oData = {
      parkNo: e.markerId
    }
    app.func.req('/appmouth/query/park', oData, function (res) {
      console.log(res);
      wx.openLocation({
        latitude: parseFloat(res.data[0].latitude),
        longitude: parseFloat(res.data[0].longitude),
        scale: 18,
        name: res.data[0].parking_name,
        address: res.data[0].address
      })
    })
  },
  controltap(e) {
    // console.log(e.controlId)
  },
  bindParkingListItemTap: function (e) {
    // console.log(e.currentTarget.dataset.index);
    wx.setStorage({
      key: 'lockDetailList',
      data: e.currentTarget.dataset.index,
      success: function(res) {
        wx.navigateTo({
          url: "../lockDetailList/lockDetailList"
        });
      },
      fail: function(res) {},
      complete: function(res) {},
    })

  },
  // openParkingMap: function () {
  //   wx.navigateTo({
  //     url: '../parkinglotMap/parkinglotMap',
  //     success: function (res) {
  //       // success
  //     },
  //     fail: function (res) {
  //       // fail
  //     },
  //     complete: function (res) {
  //       // complete
  //     }
  //   })
  // },
  sweepCar: function(){
    // 只允许从相机扫码
    wx.scanCode({
      onlyFromCamera: true,
      success: (res) => {
        // console.log(res.result);
        var link = decodeURIComponent(res.result);
        var paramArr = link.split('=');
        if (paramArr.length == 2) {
          var params = paramArr[1].split('_');
          // console.log(params[1]);//车位锁ID
          // that.setData({
          //   lockId: params[1]
          // })
          var oUrl = "../lockDetail/lockDetail?lockId=1_" + params[1]
          // console.log(oUrl)
          wx.request({
            url: http.reqUrl + '/pkmg/selectParkinglock',
            data: { dici_no: params[1] },
            method: 'POST',
            header: {
              'content-type': 'application/x-www-form-urlencoded'
            },
            success: function (res) {
              wx.setStorage({
                key: 'lockCarId',
                data: res.data.data[0].cheweiId,
                success: function(){
                  wx.redirectTo({
                    url: oUrl
                  });
                }
              })
            }
          })
          
          
        }
      }
    });
  },
  moreBtn: function(){
    wx.navigateTo({
      url: "../lockParkingList/lockParkingList"
    });
  },
  parkingP: function(){
    wx.reLaunch({
      url: '../index/index'
    })
  },
  // 刷新页面，再次请求接口
  refreshtap: function (e) {
    var that = this;
    wx.getLocation({
      type: 'wgs84', //返回可以用于wx.openLocation的经纬度
      success: function (res) {
        var latitude = res.latitude;
        var longitude = res.longitude;
        // 实例化API核心类
        var demo = new QQMapWX({
          key: 'XKBBZ-5RKWS-4TQOB-6CMPO-U2ORF-V5BKW' // 必填
        });
        demo.reverseGeocoder({
          location: {
            latitude: latitude,
            longitude: longitude
          },
          success: function (res) {
            // 获取当前区域
            // console.log(res);
            var oLat = res.result.location.lat;
            var oLng = res.result.location.lng;
            that.setData({
              oLat: res.result.location.lat,
              oLng: res.result.location.lng,
              searchPageNum: 1,   //第一次加载，设置1  
              searchSongList: [],  //放置返回数据的数组,设为空  
              isFromSearch: true,  //第一次加载，设置true  
            });
            // oAddress = res.result.address_component.district;
            Address = '杨浦区';
            app.func.req('/nearby/map/parking', { areaName: oAddress }, function (res) {
              // console.log(res);
              if (res.length > 0) {
                var oArr = [];
                for (var i = 0; i < res.length; i++) {
                  var oObj = {};
                  if (res[i].sumParking == res[i].usedParking && res[i].sumParking == 0 && res[i].usedParking == 0) {
                    continue
                  } else {
                    if (res[i].sumParking === res[i].usedParking) {
                      oObj.iconPath = "../../img/parking-s_icon_choice_pressed@2x.png";
                    } else {
                      oObj.iconPath = "../../img/parking-s_icon_choice_default@2x.png";
                    }
                  }
                  oObj.id = res[i].parking_weiyi_no;
                  oObj.latitude = res[i].latitude;
                  oObj.longitude = res[i].longitude;
                  oObj.width = 28;
                  oObj.height = 31;
                  oArr.push(oObj);
                  oObj = {};
                }
                that.setData({
                  markers: oArr
                })
              }
            });
            that.fetchSearchList();
          }
        });
      }
    });
  },
  // 移动到定位点中心
  moveToLocation: function () {
    this.mapCtx.moveToLocation()
  },
  // 跳转帮助中心页面
  helpTocenter: function () {
    wx.navigateTo({
      url: '../help/help'
    })
  },
  // 跳转个人中心页面
  personalTocenter: function () {
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
        if (res.data.success) {
          wx.navigateTo({
            url: '../person/person'
          });
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
    });
    
  },
  // 显示导航图
  navigationImg: function(){
    var that = this;
    wx.getStorage({
      key: 'lockCarId',
      success: function(res) {
        wx.request({
          url: http.reqUrl + '/lock/navigationMap',
          data: {
            parkNo: res.data,
          },
          method: 'POST',
          header: {
            'content-type': 'application/x-www-form-urlencoded'
          },
          success: function (res) {
            // console.log(res.data.data);
            that.setData({
              navigationImg: 'https://www.lcgxlm.com' + res.data.data,
              navigationImgShow: true
            })
          }
        });
      },
    })
  },
  // 关闭导航图
  navigationImgFalse: function(){
    this.setData({
      navigationImgShow: false
    })
  },
  // 取消预约
  cancelAppoint: function(){
    var that = this;
    wx.showModal({
      title: '提示',
      content: '是否取消预约？',
      success: function (res) {
        if (res.confirm) {
          wx.getStorage({
            key: 'lockCarId',
            success: function (res) {
              wx.request({
                url: http.reqUrl + '/lock/appointment/cancel',
                data: {
                  parkNo: res.data,
                },
                method: 'POST',
                header: {
                  'content-type': 'application/x-www-form-urlencoded',
                  'token': that.data.token
                },
                success: function (res) {
                  // console.log(res);
                  wx.removeStorage({
                    key: 'lockCarId',
                    success: function (res) {
                      wx.setStorage({
                        key: 'appointTrue',
                        data: false,
                        success: function (res) {
                          that.setData({
                            navigationImgShow: false,
                            parkShow: false
                          });
                        },
                      })
                    },
                  })
                }
              });
            },
          });
        }else if (res.cancel) {
          // console.log('用户点击取消');
        }
      }
    });
    
  },
  // 预约去停车
  stopCar: function(){
    wx.navigateTo({
      url: '../lockDetail/lockDetail'
    });
  }
})
