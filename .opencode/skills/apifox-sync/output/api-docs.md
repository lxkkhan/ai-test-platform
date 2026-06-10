# 配送中心 SAAS 接口文档

> 自动生成时间: 2026-06-09-auto
> 共 105 个模块, 177 个接口

---

## NC物料映射

> 基础数据 > 物料信息 > NC物料映射

### `/pszxSaasServer/templates/query`

#### GET `/pszxSaasServer/templates/query/queryTemplateCtrl/getQueryTemplateByCurrentUser`

GET /pszxSaasServer/templates/query/queryTemplateCtrl/getQueryTemplateByCurrentUser

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| `functionCode` | query | string | 否 |  |
| `orgLevel` | query | string | 否 |  |

**响应:** `200` 成功

---

#### POST `/pszxSaasServer/templates/query/personalTemplateCtrl/personalTemplateCtrl/listByScheme`

POST /pszxSaasServer/templates/query/personalTemplateCtrl/personalTemplateCtrl/listByScheme (page)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `page` | boolean | 示例: `false` |
| `sortName` | string | 示例: `"sort"` |
| `queryConditions` | array | 示例: `[{"field":"userId","value":[20019],"operation":"eq"}]` |

**响应:** `200` 成功

---

### `/pszxSaasServer/templates/column`

#### GET `/pszxSaasServer/templates/column/columnTemplateCtrl/getShowColumnTemplateByCurrentUser`

GET /pszxSaasServer/templates/column/columnTemplateCtrl/getShowColumnTemplateByCurrentUser

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| `functionCode` | query | string | 否 |  |

**响应:** `200` 成功

---

### `/pszxSaasServer/basic/org`

#### GET `/pszxSaasServer/basic/org/orgParamsCtrl/getParamsWithGroup`

GET /pszxSaasServer/basic/org/orgParamsCtrl/getParamsWithGroup

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| `code` | query | string | 否 |  |
| `pkGroup` | query | integer | 否 |  |

**响应:** `200` 成功

---

### `/pszxSaasServer/sysmp/sysDictionaryItemCtrl`

#### GET `/pszxSaasServer/sysmp/sysDictionaryItemCtrl/getDictionaryItemLabel`

GET /pszxSaasServer/sysmp/sysDictionaryItemCtrl/getDictionaryItemLabel

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| `value` | query | string | 否 |  |

**响应:** `200` 成功

---

### `/pszxSaasServer/org/orgGroupCtrl`

#### POST `/pszxSaasServer/org/orgGroupCtrl/getGroupTree`

POST /pszxSaasServer/org/orgGroupCtrl/getGroupTree (functionCode=OrgGroup)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `functionCode` | string | 示例: `"OrgGroup"` |
| `page` | boolean | 示例: `false` |
| `sortName` | string | 示例: `""` |
| `queryConditions` | array | 示例: `[{"field":"id","value":["${user.pkGroupList}"],"operation":"in"}]` |

**响应:** `200` 成功

---

### `/pszxSaasServer/archive/nc`

#### POST `/pszxSaasServer/archive/nc/ncMaterialRelationCtrl/listByScheme`

POST /pszxSaasServer/archive/nc/ncMaterialRelationCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"0ad1a78b133d4a438ac7557e41c4d3a2","value":["1787720377238028288","global"],"field":"pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"5b13a8a2b6584175879de827c1b5ef99"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 业务参数-全局

> 基础数据 > 组织管理 > 业务参数-全局

### `/pszxSaasServer/sysmp/sysDictionaryItemCtrl`

#### GET `/pszxSaasServer/sysmp/sysDictionaryItemCtrl/getDictionaryItems`

GET /pszxSaasServer/sysmp/sysDictionaryItemCtrl/getDictionaryItems

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| `dictionaryCode` | query | string | 否 |  |

**响应:** `200` 成功

---

### `/pszxSaasServer/basic/org`

#### POST `/pszxSaasServer/basic/org/orgParamsCtrl/listByScheme`

POST /pszxSaasServer/basic/org/orgParamsCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"1941370228323647494","value":[null],"field":"code","operation":"like"}]` |
| `templateId` | string | 示例: `"1941370228315258880"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 业务参数-配送中心

> 基础数据 > 组织管理 > 业务参数-配送中心

### `/pszxSaasServer/org/orgOrgCtrl`

#### POST `/pszxSaasServer/org/orgOrgCtrl/getOrgTree`

POST /pszxSaasServer/org/orgOrgCtrl/getOrgTree (functionCodeObj)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `functionCodeObj` | object |  |
| `page` | boolean | 示例: `false` |
| `sortName` | string | 示例: `""` |
| `queryConditions` | array | 示例: `[{"field":"id","value":["${user.belongOrgList}"],"operation":"in"}]` |

**响应:** `200` 成功

---

## 业务类型-公司

> 基础数据 > 组织管理 > 业务类型-公司

### `/pszxSaasServer/businessType/businessTypeCtrl`

#### POST `/pszxSaasServer/businessType/businessTypeCtrl/listByScheme`

POST /pszxSaasServer/businessType/businessTypeCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"82ac821bda2743feb54f6bbe11068eb8","value":[],"field":"pkGroup","operation":"in"}]` |
| `templateId` | string | 示例: `"24c12a351996495f97585b70ac6ee314"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 产地-公司

> 基础数据 > 物料信息 > 产地-公司

### `/pszxSaasServer/area/areaCtrl`

#### POST `/pszxSaasServer/area/areaCtrl/listByScheme`

POST /pszxSaasServer/area/areaCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"70bc1ac10a824c5da0b73c3f3c83d4c8","value":["1787720377238028288","global"],"field":"pkGroup","operation":"in"}]` |
| `templateId` | string | 示例: `"616b15aa7461476a8bbb0de923d6f921"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 人员-组织

> 基础数据 > 组织管理 > 人员-组织

### `/pszxSaasServer/org/orgOrgCtrl`

#### GET `/pszxSaasServer/org/orgOrgCtrl/getCurrentOrg`

GET /pszxSaasServer/org/orgOrgCtrl/getCurrentOrg

**响应:** `200` 成功

---

### `/pszxSaasServer/pszxDept/deptCtrl`

#### POST `/pszxSaasServer/pszxDept/deptCtrl/listTree`

POST /pszxSaasServer/pszxDept/deptCtrl/listTree (queryConditions[2])

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `queryConditions` | array | 示例: `[{"field":"deleteflag","operation":"eq","value":["0"]}]` |

**响应:** `200` 成功

---

### `/pszxSaasServer/pszxStaff/staffCtrl`

#### POST `/pszxSaasServer/pszxStaff/staffCtrl/listByScheme`

POST /pszxSaasServer/pszxStaff/staffCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"3a2f115a7da84cdcbdd2c6e22a17c77c","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"e1455ea1b743461e9645f3b72431a5a8"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

### `/pszxSaasServer/gyg/basic`

#### POST `/pszxSaasServer/gyg/basic/sysmp/sysUserVOCtrl/listByScheme`

POST /pszxSaasServer/gyg/basic/sysmp/sysUserVOCtrl/listByScheme (page)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `page` | boolean | 示例: `true` |
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `queryConditions` | array | 示例: `[{"field":"id","value":[null],"operation":"eq"}]` |

**响应:** `200` 成功

---

## 仓库

> 基础数据 > 物料信息 > 仓库

### `/pszxSaasServer/hospital/hospitalDistributeCtrl`

#### POST `/pszxSaasServer/hospital/hospitalDistributeCtrl/listByScheme`

POST /pszxSaasServer/hospital/hospitalDistributeCtrl/listByScheme (page)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `page` | boolean | 示例: `false` |
| `functionCodeObj` | object |  |
| `queryConditions` | array | 示例: `[{"field":"hospitalFullName","value":[],"operation":"like"}]` |

**响应:** `200` 成功

---

### `/pszxSaasServer/warehouse/warehouseCtrl`

#### POST `/pszxSaasServer/warehouse/warehouseCtrl/listByScheme`

POST /pszxSaasServer/warehouse/warehouseCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"165e316a6e1a4bebb23e7070d103bdef","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"e083cad9bee2454ea817e5a565857ff1"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 任务执行监控-全局

> 系统调度平台 > 任务执行监控-全局

### `/pszxSaasServer/sysmp/quartzTaskExecLogCtrl`

#### GET `/pszxSaasServer/sysmp/quartzTaskExecLogCtrl/list`

GET /pszxSaasServer/sysmp/quartzTaskExecLogCtrl/list

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| `pageSize` | query | integer | 否 |  |
| `pageNum` | query | integer | 否 |  |
| `sortName` | query | string | 否 |  |

**响应:** `200` 成功

---

## 元数据属性

> 系统配置 > 元数据 > 元数据属性

### `/pszxSaasServer/meta/metaPropertyCtrl`

#### POST `/pszxSaasServer/meta/metaPropertyCtrl/listByScheme`

POST /pszxSaasServer/meta/metaPropertyCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"4574d04ad7dc4b1ca144cb78b2bfdddc","value":[null],"field":"tableName","operation":"like"}]` |
| `templateId` | string | 示例: `"77ca788ed7994b31a28252b3e3e82d30"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 公司-全局

> 常用 > 公司-全局

### `/pszxSaasServer/pszxOrgGroup/pszxOrgGroupCtrl`

#### POST `/pszxSaasServer/pszxOrgGroup/pszxOrgGroupCtrl/listByScheme`

POST /pszxSaasServer/pszxOrgGroup/pszxOrgGroupCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"1943516339784122368","value":[null],"field":"code","operation":"like"}]` |
| `templateId` | string | 示例: `"d92b4d2bf9c5452db7b18a75f8e47ddd"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

### `/pszxSaasServer/aliOss/downloadFile`

