import { Suspense } from "react";
import { Skeleton, Row, Col, Card } from "antd";
import ProjectSiteContent from "./ProjectSiteContent";

const LoadingSkeleton = () => (
  <div style={{ padding: 24, display: "flex", gap: 24, height: "100vh" }}>
    {/* Sidebar Skeleton */}
    <div
      style={{
        width: 220,
        flexShrink: 0,
        background: "#fff",
        borderRadius: 12,
        padding: 16,
      }}>
      <Skeleton active paragraph={{ rows: 8 }} title={{ width: "60%" }} />
    </div>
    {/* Main Grid Skeleton */}
    <div style={{ flex: 1 }}>
      <Row gutter={[16, 16]}>
        {[...Array(8)].map((_, i) => (
          <Col xs={24} sm={12} md={12} lg={12} xl={8} xxl={6} key={i}>
            <Card
              style={{
                borderRadius: 12,
                border: "1px solid #f0f0f0",
              }}>
              <Skeleton active avatar paragraph={{ rows: 2 }} />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  </div>
);

export default function ProjectSitePage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ProjectSiteContent />
    </Suspense>
  );
}
