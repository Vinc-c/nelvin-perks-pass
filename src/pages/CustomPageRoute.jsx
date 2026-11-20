import React from "react";
import { useParams } from "react-router-dom";
import { CustomPage } from "@/components/LegalDynamic";

export default function CustomPageRoute() {
  const { slug } = useParams();
  return <CustomPage slug={String(slug || "").toLowerCase()} />;
}
