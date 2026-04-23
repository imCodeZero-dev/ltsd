"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

interface Props {
  spec: Record<string, unknown>;
}

export function SwaggerUIClient({ spec }: Props) {
  return (
    <SwaggerUI
      spec={spec}
      docExpansion="list"
      defaultModelsExpandDepth={1}
      tryItOutEnabled={true}
      persistAuthorization={true}
    />
  );
}
