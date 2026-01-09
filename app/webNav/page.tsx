"use client";

import React, { useEffect, useState } from "react";
import { Card, Row, Col, Typography } from "antd";
import { useRouter } from "next/navigation";
import * as API from "@/lib/api/project";

const { Title } = Typography;

export default function WebNavPage() {
  const router = useRouter();
  const [classInfoList, setClassInfoList] = useState<any[]>([]);

  useEffect(() => {
    API.getClassInfo().then((res) => {
      if (res.success) {
        setClassInfoList(res.data);
      }
    });
  }, []);

  const handleCardClick = (id: number) => {
    router.push(`/projectSite?id=${id}`);
  };

  return (
    <div style={{ padding: "24px" }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        导航分类
      </Title>
      <Row gutter={[16, 16]}>
        {classInfoList.map((item) => (
          <Col key={item.id} xs={24} sm={12} md={8} lg={6}>
            <Card
              hoverable
              onClick={() => handleCardClick(item.id)}
              style={{ cursor: "pointer", textAlign: "center" }}>
              <h3>{item.name}</h3>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
