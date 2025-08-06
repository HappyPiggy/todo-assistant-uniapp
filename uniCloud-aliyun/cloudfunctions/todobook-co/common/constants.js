// 项目册管理常量定义

// 错误码定义
const ERROR_CODES = {
  // 认证相关
  UNAUTHORIZED: 30202,
  FORBIDDEN: 403,
  
  // 业务相关
  INVALID_PARAM: 400,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
  
  // 项目册相关
  TODOBOOK_NOT_FOUND: 404,
  TODOBOOK_EXISTS: 400,
  TODOBOOK_TITLE_EMPTY: 400,
  TODOBOOK_TITLE_TOO_LONG: 400,
  
  // 任务相关
  TASK_NOT_FOUND: 404,
  TASK_TITLE_EMPTY: 400,
  
  // 成员相关
  MEMBER_NOT_FOUND: 404,
  MEMBER_EXISTS: 400,
  INVALID_NICKNAME: 400,
  CANNOT_INVITE_SELF: 400,
  CANNOT_REMOVE_CREATOR: 400,
  CREATOR_CANNOT_LEAVE: 400,
  
  // 权限相关
  NO_READ_PERMISSION: 403,
  NO_WRITE_PERMISSION: 403,
  NO_DELETE_PERMISSION: 403,
  NO_MANAGE_PERMISSION: 403
}

// 任务状态
const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
}

// 任务优先级
const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
}

// 成员角色
const MEMBER_ROLE = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member'
}

// 权限类型
const PERMISSION_TYPE = {
  READ: 'read',
  WRITE: 'write',
  DELETE: 'delete',
  MANAGE_MEMBERS: 'manage_members',
  MANAGE_SETTINGS: 'manage_settings'
}

// 成功响应码
const SUCCESS_CODE = 0

module.exports = {
  ERROR_CODES,
  TASK_STATUS,
  TASK_PRIORITY,
  MEMBER_ROLE,
  PERMISSION_TYPE,
  SUCCESS_CODE
}