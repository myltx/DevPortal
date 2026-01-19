"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

// Dynamically import SwaggerUI to avoid SSR issues with some libraries
const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function ApiDocPage() {
  return (
    <div className="container mx-auto p-4">
      <SwaggerUI url="/api/doc" />
    </div>
  );
}
