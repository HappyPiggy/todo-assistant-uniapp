<template>
	<view class="edit-task">
		<uni-forms ref="form" :model="formData" :rules="rules" label-position="top">
			<!-- 基本信息 -->
			<view class="form-section">
				<view class="section-header">
					<text class="section-title">基本信息</text>
				</view>

				<uni-forms-item name="title" label="任务标题" required>
					<uni-easyinput 
						v-model="formData.title" 
						placeholder="请输入任务标题"
						:clearable="true"
						:maxlength="200">
					</uni-easyinput>
				</uni-forms-item>

				<uni-forms-item name="description" label="任务描述">
					<uni-easyinput 
						v-model="formData.description" 
						type="textarea"
						placeholder="描述任务的详细内容（可选）"
						:maxlength="2000"
						:clearable="true">
					</uni-easyinput>
				</uni-forms-item>
			</view>

			<!-- 任务属性 -->
			<view class="form-section">
				<view class="section-header">
					<text class="section-title">任务属性</text>
				</view>

				<uni-forms-item name="priority" label="优先级">
					<uni-data-picker 
						v-model="formData.priority" 
						:localdata="priorityOptions"
						placeholder="选择优先级">
					</uni-data-picker>
				</uni-forms-item>

				<uni-forms-item name="due_date" label="截止日期">
					<uni-datetime-picker 
						v-model="formData.due_date"
						type="date"
						:clear-icon="true"
						placeholder="选择截止日期">
					</uni-datetime-picker>
				</uni-forms-item>

				<uni-forms-item name="estimated_hours" label="预估工时（小时）">
					<uni-easyinput 
						v-model="formData.estimated_hours" 
						type="number"
						placeholder="预估完成所需工时"
						:min="0"
						:step="0.5">
					</uni-easyinput>
				</uni-forms-item>
			</view>

			<!-- 分类标签 -->
			<view class="form-section">
				<view class="section-header">
					<text class="section-title">分类标签</text>
					<view class="add-tag-btn" @click="openTagManager">
						<uni-icons color="#007AFF" size="18" type="plus" />
						<text class="add-tag-text">管理</text>
					</view>
				</view>

				<view class="tags-container" v-if="formData.tags.length > 0">
					<view 
						v-for="(tag, index) in formData.tags" 
						:key="getTagKey(tag, index)"
						class="tag-item"
						:style="{ backgroundColor: getTagColor(tag) }">
						<text class="tag-text">{{ getTagName(tag) }}</text>
						<view class="remove-tag" @click="removeTag(index)">
							<uni-icons color="#ffffff" size="14" type="clear" />
						</view>
					</view>
				</view>
				<view v-else class="empty-tags">
					<text class="empty-text">暂无标签，点击右上角管理</text>
				</view>
			</view>

			<!-- 父任务选择 -->
			<view class="form-section" v-if="availableParents.length > 0 || formData.parent_id">
				<view class="section-header">
					<text class="section-title">父任务</text>
				</view>

				<uni-forms-item name="parent_id" label="选择父任务">
					<uni-data-picker 
						v-model="formData.parent_id" 
						:localdata="availableParents"
						placeholder="选择父任务（可选）">
					</uni-data-picker>
				</uni-forms-item>
			</view>
		</uni-forms>

		<!-- 底部按钮 -->
		<view class="button-section">
			<button class="cancel-btn" @click="cancel">取消</button>
			<button class="save-btn" @click="saveTask" :loading="saving">
				{{ saving ? '保存中...' : '保存' }}
			</button>
		</view>

		<!-- 添加标签弹窗 -->
		<uni-popup ref="tagPopup" type="dialog">
			<uni-popup-dialog 
				ref="tagDialog"
				title="添加标签"
				placeholder="请输入标签名称"
				:value="newTag"
				@confirm="addTag"
				@close="closeTagDialog">
			</uni-popup-dialog>
		</uni-popup>
	</view>
</template>

<script src="./edit.js"></script>

<style lang="scss" scoped src="./edit.scss"></style>