#### GET `/pszxSaasServer/aliOss/downloadFile/1e056d2b0ebd5c878c550da6ac5d3724`

GET /pszxSaasServer/aliOss/downloadFile/1e056d2b0ebd5c878c550da6ac5d3724

**响应:** `200` 成功

---

## 列模板

> 系统配置 > 模板管理 > 列模板

### `/pszxSaasServer/templates/column`

#### POST `/pszxSaasServer/templates/column/columnTemplateHeadCtrl/listWithChildren`

POST /pszxSaasServer/templates/column/columnTemplateHeadCtrl/listWithChildren (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"1638426612599095296","value":[null],"field":"head.funcCode","operation":"eq"}]` |
| `templateId` | string | 示例: `"50c65bf9-f19d-488a-b9ed-6677a4f247b2"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |

**响应:** `200` 成功

---

## 包装规格-公司

> 基础数据 > 物料信息 > 包装规格-公司

### `/pszxSaasServer/specification/specificationCtrl`

#### POST `/pszxSaasServer/specification/specificationCtrl/listByScheme`

POST /pszxSaasServer/specification/specificationCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"e5ecc4da74c346249c0b2d73f584bf69","value":["1787720377238028288","global"],"field":"pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"78013a7ec01b4a34bbbb576a0b8294ea"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 协定方档案-公司

> 基础数据 > 物料信息 > 协定方档案-公司

### `/pszxSaasServer/templates/bill`

#### GET `/pszxSaasServer/templates/bill/billTemplateCtrl/getBillTemplateByCurrentUser`

GET /pszxSaasServer/templates/bill/billTemplateCtrl/getBillTemplateByCurrentUser

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| `functionCode` | query | string | 否 |  |
| `orgLevel` | query | string | 否 |  |

**响应:** `200` 成功

---

### `/pszxSaasServer/templates/column`

#### GET `/pszxSaasServer/templates/column/columnTemplateCtrl/getEditColumnTemplateByCurrentUser`

GET /pszxSaasServer/templates/column/columnTemplateCtrl/getEditColumnTemplateByCurrentUser

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| `functionCode` | query | string | 否 |  |

**响应:** `200` 成功

---

### `/pszxSaasServer/pszxOrgOrg/pszxOrgOrgCtrl`

#### POST `/pszxSaasServer/pszxOrgOrg/pszxOrgOrgCtrl/listByScheme`

POST /pszxSaasServer/pszxOrgOrg/pszxOrgOrgCtrl/listByScheme (functionCode=pszxOrgOrg_group)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `functionCode` | string | 示例: `"pszxOrgOrg_group"` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

### `/pszxSaasServer/templates/rule`

#### GET `/pszxSaasServer/templates/rule/billTemplateRuleCtrl/getFormTemplateRulesByCurrentUser`

GET /pszxSaasServer/templates/rule/billTemplateRuleCtrl/getFormTemplateRulesByCurrentUser

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| `functionCode` | query | string | 否 |  |

**响应:** `200` 成功

---

### `/pszxSaasServer/hospital/hospitalArchiveCtrl`

#### POST `/pszxSaasServer/hospital/hospitalArchiveCtrl/listWithChildren`

POST /pszxSaasServer/hospital/hospitalArchiveCtrl/listWithChildren (page)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `page` | boolean | 示例: `false` |
| `functionCodeObj` | object |  |
| `queryConditions` | array | 示例: `[{"field":"head.code,head.fullName","value":[],"operation":"like"}]` |

**响应:** `200` 成功

---

### `/pszxSaasServer/agreedArchive/agreedArchiveCtrl`

#### POST `/pszxSaasServer/agreedArchive/agreedArchiveCtrl/listWithChildren`

POST /pszxSaasServer/agreedArchive/agreedArchiveCtrl/listWithChildren (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"1976539315647414274","value":["1787720377238028288","global"],"field":"head.pkGroup","operation":"in"}]` |
| `templateId` | string | 示例: `"1976539315588694016"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

### `/pszxSaasServer/agreedArchive/agreedArchiveBillCtrl`

#### POST `/pszxSaasServer/agreedArchive/agreedArchiveBillCtrl/getDetail`

POST /pszxSaasServer/agreedArchive/agreedArchiveBillCtrl/getDetail (id=2059482092671864832)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 示例: `"2059482092671864832"` |
| `indexFunctionCodeMap` | object |  |

**响应:** `200` 成功

---

### `/pszxSaasServer/archive/mat`

#### POST `/pszxSaasServer/archive/mat/materialArchiveHeadCtrl/listWithChildren`

POST /pszxSaasServer/archive/mat/materialArchiveHeadCtrl/listWithChildren (page)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `page` | boolean | 示例: `false` |
| `functionCodeObj` | object |  |
| `queryConditions` | array | 示例: `[{"field":"head.enableflag","value":[0],"operation":"eq"}]` |

**响应:** `200` 成功

---

### `/pszxSaasServer/decoctRequirement/decoctRequirementCtrl`

#### POST `/pszxSaasServer/decoctRequirement/decoctRequirementCtrl/listByScheme`

POST /pszxSaasServer/decoctRequirement/decoctRequirementCtrl/listByScheme (page)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `page` | boolean | 示例: `false` |
| `functionCodeObj` | object |  |
| `queryConditions` | array | 示例: `[{"field":"code","value":[],"operation":"like"}]` |

**响应:** `200` 成功

---

## 参数模板设置-全局

> 基础数据 > 组织管理 > 参数模板设置-全局

### `/pszxSaasServer/basic/org`

#### POST `/pszxSaasServer/basic/org/orgParamsTemplateCtrl/listByScheme`

POST /pszxSaasServer/basic/org/orgParamsTemplateCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"7998f06343e8408d91339215b1c51320","value":[null],"field":"code","operation":"like"}]` |
| `templateId` | string | 示例: `"8d79634444ab4a9f8f884d41b75ffc34"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 字典管理

> 系统调度平台 > 字典管理

### `/pszxSaasServer/sysmp/sysDictionaryCtrl`

#### GET `/pszxSaasServer/sysmp/sysDictionaryCtrl/list`

GET /pszxSaasServer/sysmp/sysDictionaryCtrl/list

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| `basicEntity.deleteflag` | query | integer | 否 |  |
| `pageNum` | query | integer | 否 |  |
| `pageSize` | query | integer | 否 |  |

**响应:** `200` 成功

---

## 定时任务配置-全局

> 系统调度平台 > 定时任务配置-全局

### `/pszxSaasServer/sysmp/quartzTaskConfigCtrl`

#### GET `/pszxSaasServer/sysmp/quartzTaskConfigCtrl/list`

GET /pszxSaasServer/sysmp/quartzTaskConfigCtrl/list

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| `pageNum` | query | integer | 否 |  |
| `pageSize` | query | integer | 否 |  |
| `basicEntity.deleteflag` | query | integer | 否 |  |
| `basicEntity.orgFlag` | query | boolean | 否 |  |

**响应:** `200` 成功

---

## 库存状态-全局

> 基础数据 > 物料信息 > 库存状态-全局

### `/pszxSaasServer/sysmp/messageInfoCtrl`

#### GET `/pszxSaasServer/sysmp/messageInfoCtrl/listUnreadMessages`

GET /pszxSaasServer/sysmp/messageInfoCtrl/listUnreadMessages

**响应:** `200` 成功

---

### `/pszxSaasServer/archive/inventoryStatusCtrl`

#### POST `/pszxSaasServer/archive/inventoryStatusCtrl/listByScheme`

POST /pszxSaasServer/archive/inventoryStatusCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"11c3959c208f42db9ed1d7a46362ed68","value":[null],"field":"code","operation":"like"}]` |
| `templateId` | string | 示例: `"14cda4dedbc7453182f2bd86e86bb776"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 异常原因档案

> 基础数据 > 异常原因档案

### `/pszxSaasServer/print/printTmpCtrl`

#### POST `/pszxSaasServer/print/printTmpCtrl/listByScheme`

POST /pszxSaasServer/print/printTmpCtrl/listByScheme (functionCodeObj)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `functionCodeObj` | object |  |
| `page` | boolean | 示例: `false` |
| `queryConditions` | array | 示例: `[{"field":"enableflag","value":["0"],"operation":"eq"}]` |

**响应:** `200` 成功

---

### `/pszxSaasServer/main/exceptionReason`

#### POST `/pszxSaasServer/main/exceptionReason/pszxExceptionReasonCtrl/listByScheme`

POST /pszxSaasServer/main/exceptionReason/pszxExceptionReasonCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"220aa0c6ff844361b9bda5909b45e8b0","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"0e6a9d6ef11640babe799f1b0c092db4"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 微信号管理-全局

> 系统配置 > 弹性配置 > 微信号管理-全局

### `/pszxSaasServer/org/orgWxAccountCtrl`

#### POST `/pszxSaasServer/org/orgWxAccountCtrl/listByScheme`

POST /pszxSaasServer/org/orgWxAccountCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"1aeb07596994457e87c6cc9ff0558499","value":[null],"field":"originalId","operation":"like"}]` |
| `templateId` | string | 示例: `"2563f6f0b8204dd48c14e5a72c4d1cdc"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 批号-公司

> 基础数据 > 物料信息 > 批号-公司

### `/pszxSaasServer/lotInfo/lotInfoCtrl`

#### POST `/pszxSaasServer/lotInfo/lotInfoCtrl/listByScheme`

POST /pszxSaasServer/lotInfo/lotInfoCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"5eaadf517c6f43ff80c77b9c372eca5e","value":["1787720377238028288","global"],"field":"pkGroup","operation":"in"}]` |
| `templateId` | string | 示例: `"19f489e81fe247f3b739c848f5a9ddac"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 批次号-公司

