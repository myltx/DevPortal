export interface R<T> {
  code: number;
  msg: string;
  data: T;
  success: boolean;
}

export interface Class {
  id: number;
  name: string; // 名字
}

export interface ClassDTO {
  id: number;
}

export interface Project {
  id: number; // id
  projectName: string; // 项目名称
  projectDescribe: string; // 描述
  createTime: string; // 创建时间
  updateTime: string; // 更新时间
  areaName: string; // 所属地区
  sort?: number;
  classId: number; // 所属行业
}

export interface ProjectListDTO {
  projectId: string; // 项目id
  moduleName: string; // 模块名称
  typeName: string; // 环境
}

export interface ProjectListVO {
  projectId: number; // 项目id
  projectName: string; // 项目名称
  moduleName: string; // 项目List (refers to module name in usage?)
  moduleId: number; // 模块id
  moduleUrl: string; // url地址
  typeName: string; // 类型名称
  updateTime: string; // 更新时间
  describe: string; // 描述
  remark: string; // 备注
  areaName: string; // 所属区划
}

export interface ProjectAreaList {
  areaName: string; // 地区名称
  list: ProjectListVO[]; // 项目列表
}

export interface ModuleSaveDTO {
  projectId: number; // 项目id
  moduleName: string; // 模块名称
  moduleUrl: string; // 模块地址
  typeName: string; // 环境
  moduleDescribe: string; // 描述
  remark: string; // 备注
  classId: number; // 所属行业
  areaName: string; // 所属区划
}

export interface ModuleUpdateDTO {
  moduleId: number; // 模块id
  projectId: number; // 项目id
  moduleName: string; // 模块名称
  moduleUrl: string; // 模块地址
  typeName: string; // 环境
  moduleDescribe: string; // 描述
  remark: string; // 备注
  areaName: string; // 所属区划
}

export interface Account {
  id: number; // id
  account: string; // 账号
  password: string; // 密码
  remark: string; // 备注
  moduleId: number; // 模块id
}

export interface AccountDTO {
  id?: number; // id
  account: string; // 账号
  password: string; // 密码
  remark: string; // 备注
  moduleId: number; // 模块id
}

export interface AccountListDTO {
  moduleId: number; // 模块id
}

export interface AccountListVO {
  id: number; // id
  account: string; // 账号
  password: string; // 密码
}

// NounName Interfaces
export interface NounNameDTO {
  id?: number;
  name?: string;
  type?: string;
  label?: string[];
  description?: string;
  createTime?: string;
  updateTime?: string;
  operateUser?: string;
  classId?: number;
  englishName?: string;
  remark?: string;
}

export interface NounNameListDTO {
  classId?: number;
  key?: string;
}

export interface NounNameVO {
  id?: string;
  name?: string;
  label?: string[];
  description?: string;
  createTime?: string;
  updateTime?: string;
  operateUser?: string;
  classId?: number;
  englishName?: string;
  remark?: string;
}

// ObjAttrDefine Interfaces
export interface ObjAttDefineDTO {
  id?: number;
  attrName?: string;
  attrKey?: string;
  attrType?: string;
  required?: boolean;
  remark?: string;
}

export interface ObjAttDefineSaveOrUpdateDTO {
  id?: number;
  objName?: string;
  objKey?: string;
  objRemark?: string;
  objAttDefineDTOList?: ObjAttDefineDTO[];
}

export interface ObjNameDTO {
  name?: string;
  page?: number;
  size?: number;
}

export interface ObjectAttrDefineVO {
  id?: number;
  objId?: number;
  objName?: string;
  objKey?: string;
  objRemark?: string;
  objAddTime?: string;
  attrName?: string;
  attrKey?: string;
  attrType?: string;
  required?: string;
  remark?: string;
  addTime?: string;
}

export interface ObjInfoVO {
  id?: number;
  objName?: string;
  objKey?: string;
  objRemark?: string;
  objAttDefineDTOList?: ObjAttDefineDTO[];
}

export interface ImportObjDTO {
  objName?: string;
  objKey?: string;
  objRemark?: string;
  attrName?: string;
  attrKey?: string;
  attrType?: string;
  required?: number;
  remark?: string;
}
