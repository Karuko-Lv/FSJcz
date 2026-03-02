import { GET } from "../api";

const wetDryDepositionUrl = {
  status: "/sampler/deposition/status",
};

export type WetDryDepositionSystemStatus = "正常运行" | "待机" | "故障" | "维护中";

export type WetDryDepositionStatus = {
  updatedAt: string;
  systemStatus: WetDryDepositionSystemStatus;
  rainTotalMm: number;
  rainCurrentMm: number;
  rainIntensityMmH: number;
  rainSenseStatus?: "无雨" | "有雨";
  rainIntensityMmMin?: number;
  tempRainGauge: number;
  tempRainSensor: number;
  tempSamplingBucket: number;
  tempDustCover: number;
  tempCabinet: number;
  tempAmbient: number;
  siteTemperature?: number;
  siteHumidity?: number;
  samplingMode?: string;
  cumulativeSamplingCount?: number;
};

export const fetchWetDryDepositionStatus = () => {
  return GET(wetDryDepositionUrl.status, {});
};
