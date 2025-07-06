# uniCloud-db 组件使用文档

## 概述

`uniCloud-db` 是一个数据库查询组件，极大简化了前端从 uniCloud 获取数据的操作。该组件将复杂的数据库操作封装成一个简单易用的组件，支持查询、新增、更新和删除数据库记录。

## 核心特性

### 1. 简化数据获取
- 一行代码即可获取并渲染数据库数据
- 支持使用 JQL（JavaScript Query Language）进行复杂查询
- 自动数据加载和渲染

### 2. 灵活配置
- 集合选择（collection）
- 条件过滤（where 子句）
- 排序（orderby）
- 分页支持
- 嵌套组件查询

### 3. 高级方法
- `loadData()`: 手动数据加载
- `loadMore()`: 获取更多数据
- `add()`: 插入新记录
- `update()`: 修改现有记录
- `remove()`: 删除记录

## 基本用法

### 简单查询示例

```vue
<template>
  <view>
    <unicloud-db 
      collection="user" 
      :where="`username=='${tempstr}'`" 
      v-slot:default="{data, loading, error}"
    >
      <view v-if="loading">加载中...</view>
      <view v-else-if="error">{{ error.message }}</view>
      <view v-else>
        <view v-for="item in data" :key="item._id">
          {{ item.name }}
        </view>
      </view>
    </unicloud-db>
  </view>
</template>
```

### 带分页的查询

```vue
<template>
  <unicloud-db 
    collection="articles" 
    :where="'status == 1'"
    orderby="create_time desc"
    :page-size="10"
    :getcount="true"
    v-slot:default="{data, loading, hasMore, pagination}"
  >
    <view v-for="item in data" :key="item._id">
      <text>{{ item.title }}</text>
    </view>
    
    <view v-if="hasMore">
      <button @click="loadMore">加载更多</button>
    </view>
  </unicloud-db>
</template>
```

## 组件属性

### 基础属性

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| collection | String | - | 数据库集合名称 |
| where | String | - | 查询条件，使用 JQL 语法 |
| orderby | String | - | 排序规则 |
| field | String | - | 查询字段 |
| groupby | String | - | 分组字段 |
| group-field | String | - | 分组统计字段 |
| distinct | Boolean | false | 是否去重 |

### 分页属性

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| page-size | Number | 20 | 每页数据条数 |
| page-current | Number | 1 | 当前页码 |
| getcount | Boolean | false | 是否获取总数 |
| gettree | Boolean | false | 是否获取树形数据 |

### 加载属性

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| manual | Boolean | false | 是否手动加载 |
| loadtime | String | 'auto' | 加载时机 |

## 插槽(Slots)

### 默认插槽

```vue
<unicloud-db v-slot:default="{data, loading, error, options}">
  <!-- 自定义渲染内容 -->
</unicloud-db>
```

插槽参数：
- `data`: 查询结果数据
- `loading`: 加载状态
- `error`: 错误信息
- `options`: 组件选项

## 方法

### 数据操作方法

```javascript
// 获取组件实例
const db = this.$refs.udb

// 加载数据
db.loadData()

// 加载更多数据
db.loadMore()

// 添加数据
db.add(data)

// 更新数据
db.update(id, data)

// 删除数据
db.remove(id)

// 刷新数据
db.refresh()
```

## 事件

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| load | 数据加载完成 | data, ended, pagination |
| error | 加载出错 | error |
| add | 添加数据成功 | data |
| update | 更新数据成功 | data |
| remove | 删除数据成功 | data |

## 高级用法

### 联表查询

```vue
<unicloud-db 
  collection="articles,user"
  :where="'articles.author_id == user._id'"
  field="articles.*,user.name as author_name"
  v-slot:default="{data}"
>
  <view v-for="item in data" :key="item._id">
    <text>{{ item.title }} - {{ item.author_name }}</text>
  </view>
</unicloud-db>
```

### 条件查询

```vue
<template>
  <view>
    <input v-model="keyword" placeholder="搜索关键词" />
    <unicloud-db 
      collection="articles"
      :where="searchWhere"
      v-slot:default="{data}"
    >
      <view v-for="item in data" :key="item._id">
        {{ item.title }}
      </view>
    </unicloud-db>
  </view>
</template>

<script>
export default {
  data() {
    return {
      keyword: ''
    }
  },
  computed: {
    searchWhere() {
      return this.keyword ? `title.indexOf('${this.keyword}') > -1` : ''
    }
  }
}
</script>
```

### 数据缓存

```vue
<unicloud-db 
  collection="config"
  :where="'type == \"system\"'"
  :manual="false"
  :loadtime="'manual'"
  :cache="true"
  v-slot:default="{data}"
>
  <!-- 配置数据会被缓存 -->
</unicloud-db>
```

## 最佳实践

### 1. 性能优化

```vue
<!-- 使用 field 限制查询字段 -->
<unicloud-db 
  collection="user"
  field="_id,name,avatar"
  v-slot:default="{data}"
>
  <!-- 内容 -->
</unicloud-db>

<!-- 使用分页避免一次性加载大量数据 -->
<unicloud-db 
  collection="articles"
  :page-size="20"
  :getcount="true"
  v-slot:default="{data, pagination}"
>
  <!-- 内容 -->
</unicloud-db>
```

### 2. 错误处理

```vue
<unicloud-db 
  collection="user"
  v-slot:default="{data, loading, error}"
  @error="handleError"
>
  <view v-if="loading">
    <uni-load-more status="loading"></uni-load-more>
  </view>
  <view v-else-if="error">
    <text>{{ error.message }}</text>
    <button @click="reload">重试</button>
  </view>
  <view v-else>
    <!-- 正常数据显示 -->
  </view>
</unicloud-db>
```

### 3. 数据更新

```vue
<script>
export default {
  methods: {
    async addArticle() {
      try {
        const result = await this.$refs.udb.add({
          title: '新文章',
          content: '文章内容',
          status: 1
        })
        console.log('添加成功', result)
      } catch (error) {
        console.error('添加失败', error)
      }
    },
    
    async updateArticle(id) {
      try {
        const result = await this.$refs.udb.update(id, {
          title: '更新后的标题'
        })
        console.log('更新成功', result)
      } catch (error) {
        console.error('更新失败', error)
      }
    }
  }
}
</script>
```

## 注意事项

1. **权限控制**: 确保数据库集合配置了正确的权限规则
2. **字段验证**: 在数据库 schema 中配置字段验证规则
3. **索引优化**: 为常用查询字段创建索引以提高查询性能
4. **数据安全**: 避免在前端暴露敏感数据，使用云函数处理敏感操作
5. **错误处理**: 始终处理可能的错误情况，提供用户友好的错误提示

## 总结

`uniCloud-db` 组件是 uniCloud 生态系统中的核心组件，它极大简化了前端数据库操作，提供了声明式的数据查询方式。通过合理使用该组件，可以显著提高开发效率，减少样板代码，同时保持代码的可维护性和性能。

建议在列表页面、详情页面等需要动态数据的场景中使用该组件，配合 uniCloud 数据库的强大功能，可以快速构建功能完善的应用。