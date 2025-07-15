// 项目册相关常量
export const BOOK_CONSTANTS = {
  // 颜色选项
  COLOR_OPTIONS: [
    { value: '#007AFF', name: '蓝色' },
    { value: '#28A745', name: '绿色' },
    { value: '#FF9500', name: '橙色' },
    { value: '#FF3B30', name: '红色' },
    { value: '#AF52DE', name: '紫色' },
    { value: '#FFCC00', name: '黄色' },
    { value: '#5AC8FA', name: '青色' },
    { value: '#FF2D92', name: '粉色' }
  ],
  
  // 图标选项
  ICON_OPTIONS: [
    { value: 'folder', name: '文件夹' },
    { value: 'star', name: '星标' },
    { value: 'heart', name: '爱心' },
    { value: 'fire', name: '火焰' },
    { value: 'home', name: '房子' },
    { value: 'gear', name: '设置' },
    { value: 'location', name: '位置' },
    { value: 'calendar', name: '日历' },
    { value: 'camera', name: '相机' },
    { value: 'cart', name: '购物车' },
    { value: 'email', name: '邮件' },
    { value: 'phone', name: '电话' }
  ],
  
  // 默认值
  DEFAULT_COLOR: '#007AFF',
  DEFAULT_ICON: 'folder'
}

// 任务相关常量
export const TASK_CONSTANTS = {
  // 任务状态
  STATUS: {
    TODO: 'todo',
    IN_PROGRESS: 'in_progress', 
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },
  
  // 任务优先级
  PRIORITY: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent'
  },
  
  // 筛选器选项
  FILTER_OPTIONS: [
    { key: 'all', label: '全部' },
    { key: 'todo', label: '待办' },
    { key: 'completed', label: '已完成' }
  ],
  
  // 优先级映射
  PRIORITY_MAP: {
    low: '低',
    medium: '中', 
    high: '高',
    urgent: '急'
  },
  
  // 状态映射
  STATUS_MAP: {
    todo: '待办',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消'
  }
}

// 成员相关常量
export const MEMBER_CONSTANTS = {
  // 角色类型
  ROLES: {
    OWNER: 'owner',
    ADMIN: 'admin',
    MEMBER: 'member'
  },
  
  // 角色映射
  ROLE_MAP: {
    owner: '创建者',
    admin: '管理员', 
    member: '成员'
  }
}

// API响应状态码
export const API_CODES = {
  SUCCESS: 0,
  ERROR: -1,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404
}

// 表单验证规则
export const VALIDATION_RULES = {
  // 项目册表单规则
  BOOK_FORM: {
    title: {
      rules: [
        { required: true, errorMessage: '请输入项目册名称' },
        { minLength: 1, maxLength: 100, errorMessage: '名称长度应为1-100个字符' }
      ]
    }
  },
  
  // 任务表单规则
  TASK_FORM: {
    title: {
      rules: [
        { required: true, errorMessage: '请输入任务标题' },
        { minLength: 1, maxLength: 200, errorMessage: '标题长度应为1-200个字符' }
      ]
    },
    description: {
      rules: [
        { maxLength: 2000, errorMessage: '描述长度不能超过2000个字符' }
      ]
    }
  }
}

// 错误消息
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络错误，请检查网络连接',
  SERVER_ERROR: '服务器错误，请稍后重试',
  PERMISSION_DENIED: '权限不足，无法执行此操作',
  DATA_NOT_FOUND: '数据不存在或已被删除',
  VALIDATION_FAILED: '数据验证失败，请检查输入',
  OPERATION_FAILED: '操作失败，请重试'
}

