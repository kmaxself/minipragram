const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    openid: '',
    faceTotalNum: 0,
    backTotalNum: 0,
    faceNum: 0,
    backNum: 0,
    ownerId: '',
    disableValue:false,
    hiddenName:false,
    activateTitle:'',
    activateTitleId:'',
    activateFacePoint:'',
    activateBackPoint:''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log("onload###############################################");
    if (app.globalData.openid) {
      this.setData({
        openid: app.globalData.openid
      });
      if (app.globalData.openid == 'olWVs5dtRvuk_tCC09e1KPfmZuq0') {
        console.log('显示删除按钮 ')
        this.setData({
          hiddenName: true
        })
      }
    } else {
      this.onGetOpenId()
    }
    var that = this;
    setInterval(function(){
      that.onCountTotalScore()
    },3000)
  },

  /**
   * 获取OPEN_ID
   */
  onGetOpenId: function () {
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        app.globalData.openid = res.result.openid
        this.setData({
          openid: res.result.openid
        })
        console.log('2222222222' + res.result.openid)
        if (res.result.openid == 'olWVs5dtRvuk_tCC09e1KPfmZuq0') {
          console.log('显示删除按钮 ')
          this.setData({
            hiddenName: true
          })
        }
      },
      fail: err => {
        console.log('get openid fail')
      }
    })
  },

  onSupport: async function (e) {
    this.setData({
      disableValue:true
    })
    console.log('onsupport : ', e)
    wx.showToast({
      title: '',
      icon:'loading',
      mask:true,
      duration:1000
    })

    //获取button的传参
    var direction = e.currentTarget.dataset.direction
    console.log('direction:', direction)
    var i = e
    var j = ''
    if (direction == 'face') {
      j = 'back'
    } else {
      j = 'face'
    }
    const db = wx.cloud.database()
    console.log('openid :', this.data.openid)
    // const currentActiveTitle = await this.syncQueryCurentSchedule();
    
    db.collection('vote').where({
      direction: direction,
      _openid: this.data.openid,
      titleId: this.data.activateTitleId
    }).get({
      success: res => {
        console.log(res.data)
        //如果已获取数据则提示已支持
        if (res.data.length >= 1) {
          wx.showToast({
            title: '已支持该方'
          })
        }
        //之前未支持，插入数据
        if (res.data.length === 0) {
          this.onAdd(i)
        }
        //不管之前是否支持过地方，删除对立面观点
        this.onDeleteOppositeIdea(j)
      },
      fail: err => {
        console.log('投票失败')
      }
    })

    this.setData({
      disableValue: false
    })

  },

  onDeleteOppositeIdea: function (e) {
    var idea = e
    const db = wx.cloud.database()
    db.collection('vote').where({
      _openid: this.data.openid,
      direction: idea,
      titleId:this.data.activateTitleId
    }).get({
      success: res => {
        console.log('kasdf:', res.data)
        console.log('data length:', res.data.length)
        if (res.data.length === 1) {
          console.log('ID: ', res.data[0]._id)
          this.onRemove(res.data[0]._id)
        }

      },
      fail: err => {
        console.error('[数据库] [查询记录] 失败：', err)
      }
    })

  },

  onRemove: function (e) {
    if (e) {
      console.log('begin to delete _Id', e)
      const db = wx.cloud.database()
      db.collection('vote').doc(e).remove({
        success: res => {
          this.setData({
            ownerId: '',
          })
          this.onCountTotalScore()
        },
        fail: err => {
          console.error('[数据库] [删除记录] 失败：', err)
        }
      })
    }
  },

  onRemoveAllCounter: function (e) {
    console.log("begin to remove counter all data")
    const cloud = require('wx-server-sdk')
    const db = cloud.database()
    const _ = db.command

    exports.main = async (event, context) => {
      try {
        return await db.collection('counter').where({
          done: true
        }).remove()
      } catch (e) {
        console.error(e)
      }
    }

    // if (e) {
    //   console.log('begin to delete _Id', e)
    //   const db = wx.cloud.database()
    //   db.collection('counter').doc(e).remove({
    //     success: res => {
 
    //       this.onCountTotalScore()
    //     },
    //     fail: err => {
    //       console.error('[数据库] [删除记录] 失败：', err)
    //     }
    //   })
    // }
  },

  onAdd: function (e) {
    console.log('onAdd e：', e)
    var idea = e.currentTarget.dataset.direction
    const db = wx.cloud.database()
    db.collection('vote').add({
      data: {
        direction: idea,
        titleId:this.data.activateTitleId
      },
      success: res => {
        // 在返回结果中会包含新创建的记录的 _id
        wx.showToast({
          title: '感谢支持',
        })
        //刷新比分
        this.onCountTotalScore()

        console.log('[数据库] [新增记录] 成功，记录 _id: ', res._id)
      },
      fail: err => {
        // wx.showToast({
        //   icon: 'none',
        //   title: '支持失败'
        // })
        console.error('[数据库] [新增记录] 失败：', err)
      }
    })
  },

  onCountTotalScore: async function () {
    console.log('faceTotalNum:', this.data.faceTotalNum);
    const currentActiveTitle = await this.syncQueryCurentSchedule();
    console.log('current title : '+currentActiveTitle.data[0].title);
    this.setData({
      activateTitleId: currentActiveTitle.data[0]._id,
      activateFacePoint: currentActiveTitle.data[0].face_standpoint,
      activateBackPoint: currentActiveTitle.data[0].back_standpoint,
      activateTitle: currentActiveTitle.data[0].title
    });
    console.log('activate title : ', this.data.activateTitle);
    console.log('activate id:',this.data.activateTitleId);
    var resback1 = await this.syncCollectVoteResult('face');
    var res2 = await this.syncCollectVoteResult('back')
    console.log('backTotalNum:', this.data.backTotalNum)
  },

  syncCollectVoteResult(e){
    return new Promise((resolve, reject) => {
      console.log('onCollectNum e:', e)
      const db = wx.cloud.database()
      console.log("333333: ",this.data.activateTitleId)
      db.collection('vote').where({
        direction: e,
        titleId:this.data.activateTitleId
      }).count({
        success: res1 => {
         console.log(res1)
          if (e === 'face') {
            console.log('face 111')
            console.log('res1.total : ',res1.total)
            this.setData({
              faceTotalNum: res1.total
            })
            console.log("1111")
            // console.log('2:', this.faceTotalNum)
          } else {
            console.log('back 111')
            this.setData({
              backTotalNum: res1.total
            })
          }
          resolve(res1);
          console.log('faceTotalNum after collect:', this.data.faceTotalNum)
          console.log('backTotalNum after collect:', this.data.backTotalNum)
        },
        fail: err => {
          console.log('fail to query data')
        }
      })
    });
  },


  onCollectNum: function (e) {
    console.log('onCollectNum e:', e)
    const db = wx.cloud.database()
    db.collection('vote').where({
      direction: e
    }).count({
      success: res => {
        console.log(res.data)
        if (e === 'face') {
          console.log('face 111')
          this.setData({
            faceTotalNum: res.total
          })
          console.log('2:', faceTotalNum)
        } else {
          console.log('back 111')
          this.setData({
            backTotalNum: res.total
          })
        }
        console.log('faceTotalNum after collect:', this.data.faceTotalNum)
        console.log('backTotalNum after collect:', this.data.backTotalNum)
      },
      fail: err => {
        console.log('fail to query data')
      }
    })
  },



  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  /**
   * 获取活跃辩题
   */
  syncQueryCurentSchedule(){
    return new Promise((resolve, reject) => {
      console.log('syncQueryCurentSchedule')
      const db = wx.cloud.database()
      db.collection('schedule').where({
        activation: 'Y'
      }).get({
        success: res1 => {
         console.log(res1)
          resolve(res1);
        },
        fail: err => {
          console.log('fail to query data')
        }
      })
    });
  }




})