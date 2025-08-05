/**
 * 分享模块
 * 处理项目册分享相关功能
 */

const createShare = require('./create-share.js')
const deleteShare = require('./delete-share.js')
const getMyShares = require('./get-my-shares.js')
const importByCode = require('./import-by-code.js')
const getSharePreview = require('./get-share-preview.js')
const checkShareStatus = require('./check-share-status.js')
const syncShare = require('./sync-share.js')

module.exports = {
  createShare,
  deleteShare,
  getMyShares,
  importByCode,
  getSharePreview,
  checkShareStatus,
  syncShare
}