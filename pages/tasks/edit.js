export default {
	data() {
		return {
			taskId: '',
			bookId: '',
			saving: false,
			loading: true,
			newTag: '',
			availableParents: [],
			originalData: null,
			formData: {
				title: '',
				description: '',
				priority: 'medium',
				due_date: null,
				estimated_hours: '',
				tags: [],
				parent_id: null
			},
			rules: {
				title: {
					rules: [
						{ required: true, errorMessage: '请输入任务标题' },
						{ minLength: 1, maxLength: 200, errorMessage: '标题长度应为1-200个字符' }
					]
				}
			},
			priorityOptions: [
				{ value: 'low', text: '低优先级' },
				{ value: 'medium', text: '中优先级' },
				{ value: 'high', text: '高优先级' },
				{ value: 'urgent', text: '紧急' }
			]
		}
	},
	onLoad(options) {
		if (!options.id || !options.bookId) {
			uni.showToast({
				title: '缺少必要参数',
				icon: 'error'
			})
			uni.navigateBack()
			return
		}
		this.taskId = options.id
		this.bookId = options.bookId
		
		this.loadTaskData()
		this.loadParentTasks()
	},
	methods: {
		// 加载任务数据
		async loadTaskData() {
			try {
				const todoBooksObj = uniCloud.importObject('todobook-co')
				const result = await todoBooksObj.getTodoItemDetail(this.taskId)
				
				if (result.code === 0 && result.data) {
					const task = result.data
					
					// 填充表单数据
					this.formData = {
						title: task.title || '',
						description: task.description || '',
						priority: task.priority || 'medium',
						due_date: task.due_date || null,
						estimated_hours: task.estimated_hours ? String(task.estimated_hours) : '',
						tags: task.tags || [],
						parent_id: task.parent_id || null
					}
					
					// 保存原始数据用于比较
					this.originalData = JSON.parse(JSON.stringify(this.formData))
				} else {
					throw new Error(result.message || '加载任务数据失败')
				}
			} catch (error) {
				console.error('加载任务数据失败:', error)
				uni.showToast({
					title: '加载失败',
					icon: 'error'
				})
				setTimeout(() => {
					uni.navigateBack()
				}, 1500)
			} finally {
				this.loading = false
			}
		},
		
		// 加载父任务数据
		async loadParentTasks() {
			if (!this.bookId || typeof this.bookId !== 'string') {
				console.warn("bookId is empty, undefined or not string:", this.bookId)
				return
			}
			
			try {
				// 使用云对象获取可用的父任务
				const todoBooksObj = uniCloud.importObject('todobook-co')
				const result = await todoBooksObj.getTodoBookDetail(this.bookId)
				
				if (result.code === 0 && result.data.tasks) {
					// 筛选出可作为父任务的任务
					// 1. 不能选择已完成的任务
					// 2. 不能选择有父任务的任务（避免多层嵌套）
					// 3. 不能选择当前编辑的任务
					// 4. 不能选择当前任务的子任务
					const availableTasks = result.data.tasks.filter(task => {
						// 过滤当前任务
						if (task._id === this.taskId) return false
						// 过滤已完成的任务
						if (task.status === 'completed') return false
						// 过滤已经有父任务的任务（只允许一层父子关系）
						if (task.parent_id) return false
						// 过滤当前任务的子任务
						if (task.parent_id === this.taskId) return false
						return true
					})
					
					this.availableParents = availableTasks.map(task => ({
						value: task._id,
						text: task.title
					}))
				}
			} catch (error) {
				console.error('加载父任务失败:', error)
			}
		},

		async saveTask() {
			try {
				await this.$refs.form.validate()
			} catch (errors) {
				console.log('表单验证失败:', errors)
				return
			}

			// 准备更新数据
			const updateData = {
				title: this.formData.title.trim(),
				description: this.formData.description.trim(),
				priority: this.formData.priority,
				parent_id: this.formData.parent_id || null,
				due_date: this.formData.due_date,
				tags: this.formData.tags || []
			}

			// 添加预估工时
			if (this.formData.estimated_hours) {
				updateData.estimated_hours = parseFloat(this.formData.estimated_hours)
			} else {
				updateData.estimated_hours = null
			}

			// 乐观更新：立即返回并显示成功消息
			uni.showToast({
				title: '保存中...',
				icon: 'loading',
				duration: 10000 // 设置较长时间，后续会手动关闭
			})

			// 立即返回列表页
			setTimeout(() => {
				uni.navigateBack()
			}, 300)

			// 异步更新任务
			this.updateTaskAsync(updateData)
		},

		async updateTaskAsync(updateData) {
			try {
				// 使用云对象更新任务
				const todoBooksObj = uniCloud.importObject('todobook-co')
				const result = await todoBooksObj.updateTodoItem(this.taskId, updateData)
				
				// 隐藏loading提示
				uni.hideToast()
				
				if (result.code === 0) {
					// 更新成功，显示成功提示
					uni.showToast({
						title: '保存成功',
						icon: 'success',
						duration: 1500
					})
				} else {
					// 更新失败，显示错误
					uni.showToast({
						title: result.message || '保存失败',
						icon: 'error',
						duration: 2000
					})
				}
			} catch (error) {
				console.error('更新任务失败:', error)
				uni.hideToast()
				uni.showToast({
					title: error.message || '网络错误',
					icon: 'error',
					duration: 2000
				})
			}
		},

		cancel() {
			if (this.hasChanges()) {
				uni.showModal({
					title: '确认取消',
					content: '确定要取消编辑吗？未保存的修改将丢失。',
					success: (res) => {
						if (res.confirm) {
							uni.navigateBack()
						}
					}
				})
			} else {
				uni.navigateBack()
			}
		},

		hasChanges() {
			if (!this.originalData) return false
			return JSON.stringify(this.formData) !== JSON.stringify(this.originalData)
		},

		openTagManager() {
			// 跳转到标签管理页面
			const currentTagsStr = encodeURIComponent(JSON.stringify(this.formData.tags))
			uni.navigateTo({
				url: `/pages/tags/manage?taskId=${this.taskId}&bookId=${this.bookId}&currentTags=${currentTagsStr}`
			})
		},

		// 从标签管理页面返回时调用
		updateTaskTags(selectedTags) {
			this.formData.tags = selectedTags
		},

		// 获取标签的唯一key
		getTagKey(tag, index) {
			if (typeof tag === 'object' && tag.id) {
				return tag.id
			}
			return index
		},

		// 获取标签名称
		getTagName(tag) {
			if (typeof tag === 'object' && tag.name) {
				return tag.name
			}
			return tag // 兼容旧格式的字符串标签
		},

		// 获取标签颜色
		getTagColor(tag) {
			if (typeof tag === 'object' && tag.color) {
				return tag.color
			}
			return '#f0f6ff' // 默认颜色，兼容旧格式
		},

		showAddTag() {
			this.newTag = ''
			this.$refs.tagPopup.open()
		},

		addTag(value) {
			const tag = value.trim()
			if (tag && !this.formData.tags.includes(tag)) {
				this.formData.tags.push(tag)
			}
			this.closeTagDialog()
		},

		removeTag(index) {
			this.formData.tags.splice(index, 1)
		},

		closeTagDialog() {
			this.$refs.tagPopup.close()
			this.newTag = ''
		}
	}
}