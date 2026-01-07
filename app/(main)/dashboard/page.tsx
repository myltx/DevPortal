"use client";

import React, { useState, useMemo } from "react";
import { Radio, Card, List, Tag } from "antd";

const DashboardPage: React.FC = () => {
  const [radio, setRadio] = useState(0);

  const familyList = [
    { type: 1, name: "mather", sex: 1 },
    { type: 2, name: "father", sex: 2 },
    { type: 3, name: "brother", sex: 2 },
    { type: 1, name: "妈妈", sex: 1 },
    { type: 2, name: "爸爸", sex: 2 },
    { type: 3, name: "兄弟", sex: 2 },
    { type: 4, name: "女儿", sex: 1 },
    { type: 5, name: "表兄1", sex: 2 },
    { type: 5, name: "表兄2", sex: 2 },
    { type: 5, name: "表兄3", sex: 2 },
    { type: 5, name: "表兄4", sex: 2 },
    { type: 5, name: "表兄5", sex: 2 },
  ];

  const filterType = useMemo(() => {
    const arr: number[] = [];
    familyList.forEach((item) => {
      if (!arr.includes(item.type)) {
        arr.push(item.type);
      }
    });
    return arr.sort((a, b) => a - b);
  }, []);

  const filterFamily = useMemo(() => {
    if (radio === 0) return familyList;
    return familyList.filter((item) => item.type === radio);
  }, [radio]);

  return (
    <div style={{ padding: 24 }}>
      <Card title="Dashboard" style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <Radio.Group onChange={(e) => setRadio(e.target.value)} value={radio}>
            <Radio value={0}>All</Radio>
            {filterType.map((type) => (
              <Radio key={type} value={type}>
                类型{type}
              </Radio>
            ))}
          </Radio.Group>
        </div>

        <List
          header={<div>Family Members</div>}
          bordered
          dataSource={filterFamily}
          renderItem={(item) => (
            <List.Item>
              <Tag color={item.sex === 1 ? "magenta" : "blue"}>
                {item.sex === 1 ? "Female" : "Male"}
              </Tag>
              {item.name} (Type: {item.type})
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default DashboardPage;
