// 成员管理模块入口

const getMembers = require('./get-members')
const inviteUserByNickname = require('./invite-member')
const removeMember = require('./remove-member')
const leaveBook = require('./leave-book')

module.exports = {
  getMembers,
  inviteUserByNickname,
  removeMember,
  leaveBook
}