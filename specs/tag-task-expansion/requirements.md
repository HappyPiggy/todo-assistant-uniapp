# Requirements Document

## Introduction

本功能旨在增强数据统计页面中饼图下方tag列表的交互性，通过点击tag项目可以展开显示该tag下的所有相关任务，任务按花费金额倒序排列，用户可以点击具体任务跳转到任务详情页面。这将提升用户在数据统计页面的操作效率和信息获取便利性。

## Requirements

### Requirement 1

**User Story:** 作为用户，我希望能够点击统计页面饼图下方的tag列表项，以便展开查看该tag下的具体任务信息

#### Acceptance Criteria

1. WHEN 用户点击饼图下方的tag列表项 THEN 系统 SHALL 在该tag项下方展开显示相关任务列表
2. WHEN 用户再次点击同一个tag列表项 THEN 系统 SHALL 收起该tag的任务列表
3. WHEN 用户点击其他tag列表项 THEN 系统 SHALL 收起当前展开的任务列表并展开新选中tag的任务列表
4. WHEN tag项展开时 THEN 系统 SHALL 显示展开指示图标（如下拉箭头）并应用相应的视觉反馈

### Requirement 2

**User Story:** 作为用户，我希望展开的任务列表按照花费金额倒序排列，以便快速识别高消费任务

#### Acceptance Criteria

1. WHEN tag的任务列表展开时 THEN 系统 SHALL 将任务按actual_cost字段从高到低排序
2. WHEN 任务的actual_cost为空或0时 THEN 系统 SHALL 将这些任务排在列表末尾
3. WHEN 多个任务的actual_cost相同时 THEN 系统 SHALL 保持原有的任务顺序

### Requirement 3

**User Story:** 作为用户，我希望在展开的任务列表中看到任务标题和花费金额，以便快速了解任务信息

#### Acceptance Criteria

1. WHEN 任务列表展开时 THEN 系统 SHALL 显示每个任务的标题和实际花费金额
2. WHEN 任务标题过长时 THEN 系统 SHALL 使用省略号截断显示
3. WHEN 任务没有标题时 THEN 系统 SHALL 显示"无标题"
4. WHEN 任务没有actual_cost时 THEN 系统 SHALL 显示"¥0.00"
5. WHEN 展开的任务列表超过一定数量时 THEN 系统 SHALL 限制最大高度并提供滚动

### Requirement 4

**User Story:** 作为用户，我希望能够点击展开列表中的具体任务，以便跳转到该任务的详情页面

#### Acceptance Criteria

1. WHEN 用户点击展开列表中的任务项 THEN 系统 SHALL 导航到该任务的详情页面
2. WHEN 跳转到任务详情页面时 THEN 系统 SHALL 传递正确的任务ID和TodoBook ID参数
3. WHEN 任务详情页面不存在时 THEN 系统 SHALL 显示错误提示"任务详情页面不存在"

### Requirement 5

**User Story:** 作为用户，我希望tag列表的展开/收起动画流畅自然，以便获得良好的用户体验

#### Acceptance Criteria

1. WHEN tag列表展开或收起时 THEN 系统 SHALL 播放平滑的动画效果
2. WHEN 动画播放时 THEN 系统 SHALL 确保动画时长不超过300ms
3. WHEN 动画播放时 THEN 系统 SHALL 使用ease-in-out缓动函数
4. WHEN 用户快速连续点击时 THEN 系统 SHALL 防止动画冲突

### Requirement 6

**User Story:** 作为用户，我希望在移动端设备上也能正常使用tag展开功能，以便在不同设备上保持一致体验

#### Acceptance Criteria

1. WHEN 在移动端设备访问时 THEN 系统 SHALL 确保tag列表项的点击区域足够大
2. WHEN 在小屏设备上展示时 THEN 系统 SHALL 调整任务列表项的字体大小和间距
3. WHEN 在移动端展开任务列表时 THEN 系统 SHALL 确保滚动操作不与页面滚动冲突
4. WHEN 在暗色主题下显示时 THEN 系统 SHALL 应用适当的暗色主题样式