> 基础数据 > 物料信息 > 批次号-公司

### `/pszxSaasServer/batchInfo/batchInfoCtrl`

#### POST `/pszxSaasServer/batchInfo/batchInfoCtrl/listByScheme`

POST /pszxSaasServer/batchInfo/batchInfoCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"e63a62e312e643ac9a0f92486b08edd1","value":["1787720377238028288","global"],"field":"pkGroup","operation":"in"}]` |
| `templateId` | string | 示例: `"e100c42e327f4d79ab1be741170c8357"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 操作审计日志

> 系统配置 > 日志 > 操作审计日志

### `/pszxSaasServer/audit/auditRecordCtrl`

#### POST `/pszxSaasServer/audit/auditRecordCtrl/listByScheme`

POST /pszxSaasServer/audit/auditRecordCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"081c86aeddb645b396f1ee48e01d5a68","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"8c45e92ad10b4a1bb979f7a6b2752e98"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 物料档案-公司

> 基础数据 > 物料信息 > 物料档案-公司

### `/pszxSaasServer/archive/mat`

#### POST `/pszxSaasServer/archive/mat/type/materialArchiveTypeHeadCtrl/listWithChildren`

POST /pszxSaasServer/archive/mat/type/materialArchiveTypeHeadCtrl/listWithChildren (functionCode=MaterialArchiveTypeHead_group)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `functionCode` | string | 示例: `"MaterialArchiveTypeHead_group"` |
| `functionCodeObj` | object |  |
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `queryConditions` | array | 示例: `[{"field":"head.enableflag","value":[0],"operation":"eq"}]` |

**响应:** `200` 成功

---

#### POST `/pszxSaasServer/archive/mat/materialArchiveCtrl/getDetail`

POST /pszxSaasServer/archive/mat/materialArchiveCtrl/getDetail (id=2061717877588496384)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 示例: `"2061717877588496384"` |
| `indexFunctionCodeMap` | object |  |

**响应:** `200` 成功

---

### `/pszxSaasServer/measurementUnit/measurementUnitCtrl`

#### POST `/pszxSaasServer/measurementUnit/measurementUnitCtrl/listByScheme`

POST /pszxSaasServer/measurementUnit/measurementUnitCtrl/listByScheme (page)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `page` | boolean | 示例: `false` |
| `functionCodeObj` | object |  |
| `queryConditions` | array | 示例: `[{"field":"code","value":[],"operation":"like"}]` |

**响应:** `200` 成功

---

### `/pszxSaasServer/drugProperty/drugPropertyCtrl`

#### POST `/pszxSaasServer/drugProperty/drugPropertyCtrl/listByScheme`

POST /pszxSaasServer/drugProperty/drugPropertyCtrl/listByScheme (page)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `page` | boolean | 示例: `false` |
| `functionCodeObj` | object |  |
| `queryConditions` | array | 示例: `[{"field":"code","value":[],"operation":"like"}]` |

**响应:** `200` 成功

---

## 物料用量限制

> 基础数据 > 物料信息 > 物料用量限制

### `/pszxSaasServer/hospital/hospitalMaterialLimitCtrl`

#### POST `/pszxSaasServer/hospital/hospitalMaterialLimitCtrl/listByScheme`

POST /pszxSaasServer/hospital/hospitalMaterialLimitCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"8bed35f70efa4fb2aeda3499b17fe2ed","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"7c748198db4a473f8ce41bb3ad6149e9"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 物料申请单

> 基础数据 > 物料信息 > 物料申请单

### `/pszxSaasServer/archive/apply`

#### POST `/pszxSaasServer/archive/apply/materialApplyCtrl/listByScheme`

POST /pszxSaasServer/archive/apply/materialApplyCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"418cd1d9f5f34c94b9295af6a96a1440","value":[null],"field":"drugAdvice","operation":"like"}]` |
| `templateId` | string | 示例: `"f2893eaf2b704beb9f7097f6ab563749"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 生产厂家-公司

> 基础数据 > 物料信息 > 生产厂家-公司

### `/pszxSaasServer/producer/producerCtrl`

#### POST `/pszxSaasServer/producer/producerCtrl/listByScheme`

POST /pszxSaasServer/producer/producerCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"5b6eda1e21b248379f385bac966fad17","value":["1787720377238028288","global"],"field":"pkGroup","operation":"in"}]` |
| `templateId` | string | 示例: `"f525e2dff1b541cb882d08e838c9fc1a"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 等级-公司

> 基础数据 > 物料信息 > 等级-公司

### `/pszxSaasServer/level/levelCtrl`

#### POST `/pszxSaasServer/level/levelCtrl/listByScheme`

POST /pszxSaasServer/level/levelCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"1a9e232c6d8d4cfba56b876466fe0da0","value":["1787720377238028288","global"],"field":"pkGroup","operation":"in"}]` |
| `templateId` | string | 示例: `"13e7de8c6b6649b2bf6a8ed5a13cac2e"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 脚本设置-公司

> 系统配置 > 弹性配置 > 脚本设置-公司

### `/pszxSaasServer/config/dbScriptCtrl`

#### POST `/pszxSaasServer/config/dbScriptCtrl/listByScheme`

POST /pszxSaasServer/config/dbScriptCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"a91435f0827c4db8bcda56164b43d745","value":["1787720377238028288","global"],"field":"pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"da68a1dd05284167825e7a1a37789eda"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 药用部位-公司

> 基础数据 > 物料信息 > 药用部位-公司

### `/pszxSaasServer/archive/drug`

#### POST `/pszxSaasServer/archive/drug/part/drugPartCtrl/listByScheme`

POST /pszxSaasServer/archive/drug/part/drugPartCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"69c1271b51d047a892287e1d1cdf17fa","value":["1787720377238028288","global"],"field":"pkGroup","operation":"in"}]` |
| `templateId` | string | 示例: `"862b3d0523834395a06ee14b4a348c7d"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 表单模板

> 系统配置 > 模板管理 > 表单模板

### `/pszxSaasServer/templates/bill`

#### POST `/pszxSaasServer/templates/bill/billTemplateHeadCtrl/listWithChildren`

POST /pszxSaasServer/templates/bill/billTemplateHeadCtrl/listWithChildren (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"969c9b50-fae6-4cf3-a72e-63bef37413b3","value":[null],"field":"head.funcCode","operation":"eq"}]` |
| `templateId` | string | 示例: `"969c9b50-fae6-4cf3-a72e-63bef37413bk"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |

**响应:** `200` 成功

---

## 货位

> 基础数据 > 物料信息 > 货位

### `/pszxSaasServer/location/locationCtrl`

#### POST `/pszxSaasServer/location/locationCtrl/listByScheme`

POST /pszxSaasServer/location/locationCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"8924ff42e5c640fc8de987e7ece6dd8f","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"10a71fe9595a471fa67635fcc34499a2"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 配伍禁忌-公司

> 基础数据 > 物料信息 > 配伍禁忌-公司

### `/pszxSaasServer/archive/pro`

#### POST `/pszxSaasServer/archive/pro/prohibitedCombinationHeadCtrl/listWithChildren`

POST /pszxSaasServer/archive/pro/prohibitedCombinationHeadCtrl/listWithChildren (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"1960536903900069889","value":["1787720377238028288","global"],"field":"head.pkGroup","operation":"in"}]` |
| `templateId` | string | 示例: `"8b93faca94fb4f3696e2b4966723bad7"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

#### POST `/pszxSaasServer/archive/pro/prohibitedCombinationCtrl/getDetail`

POST /pszxSaasServer/archive/pro/prohibitedCombinationCtrl/getDetail (id=2048637239839293440)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 示例: `"2048637239839293440"` |
| `indexFunctionCodeMap` | object |  |

**响应:** `200` 成功

---

## 项目初始化清单

> 系统配置 > 日志 > 项目初始化清单

### `/pszxSaasServer/InitLog/syncInitLogCtrl`

#### POST `/pszxSaasServer/InitLog/syncInitLogCtrl/listByScheme`

POST /pszxSaasServer/InitLog/syncInitLogCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"d4cd0c5f43db4c9d83ae6e52a8e562d3","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"0a730d835100495f98c4c3e740f0a8f7"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 项目初始化清单日志

> 系统配置 > 日志 > 项目初始化清单日志

### `/pszxSaasServer/InitItem/syncInitItemCtrl`

#### POST `/pszxSaasServer/InitItem/syncInitItemCtrl/listByScheme`

POST /pszxSaasServer/InitItem/syncInitItemCtrl/listByScheme (page)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `page` | boolean | 示例: `true` |
| `pageSize` | number | 示例: `20` |
| `functionCodeObj` | object |  |
| `queryConditions` | array | 示例: `[{"field":"code","value":[],"operation":"like"}]` |

**响应:** `200` 成功

---

## 事务管理-全局

> 基础数据 > 作业中心配置 > 事务管理-全局

### `/pszxSaasServer/work/affair`

#### POST `/pszxSaasServer/work/affair/workAffairCtrl/listByScheme`

POST /pszxSaasServer/work/affair/workAffairCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"ec4f2fd3cad74baca2954507a4566cfd","value":[null],"field":"autoDelayStart","operation":"eq"}]` |
| `templateId` | string | 示例: `"fc4c9bb440ac45f8ab071e3813f089f6"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 价格变更单-公司

> 基础数据 > 结算管理 > 价格变更单-公司

### `/pszxSaasServer/settlement/price`

#### POST `/pszxSaasServer/settlement/price/settlePriceChangeCtrl/listWithChildren`

POST /pszxSaasServer/settlement/price/settlePriceChangeCtrl/listWithChildren (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"65454bb7145a4c32a0ab3156bd6f58ed","value":["1787720377238028288","global"],"field":"head.pkGroup","operation":"in"}]` |
| `templateId` | string | 示例: `"61f65890b0fd4150b78841b3486be08c"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

