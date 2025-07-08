// 评论管理模块入口

const getTaskComments = require('./get-task-comments')
const addTaskComment = require('./add-task-comment')
const updateTaskComment = require('./update-task-comment')
const deleteTaskComment = require('./delete-task-comment')

module.exports = {
  getTaskComments,
  addTaskComment,
  updateTaskComment,
  deleteTaskComment
}