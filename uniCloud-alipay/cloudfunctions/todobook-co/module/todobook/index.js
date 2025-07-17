// 项目册管理模块入口

const getTodoBooks = require('./get-todobooks')
const createTodoBook = require('./create-todobook')
const getTodoBookDetail = require('./get-todobook-detail')
const updateTodoBook = require('./update-todobook')
const deleteTodoBook = require('./delete-todobook')

module.exports = {
  getTodoBooks,
  createTodoBook,
  getTodoBookDetail,
  updateTodoBook,
  deleteTodoBook
}