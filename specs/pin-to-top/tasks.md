# 实施计划

- [ ] 1. **创建 `usePinning` Composable**
    - [ ] 在 `/composables` 目录下创建 `usePinning.js` 文件。
    - [ ] 实现技术方案中设计的 `usePinning` 函数，包括 `getStorageKey`, `getPinnedIds`, `savePinnedIds`, `togglePin`, `isPinned`, 和 `sortedItems`。
    - [ ] 从 `@/store/storage.js` 导入 `currentUserId`。
    - _需求: 1, 2, 3_

- [ ] 2. **项目册置顶功能实现 (`pages/list/list.vue`)**
    - [ ] 导入 `usePinning` Composable。
    - [ ] 使用 `usePinning` 初始化项目册的置顶逻辑，并将 `todoBooks` 作为源数据传入。
    - [ ] 将列表渲染的 `v-for` 指令从 `todoBooks` 修改为 `usePinning` 返回的 `sortedItems`。
    - [ ] 在项目册卡片的 `card-header` 中，根据 `isPinned` 状态添加一个图钉图标。
    - [ ] 在 `uni-popup` 操作菜单中，添加“置顶”/“取消置顶”按钮，并绑定 `togglePin` 事件。
    - [ ] 确保在用户切换 (`onUserSwitched`) 或数据刷新时，置顶状态能正确更新。
    - _需求: 1, 3_

- [ ] 3. **任务置顶功能实现 (`pages/todobooks/detail.vue` & `VirtualTaskList.vue`)**
    - [ ] **`pages/todobooks/detail.vue`**:
        - [ ] 导入 `usePinning` Composable。
        - [ ] 使用 `usePinning` 初始化任务的置顶逻辑，并将 `filteredTasks` 作为源数据传入。
        - [ ] 将传递给 `VirtualTaskList` 组件的 `:tasks` prop 修改为 `usePinning` 返回的 `sortedItems`。
        - [ ] 将 `isPinned` 和 `togglePin` 函数作为 props 传递给 `VirtualTaskList` 组件。
    - [ ] **`pages/todobooks/components/task/VirtualTaskList.vue`**:
        - [ ] 在 `props` 中定义接收 `isPinned` 和 `togglePin`。
        - [ ] 在任务项模板中，根据 `isPinned` 状态添加图钉图标。
        - [ ] 在任务菜单的逻辑中，添加“置顶”/“取消置顶”的选项，并触发 `togglePin` 事件。
    - _需求: 2, 3_

- [ ] 4. **最终测试**
    - [ ] 测试项目册置顶：置顶、取消置顶、多项置顶顺序、关闭应用后状态保持。
    - [ ] 测试任务置顶：置顶、取消置顶、在不同筛选条件下置顶、关闭应用后状态保持。
    - [ ] 测试用户隔离：切换不同用户登录，检查置顶数据是否隔离。
    - _需求: 1, 2, 3_
