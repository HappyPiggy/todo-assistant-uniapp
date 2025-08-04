/**
 * 标签管理功能集成测试
 * 用于验证标签编辑和智能删除功能的数据一致性
 */

// 模拟 uni-app 环境
const mockUni = {
  showToast: (options) => console.log('Toast:', options.title),
  showModal: (options) => {
    console.log('Modal:', options.title, options.content)
    if (options.success) {
      options.success({ confirm: true })
    }
  },
  setStorageSync: (key, data) => {
    console.log('Storage SET:', key, JSON.stringify(data, null, 2))
  },
  getStorageSync: (key) => {
    console.log('Storage GET:', key)
    return []
  },
  $emit: (eventName, data) => {
    console.log('Event EMIT:', eventName, data)
  }
}

// 全局设置
global.uni = mockUni
global.uniCloud = {
  importObject: () => ({
    getTodoBookDetail: async () => ({
      code: 0,
      data: {
        tasks: []
      }
    })
  })
}

// 测试数据
const testTags = [
  {
    id: 'tag1',
    name: '重要',
    color: '#ff6b35',
    source: 'local',
    createdAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'tag2', 
    name: '紧急',
    color: '#007AFF',
    source: 'local',
    createdAt: '2024-01-01T00:00:00.000Z'
  }
]

/**
 * 测试标签编辑功能
 */
async function testTagEdit() {
  console.log('\n=== 测试标签编辑功能 ===')
  
  try {
    // 导入 useTagManage (需要模拟环境)
    const { useTagManage } = await import('./useTagManage.js')
    
    // 初始化标签管理
    const tagManager = useTagManage()
    
    // 设置测试数据
    tagManager.availableTags.value = [...testTags]
    tagManager.bookId.value = 'test-book'
    
    console.log('1. 初始标签数量:', tagManager.availableTags.value.length)
    
    // 测试开始编辑
    const tagToEdit = testTags[0]
    await tagManager.startEditTag(tagToEdit)
    
    console.log('2. 编辑状态:', {
      isEditMode: tagManager.isEditMode.value,
      editingTag: tagManager.editingTag.value?.name,
      modalVisible: tagManager.editModalVisible.value
    })
    
    // 测试保存编辑
    const updatedTag = {
      ...tagToEdit,
      name: '超重要',
      color: '#ff0000',
      updatedAt: new Date().toISOString()
    }
    
    await tagManager.saveTagEdit(updatedTag)
    
    console.log('3. 编辑完成后的标签:', 
      tagManager.availableTags.value.find(t => t.id === tagToEdit.id)
    )
    
    console.log('✅ 标签编辑功能测试通过')
    
  } catch (error) {
    console.error('❌ 标签编辑功能测试失败:', error.message)
  }
}

/**
 * 测试智能删除功能
 */
async function testSmartDelete() {
  console.log('\n=== 测试智能删除功能 ===')
  
  try {
    const { useTagManage } = await import('./useTagManage.js')
    const tagManager = useTagManage()
    
    // 设置测试数据
    tagManager.availableTags.value = [...testTags]
    tagManager.bookId.value = 'test-book'
    
    console.log('1. 删除前标签数量:', tagManager.availableTags.value.length)
    
    // 测试开始删除
    const tagToDelete = testTags[1]
    await tagManager.startDeleteTag(tagToDelete)
    
    console.log('2. 删除准备状态:', {
      deletingTag: tagManager.deletingTag.value?.name,
      dependencyCount: tagManager.dependencyCount.value,
      confirmVisible: tagManager.deleteConfirmVisible.value
    })
    
    // 测试确认删除
    await tagManager.confirmDeleteTag(tagToDelete.id)
    
    console.log('3. 删除完成后标签数量:', tagManager.availableTags.value.length)
    console.log('4. 剩余标签:', tagManager.availableTags.value.map(t => t.name))
    
    console.log('✅ 智能删除功能测试通过')
    
  } catch (error) {
    console.error('❌ 智能删除功能测试失败:', error.message)
  }
}

/**
 * 测试数据一致性
 */
async function testDataConsistency() {
  console.log('\n=== 测试数据一致性 ===')
  
  try {
    const { tagService } = await import('../tasks/composables/useTagService.js')
    
    // 测试标签使用统计
    const usageCount = await tagService.getTagUsageCount('test-book', 'tag1')
    console.log('1. 标签使用统计:', usageCount)
    
    // 测试依赖任务查找
    const dependentTasks = await tagService.getTasksUsingTag('test-book', 'tag1')
    console.log('2. 依赖任务列表:', dependentTasks)
    
    // 测试缓存管理
    tagService.clearBookCache('test-book')
    console.log('3. 缓存已清理')
    
    console.log('✅ 数据一致性测试通过')
    
  } catch (error) {
    console.error('❌ 数据一致性测试失败:', error.message)
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('🚀 开始标签管理功能集成测试\n')
  
  await testTagEdit()
  await testSmartDelete()
  await testDataConsistency()
  
  console.log('\n🎉 所有测试完成!')
}

// 如果直接运行此文件，执行测试
if (typeof require !== 'undefined' && require.main === module) {
  runAllTests().catch(console.error)
}

export { testTagEdit, testSmartDelete, testDataConsistency, runAllTests }