#### POST `/pszxSaasServer/settlement/price/settlePriceChangeBillCtrl/getDetail`

POST /pszxSaasServer/settlement/price/settlePriceChangeBillCtrl/getDetail (id=2054472406797127680)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 示例: `"2054472406797127680"` |
| `indexFunctionCodeMap` | object |  |

**响应:** `200` 成功

---

## 价格变更单-配送中心

> 基础数据 > 结算管理 > 价格变更单-配送中心

### `/pszxSaasServer/org/orgOrgCtrl`

#### POST `/pszxSaasServer/org/orgOrgCtrl/listByScheme`

POST /pszxSaasServer/org/orgOrgCtrl/listByScheme (functionCode=OrgOrg_org)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `functionCode` | string | 示例: `"OrgOrg_org"` |
| `functionCodeObj` | object |  |
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `queryConditions` | array | 示例: `[{"field":"deleteflag","value":[0],"operation":"eq"}]` |

**响应:** `200` 成功

---

## 价格维护单-公司

> 基础数据 > 结算管理 > 价格维护单-公司

### `/pszxSaasServer/settlement/price`

#### POST `/pszxSaasServer/settlement/price/settlePriceManageCtrl/listWithChildren`

POST /pszxSaasServer/settlement/price/settlePriceManageCtrl/listWithChildren (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"6aac0fd7efc543dcba685a4401171a94","value":["1787720377238028288","global"],"field":"head.pkGroup","operation":"in"}]` |
| `templateId` | string | 示例: `"79e9092ea4c14b639a87edf1e7943a5a"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

#### POST `/pszxSaasServer/settlement/price/settlePriceManageBillCtrl/getDetail`

POST /pszxSaasServer/settlement/price/settlePriceManageBillCtrl/getDetail (id=2036642487081897984)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 示例: `"2036642487081897984"` |
| `indexFunctionCodeMap` | object |  |

**响应:** `200` 成功

---

## 价目表-公司

> 基础数据 > 结算管理 > 价目表-公司

### `/pszxSaasServer/settlement/price`

#### POST `/pszxSaasServer/settlement/price/settlePriceCtrl/listByScheme`

POST /pszxSaasServer/settlement/price/settlePriceCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"df289d01c69847b8b24b76745ae09f3d","value":["1787720377238028288"],"field":"pkGroup","operation":"in"}]` |
| `templateId` | string | 示例: `"e3b06793773447fc8b6b05f2ae0c77fa"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 作业流程

> 基础数据 > 作业中心配置 > 作业流程

### `/pszxSaasServer/work/custom`

#### POST `/pszxSaasServer/work/custom/func/workCustomFuncCtrl/listByScheme`

POST /pszxSaasServer/work/custom/func/workCustomFuncCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"0c3625802f2c4c009b0c09440af0ba04","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"1f6e878e8a11448982b9c9523326dfb8"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 作业环节-公司

> 基础数据 > 作业中心配置 > 作业环节-公司

### `/pszxSaasServer/work/link`

#### POST `/pszxSaasServer/work/link/workLinkCtrl/listByScheme`

POST /pszxSaasServer/work/link/workLinkCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"08c55d8b35c145e7b120e92f81be0a74","value":["1787720377238028288","global"],"field":"pkGroup","operation":"in"}]` |
| `templateId` | string | 示例: `"a451e0d069bb44d992701cec8ef9ffd7"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

### `/pszxSaasServer/aliOss/downloadFile`

#### GET `/pszxSaasServer/aliOss/downloadFile/c52f1bd66cc19d05628bd8bf27af3ad6`

GET /pszxSaasServer/aliOss/downloadFile/c52f1bd66cc19d05628bd8bf27af3ad6

**响应:** `200` 成功

---

#### GET `/pszxSaasServer/aliOss/downloadFile/4311359ed4969e8401880e3c1836fbe1`

GET /pszxSaasServer/aliOss/downloadFile/4311359ed4969e8401880e3c1836fbe1

**响应:** `200` 成功

---

#### GET `/pszxSaasServer/aliOss/downloadFile/ca75910166da03ff9d4655a0338e6b09`

GET /pszxSaasServer/aliOss/downloadFile/ca75910166da03ff9d4655a0338e6b09

**响应:** `200` 成功

---

#### GET `/pszxSaasServer/aliOss/downloadFile/c22abfa379f38b5b0411bc11fa9bf92f`

GET /pszxSaasServer/aliOss/downloadFile/c22abfa379f38b5b0411bc11fa9bf92f

**响应:** `200` 成功

---

## 供应商-公司

> 基础数据 > 供应商信息 > 供应商-公司

### `/pszxSaasServer/supplier/supplierTypeCtrl`

#### POST `/pszxSaasServer/supplier/supplierTypeCtrl/listByScheme`

POST /pszxSaasServer/supplier/supplierTypeCtrl/listByScheme (page)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `page` | boolean | 示例: `false` |
| `functionCodeObj` | object |  |
| `queryConditions` | array | 示例: `[{"field":"code","value":[],"operation":"like"}]` |

**响应:** `200` 成功

---

### `/pszxSaasServer/supplier/supplierCtrl`

#### POST `/pszxSaasServer/supplier/supplierCtrl/listByScheme`

POST /pszxSaasServer/supplier/supplierCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"1acb02c8d69d4a70914e9ea6a80d784b","value":["1787720377238028288","global"],"field":"pkGroup","operation":"in"}]` |
| `templateId` | string | 示例: `"4e441e9cc1cb43aca622d24011169b0d"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 供应商申请表

> 基础数据 > 供应商信息 > 供应商申请表

### `/pszxSaasServer/supplier/supplierApplyCtrl`

#### POST `/pszxSaasServer/supplier/supplierApplyCtrl/listByScheme`

POST /pszxSaasServer/supplier/supplierApplyCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"53f083bc706c4252870a5c8492f2fb2f","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"58d95ebf2eb64d26a66b580db822e485"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 借药还药单

> 库存管理 > 借药还药单

### `/pszxSaasServer/ic/br`

#### GET `/pszxSaasServer/ic/br/brOrderBillCtrl/getTaskInfoList`

GET /pszxSaasServer/ic/br/brOrderBillCtrl/getTaskInfoList

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| `orderId` | query | string | 否 |  |
| `status` | query | string | 否 |  |

**响应:** `200` 成功

---

#### POST `/pszxSaasServer/ic/br/brOrderCtrl/listWithChildren`

