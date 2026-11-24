"use client";

import dynamic from "next/dynamic";
import { Map } from "lucide-react";

export const ChargingMap = dynamic(() => import("./charging-map"), {
  ssr: false,
  loading: () => <div className="map-loading" role="status"><Map size={19} aria-hidden /> Загружается карта</div>,
});
