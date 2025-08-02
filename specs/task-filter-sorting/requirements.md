# Requirements Document

## Introduction

为任务过滤器增加排序功能，允许用户通过下拉选择器按照不同的条件对任务进行升序和降序排序。该功能将提升用户在管理大量任务时的效率，使用户能够根据自己的需求快速找到相关任务。

## Requirements

### Requirement 1

**User Story:** 作为用户，我希望能够按照任务创建时间对任务进行排序，这样我可以快速找到最新创建或最早创建的任务。

#### Acceptance Criteria

1. WHEN 用户点击排序下拉选择器 THEN 系统 SHALL 显示"创建时间"排序选项
2. WHEN 用户选择"创建时间-升序" THEN 系统 SHALL 按照任务创建时间从早到晚显示任务列表
3. WHEN 用户选择"创建时间-降序" THEN 系统 SHALL 按照任务创建时间从晚到早显示任务列表
4. WHEN 任务列表按创建时间排序完成 THEN 系统 SHALL 保持当前排序状态直到用户改变排序条件

### Requirement 2

**User Story:** 作为用户，我希望能够按照任务更新时间对任务进行排序，这样我可以快速找到最近修改或很久未修改的任务。

#### Acceptance Criteria

1. WHEN 用户点击排序下拉选择器 THEN 系统 SHALL 显示"更新时间"排序选项
2. WHEN 用户选择"更新时间-升序" THEN 系统 SHALL 按照任务最后更新时间从早到晚显示任务列表
3. WHEN 用户选择"更新时间-降序" THEN 系统 SHALL 按照任务最后更新时间从晚到早显示任务列表
4. WHEN 任务没有更新时间记录 THEN 系统 SHALL 使用创建时间作为更新时间进行排序

### Requirement 3

**User Story:** 作为用户，我希望能够按照任务的tag类别对任务进行排序，这样我可以将相同类型的任务聚集在一起查看。

#### Acceptance Criteria

1. WHEN 用户点击排序下拉选择器 THEN 系统 SHALL 显示"tag类别"排序选项
2. WHEN 用户选择"tag类别-升序" THEN 系统 SHALL 首先将具有相同tag的任务分组，然后按照tag名称的字母顺序从A到Z显示各组
3. WHEN 用户选择"tag类别-降序" THEN 系统 SHALL 首先将具有相同tag的任务分组，然后按照tag名称的字母顺序从Z到A显示各组
4. WHEN 同一tag组内有多个任务 THEN 系统 SHALL 按照任务创建时间降序排列组内任务
5. WHEN 任务有多个tag THEN 系统 SHALL 使用第一个tag进行分组和排序
6. WHEN 任务没有tag THEN 系统 SHALL 将这些任务作为单独的"无tag"组排在最后

### Requirement 4

**User Story:** 作为用户，我希望排序功能有良好的用户界面，这样我可以直观地了解当前的排序状态并轻松切换排序方式。

#### Acceptance Criteria

1. WHEN 页面加载 THEN 系统 SHALL 默认按照创建时间降序排列任务
2. WHEN 用户选择新的排序方式 THEN 系统 SHALL 在500毫秒内完成排序并更新显示
3. WHEN 排序进行中 THEN 系统 SHALL 显示加载状态指示器
4. WHEN 排序完成 THEN 系统 SHALL 在下拉选择器中显示当前选中的排序方式
5. WHEN 用户切换页面后返回 THEN 系统 SHALL 从本地存储中读取用户最后选择的排序方式
6. WHEN 用户关闭应用后重新打开 THEN 系统 SHALL 从本地存储中恢复用户最后选择的排序方式

### Requirement 5

**User Story:** 作为用户，我希望排序功能与现有的过滤功能兼容，这样我可以同时使用过滤和排序来管理任务。

#### Acceptance Criteria

1. WHEN 用户同时使用过滤和排序功能 THEN 系统 SHALL 先应用过滤条件再应用排序条件
2. WHEN 用户改变过滤条件 THEN 系统 SHALL 保持当前的排序方式并重新排序过滤后的结果
3. WHEN 用户改变排序条件 THEN 系统 SHALL 保持当前的过滤条件并重新排序过滤后的结果
4. WHEN 过滤结果为空 THEN 系统 SHALL 显示"暂无数据"提示，排序选择器保持可用状态

### Requirement 6

**User Story:** 作为用户，我希望我的排序偏好能够独立保存，这样不会受到其他用户或设备的影响。

#### Acceptance Criteria

1. WHEN 用户选择排序方式 THEN 系统 SHALL 将排序偏好以JSON格式保存到本地存储中，存储键名为`task_sort_${userId}_${todorbookId}`
2. WHEN 多个用户使用同一设备 THEN 系统 SHALL 基于userId和todorbookId为每个用户的每个项目册独立保存排序偏好
3. WHEN 用户切换账户 THEN 系统 SHALL 监听currentUserId变化并加载对应用户的排序偏好设置
4. WHEN 新用户首次使用或无本地存储数据 THEN 系统 SHALL 使用默认排序方式（创建时间降序）
5. WHEN 本地存储数据损坏或丢失 THEN 系统 SHALL 通过try-catch错误处理回退到默认排序方式
6. WHEN 保存排序偏好 THEN 系统 SHALL 同时保存timestamp时间戳用于数据追溯