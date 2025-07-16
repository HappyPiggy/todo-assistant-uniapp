export default {
	data() {
		return {
			bookId: '',
			creating: false,
			newTag: '',
			availableParents: [],
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
		if (!options.bookId) {
			uni.showToast({
				title: '缺少项目册ID',
				icon: 'error'
			})
			uni.navigateBack()
			return
		}
		this.bookId = options.bookId
		
		// 如果传入了父任务ID，设置默认值
		if (options.parentId) {
			this.formData.parent_id = options.parentId
		}
		
		this.loadParentTasks()
	},
	methods: {
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
					console.log('所有任务数量:', result.data.tasks.length)
					console.log('任务列表:', result.data.tasks)
					
					// 筛选出可作为父任务的任务
					// 1. 不能选择已完成的任务
					// 2. 不能选择有父任务的任务（避免多层嵌套）
					const availableTasks = result.data.tasks.filter(task => {
						// 过滤已完成的任务
						if (task.status === 'completed') return false
						// 过滤已经有父任务的任务（只允许一层父子关系）
						if (task.parent_id) return false
						return true
					})
					
					console.log('可选父任务数量:', availableTasks.length)
					console.log('可选父任务:', availableTasks)
					
					this.availableParents = availableTasks.map(task => ({
						value: task._id,
						text: task.title
					}))
				}
			} catch (error) {
				console.error('加载父任务失败:', error)
			}
		},

		async createTask() {
			try {
				await this.$refs.form.validate()
			} catch (errors) {
				console.log('表单验证失败:', errors)
				return
			}

			// 准备任务数据
			const taskData = {
				todobook_id: this.bookId,
				title: this.formData.title.trim(),
				description: this.formData.description.trim(),
				priority: this.formData.priority,
				parent_id: this.formData.parent_id || null,
				due_date: this.formData.due_date,
				tags: this.formData.tags || []
			}

			// 添加预估工时
			if (this.formData.estimated_hours) {
				taskData.estimated_hours = parseFloat(this.formData.estimated_hours)
			}

			// 乐观更新：立即返回并显示成功消息
			uni.showToast({
				title: '创建中...',
				icon: 'loading',
				duration: 10000 // 设置较长时间，后续会手动关闭
			})

			// 立即返回列表页
			setTimeout(() => {
				uni.navigateBack()
			}, 300)

			// 异步创建任务
			this.createTaskAsync(taskData)
		},

		async createTaskAsync(taskData) {
			try {
				// 使用云对象创建任务
				const todoBooksObj = uniCloud.importObject('todobook-co')
				const result = await todoBooksObj.createTodoItem(taskData)
				
				// 隐藏loading提示
				uni.hideToast()
				
				if (result.code === 0) {
					// 创建成功，显示成功提示
					uni.showToast({
						title: '创建成功',
						icon: 'success',
						duration: 1500
					})
				} else {
					// 创建失败，显示错误
					uni.showToast({
						title: result.message || '创建失败',
						icon: 'error',
						duration: 2000
					})
				}
			} catch (error) {
				console.error('创建任务失败:', error)
				uni.hideToast()
				uni.showToast({
					title: error.message || '网络错误',
					icon: 'error',
					duration: 2000
				})
			}
		},
		
		onTaskCreated(result) {
			// 任务创建成功事件处理
			this.creating = false
			
			if (result.code === 0) {
				uni.showToast({
					title: '创建成功',
					icon: 'success'
				})

				setTimeout(() => {
					uni.navigateBack()
				}, 1500)
			} else {
				this.onCreateError({ message: result.message || '创建失败' })
			}
		},
		
		onCreateError(e) {
			// 任务创建失败事件处理
			this.creating = false
			console.error('创建任务失败:', e)
			uni.showToast({
				title: e.message || '创建失败',
				icon: 'error'
			})
		},

		cancel() {
			if (this.hasChanges()) {
				uni.showModal({
					title: '确认取消',
					content: '确定要取消创建任务吗？已输入的内容将丢失。',
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
			return this.formData.title.trim() || 
				   this.formData.description.trim() ||
				   this.formData.tags.length > 0
		},

		openTagManager() {
			// 跳转到标签管理页面
			const currentTagsStr = encodeURIComponent(JSON.stringify(this.formData.tags))
			uni.navigateTo({
				url: `/pages/tags/manage?bookId=${this.bookId}&currentTags=${currentTagsStr}`
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