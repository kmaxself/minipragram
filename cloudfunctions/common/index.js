// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init() //初始化云函数
const db = cloud.database()
// 云函数入口函数
exports.main = async(event, context) => {
  return await db.collection('schedule').where({
      _id: event.id
    })
    .update({
      data: {
        activation: event.activation
      },
    })
 
}