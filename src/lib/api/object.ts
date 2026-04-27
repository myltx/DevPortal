import request from "@/lib/request";

export function objList(data: any) {
  return request({
    url: "/objAttrDefine/objList",
    method: "post",
    data,
  });
}

export function saveOrUpdate(data: any) {
  return request({
    url: "/objAttrDefine/saveOrUpdate",
    method: "post",
    data,
  });
}

export function objectInfoList(data: any) {
  return request({
    url: "/objAttrDefine/objectInfoList",
    method: "post",
    data,
  });
}

export function deleteById(id: number) {
  return request({
    url: "/objAttrDefine/deleteById",
    method: "post",
    params: { id },
  });
}

export function exportList(data: any) {
  return request({
    url: "/objAttrDefine/exportObj",
    method: "post",
    data,
    responseType: "blob", // For download
  });
}
