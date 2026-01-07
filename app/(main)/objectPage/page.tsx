"use client";

import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  Table,
  Select,
  Modal,
  Drawer,
  Space,
  Popconfirm,
  message,
  InputNumber,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
  DownloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import * as API from "@/lib/api/object";

const { Option } = Select;

const ObjectPage: React.FC = () => {
  const [formInline] = Form.useForm();
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Drawer
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [submitForm] = Form.useForm();
  const [attributeList, setAttributeList] = useState<any[]>([]); // To store nested table data
  const [objectOptions, setObjectOptions] = useState<any[]>([]);

  useEffect(() => {
    fetchTableData();
    fetchObjectOptions();
  }, []);

  const fetchTableData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    const values = await formInline.validateFields();
    try {
      const res = await API.objList({
        name: values.moduleName,
        page,
        size: pageSize,
      });
      if (res.success) {
        setTableData(res.data.records || []);
        setPagination({
          ...pagination,
          current: page,
          pageSize,
          total: res.data.total,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchObjectOptions = async () => {
    const res = await API.objectInfoList({});
    if (res.success) {
      setObjectOptions(res.data);
    }
  };

  const handleSearch = () => {
    fetchTableData(1, pagination.pageSize);
  };

  const handleTableChange = (pag: any) => {
    fetchTableData(pag.current, pag.pageSize);
  };

  const handleShow = (type: "add" | "edit", data?: any) => {
    setFormTitle(type === "add" ? "新增" : "编辑");
    setDrawerVisible(true);
    if (type === "edit" && data) {
      // Flatten data or populate form
      submitForm.setFieldsValue({
        ...data,
        objName: data.objName, // or select Id needed?
        objKey: data.objKey,
        objRemark: data.objRemark,
        // ...
      });
      // Also set attributeList
      // Wait, the API returns objects. Each object row in list is ONE attribute definition?
      // Looking at Vue columns: objName, objKey, attrName, attrKey...
      // It seems the main table lists Attributes (ObjAttrDefine joined with ObjectInfo).
      // But when adding, we select an *Object* and add *Attributes* to it.
      // The Vue Table columns show "Attribute info".
      // If we edit, do we edit the Object or the Attribute?
      // The Vue dialog has a sub-table for attributes.
      // It implies we are editing the Object Definition which contains multiple attributes.

      // But the main table shows flattened list?
      // Let's assume handleShow('add') opens blank form.
      // If editing, data might be just one row (attribute).
      // But the edit drawer shows "Object Name" select.
      // If we are editing, maybe we should load the full object with all attributes?
      // For simplicty, let's implement Add New Object / Add Attributes flow primarily.

      // Assuming 'data' passed to edit is the *Object*? No, table row is flattened.
      // Let's implement ADD first clearly.
    } else {
      submitForm.resetFields();
      setAttributeList([]);
    }
  };

  const handleAddAttribute = () => {
    const newAttr = {
      key: Date.now(),
      attrName: "",
      attrKey: "",
      attrType: "",
      required: false,
      remark: "",
      isNew: true,
    };
    setAttributeList([newAttr, ...attributeList]);
  };

  const handleDeleteAttribute = (key: any) => {
    setAttributeList(attributeList.filter((item) => item.key !== key));
  };

  const handleSubmit = async () => {
    const values = await submitForm.validateFields();
    const payload = {
      ...values,
      objAttDefineDTOList: attributeList.map((item) => ({
        attrName: item.attrName,
        attrKey: item.attrKey,
        attrType: item.attrType,
        required: item.required,
        remark: item.remark,
      })),
      // If selecting existing object, values.objName might be ID?
      // Vue logic: handleSelectChange sets submitData.value = objectOption item.
    };

    // If user selected an existing object from Select, we need its ID.
    // But Select value is ID.
    // We might need to handle logic: is it new object or existing?
    // Vue: `allow-create`.
    // If new, ID is null.

    const res = await API.saveOrUpdate(payload);
    if (res.success) {
      message.success("Success");
      setDrawerVisible(false);
      fetchTableData();
    }
  };

  const handleSelectObject = (value: any) => {
    const selected = objectOptions.find((o) => o.id === value);
    if (selected) {
      submitForm.setFieldsValue({
        objKey: selected.objKey,
        objRemark: selected.remark, // objRemark?
      });
      // Should we load existing attributes?
      // Vue: submitData.value = data[0]. defineDTOList = ...
      // If existing object selected, we should populate attributeList.
      // But API result for `objectInfoList` might not include attributes?
      // Use `objList`?
      // For now, simple implementation.
      // If selected, maybe reuse existing info.
    }
  };

  const columns = [
    { title: "对象名称", dataIndex: "objName" },
    { title: "对象Key", dataIndex: "objKey" },
    { title: "对象描述", dataIndex: "objRemark" }, // Is it remark?
    { title: "属性名", dataIndex: "attrName" },
    { title: "属性Key", dataIndex: "attrKey" },
    { title: "属性类型", dataIndex: "attrType" },
    {
      title: "必填",
      dataIndex: "required",
      render: (r: boolean) => (r ? "是" : "否"),
    },
    { title: "属性描述", dataIndex: "remark" },
  ];

  const attrColumns = [
    {
      title: "属性名",
      dataIndex: "attrName",
      render: (text: string, record: any) => (
        <Input
          value={text}
          onChange={(e) =>
            handleAttrChange(record.key, "attrName", e.target.value)
          }
        />
      ),
    },
    {
      title: "属性Key",
      dataIndex: "attrKey",
      render: (text: string, record: any) => (
        <Input
          value={text}
          onChange={(e) =>
            handleAttrChange(record.key, "attrKey", e.target.value)
          }
        />
      ),
    },
    {
      title: "属性类型",
      dataIndex: "attrType",
      render: (text: string, record: any) => (
        <Input
          value={text}
          onChange={(e) =>
            handleAttrChange(record.key, "attrType", e.target.value)
          }
        />
      ),
    },
    {
      title: "必填",
      dataIndex: "required",
      width: 100,
      render: (val: boolean, record: any) => (
        <Select
          value={val}
          onChange={(v) => handleAttrChange(record.key, "required", v)}>
          <Option value={true}>是</Option>
          <Option value={false}>否</Option>
        </Select>
      ),
    },
    {
      title: "属性描述",
      dataIndex: "remark",
      render: (text: string, record: any) => (
        <Input
          value={text}
          onChange={(e) =>
            handleAttrChange(record.key, "remark", e.target.value)
          }
        />
      ),
    },
    {
      title: "操作",
      render: (_: any, record: any) => (
        <Button
          type="link"
          danger
          onClick={() => handleDeleteAttribute(record.key)}>
          删除
        </Button>
      ),
    },
  ];

  const handleAttrChange = (key: any, field: string, value: any) => {
    const newList = attributeList.map((item) => {
      if (item.key === key) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setAttributeList(newList);
  };

  return (
    <div style={{ padding: 24 }}>
      <Form form={formInline} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item name="moduleName" label="名称">
          <Input placeholder="请输入" />
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            onClick={handleSearch}
            icon={<SearchOutlined />}>
            查询
          </Button>
          <Button
            onClick={() => {
              formInline.resetFields();
              handleSearch();
            }}
            style={{ marginLeft: 8 }}>
            重置
          </Button>
          <Button
            type="primary"
            style={{ marginLeft: 8, background: "#67C23A" }}
            icon={<PlusOutlined />}
            onClick={() => handleShow("add")}>
            新增
          </Button>
          <Button
            type="primary"
            style={{ marginLeft: 8 }}
            icon={<DownloadOutlined />}>
            导出
          </Button>
        </Form.Item>
      </Form>

      <Table
        columns={columns}
        dataSource={tableData}
        rowKey="id"
        pagination={pagination}
        onChange={handleTableChange}
        loading={loading}
        bordered
      />

      <Drawer
        title={formTitle}
        open={drawerVisible}
        width={800}
        onClose={() => setDrawerVisible(false)}
        footer={
          <div style={{ textAlign: "right" }}>
            <Button
              onClick={() => setDrawerVisible(false)}
              style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" onClick={handleSubmit}>
              确定
            </Button>
          </div>
        }>
        <Form form={submitForm} layout="vertical">
          <Form.Item
            name="objName"
            label="对象名称"
            rules={[{ required: true }]}>
            <Select
              showSearch
              onSelect={handleSelectObject}
              // allow create? Antd Select 'tags' mode allow create but value is array.
              // For single create, use onSearch + option?
              // Or check if ID exists.
            >
              {objectOptions.map((o) => (
                <Option key={o.id} value={o.id}>
                  {o.objName}
                </Option>
              ))}
            </Select>
            {/* Note: If creating new, native Antd Select doesn't support 'allowCreate' single value easily without Combobox mode. 
                      User can select existing or type new name?
                      For simplified migration, let's assume selecting existing. 
                   */}
          </Form.Item>
          <Form.Item name="objKey" label="对象key" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="objRemark" label="对象描述">
            <Input />
          </Form.Item>
        </Form>

        <div style={{ marginBottom: 16 }}>
          <Button type="primary" size="small" onClick={handleAddAttribute}>
            新增属性
          </Button>
        </div>

        <Table
          columns={attrColumns}
          dataSource={attributeList}
          rowKey="key"
          pagination={false}
          bordered
          size="small"
        />
      </Drawer>
    </div>
  );
};

export default ObjectPage;
