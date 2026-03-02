import { GET, POST } from "../api";

const aerosolSamplerUrl = {
  status: "/sampler/aerosol/status",
  setMode: "/sampler/aerosol/mode",
  start: "/sampler/aerosol/start",
  stop: "/sampler/aerosol/stop",
  commCheck: "/sampler/aerosol/comm-check",
};

export type AerosolSamplerMode = "1h" | "6h" | "24h";

export const fetchAerosolSamplerStatus = () => {
  return GET(aerosolSamplerUrl.status, {});
};

export const setAerosolSamplerMode = (param: { mode: AerosolSamplerMode }) => {
  return POST(aerosolSamplerUrl.setMode, param);
};

export const startAerosolSampler = () => {
  return POST(aerosolSamplerUrl.start, {});
};

export const stopAerosolSampler = () => {
  return POST(aerosolSamplerUrl.stop, {});
};

export const commCheckAerosolSampler = () => {
  return POST(aerosolSamplerUrl.commCheck, {});
};
