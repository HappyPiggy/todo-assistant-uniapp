# uniCloud DB Schema 数据库模式文档

## 概述

uniCloud DB Schema 是一个基于 JSON 的数据库表结构定义规范，为 uniCloud 云数据库提供全面的数据建模和验证功能。每个数据库集合都需要一个对应的 `.schema.json` 文件来定义其结构、验证规则和权限控制。

## 核心功能

### 1. 数据结构定义
- 使用 JSON Schema 格式定义表结构
- 支持多种数据类型（string、int、bool、object、array 等）
- 描述字段属性、约束条件和关联关系

### 2. 数据验证
- 必填字段验证
- 数据类型验证
- 值范围约束
- 格式验证（邮箱、URL、手机号等）
- 正则表达式验证
- 枚举值验证
- 自定义验证函数

### 3. 权限控制
- 表级权限控制
- 字段级读写权限
- 基于角色的访问控制
- 动态权限表达式

### 4. 高级特性
- 外键关联
- 树形数据结构
- 默认值生成
- 自动代码生成

## Schema 文件结构

### 基本结构

```json
{
  "bsonType": "object",
  "required": ["field1", "field2"],
  "permission": {
    "read": "doc.user_id == auth.uid",
    "create": true,
    "update": "doc.user_id == auth.uid",
    "delete": "doc.user_id == auth.uid"
  },
  "properties": {
    "field1": {
      "bsonType": "string",
      "title": "字段标题",
      "description": "字段描述"
    }
  }
}
```

### 字段类型定义

#### 基础类型

```json
{
  "properties": {
    "name": {
      "bsonType": "string",
      "title": "姓名",
      "minLength": 2,
      "maxLength": 20,
      "description": "用户姓名"
    },
    "age": {
      "bsonType": "int",
      "title": "年龄",
      "minimum": 0,
      "maximum": 150
    },
    "is_active": {
      "bsonType": "bool",
      "title": "是否激活",
      "defaultValue": true
    },
    "created_at": {
      "bsonType": "timestamp",
      "title": "创建时间",
      "forceDefaultValue": {
        "$env": "now"
      }
    }
  }
}
```

#### 复杂类型

```json
{
  "properties": {
    "profile": {
      "bsonType": "object",
      "title": "用户资料",
      "properties": {
        "avatar": {
          "bsonType": "string",
          "title": "头像"
        },
        "bio": {
          "bsonType": "string",
          "title": "个人简介"
        }
      }
    },
    "tags": {
      "bsonType": "array",
      "title": "标签",
      "items": {
        "bsonType": "string"
      }
    }
  }
}
```

## 验证规则

### 字符串验证

```json
{
  "email": {
    "bsonType": "string",
    "title": "邮箱",
    "format": "email",
    "errorMessage": "请输入有效的邮箱地址"
  },
  "phone": {
    "bsonType": "string",
    "title": "手机号",
    "pattern": "^1[3-9]\\d{9}$",
    "errorMessage": "请输入有效的手机号码"
  },
  "status": {
    "bsonType": "string",
    "title": "状态",
    "enum": ["active", "inactive", "pending"],
    "enumType": "select",
    "errorMessage": "状态值不正确"
  }
}
```

### 数值验证

```json
{
  "score": {
    "bsonType": "number",
    "title": "分数",
    "minimum": 0,
    "maximum": 100,
    "multipleOf": 0.1,
    "errorMessage": "分数必须在0-100之间"
  },
  "priority": {
    "bsonType": "int",
    "title": "优先级",
    "minimum": 1,
    "maximum": 5,
    "defaultValue": 3
  }
}
```

### 自定义验证函数

```json
{
  "username": {
    "bsonType": "string",
    "title": "用户名",
    "validateFunction": "type_name_check",
    "errorMessage": "用户名格式不正确"
  }
}
```

## 权限控制

### 基础权限配置

```json
{
  "permission": {
    "read": true,
    "create": true,
    "update": "doc.user_id == auth.uid",
    "delete": "doc.user_id == auth.uid",
    "count": true
  }
}
```

### 动态权限表达式

```json
{
  "permission": {
    "read": "doc.status == 'public' || doc.user_id == auth.uid",
    "create": "auth.uid != null",
    "update": "doc.user_id == auth.uid && doc.status != 'locked'",
    "delete": "doc.user_id == auth.uid || auth.role.includes('admin')"
  }
}
```

### 字段级权限

