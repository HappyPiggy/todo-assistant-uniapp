// 项目册管理云对象
const uniID = require('uni-id-common')

// 引入各功能模块
const {
  getTodoBooks,
  createTodoBook,
  getTodoBookDetail,
  updateTodoBook,
  deleteTodoBook
} = require('./module/todobook/index')

const {
  createTodoItem,
  getTaskDetail,
  updateTodoItem,
  updateTodoItemStatus,
  updateTaskOrder,
  deleteTask
} = require('./module/task/index')

const {
  getMembers,
  inviteUserByNickname,
  removeMember,
  leaveBook
} = require('./module/member/index')

const {
  getTaskComments,
  addTaskComment,
  updateTaskComment,
  deleteTaskComment
} = require('./module/comments/index')

const {
  createShare,
  deleteShare,
  getMyShares,
  importByCode,
  getSharePreview,
  checkShareStatus,
  syncShare
} = require('./module/share/index')

module.exports = {
  _before: async function () {
    const token = this.getUniIdToken();  
    if (!token) {  
      throw new Error('请登录后再访问');  
    } 

    this.uniID = uniID.createInstance({
      context: this.getCloudInfo()
    })
    const {uid} = await this.uniID.checkToken(token)
    this.uid = uid
	  this.db = uniCloud.database()
  },

  // 项目册管理接口
  getTodoBooks,
  createTodoBook,
  getTodoBookDetail,
  updateTodoBook,
  deleteTodoBook,
  
  // 任务管理接口
  createTodoItem,
  getTaskDetail,
  getTodoItemDetail: getTaskDetail, // 别名，保持兼容性
  updateTodoItem,
  updateTodoItemStatus,
  updateTaskOrder,
  deleteTask,

  // 成员管理接口
  getMembers,
  inviteUserByNickname,
  removeMember,
  leaveBook,

  // 评论管理接口
  getTaskComments,
  addTaskComment,
  updateTaskComment,
  deleteTaskComment,

  // 分享管理接口
  createShare,
  deleteShare,
  getMyShares,
  importByCode,
  getSharePreview,
  checkShareStatus,
  syncShare
}