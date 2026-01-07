import request from "@/lib/request";

// 获取分类表
export function getClassInfo(data = {}) {
  return request({
    url: "/class/getClassInfo",
    method: "post",
    data,
  });
}

// 项目(名词) 列表
export function selectList(data: any) {
  return request({
    url: "/nounName/selectList",
    method: "post",
    data,
  });
}

// 项目新增
export function addProject(data: any) {
  return request({
    url: "/nounName/add",
    method: "post",
    data,
  });
}

// 项目 删除
export function deleteProject(id: number) {
  return request({
    url: "/nounName/deleteById",
    method: "post",
    params: { id }, // Pass as query param if backend expects it via @RequestParam equivalent, or body if JSON
     // API definition check needed. Original JS used url?id=...
  });
}

// 项目 修改
export function updateProject(data: any) {
  return request({
    url: "/nounName/update",
    method: "post",
    data,
  });
}

// 标签列表
export function labelList(type?: string) {
  return request({
    url: "/nounName/labelList",
    method: "post",
    params: { type }, 
  });
}

// Below are for WebNav (Project/Module/Account)

export function projectList(data: any) {
  return request({
    url: "/project/projectList",
    method: "post",
    data,
  });
}

export function getProjectNameList(classId?: number) {
  // Original uses getList?classId=...
  return request({
    url: "/project/getList",
    method: "post",
    params: { classId },
  });
}

export function getAreaList(data = {}) {
  return request({
    url: "/project/areaList",
    method: "post",
    data,
  });
}

export function createProject(data: any) {
  return request({
    url: "/project/add",
    method: "post",
    data,
  });
}

export function editProject(data: any) {
  return request({
    url: "/project/update",
    method: "post",
    data,
  });
}

export function removeProject(id: number) {
  return request({
    url: "/project/deleteById",
    method: "post",
    params: { id },
  });
}

export function accountList(data: any) {
  return request({
    url: "/project/accountList",
    method: "post",
    data,
  });
}

export function addOrUpdateAccount(data: any) {
  return request({
    url: "/project/addOrUpdate",
    method: "post",
    data,
  });
}

export function deleteAccount(ids: number[]) {
  return request({
    url: "/project/deleteAccount",
    method: "post",
    data: ids, // check backend if it expects array directly or inside object
  });
}