POST /pszxSaasServer/ic/br/brOrderCtrl/listWithChildren (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"70f3ae3bbdc946d397bd125259a8fabc","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"head.pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"047b6c887a1c4dbaaff256395ec9d001"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

#### POST `/pszxSaasServer/ic/br/brOrderBillCtrl/getDetail`

POST /pszxSaasServer/ic/br/brOrderBillCtrl/getDetail (id=2054824491921182720)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 示例: `"2054824491921182720"` |
| `indexFunctionCodeMap` | object |  |

**响应:** `200` 成功

---

### `/pszxSaasServer/ic/basic`

#### POST `/pszxSaasServer/ic/basic/flow/icBillType/icBillTypeCtrl/listByScheme`

POST /pszxSaasServer/ic/basic/flow/icBillType/icBillTypeCtrl/listByScheme (page)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `page` | boolean | 示例: `true` |
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `queryConditions` | array | 示例: `[{"field":"id","value":[null],"operation":"eq"}]` |

**响应:** `200` 成功

---

## 入库单

> 库存管理 > 入库单

### `/pszxSaasServer/inventory/inventoryInCtrl`

#### POST `/pszxSaasServer/inventory/inventoryInCtrl/listWithChildren`

POST /pszxSaasServer/inventory/inventoryInCtrl/listWithChildren (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"7039f4bcea8d444d84634eb2ccb27824","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"head.pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"ce661493c31145358a511ccbc8d56854"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

### `/pszxSaasServer/inventory/inventoryInBillCtrl`

#### POST `/pszxSaasServer/inventory/inventoryInBillCtrl/getDetail`

POST /pszxSaasServer/inventory/inventoryInBillCtrl/getDetail (id=2060200735089102848)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 示例: `"2060200735089102848"` |
| `indexFunctionCodeMap` | object |  |

**响应:** `200` 成功

---

## 出库单

> 库存管理 > 出库单

### `/pszxSaasServer/inventory/inventoryOutCtrl`

#### POST `/pszxSaasServer/inventory/inventoryOutCtrl/listWithChildren`

POST /pszxSaasServer/inventory/inventoryOutCtrl/listWithChildren (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"1966421962872061956","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"head.pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"1966421962855284736"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

### `/pszxSaasServer/inventory/inventoryOutBillCtrl`

#### POST `/pszxSaasServer/inventory/inventoryOutBillCtrl/getDetail`

POST /pszxSaasServer/inventory/inventoryOutBillCtrl/getDetail (id=2062099293896048640)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 示例: `"2062099293896048640"` |
| `indexFunctionCodeMap` | object |  |

**响应:** `200` 成功

---

## 到货单

> 库存管理 > 到货单

### `/pszxSaasServer/ic/arrival`

#### POST `/pszxSaasServer/ic/arrival/arrivalOrderCtrl/listWithChildren`

POST /pszxSaasServer/ic/arrival/arrivalOrderCtrl/listWithChildren (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"07b4022d145b4cb3862f057ec96f21f6","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"head.pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"ca551048984e4d48b9f5a33364229f1d"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

#### POST `/pszxSaasServer/ic/arrival/arrivalOrderBillCtrl/getDetail`

POST /pszxSaasServer/ic/arrival/arrivalOrderBillCtrl/getDetail (id=2055184968388313088)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 示例: `"2055184968388313088"` |
| `indexFunctionCodeMap` | object |  |

**响应:** `200` 成功

---

### `/pszxSaasServer/archive/mat`

#### POST `/pszxSaasServer/archive/mat/materialArchiveDistributeCtrl/listByScheme`

POST /pszxSaasServer/archive/mat/materialArchiveDistributeCtrl/listByScheme (functionCodeObj)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `functionCodeObj` | object |  |
| `page` | boolean | 示例: `true` |
| `pageSize` | number | 示例: `50` |
| `sortName` | string | 示例: `""` |
| `queryConditions` | array | 示例: `[{"field":"parentId","value":[null],"operation":"eq"}]` |

**响应:** `200` 成功

---

## 医疗机构档案-公司

> 基础数据 > 医疗机构信息 > 医疗机构档案-公司

### `/pszxSaasServer/hospital/hospitalTypeCtrl`

#### POST `/pszxSaasServer/hospital/hospitalTypeCtrl/listByScheme`

POST /pszxSaasServer/hospital/hospitalTypeCtrl/listByScheme (page)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `page` | boolean | 示例: `false` |
| `functionCodeObj` | object |  |
| `queryConditions` | array | 示例: `[{"field":"code","value":[],"operation":"like"}]` |

**响应:** `200` 成功

---

## 医疗机构申请表

> 基础数据 > 医疗机构信息 > 医疗机构申请表

### `/pszxSaasServer/hospital/hospitalArchiveApplyCtrl`

#### POST `/pszxSaasServer/hospital/hospitalArchiveApplyCtrl/listByScheme`

POST /pszxSaasServer/hospital/hospitalArchiveApplyCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"0203da14abdf4f39a50a1ed8648ed948","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"b333330402c1480fbac8f1af651c6766"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 医院回传记录

> 基础数据 > 医疗机构信息 > 医院回传记录

### `/pszxSaasServer/herb/record`

#### POST `/pszxSaasServer/herb/record/prescriptCallbackHosCtrl/listByScheme`

POST /pszxSaasServer/herb/record/prescriptCallbackHosCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"cd9e0f1a6e40453493546496f586b741","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"d4f2e84bc585494ba3b587cb8e2a6c71"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 单据类型-全局

> 基础数据 > 作业信息 > 单据类型-全局

### `/pszxSaasServer/ic/basic`

#### POST `/pszxSaasServer/ic/basic/flow/icBillType/icBillTypeCtrl/listWithChildren`

POST /pszxSaasServer/ic/basic/flow/icBillType/icBillTypeCtrl/listWithChildren (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"101104efa89c473a95ebc51399622677","value":[null],"field":"head.classify","operation":"like"}]` |
| `templateId` | string | 示例: `"5d6438d6145b4788b4815dca742bc35f"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 单据类型-公司

> 基础数据 > 作业信息 > 单据类型-公司

### `/pszxSaasServer/ic/basic`

#### POST `/pszxSaasServer/ic/basic/flow/icBillType/icBillTypeBillCtrl/getDetail`

POST /pszxSaasServer/ic/basic/flow/icBillType/icBillTypeBillCtrl/getDetail (id=2027650383316385792)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 示例: `"2027650383316385792"` |
| `indexFunctionCodeMap` | object |  |

**响应:** `200` 成功

---

## 处方时效

> 基础数据 > 配送管理 > 处方时效

### `/pszxSaasServer/prescription/aging`

#### POST `/pszxSaasServer/prescription/aging/prescriptionAgingCtrl/listByScheme`

POST /pszxSaasServer/prescription/aging/prescriptionAgingCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"af06f05794d94a838bbbe8878a11b4da","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"f3cc6daa7ae849a9a6b07c6b39beb619"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 打印日志

> 基础数据 > 打印管理 > 打印日志

### `/pszxSaasServer/print/printLogCtrl`

#### POST `/pszxSaasServer/print/printLogCtrl/listByScheme`

POST /pszxSaasServer/print/printLogCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"5202641247224fc3ba82f43ba63d3d52","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"de8838248253483f91d7cf86d38a98c6"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 打印机

> 基础数据 > 打印管理 > 打印机

### `/pszxSaasServer/print/printerCtrl`

#### POST `/pszxSaasServer/print/printerCtrl/listByScheme`

POST /pszxSaasServer/print/printerCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"3264bd343a284126b05091748ddc6269","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"05a866fa865b4a9cbf822a3b31bf9232"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 打印模板

> 基础数据 > 打印管理 > 打印模板

### `/pszxSaasServer/org/orgOrgCtrl`

#### GET `/pszxSaasServer/org/orgOrgCtrl/listOrgByCurrentUser`

GET /pszxSaasServer/org/orgOrgCtrl/listOrgByCurrentUser

**响应:** `200` 成功

---

## 打印模板关联

> 基础数据 > 打印管理 > 打印模板关联

### `/pszxSaasServer/print/printConfigCtrl`

#### POST `/pszxSaasServer/print/printConfigCtrl/listByScheme`

POST /pszxSaasServer/print/printConfigCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"96a2109870104c769549b2fabd0a6da4","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"1a6d9a8cefb64935a202412a5b44321b"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 打印设计

> 基础数据 > 打印管理 > 打印设计

### `/pszxSaasServer/print/printTmpCtrl`

#### GET `/pszxSaasServer/print/printTmpCtrl/getCode`

GET /pszxSaasServer/print/printTmpCtrl/getCode

**响应:** `200` 成功

---

## 报错原处方单物料映射

> 基础数据 > 医疗机构信息 > 报错原处方单物料映射

### `/pszxSaasServer/archive/relationErr`

#### POST `/pszxSaasServer/archive/relationErr/rxMatRelationErrCtrl/listByScheme`

POST /pszxSaasServer/archive/relationErr/rxMatRelationErrCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"20632c81ac3745bca2953e7e71258f38","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"32d1dd38ac5141cfae901b086899be6d"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 机器档案

> 基础数据 > 机器管理 > 机器档案

### `/pszxSaasServer/machine/machineCtrl`

#### POST `/pszxSaasServer/machine/machineCtrl/listByScheme`

POST /pszxSaasServer/machine/machineCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"19ed00be17b844cd98248653701d0f93","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"62a826da4ef74ffc94c22655472029b0"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

### `/pszxSaasServer/machine/category`

#### POST `/pszxSaasServer/machine/category/machineCategoryCtrl/listByScheme`

POST /pszxSaasServer/machine/category/machineCategoryCtrl/listByScheme (page)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `page` | boolean | 示例: `true` |
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `queryConditions` | array | 示例: `[{"field":"id","value":[null],"operation":"eq"}]` |

**响应:** `200` 成功

---

## 浸泡桶管理

> 基础数据 > 机器管理 > 浸泡桶管理

### `/pszxSaasServer/bucket/bucketCtrl`

#### POST `/pszxSaasServer/bucket/bucketCtrl/listByScheme`

POST /pszxSaasServer/bucket/bucketCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"525c59e6aec74e4b9dfeb7c20f1fe25a","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"6e5dfe13d8424a2d933138734c468916"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 物料关系映射

> 基础数据 > 医疗机构信息 > 物料关系映射

### `/pszxSaasServer/archive/mr`

#### POST `/pszxSaasServer/archive/mr/materialRelationHeadCtrl/listWithChildren`

POST /pszxSaasServer/archive/mr/materialRelationHeadCtrl/listWithChildren (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"89f8d7caa9fe4290829ddd4354a8c9c9","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"head.pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"5ac5778a48b44f02bbb4c19a03b6c920"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

#### POST `/pszxSaasServer/archive/mr/materialRelationCtrl/getDetail`

POST /pszxSaasServer/archive/mr/materialRelationCtrl/getDetail (id=2061622728258752512)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 示例: `"2061622728258752512"` |
| `indexFunctionCodeMap` | object |  |

**响应:** `200` 成功

---

## 用户协议管理-公司

> 患者后台管理 > 用户协议管理-公司

### `/pszxSaasServer/userAgreement/userAgreementCtrl`

#### POST `/pszxSaasServer/userAgreement/userAgreementCtrl/listByScheme`

POST /pszxSaasServer/userAgreement/userAgreementCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"1f90bf826d00440c91591e3adbe73e22","value":[null],"field":"name","operation":"like"}]` |
| `templateId` | string | 示例: `"d5495a0b3cec425496f27196fe6b7c8b"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 用户管理-公司

> 患者后台管理 > 用户管理-公司

### `/pszxSaasServer/user/userCtrl`

#### POST `/pszxSaasServer/user/userCtrl/listByScheme`

POST /pszxSaasServer/user/userCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"dc26d05dbbb145679429415dc9c57ee7","value":[null],"field":"name","operation":"like"}]` |
| `templateId` | string | 示例: `"39ed60cc728f490999f2c922e21469ba"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

### `/pszxSaasServer/patient/patientCtrl`

#### POST `/pszxSaasServer/patient/patientCtrl/listByScheme`

POST /pszxSaasServer/patient/patientCtrl/listByScheme (pageNum)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageNum` | number | 示例: `1` |
| `pageSize` | number | 示例: `50` |
| `functionCodeObj` | object |  |
| `queryConditions` | array | 示例: `[{"field":"pkOrg","value":["1787720377238028288"],"operation":"eq"}]` |

**响应:** `200` 成功

---

### `/pszxSaasServer/patientMatch/patientMatchCtrl`

#### POST `/pszxSaasServer/patientMatch/patientMatchCtrl/listByScheme`

POST /pszxSaasServer/patientMatch/patientMatchCtrl/listByScheme (templateId=82847219075345cdaabab453f24058fc)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `templateId` | string | 示例: `"82847219075345cdaabab453f24058fc"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `queryConditions` | array | 示例: `[{"field":"pkGroup","value":["1787720377238028288"],"operation":"eq"}]` |
| `groupByList` | array | 示例: `[]` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 转库单