```json
{
  "properties": {
    "private_info": {
      "bsonType": "string",
      "title": "私密信息",
      "permission": {
        "read": "doc.user_id == auth.uid",
        "write": "doc.user_id == auth.uid"
      }
    }
  }
}
```

## 关联关系

### 外键关联

```json
{
  "user_id": {
    "bsonType": "string",
    "title": "用户ID",
    "foreignKey": "uni-id-users._id",
    "enumType": "tree"
  },
  "category_id": {
    "bsonType": "string",
    "title": "分类ID",
    "foreignKey": "categories._id"
  }
}
```

### 树形结构

```json
{
  "parent_id": {
    "bsonType": "string",
    "title": "父级ID",
    "parentKey": "_id",
    "enumType": "tree",
    "foreignKey": "categories._id"
  }
}
```

## 默认值与自动填充

### 静态默认值

```json
{
  "status": {
    "bsonType": "string",
    "title": "状态",
    "defaultValue": "pending"
  }
}
```

### 动态默认值

```json
{
  "user_id": {
    "bsonType": "string",
    "title": "用户ID",
    "forceDefaultValue": {
      "$env": "uid"
    }
  },
  "created_at": {
    "bsonType": "timestamp",
    "title": "创建时间",
    "forceDefaultValue": {
      "$env": "now"
    }
  }
}
```

## 索引配置

### 单字段索引

```json
{
  "index": [
    {
      "IndexName": "user_id",
      "MgoKeySchema": {
        "MgoIndexKeys": [{"Name": "user_id", "Direction": "1"}],
        "MgoIsUnique": false
      }
    }
  ]
}
```

### 复合索引

```json
{
  "index": [
    {
      "IndexName": "user_status_idx",
      "MgoKeySchema": {
        "MgoIndexKeys": [
          {"Name": "user_id", "Direction": "1"},
          {"Name": "status", "Direction": "1"}
        ],
        "MgoIsUnique": false
      }
    }
  ]
}
```

### 唯一索引

```json
{
  "index": [
    {
      "IndexName": "email_unique",
      "MgoKeySchema": {
        "MgoIndexKeys": [{"Name": "email", "Direction": "1"}],
        "MgoIsUnique": true
      }
    }
  ]
}
```

## 实际应用示例

### 用户表 Schema

```json
{
  "bsonType": "object",
  "required": ["username", "email"],
  "permission": {
    "read": "doc._id == auth.uid || auth.role.includes('admin')",
    "create": true,
    "update": "doc._id == auth.uid",
    "delete": false
  },
  "properties": {
    "_id": {
      "description": "ID，系统自动生成"
    },
    "username": {
      "bsonType": "string",
      "title": "用户名",
      "minLength": 3,
      "maxLength": 20,
      "pattern": "^[a-zA-Z0-9_]+$",
      "errorMessage": "用户名只能包含字母、数字和下划线"
    },
    "email": {
      "bsonType": "string",
      "title": "邮箱",
      "format": "email",
      "errorMessage": "请输入有效的邮箱地址"
    },
    "profile": {
      "bsonType": "object",
      "title": "用户资料",
      "properties": {
        "nickname": {
          "bsonType": "string",
          "title": "昵称",
          "maxLength": 50
        },
        "avatar": {
          "bsonType": "string",
          "title": "头像",
          "format": "url"
        },
        "bio": {
          "bsonType": "string",
          "title": "个人简介",
          "maxLength": 500
        }
      }
    },
    "created_at": {
      "bsonType": "timestamp",
      "title": "创建时间",
      "forceDefaultValue": {
        "$env": "now"
      }
    },
    "updated_at": {
      "bsonType": "timestamp",
      "title": "更新时间",
      "forceDefaultValue": {
        "$env": "now"
      }
    }
  },
  "index": [
    {
      "IndexName": "username_unique",
      "MgoKeySchema": {
        "MgoIndexKeys": [{"Name": "username", "Direction": "1"}],
        "MgoIsUnique": true
      }
    },
    {
      "IndexName": "email_unique",
      "MgoKeySchema": {
        "MgoIndexKeys": [{"Name": "email", "Direction": "1"}],
        "MgoIsUnique": true
      }
    }
  ]
}
```

### 文章表 Schema

