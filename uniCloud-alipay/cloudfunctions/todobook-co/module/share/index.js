/**
 * 分享模块
 * 处理项目册分享相关功能
 */

module.exports = {
  createShare: require('./create-share.js'),
  deleteShare: require('./delete-share.js'),
  getMyShares: require('./get-my-shares.js'),
  importByCode: require('./import-by-code.js'),
  getSharePreview: require('./get-share-preview.js'),
  checkShareStatus: require('./check-share-status.js'),
  syncShare: require('./sync-share.js')
}