> 库存管理 > 转库单

### `/pszxSaasServer/ic/transfer`

#### POST `/pszxSaasServer/ic/transfer/transferOrderCtrl/listWithChildren`

POST /pszxSaasServer/ic/transfer/transferOrderCtrl/listWithChildren (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"f04a2812353c4504829b9086ccb2ebaf","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"head.pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"483ad942dbd74346b18fee5bedb73267"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

#### POST `/pszxSaasServer/ic/transfer/transferOrderBillCtrl/getDetail`

POST /pszxSaasServer/ic/transfer/transferOrderBillCtrl/getDetail (id=2055124984568872960)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 示例: `"2055124984568872960"` |
| `indexFunctionCodeMap` | object |  |

**响应:** `200` 成功

---

## 配送公司-全局

> 基础数据 > 配送管理 > 配送公司-全局

### `/pszxSaasServer/delivery/company`

#### POST `/pszxSaasServer/delivery/company/deliveryCompanyCtrl/listByScheme`

POST /pszxSaasServer/delivery/company/deliveryCompanyCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"fa5aebe44a2e4f56ab3e96771bcd9389","value":[null],"field":"code","operation":"like"}]` |
| `templateId` | string | 示例: `"4fbf0566ff3a41dbb173d076d14987d2"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 配送地址

> 基础数据 > 配送管理 > 配送地址

### `/pszxSaasServer/hospital/address`

#### POST `/pszxSaasServer/hospital/address/hospitalAddressCtrl/listByScheme`

POST /pszxSaasServer/hospital/address/hospitalAddressCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"706461ae1b554f208f6c0d11ba8e0e61","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"7ee39a0a5c014b0183dc617bbc133f9a"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 配送服务

> 基础数据 > 配送管理 > 配送服务

### `/pszxSaasServer/delivery/service`

#### POST `/pszxSaasServer/delivery/service/deliveryServiceCtrl/listByScheme`

POST /pszxSaasServer/delivery/service/deliveryServiceCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"7f262b870e824715b7f5a6247e8b1118","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"c9b165f150b54009bd888c14847813b5"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 配送清单

> 基础数据 > 配送管理 > 配送清单

### `/pszxSaasServer/delivery/rule`

#### POST `/pszxSaasServer/delivery/rule/deliveryRuleCtrl/getHospitalCategoryParams`

POST /pszxSaasServer/delivery/rule/deliveryRuleCtrl/getHospitalCategoryParams (page)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `page` | boolean | 示例: `false` |
| `queryConditions` | array | 示例: `[]` |

**响应:** `200` 成功

---

### `/pszxSaasServer/delivery/list`

#### POST `/pszxSaasServer/delivery/list/deliveryListCtrl/listByScheme`

POST /pszxSaasServer/delivery/list/deliveryListCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `"deptName asc,bedNo asc"` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"1980885280789626883","value":[null],"field":"serialNumber","operation":"like"}]` |
| `templateId` | string | 示例: `"c1bdd5e1ea1a4ca08bb244ee9eddf304"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

### `/pszxSaasServer/delivery/schedule`

#### POST `/pszxSaasServer/delivery/schedule/deliveryScheduleCtrl/listByScheme`

POST /pszxSaasServer/delivery/schedule/deliveryScheduleCtrl/listByScheme (page)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `page` | boolean | 示例: `false` |
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `queryConditions` | array | 示例: `[{"field":"id","value":[null],"operation":"eq"}]` |

**响应:** `200` 成功

---

## 配送规则

> 基础数据 > 配送管理 > 配送规则

### `/pszxSaasServer/delivery/rule`

#### POST `/pszxSaasServer/delivery/rule/deliveryRuleCtrl/listByScheme`

POST /pszxSaasServer/delivery/rule/deliveryRuleCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"7e686fb4ed0e4c6b99aee04078936355","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"6a6adaa6c3884074803bf6d2b85d5b62"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 默认调剂货位

> 基础数据 > 物料信息 > 默认调剂货位

### `/pszxSaasServer/archive/mat`

#### POST `/pszxSaasServer/archive/mat/materialArchiveLocationCtrl/listByScheme`

POST /pszxSaasServer/archive/mat/materialArchiveLocationCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"2057298077416165377","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"2057298077378416640"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## dataease报表测试

> 数据报表 > dataease报表测试

### `/pszxSaasServer/settlement/inventoryOutApplyCtrl`

#### POST `/pszxSaasServer/settlement/inventoryOutApplyCtrl/listWithChildren`

POST /pszxSaasServer/settlement/inventoryOutApplyCtrl/listWithChildren (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"6a1c16aceffb458392215410021c0a3c","value":[],"field":"head.ordTime","operation":"between"}]` |
| `templateId` | string | 示例: `"29c60475e39941d8938c6eb79c28abc6"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## NC仓库

> 财务结算 > NC仓库

### `/pszxSaasServer/main/ncWarehouse`

#### POST `/pszxSaasServer/main/ncWarehouse/ncWarehouseCtrl/listByScheme`

POST /pszxSaasServer/main/ncWarehouse/ncWarehouseCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"2aa19585689d4baf9cce56fc007c7b2e","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"c4704c86318c48d58ea0c289551b3dbd"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## NC余留库存管理

> 财务结算 > NC余留库存管理

### `/pszxSaasServer/settlement/ncRemainingInventoryCtrl`

#### POST `/pszxSaasServer/settlement/ncRemainingInventoryCtrl/listByScheme`

POST /pszxSaasServer/settlement/ncRemainingInventoryCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"a1a0932ad3364db5848a4e4239fe4aee","value":[null],"field":"pkNcWarehouse","operation":"like"}]` |
| `templateId` | string | 示例: `"8e3db43075d84e6fbc0bee1d30ecacff"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

### `/pszxSaasServer/archive/mat`

#### POST `/pszxSaasServer/archive/mat/materialArchiveHeadCtrl/listByScheme`

POST /pszxSaasServer/archive/mat/materialArchiveHeadCtrl/listByScheme (page)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `page` | boolean | 示例: `false` |
| `functionCodeObj` | object |  |
| `queryConditions` | array | 示例: `[{"field":"deleteflag","value":[0],"operation":"eq"}]` |

**响应:** `200` 成功

---

## 余留单

> 财务结算 > 余留单

### `/pszxSaasServer/settlement/remainingCtrl`

#### POST `/pszxSaasServer/settlement/remainingCtrl/listWithChildren`