```json
{
  "bsonType": "object",
  "required": ["title", "content", "author_id"],
  "permission": {
    "read": "doc.status == 'published' || doc.author_id == auth.uid",
    "create": "auth.uid != null",
    "update": "doc.author_id == auth.uid",
    "delete": "doc.author_id == auth.uid || auth.role.includes('admin')"
  },
  "properties": {
    "title": {
      "bsonType": "string",
      "title": "标题",
      "minLength": 1,
      "maxLength": 100,
      "errorMessage": "标题长度必须在1-100字符之间"
    },
    "content": {
      "bsonType": "string",
      "title": "内容",
      "minLength": 10,
      "errorMessage": "内容不能少于10个字符"
    },
    "author_id": {
      "bsonType": "string",
      "title": "作者ID",
      "foreignKey": "uni-id-users._id",
      "forceDefaultValue": {
        "$env": "uid"
      }
    },
    "category_id": {
      "bsonType": "string",
      "title": "分类ID",
      "foreignKey": "categories._id"
    },
    "tags": {
      "bsonType": "array",
      "title": "标签",
      "items": {
        "bsonType": "string"
      },
      "maxItems": 10
    },
    "status": {
      "bsonType": "string",
      "title": "状态",
      "enum": ["draft", "published", "archived"],
      "defaultValue": "draft",
      "errorMessage": "状态值不正确"
    },
    "view_count": {
      "bsonType": "int",
      "title": "查看次数",
      "minimum": 0,
      "defaultValue": 0
    },
    "created_at": {
      "bsonType": "timestamp",
      "title": "创建时间",
      "forceDefaultValue": {
        "$env": "now"
      }
    },
    "updated_at": {
      "bsonType": "timestamp",
      "title": "更新时间",
      "forceDefaultValue": {
        "$env": "now"
      }
    }
  },
  "index": [
    {
      "IndexName": "author_status_idx",
      "MgoKeySchema": {
        "MgoIndexKeys": [
          {"Name": "author_id", "Direction": "1"},
          {"Name": "status", "Direction": "1"}
        ]
      }
    },
    {
      "IndexName": "category_status_idx",
      "MgoKeySchema": {
        "MgoIndexKeys": [
          {"Name": "category_id", "Direction": "1"},
          {"Name": "status", "Direction": "1"}
        ]
      }
    }
  ]
}
```

## 重要注意事项

### 1. 权限表达式编写

```javascript
// 正确的权限表达式
"read": "doc.user_id == auth.uid"
"update": "doc.status == 'editable' && doc.user_id == auth.uid"
"delete": "auth.role.includes('admin') || doc.user_id == auth.uid"

// 避免复杂的嵌套逻辑，建议使用云函数处理
```

### 2. 索引设计原则

- 为经常查询的字段创建索引
- 复合索引的字段顺序很重要
- 避免过多的索引影响写入性能
- 唯一索引确保数据唯一性

### 3. 验证函数注意事项

```javascript
// 自定义验证函数文件路径：uniCloud/database/validateFunction/
// 函数返回true表示验证通过，false表示验证失败

module.exports = function(rule, value, data, callback) {
  // rule: 当前规则
  // value: 当前字段值
  // data: 整个数据对象
  // callback: 回调函数
  
  if (value && value.length < 3) {
    callback('用户名长度不能少于3位')
    return
  }
  
  callback() // 验证通过
}
```

### 4. 性能优化建议

- 合理使用字段级权限，避免返回敏感数据
- 利用索引优化查询性能
- 使用 `forceDefaultValue` 自动填充常用字段
- 设置合适的数据验证规则，减少无效数据

### 5. 权限设计最佳实践

```json
{
  "permission": {
    // 使用 get() 方法进行关联查询验证
    "read": "get(`database.todobooks.${doc.todobook_id}`).creator_id == auth.uid",
    
    // 组合多个条件
    "update": "doc.creator_id == auth.uid && doc.status != 'locked'",
    
    // 基于角色的权限控制
    "delete": "auth.role.includes('admin') || doc.creator_id == auth.uid"
  }
}
```

## 总结

uniCloud DB Schema 是构建安全、高效云数据库应用的基础。通过合理的 Schema 设计，可以：

1. **确保数据完整性**：通过验证规则保证数据质量
2. **实现精细权限控制**：保护敏感数据安全
3. **优化查询性能**：通过索引提升数据库性能
4. **简化开发流程**：自动生成表单和接口代码
5. **维护数据一致性**：通过外键和约束保持数据关联

建议在项目开始时就认真设计 Schema，这将为后续开发和维护带来巨大便利。同时要注意权限表达式的安全性，避免数据泄露风险。