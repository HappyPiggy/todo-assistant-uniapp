// 项目册管理模块入口

const getTodoBooks = require('./get-todobooks')
const createTodoBook = require('./create-todobook')
const getTodoBookDetail = require('./get-todobook-detail')
const getTodoBookBasic = require('./get-todobook-basic')
const getTodoBookMembers = require('./get-todobook-members')
const getTodoBookTasks = require('./get-todobook-tasks')
const updateTodoBook = require('./update-todobook')
const deleteTodoBook = require('./delete-todobook')

module.exports = {
  getTodoBooks,
  createTodoBook,
  getTodoBookDetail,
  getTodoBookBasic,
  getTodoBookMembers,
  getTodoBookTasks,
  updateTodoBook,
  deleteTodoBook
}