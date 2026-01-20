import { Suspense } from "react";
import ProjectSiteContent from "./ProjectSiteContent";

export default function ProjectSitePage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>加载中...</div>}>
      <ProjectSiteContent />
    </Suspense>
  );
}
