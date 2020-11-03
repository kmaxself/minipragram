// miniprogram/pages/admin/admin.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    scheduleList:{}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getScheduleList();
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

  async getScheduleList(){
    const schedultListTemp = await this.syncQueryScheduleList();
    for (var i = 0; i < schedultListTemp.length; ++i) {
      console.log(i);
      console.log(schedultListTemp[i]._id);
      var faceNum = await this.syncCollectVoteResult('face',schedultListTemp[i]._id);
      console.log('faceNum : ',faceNum);
      schedultListTemp[i].faceNum=faceNum;
      var backNum = await this.syncCollectVoteResult('back',schedultListTemp[i]._id);
      console.log('backNum : ',backNum);
      schedultListTemp[i].backNum=backNum;
    }
    console.log(schedultListTemp);
    this.setData({
      scheduleList: schedultListTemp
    });
  },



   /**
   * 同步获取选题
   */
  async syncQueryScheduleList(){
    return new Promise((resolve, reject) => {
      const db = wx.cloud.database()
      db.collection('schedule').get().then(res => {
        // res.data 是一个包含集合中有权限访问的所有记录的数据，不超过 20 条
        console.log(res.data);
        resolve(res.data);
 

      })
    });
  },


  closeCurrentVote(e){
    var index = parseInt(e.currentTarget.dataset.index);
    console.log("index : ",index);
    var item = this.data.scheduleList[index];
    var that = this;
    wx.cloud.callFunction({
      // 云函数名称
      name: 'common',
      // 传给云函数的参数
      data: {
        id: item._id,
        activation: "N"
      },
      success: function(res) {
        console.log("success to update schedule status ",res) // 3
        that.getScheduleList()
      },
      fail: console.error
    })

  },


  //开始投票
  openCurrentVote(e){
    var index = parseInt(e.currentTarget.dataset.index);
    console.log("index : ",index);
    var item = this.data.scheduleList[index];
    var that = this;
    wx.cloud.callFunction({
      // 云函数名称
      name: 'common',
      // 传给云函数的参数
      data: {
        id: item._id,
        activation: "Y"
      },
      success: function(res) {
        console.log("success to update schedule status ",res); // 3
        that.getScheduleList();
      },
      fail: console.error
    })

  },






  //切换activation
  closeCurrentVoteByOrigin(e){
    console.log("333333333:",e);
    var index = parseInt(e.currentTarget.dataset.index);
    console.log("index : ",index);
    var item = this.data.scheduleList[index];
    var currentTitleId = item._id;
    console.log(item);
    console.log("currentTitleId",currentTitleId);
    const db = wx.cloud.database();
    db.collection('schedule').doc(currentTitleId).get().then(res => {
      console.log("res : ",res);
    });
    db.collection('schedule').doc(currentTitleId)
    .update({
      data: {
        'activation': 'N'
      },
      success: function(res) {
        console.log(res)
        this.getScheduleList();
      }
    })

  },

  syncCollectVoteResult(e,activateTitleId){
    return new Promise((resolve, reject) => {
      console.log('onCollectNum e:', e)
      const db = wx.cloud.database()
      console.log("333333: ",activateTitleId)
      db.collection('vote').where({
        direction: e,
        titleId:activateTitleId
      }).count({
        success: res1 => {
         console.log(res1)
          resolve(res1.total);
        },
        fail: err => {
          console.log('fail to query data')
        }
      })
    });
  },

})