POST /pszxSaasServer/settlement/remainingCtrl/listWithChildren (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"06060b72115848c0a0d5ed452d03ac4e","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"head.pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"27b827ff48b54c9591ee57101b6aff39"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 作业控制台

> 作业控制台

### `/pszxSaasServer/basic/org`

#### GET `/pszxSaasServer/basic/org/orgParamsCtrl/getParamsWithOrg`

GET /pszxSaasServer/basic/org/orgParamsCtrl/getParamsWithOrg

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| `pkOrg` | query | string | 否 |  |
| `code` | query | string | 否 |  |

**响应:** `200` 成功

---

### `/pszxSaasServer/work/system`

#### GET `/pszxSaasServer/work/system/setting/workSystemSettingCtrl/listOne`

GET /pszxSaasServer/work/system/setting/workSystemSettingCtrl/listOne

**响应:** `200` 成功

---

### `/pszxSaasServer/do/work`

#### POST `/pszxSaasServer/do/work/doWorkCtrl/page`

POST /pszxSaasServer/do/work/doWorkCtrl/page (templateId=9c2e153e1a014d198fed9e1ad9bf54c4)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `templateId` | string | 示例: `"9c2e153e1a014d198fed9e1ad9bf54c4"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `queryConditions` | array | 示例: `[{"id":"c90d482a31264a3cb9af2e93b2e6bcf4","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"head.pkOrg","operation":"in"}]` |
| `groupByList` | array | 示例: `[]` |
| `pageNum` | number | 示例: `1` |
| `pageSize` | number | 示例: `30` |
| `functionCodeObj` | object |  |
| `sortName` | string | 示例: `""` |

**响应:** `200` 成功

---

## 借药报表

> 库存管理 > 借药报表

### `/pszxSaasServer/ic/br`

#### POST `/pszxSaasServer/ic/br/brOrderReportCtrl/listWithChildren`

POST /pszxSaasServer/ic/br/brOrderReportCtrl/listWithChildren (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"1966398460324478976","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"boh.pk_org","operation":"in"}]` |
| `templateId` | string | 示例: `"1966390599183761408"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

#### POST `/pszxSaasServer/ic/br/brOrderReportCtrl/getDetail`

POST /pszxSaasServer/ic/br/brOrderReportCtrl/getDetail (id=00013A1000000000VGSD@1978334564828581888)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 示例: `"00013A1000000000VGSD@1978334564828581888"` |
| `indexFunctionCodeMap` | object |  |
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[{"id":"pkOrg","value":["00013A1000000000VGSD"],"operation":"in"}]` |
| `queryConditions` | array | 示例: `[{"id":"1966398460324478976","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"boh.pk_org","operation":"in"}]` |
| `templateId` | string | 示例: `"1966390599183761408"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 医院外系统接口映射档案

> 订单管理 > 医院外系统接口映射档案

### `/pszxSaasServer/main/external`

#### POST `/pszxSaasServer/main/external/originalPrescriptConvertCtrl/listWithChildren`

POST /pszxSaasServer/main/external/originalPrescriptConvertCtrl/listWithChildren (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"14857de638aa4f758a047c0679649a03","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"head.pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"3ad4d4aef5a44b3d89e728275aca8c09"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

#### POST `/pszxSaasServer/main/external/externalSystemCtrl/listWithChildren`

POST /pszxSaasServer/main/external/externalSystemCtrl/listWithChildren (page)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `page` | boolean | 示例: `false` |
| `functionCodeObj` | object |  |
| `queryConditions` | array | 示例: `[{"field":"head.enableflag","value":[0],"operation":"eq"}]` |

**响应:** `200` 成功

---

## 医院外系统接口档案

> 订单管理 > 医院外系统接口档案

### `/pszxSaasServer/main/external`

#### POST `/pszxSaasServer/main/external/externalSystemBillCtrl/getDetail`

POST /pszxSaasServer/main/external/externalSystemBillCtrl/getDetail (id=2043517928245825536)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 示例: `"2043517928245825536"` |
| `indexFunctionCodeMap` | object |  |

**响应:** `200` 成功

---

## 医院认证配置

> 订单管理 > 医院认证配置

### `/pszxSaasServer/order/hospitalAuthConfig`

#### POST `/pszxSaasServer/order/hospitalAuthConfig/hospitalAuthConfigCtrl/listByScheme`

POST /pszxSaasServer/order/hospitalAuthConfig/hospitalAuthConfigCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"0b43a0320a544034a451fc6f7c177ab8","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"6e82333e5f684b3287abffaf43ba4e88"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 协定方现存量

> 库存管理 > 协定方现存量

### `/pszxSaasServer/agreed/inventory`

#### POST `/pszxSaasServer/agreed/inventory/agreedInventoryCtrl/listWithChildren`

POST /pszxSaasServer/agreed/inventory/agreedInventoryCtrl/listWithChildren (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"27e1d3abeb6a42a99ec766c4bd179239","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"head.pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"9d55548263b64cf29d3a933d39420866"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

#### POST `/pszxSaasServer/agreed/inventory/agreedInventoryBillCtrl/getDetail`

POST /pszxSaasServer/agreed/inventory/agreedInventoryBillCtrl/getDetail (id=2047223711168991232)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 示例: `"2047223711168991232"` |
| `indexFunctionCodeMap` | object |  |

**响应:** `200` 成功

---

## 原处方单模板

> 处方受理 > 原处方单模板

### `/pszxSaasServer/herb/rx`

#### POST `/pszxSaasServer/herb/rx/oriPrescriptionTemplateCtrl/listWithChildren`

POST /pszxSaasServer/herb/rx/oriPrescriptionTemplateCtrl/listWithChildren (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"1805d1303db54d0b802119b0a8b9903a","value":[null],"field":"head.pkHospital","operation":"in"}]` |
| `templateId` | string | 示例: `"76988b91b92f4897b0c0397d835f96c8"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

#### POST `/pszxSaasServer/herb/rx/oriPrescriptionTemplateBillCtrl/getDetail`

POST /pszxSaasServer/herb/rx/oriPrescriptionTemplateBillCtrl/getDetail (id=2005453221765320704)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 示例: `"2005453221765320704"` |
| `indexFunctionCodeMap` | object |  |

**响应:** `200` 成功

---

## 处方单转换规则-全局

> 处方受理 > 处方单转换规则-全局

### `/pszxSaasServer/herb/convert`

#### POST `/pszxSaasServer/herb/convert/prescriptConvertCtrl/listByScheme`

POST /pszxSaasServer/herb/convert/prescriptConvertCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"64feca2f516d40bd8b05e9775947f519","value":[null],"field":"billSource","operation":"like"}]` |
| `templateId` | string | 示例: `"0b6f64fd24e241b187efeaf5d5baca51"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 处方性质煎煮时间

> 处方受理 > 处方性质煎煮时间

### `/pszxSaasServer/archive/apply`

#### POST `/pszxSaasServer/archive/apply/prescriptDecoctConfigCtrl/listByScheme`

POST /pszxSaasServer/archive/apply/prescriptDecoctConfigCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"56f8cd42c3914e5d97669377cf529401","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"d343d2f889b142c5b45a79a2bea5e8a9"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 处方看板

> 处方受理 > 处方看板

### `/pszxSaasServer/herb/rx`

#### POST `/pszxSaasServer/herb/rx/prescriptionViewCtrl/queryDashboardData`

POST /pszxSaasServer/herb/rx/prescriptionViewCtrl/queryDashboardData (pkHospital=)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pkHospital` | string | 示例: `""` |
| `beginDate` | string | 示例: `"2026-06-09 00:00:00"` |
| `endDate` | string | 示例: `"2026-06-09 23:59:59"` |

**响应:** `200` 成功

---

## 库存出入库流水

> 库存管理 > 库存出入库流水

### `/pszxSaasServer/ic/basic`

#### POST `/pszxSaasServer/ic/basic/inv/icInventoryFlownumCtrl/listByScheme`

POST /pszxSaasServer/ic/basic/inv/icInventoryFlownumCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"9d57ca53ac3a483e93d7e9b08c1c616c","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"d50637219fc849de9e899fcdb1291cf5"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 库存占用

> 库存管理 > 库存占用

### `/pszxSaasServer/ic/basic`

#### POST `/pszxSaasServer/ic/basic/inv/icInventoryAvailableCtrl/listByScheme`

POST /pszxSaasServer/ic/basic/inv/icInventoryAvailableCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"c2f6c8409b4949c5bbbe81fd7a7f1129","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"6b37ae6812e4451ebd39b8e1ea5175cd"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 库存明细

> 库存管理 > 库存明细

### `/pszxSaasServer/ic/basic`

#### POST `/pszxSaasServer/ic/basic/inv/icInventoryCtrl/listByScheme`

POST /pszxSaasServer/ic/basic/inv/icInventoryCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"038fd11b334845e39f7e11faf72d8bb5","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"528f0173b4d8445dae58107b6ea6485d"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 库存明细NC相关

> 库存管理 > 库存明细NC相关

### `/pszxSaasServer/pszx/inv`

#### POST `/pszxSaasServer/pszx/inv/icInventoryNcCtrl/listByScheme`

POST /pszxSaasServer/pszx/inv/icInventoryNcCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"80bb685bd0954a0c9b5188a898642ef0","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"36b647962a0f42fe9f95511d89fa8856"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 库存预警

> 库存管理 > 库存预警

### `/pszxSaasServer/inv/volumeWarn`

#### POST `/pszxSaasServer/inv/volumeWarn/sum`

POST /pszxSaasServer/inv/volumeWarn/sum (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"2000397195114582020","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"2000397195068444672"` |
| `groupByFields` | string | 示例: `"32857d347d054360813c4ad8cf7dbb04,272794ea14844a088d85994e0f70f75a,23c27d498b8246ae8eb8d0704a7f0b2d,2"` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 报文处理记录

> 订单管理 > 报文处理记录

### `/pszxSaasServer/order/messageProcessingLog`

#### POST `/pszxSaasServer/order/messageProcessingLog/messageProcessingLogCtrl/listByScheme`

POST /pszxSaasServer/order/messageProcessingLog/messageProcessingLogCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"6e739881ba05444ebbb8154deb890bca","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"1f8cfa1cab4646e08e66cfbc0de2ef7a"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 损耗单

> 财务结算 > 损耗单

### `/pszxSaasServer/loss/lossCtrl`

#### POST `/pszxSaasServer/loss/lossCtrl/listWithChildren`

POST /pszxSaasServer/loss/lossCtrl/listWithChildren (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"a4b481cacc014be0bfd1ccf00593af29","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"head.pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"5f0bc522092b4dee827e4716875497a9"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 接口字段配置-全局

> 订单管理 > 接口字段配置-全局

### `/pszxSaasServer/order/interfaceFieldConfig`

#### POST `/pszxSaasServer/order/interfaceFieldConfig/interfaceFieldConfigCtrl/listByScheme`

POST /pszxSaasServer/order/interfaceFieldConfig/interfaceFieldConfigCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[]` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 推单日志

> 库存管理 > 推单日志

### `/pszxSaasServer/ic/syncLogCtrl`

#### POST `/pszxSaasServer/ic/syncLogCtrl/listByScheme`

POST /pszxSaasServer/ic/syncLogCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"5195ffff7cd042fbafae75f0d931d985","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"112f3e808aa8466db93785fa46153aaa"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 效期预警

> 库存管理 > 效期预警

### `/pszxSaasServer/inv/validityWarn`

#### POST `/pszxSaasServer/inv/validityWarn/sum`

POST /pszxSaasServer/inv/validityWarn/sum (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"1948919391768936452","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"1948919391752159232"` |
| `groupByFields` | string | 示例: `"b2267f4a47bb4e10ad9833681fea20f3,719d1de2591140ffbc156297c9b78a4b,b6c1d49d0896485ebf6b65139adad353,a"` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 数据源管理

> 数据源管理

### `/pszxSaasServer/sysmp/sysDictionaryItemCtrl`

#### GET `/pszxSaasServer/sysmp/sysDictionaryItemCtrl/list`

GET /pszxSaasServer/sysmp/sysDictionaryItemCtrl/list

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| `basicEntity.deleteflag` | query | integer | 否 |  |
| `page` | query | boolean | 否 |  |
| `basicEntity.dictionaryId` | query | integer | 否 |  |

**响应:** `200` 成功

---

### `/pszxSaasServer/templates/query`

#### POST `/pszxSaasServer/templates/query/queryTemplateHeadCtrl/listWithChildren`

POST /pszxSaasServer/templates/query/queryTemplateHeadCtrl/listWithChildren (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `9999` |
| `pageNum` | number | 示例: `1` |

**响应:** `200` 成功

---

#### POST `/pszxSaasServer/templates/query/queryTemplateCtrl/getDetail`

POST /pszxSaasServer/templates/query/queryTemplateCtrl/getDetail (id=fc4c9bb440ac45f8ab071e3813f089f6)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 示例: `"fc4c9bb440ac45f8ab071e3813f089f6"` |
| `indexFunctionCodeMap` | object |  |

**响应:** `200` 成功

---

### `/pszxSaasServer/templates/column`

#### POST `/pszxSaasServer/templates/column/columnTemplateCtrl/getDetail`

POST /pszxSaasServer/templates/column/columnTemplateCtrl/getDetail (id=ff08e8710b594ba1b25755cb97b912a1)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 示例: `"ff08e8710b594ba1b25755cb97b912a1"` |
| `indexFunctionCodeMap` | object |  |

**响应:** `200` 成功

---

## 现存量

> 库存管理 > 现存量

### `/pszxSaasServer/templates/column`

#### GET `/pszxSaasServer/templates/column/columnTemplateCtrl/getShowColumnTemplateWithGroupBy`

GET /pszxSaasServer/templates/column/columnTemplateCtrl/getShowColumnTemplateWithGroupBy

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| `functionCode` | query | string | 否 |  |

**响应:** `200` 成功

---

### `/pszxSaasServer/inv/sum`

#### POST `/pszxSaasServer/inv/sum/sum`

POST /pszxSaasServer/inv/sum/sum (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"1948952720723410948","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"1948952720689856512"` |
| `groupByFields` | string | 示例: `"412ba3f2a77240d88d50f0fe6f267430,8c8172cbeb2f48e2b08a0e6c24e44222,c1e2ddf050244ce89df96dae0b23f683,2"` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 盘点单

> 库存管理 > 盘点单

### `/pszxSaasServer/archive/mat`

#### POST `/pszxSaasServer/archive/mat/type/materialArchiveTypeHeadCtrl/listByScheme`

POST /pszxSaasServer/archive/mat/type/materialArchiveTypeHeadCtrl/listByScheme (functionCodeObj)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `functionCodeObj` | object |  |
| `page` | boolean | 示例: `true` |
| `pageSize` | number | 示例: `999` |
| `sortName` | string | 示例: `""` |
| `queryConditions` | array | 示例: `[{"field":"code","value":[],"operation":"like"}]` |

**响应:** `200` 成功

---

### `/pszxSaasServer/ic/invcount`

#### POST `/pszxSaasServer/ic/invcount/invCountOrderCtrl/listWithChildren`

POST /pszxSaasServer/ic/invcount/invCountOrderCtrl/listWithChildren (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"4f7af400faed4387b88b78e8b9aef737","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"head.pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"d67acc333093431e8bef217cc99eafe6"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 空间消杀记录

> 空间消杀记录

### `/pszxSaasServer/templates/bill`

#### POST `/pszxSaasServer/templates/bill/billTemplateCtrl/getDetail`

POST /pszxSaasServer/templates/bill/billTemplateCtrl/getDetail (id=fff7e31bbca946c2b51c3a3d42632a56)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 示例: `"fff7e31bbca946c2b51c3a3d42632a56"` |
| `indexFunctionCodeMap` | object |  |

**响应:** `200` 成功

---

### `/pszxSaasServer/main/spacedr`

#### POST `/pszxSaasServer//main/spacedr/spaceDRecordCtrl/listByScheme`

POST /pszxSaasServer//main/spacedr/spaceDRecordCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"ff0fe7c07ea54323a95c67decac1ef15","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"c8cf11f2f33148bbbb291615d5030eda"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

### `/pszxSaasServer/aliOss/downloadFile`

#### GET `/pszxSaasServer/aliOss/downloadFile/df12ecd077efc8c23881028604dbb8cc`

GET /pszxSaasServer/aliOss/downloadFile/df12ecd077efc8c23881028604dbb8cc

**响应:** `200` 成功

---

#### GET `/pszxSaasServer/aliOss/downloadFile/471c75ee6643a10934502bdafee198fb`

GET /pszxSaasServer/aliOss/downloadFile/471c75ee6643a10934502bdafee198fb

**响应:** `200` 成功

---

#### GET `/pszxSaasServer/aliOss/downloadFile/e60e81c4cbe5171cd654662d9887aec2`

GET /pszxSaasServer/aliOss/downloadFile/e60e81c4cbe5171cd654662d9887aec2

**响应:** `200` 成功

---

#### GET `/pszxSaasServer/aliOss/downloadFile/0f3d014eead934bbdbacb62a01dc4831`

GET /pszxSaasServer/aliOss/downloadFile/0f3d014eead934bbdbacb62a01dc4831

**响应:** `200` 成功

---

#### GET `/pszxSaasServer/aliOss/downloadFile/2b3bf3eee2475e03885a110e9acaab61`

GET /pszxSaasServer/aliOss/downloadFile/2b3bf3eee2475e03885a110e9acaab61

**响应:** `200` 成功

---

#### GET `/pszxSaasServer/aliOss/downloadFile/83f2550373f2f19492aa30fbd5b57512`

GET /pszxSaasServer/aliOss/downloadFile/83f2550373f2f19492aa30fbd5b57512

**响应:** `200` 成功

---

#### GET `/pszxSaasServer/aliOss/downloadFile/ebd6d2f5d60ff9afaeda1a81fc53e2d0`

GET /pszxSaasServer/aliOss/downloadFile/ebd6d2f5d60ff9afaeda1a81fc53e2d0

**响应:** `200` 成功

---

#### GET `/pszxSaasServer/aliOss/downloadFile/1cd3882394520876dc88d1472aa2a93f`

GET /pszxSaasServer/aliOss/downloadFile/1cd3882394520876dc88d1472aa2a93f

**响应:** `200` 成功

---

#### GET `/pszxSaasServer/aliOss/downloadFile/41a60377ba920919939d83326ebee5a1`

GET /pszxSaasServer/aliOss/downloadFile/41a60377ba920919939d83326ebee5a1

**响应:** `200` 成功

---

#### GET `/pszxSaasServer/aliOss/downloadFile/b5488aeff42889188d03c9895255cecc`

GET /pszxSaasServer/aliOss/downloadFile/b5488aeff42889188d03c9895255cecc

**响应:** `200` 成功

---

#### GET `/pszxSaasServer/aliOss/downloadFile/0c8ce55163055c4da50a81e0a273468c`

GET /pszxSaasServer/aliOss/downloadFile/0c8ce55163055c4da50a81e0a273468c

**响应:** `200` 成功

---

#### GET `/pszxSaasServer/aliOss/downloadFile/5cbdfd0dfa22a3fca7266376887f549b`

GET /pszxSaasServer/aliOss/downloadFile/5cbdfd0dfa22a3fca7266376887f549b

**响应:** `200` 成功

---

## 请求日志

> 订单管理 > 请求日志

### `/pszxSaasServer/order/requestLog`

#### POST `/pszxSaasServer/order/requestLog/requestLogCtrl/listByScheme`

POST /pszxSaasServer/order/requestLog/requestLogCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"9fa695a739bd4f0189a77e8bfa603ce7","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"f13c7fc11065447c9da6270038ca8ec3"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 重复检测索引

> 订单管理 > 重复检测索引

### `/pszxSaasServer/order/duplicateCheckIndex`

#### POST `/pszxSaasServer/order/duplicateCheckIndex/duplicateCheckIndexCtrl/listByScheme`

POST /pszxSaasServer/order/duplicateCheckIndex/duplicateCheckIndexCtrl/listByScheme (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"63fc12afe114497982e139daa79f407d","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"e7c07275d2554cce93ef4ebaaab881e1"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 销售发票

> 财务结算 > 销售发票

### `/pszxSaasServer/sale/invoice`

#### POST `/pszxSaasServer/sale/invoice/saleInvoiceCtrl/listWithChildren`

POST /pszxSaasServer/sale/invoice/saleInvoiceCtrl/listWithChildren (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"f66270677a794e09b1bda1a2b3a60314","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"head.pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"56602028c79a491bbcec68cfc4cb906d"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 销售结算单

> 财务结算 > 销售结算单

### `/pszxSaasServer/settlement/saleSettle`

#### POST `/pszxSaasServer/settlement/saleSettle/saleSettleOrderCtrl/listWithChildren`

POST /pszxSaasServer/settlement/saleSettle/saleSettleOrderCtrl/listWithChildren (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"1d19233106c4469ab6be9e27e801ad51","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"head.pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"800eae30cd8f41cc8868b03350e4375a"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 销售订单

> 财务结算 > 销售订单

### `/pszxSaasServer/saleOrder/saleOrderCtrl`

#### POST `/pszxSaasServer/saleOrder/saleOrderCtrl/listWithChildren`

POST /pszxSaasServer/saleOrder/saleOrderCtrl/listWithChildren (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"8455ba652c9e4deaa9ea25304bad6761","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"head.pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"2cf9fb468c8d4a3a962aeceecfa65c1e"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---

## 预销售单

> 财务结算 > 预销售单

### `/pszxSaasServer/settlement/presale`

#### POST `/pszxSaasServer/settlement/presale/presaleOrderCtrl/listWithChildren`

POST /pszxSaasServer/settlement/presale/presaleOrderCtrl/listWithChildren (pageSize)

**请求体:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pageSize` | number | 示例: `50` |
| `pageNum` | number | 示例: `1` |
| `sortName` | string | 示例: `""` |
| `extQueryConditions` | array | 示例: `[]` |
| `queryConditions` | array | 示例: `[{"id":"12582f6f2e4e4228a72eb844838c8099","value":["00013A1000000000VGSD","1787720377238028288","global"],"field":"head.pkOrg","operation":"in"}]` |
| `templateId` | string | 示例: `"95b6678c49ea444f845d38862e08913c"` |
| `groupByFields` | string | 示例: `""` |
| `reloadColumnFlag` | number | 示例: `0` |
| `functionCodeObj` | object |  |

**响应:** `200` 成功

---
