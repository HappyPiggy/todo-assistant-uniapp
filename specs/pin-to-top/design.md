# 技术方案设计

## 1. 整体思路

利用 `uni-app` 的本地存储 `uni.storage` 来持久化用户的置顶设置。通过创建一个可复用的 Vue Composition API 函数 (Composable) 来封装置顶相关的逻辑，包括数据的读取、写入和排序。最后，在项目册列表页和任务列表页中集成这个 Composable，实现UI展示和用户交互。

## 2. 数据存储

-   **存储方式**: 使用 `uni.setStorageSync` 和 `uni.getStorageSync` 进行同步本地存储，确保操作的原子性和即时性。
-   **数据结构**:
    -   为每个用户和每种类型的置顶项（项目册、任务）创建一个独立的存储键。
    -   键的格式为 `pinned_items_${userId}_${itemType}`，例如 `pinned_items_user123_todobooks`。
    -   存储的值是一个 **JSON 字符串**，其内容为一个数组，包含被置顶项的 `_id`。例如: `["book_id_1", "book_id_3"]`。
-   **用户隔离**: 通过在存储键中嵌入 `userId` 来实现。`userId` 从 `store/storage.js` 中导出的 `currentUserId` 获取。

## 3. 核心逻辑：`usePinning` Composable

创建一个新文件 `composables/usePinning.js` 来统一管理置顶逻辑。

```javascript
// composables/usePinning.js
import { ref, computed } from 'vue';
import { currentUserId } from '@/store/storage.js'; // 假设可以从这里获取

const getStorageKey = (itemType) => {
  if (!currentUserId.value) return null;
  return `pinned_items_${currentUserId.value}_${itemType}`;
};

const getPinnedIds = (itemType) => {
  const key = getStorageKey(itemType);
  if (!key) return [];
  try {
    const data = uni.getStorageSync(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const savePinnedIds = (itemType, ids) => {
  const key = getStorageKey(itemType);
  if (!key) return;
  uni.setStorageSync(key, JSON.stringify(ids));
};

export function usePinning(itemType, initialItems) {
  const pinnedIds = ref(getPinnedIds(itemType));

  const togglePin = (itemId) => {
    const ids = [...pinnedIds.value];
    const index = ids.indexOf(itemId);
    if (index > -1) {
      ids.splice(index, 1); // 取消置顶
    } else {
      ids.unshift(itemId); // 置顶（新置顶的排在最前）
    }
    pinnedIds.value = ids;
    savePinnedIds(itemType, ids);
  };

  const isPinned = (itemId) => {
    return pinnedIds.value.includes(itemId);
  };

  const sortedItems = computed(() => {
    const items = [...initialItems.value];
    return items.sort((a, b) => {
      const isAPinned = isPinned(a._id);
      const isBPinned = isPinned(b._id);
      if (isAPinned && !isBPinned) return -1;
      if (!isAPinned && isBPinned) return 1;
      if (isAPinned && isBPinned) {
        // 两者都置顶，按置顶时间（数组中的顺序）排序
        return pinnedIds.value.indexOf(a._id) - pinnedIds.value.indexOf(b._id);
      }
      // 都不置顶，维持原顺序（或按其他逻辑）
      return 0;
    });
  });
  
  // 提供一个刷新函数，当外部列表变化时可以更新
  const refreshPinnedIds = () => {
      pinnedIds.value = getPinnedIds(itemType);
  }

  return {
    sortedItems,
    isPinned,
    togglePin,
    refreshPinnedIds
  };
}
```

## 4. 实施计划

### 4.1. `pages/list/list.vue` (项目册列表)

1.  **引入 `usePinning`**: 在 `<script setup>` 中引入并初始化 `usePinning`。
    ```javascript
    import { usePinning } from '@/composables/usePinning.js';
    const { sortedItems: sortedTodoBooks, isPinned, togglePin } = usePinning('todobooks', todoBooks);
    ```
2.  **修改列表渲染**: 将 `v-for` 的目标从 `todoBooks` 改为 `sortedTodoBooks`。
3.  **修改操作菜单**:
    -   在 `action-list` 中添加一个新的 `action-item` 用于置顶/取消置顶。
    -   其文本和图标根据 `isPinned(currentBook._id)` 的结果进行动态切换。
    -   点击事件调用 `togglePin(currentBook._id)`。
4.  **添加置顶标识**: 在项目册卡片的 `card-header` 中，添加一个图钉图标 (`<uni-icons type="pin-filled" />`)，并使用 `v-if="isPinned(book._id)"` 控制其显示。

### 4.2. `pages/todobooks/components/task/VirtualTaskList.vue` (任务列表)

由于任务列表是虚拟列表，直接修改 `detail.vue` 中的 `filteredTasks` 会更高效。

1.  **修改 `pages/todobooks/detail.vue`**:
    -   引入 `usePinning` 并将其应用于 `filteredTasks`。
    ```javascript
    import { usePinning } from '@/composables/usePinning.js';
    // ... useTaskData() ...
    const { sortedItems: sortedAndPinnedTasks, isPinned, togglePin } = usePinning('tasks', filteredTasks);
    ```
    -   将传递给 `VirtualTaskList` 组件的 `:tasks` prop 从 `filteredTasks` 改为 `sortedAndPinnedTasks`。
    -   将 `isPinned` 和 `togglePin` 函数也作为 props 传递给 `VirtualTaskList`。

2.  **修改 `pages/todobooks/components/task/VirtualTaskList.vue`**:
    -   接收 `isPinned` 和 `togglePin` props。
    -   在任务项的菜单中，添加“置顶”/“取消置顶”选项，调用 `togglePin`。
    -   在任务项的标题旁边，根据 `isPinned` 的结果显示或隐藏图钉图标。

## 5. 安全性

-   该功能完全在前端实现，不涉及后端API变更，因此不引入新的后端安全风险。
-   数据存储在用户设备的本地存储中，并与用户ID绑定，遵循了用户数据隔离的原则。
