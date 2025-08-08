// composables/usePinning.js
import { ref, computed, watch } from 'vue';
import { currentUserId } from '@/store/storage.js';

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
    console.error(`Failed to parse pinned IDs for ${itemType}:`, e);
    return [];
  }
};

const savePinnedIds = (itemType, ids) => {
  const key = getStorageKey(itemType);
  if (!key) return;
  try {
    uni.setStorageSync(key, JSON.stringify(ids));
  } catch (e) {
    console.error(`Failed to save pinned IDs for ${itemType}:`, e);
  }
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
    if (!Array.isArray(pinnedIds.value)) {
      return false;
    }
    return pinnedIds.value.includes(itemId);
  };

  const sortedItems = computed(() => {
    // 确保 initialItems 是一个 ref，并且数据已经加载
    const items = initialItems.value;
    if (!Array.isArray(items)) {
      return [];
    }
    
    const sortableItems = [...items];
    
    return sortableItems.sort((a, b) => {
      const isAPinned = isPinned(a._id);
      const isBPinned = isPinned(b._id);

      if (isAPinned && !isBPinned) return -1;
      if (!isAPinned && isBPinned) return 1;
      
      if (isAPinned && isBPinned) {
        // 两者都置顶，按置顶时间（数组中的顺序）排序
        return pinnedIds.value.indexOf(a._id) - pinnedIds.value.indexOf(b._id);
      }
      
      // 都不置顶，维持原顺序
      return 0;
    });
  });
  
  const refreshPinnedIds = () => {
      pinnedIds.value = getPinnedIds(itemType);
  };

  // 监听用户变化，自动刷新置顶列表
  watch(currentUserId, () => {
      refreshPinnedIds();
  });

  return {
    sortedItems,
    isPinned,
    togglePin,
    refreshPinnedIds
  };
}
