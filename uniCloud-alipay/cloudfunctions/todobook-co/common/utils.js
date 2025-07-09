// 通用工具函数

const { ERROR_CODES, SUCCESS_CODE } = require('./constants')

/**
 * 创建成功响应
 * @param {*} data 响应数据
 * @param {string} message 响应消息
 * @returns {Object} 响应对象
 */
function createSuccessResponse(data = null, message = '操作成功') {
  const response = {
    code: SUCCESS_CODE
  }
  
  if (message) {
    response.message = message
  }
  
  if (data !== null) {
    response.data = data
  }
  
  return response
}

/**
 * 创建错误响应
 * @param {number} code 错误码
 * @param {string} message 错误消息
 * @returns {Object} 错误响应对象
 */
function createErrorResponse(code, message) {
  return {
    code,
    message
  }
}

/**
 * 验证字符串参数
 * @param {string} value 待验证值
 * @param {string} name 参数名
 * @param {number} minLength 最小长度
 * @param {number} maxLength 最大长度
 * @returns {Object|null} 验证结果，null表示验证通过
 */
function validateStringParam(value, name, minLength = 1, maxLength = 200) {
  if (!value || typeof value !== 'string') {
    return createErrorResponse(ERROR_CODES.INVALID_PARAM, `${name}不能为空`)
  }
  
  const trimmedValue = value.trim()
  if (trimmedValue.length === 0) {
    return createErrorResponse(ERROR_CODES.INVALID_PARAM, `${name}不能为空`)
  }
  
  if (trimmedValue.length < minLength) {
    return createErrorResponse(ERROR_CODES.INVALID_PARAM, `${name}长度不能少于${minLength}个字符`)
  }
  
  if (trimmedValue.length > maxLength) {
    return createErrorResponse(ERROR_CODES.INVALID_PARAM, `${name}长度不能超过${maxLength}个字符`)
  }
  
  return null
}

/**
 * 验证分页参数
 * @param {number} page 页码
 * @param {number} pageSize 每页大小
 * @returns {Object} 验证后的分页参数
 */
function validatePaginationParams(page = 1, pageSize = 20) {
  let validPage = page
  let validPageSize = pageSize
  
  if (validPage < 1) validPage = 1
  if (validPageSize < 1 || validPageSize > 100) validPageSize = 20
  
  return {
    page: validPage,
    pageSize: validPageSize
  }
}

/**
 * 转义正则表达式特殊字符
 * @param {string} string 待转义字符串
 * @returns {string} 转义后的字符串
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 创建搜索正则表达式
 * @param {string} keyword 搜索关键词
 * @returns {Object} 正则表达式对象
 */
function createSearchRegex(keyword) {
  const escapedKeyword = escapeRegExp(keyword.trim())
  return {
    $regex: escapedKeyword,
    $options: 'i'
  }
}

/**
 * 处理数据库聚合查询错误的备用方案
 * @param {Function} aggregateQuery 聚合查询函数
 * @param {Function} fallbackQuery 备用查询函数
 * @returns {*} 查询结果
 */
async function handleAggregateWithFallback(aggregateQuery, fallbackQuery) {
  try {
    return await aggregateQuery()
  } catch (aggregateError) {
    console.error('聚合查询失败，尝试使用备用方案:', aggregateError)
    return await fallbackQuery()
  }
}

module.exports = {
  createSuccessResponse,
  createErrorResponse,
  validateStringParam,
  validatePaginationParams,
  escapeRegExp,
  createSearchRegex,
  handleAggregateWithFallback
}