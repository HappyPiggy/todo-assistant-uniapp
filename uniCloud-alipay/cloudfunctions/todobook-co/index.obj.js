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
  getSharePreview
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
  /**
   * 获取任务评论列表（分页）
   */
  async getTaskComments(taskId, page = 1, pageSize = 20) {
    return await getTaskComments.call(this, { taskId, page, pageSize })
  },

  /**
   * 添加任务评论
   */
  async addTaskComment(taskId, content, parentCommentId = null) {
    return await addTaskComment.call(this, { taskId, content, parentCommentId })
  },

  /**
   * 编辑评论
   */
  async updateTaskComment(commentId, content) {
    return await updateTaskComment.call(this, { commentId, content })
  },

  /**
   * 删除评论
   */
  async deleteTaskComment(commentId) {
    return await deleteTaskComment.call(this, { commentId })
  },

  // 分享管理接口
  /**
   * 创建分享
   */
  async createShare(todBookId, includeComments = false) {
    return await createShare.call(this, { todBookId, includeComments })
  },

  /**
   * 删除分享
   */
  async deleteShare(shareId) {
    return await deleteShare.call(this, { shareId })
  },

  /**
   * 获取我的分享列表
   */
  async getMyShares() {
    return await getMyShares.call(this)
  },

  /**
   * 通过分享码导入项目册
   */
  async importByCode(shareCode, allowDuplicate = false) {
    return await importByCode.call(this, shareCode, allowDuplicate)
  },

  /**
   * 获取分享预览
   */
  async getSharePreview(shareCode) {
    return await getSharePreview.call(this, shareCode)
  }
}