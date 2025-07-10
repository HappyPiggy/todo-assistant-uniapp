import { ref, computed } from 'vue'
import { formatJoinTime } from '@/pages/todobooks/utils/dateUtils.js'
import { API_CODES, ERROR_MESSAGES, MEMBER_CONSTANTS } from '@/pages/todobooks/utils/constants.js'

/**
 * 成员数据管理组合式函数
 * @param {string} bookId - 项目册ID
 * @returns {Object} 成员数据和操作方法
 */
export function useMemberData(bookId) {
  // 响应式数据
  const members = ref([])
  const loading = ref(false)
  const error = ref(null)
  const currentUserId = ref('')
  
  // 计算属性
  const isOwner = computed(() => {
    if (!currentUserId.value || !members.value.length) return false
    const currentMember = members.value.find(m => m.user_id === currentUserId.value)
    return currentMember && currentMember.role === MEMBER_CONSTANTS.ROLES.OWNER
  })
  
  const memberCount = computed(() => {
    return members.value.length
  })
  
  const currentMember = computed(() => {
    return members.value.find(m => m.user_id === currentUserId.value)
  })
  
  const otherMembers = computed(() => {
    return members.value.filter(m => m.user_id !== currentUserId.value)
  })
  
  /**
   * 获取当前用户信息
   */
  const getCurrentUser = async () => {
    try {
      const userInfo = uni.getStorageSync('uni-id-pages-userInfo')
      if (userInfo) {
        currentUserId.value = userInfo._id
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  }
  
  /**
   * 加载成员列表
   * @param {string} id - 项目册ID
   */
  const loadMembers = async (id = bookId) => {
    if (!id) {
      error.value = '项目册ID不能为空'
      return
    }
    
    loading.value = true
    error.value = null
    
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.getMembers(id)
      
      if (result.code === API_CODES.SUCCESS) {
        members.value = result.data.members || []
        
        // 格式化成员数据
        members.value = members.value.map(member => ({
          ...member,
          formattedJoinTime: formatJoinTime(member.joined_at),
          roleName: MEMBER_CONSTANTS.ROLE_MAP[member.role] || member.role
        }))
        
        // 检查当前用户是否是创建者
        if (currentUserId.value) {
          const currentMember = members.value.find(m => m.user_id === currentUserId.value)
          if (currentMember) {
            currentMember.isCurrent = true
          }
        }
      } else {
        error.value = result.message || ERROR_MESSAGES.DATA_NOT_FOUND
        uni.showToast({
          title: error.value,
          icon: 'none'
        })
      }
    } catch (err) {
      console.error('获取成员列表失败:', err)
      error.value = ERROR_MESSAGES.NETWORK_ERROR
      uni.showToast({
        title: error.value,
        icon: 'none'
      })
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 邀请用户
   * @param {string} nickname - 用户昵称
   */
  const inviteUser = async (nickname) => {
    if (!nickname || !nickname.trim()) {
      throw new Error('请输入用户昵称')
    }
    
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.inviteUserByNickname(bookId, nickname.trim())
      
      if (result.code === API_CODES.SUCCESS) {
        // 重新加载成员列表
        await loadMembers(bookId)
        return result
      } else {
        throw new Error(result.message || ERROR_MESSAGES.OPERATION_FAILED)
      }
    } catch (err) {
      console.error('邀请用户失败:', err)
      throw err
    }
  }
  
  /**
   * 移除成员
   * @param {string} userId - 用户ID
   */
  const removeMember = async (userId) => {
    if (!userId) {
      throw new Error('用户ID不能为空')
    }
    
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.removeMember(bookId, userId)
      
      if (result.code === API_CODES.SUCCESS) {
        // 重新加载成员列表
        await loadMembers(bookId)
        return result
      } else {
        throw new Error(result.message || ERROR_MESSAGES.OPERATION_FAILED)
      }
    } catch (err) {
      console.error('移除成员失败:', err)
      throw err
    }
  }
  
  /**
   * 退出项目册
   */
  const leaveBook = async () => {
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.leaveBook(bookId)
      
      if (result.code === API_CODES.SUCCESS) {
        return result
      } else {
        throw new Error(result.message || ERROR_MESSAGES.OPERATION_FAILED)
      }
    } catch (err) {
      console.error('退出项目册失败:', err)
      throw err
    }
  }
  
  /**
   * 更新成员角色
   * @param {string} userId - 用户ID
   * @param {string} role - 新角色
   */
  const updateMemberRole = async (userId, role) => {
    if (!userId || !role) {
      throw new Error('用户ID和角色不能为空')
    }
    
    try {
      const todoBookCo = uniCloud.importObject('todobook-co')
      const result = await todoBookCo.updateMemberRole(bookId, userId, role)
      
      if (result.code === API_CODES.SUCCESS) {
        // 更新本地成员数据
        const memberIndex = members.value.findIndex(m => m.user_id === userId)
        if (memberIndex !== -1) {
          members.value[memberIndex].role = role
          members.value[memberIndex].roleName = MEMBER_CONSTANTS.ROLE_MAP[role] || role
        }
        return result
      } else {
        throw new Error(result.message || ERROR_MESSAGES.OPERATION_FAILED)
      }
    } catch (err) {
      console.error('更新成员角色失败:', err)
      throw err
    }
  }
  
  /**
   * 获取成员信息
   * @param {string} userId - 用户ID
   * @returns {Object|null} 成员信息
   */
  const getMemberById = (userId) => {
    return members.value.find(m => m.user_id === userId) || null
  }
  
  /**
   * 检查用户权限
   * @param {string} userId - 用户ID
   * @param {string} action - 操作类型
   * @returns {boolean} 是否有权限
   */
  const checkPermission = (userId, action) => {
    const member = getMemberById(userId)
    if (!member) return false
    
    switch (action) {
      case 'invite':
      case 'remove':
        // 只有所有者和管理员可以邀请和移除成员
        return [MEMBER_CONSTANTS.ROLES.OWNER, MEMBER_CONSTANTS.ROLES.ADMIN].includes(member.role)
      case 'update_role':
        // 只有所有者可以更新角色
        return member.role === MEMBER_CONSTANTS.ROLES.OWNER
      case 'leave':
        // 所有人都可以退出，除了所有者
        return member.role !== MEMBER_CONSTANTS.ROLES.OWNER
      default:
        return false
    }
  }
  
  /**
   * 获取成员头像URL或占位符
   * @param {Object} member - 成员对象
   * @returns {string} 头像URL或占位符文本
   */
  const getMemberAvatar = (member) => {
    if (member['user_info.avatar_file']) {
      return member['user_info.avatar_file']
    }
    
    // 返回昵称首字母作为占位符
    const nickname = member['user_info.nickname']
    return nickname ? nickname.charAt(0).toUpperCase() : '?'
  }
  
  /**
   * 获取成员昵称
   * @param {Object} member - 成员对象
   * @returns {string} 昵称
   */
  const getMemberNickname = (member) => {
    return member['user_info.nickname'] || '未知用户'
  }
  
  /**
   * 刷新数据
   */
  const refreshData = async () => {
    await loadMembers(bookId)
  }
  
  /**
   * 重置状态
   */
  const resetState = () => {
    members.value = []
    loading.value = false
    error.value = null
    currentUserId.value = ''
  }
  
  // 初始化时获取当前用户信息
  getCurrentUser()
  
  return {
    // 响应式数据
    members,
    loading,
    error,
    currentUserId,
    
    // 计算属性
    isOwner,
    memberCount,
    currentMember,
    otherMembers,
    
    // 方法
    getCurrentUser,
    loadMembers,
    inviteUser,
    removeMember,
    leaveBook,
    updateMemberRole,
    getMemberById,
    checkPermission,
    getMemberAvatar,
    getMemberNickname,
    refreshData,
    resetState
  }
}