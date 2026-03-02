import { GET, POST } from "../api";

const naiSpectrometerUrl = {
  status: "/spectrometer/nai/status",
  spectrum: "/spectrometer/nai/spectrum",
  clearDose: "/spectrometer/nai/clear-dose",
  recalibrate: "/spectrometer/nai/recalibrate",
  restartSpectrum: "/spectrometer/nai/restart-spectrum",
};

export type NaISpectrometerWorkStatus = "未开始" | "刻度中" | "刻度成功";
export type NaIAerosolSwitchStatus = "开启" | "关闭";

export type NaISpectrometerStatus = {
  updatedAt: string;
  workStatus: NaISpectrometerWorkStatus;
  aerosolSwitch: NaIAerosolSwitchStatus;
  cps: number;
  gammaDoseRate: number;
  gammaDoseRateUnit: "µSv/h";
  gammaTotalDose: number;
  gammaTotalDoseUnit: "µSv";
  spectrumAccumSeconds: number;
  spectrumSize: 1024 | 2048;
};

export type NaISpectrum = {
  size: 1024 | 2048;
  counts: number[];
};

export const fetchNaISpectrometerStatus = () => {
  return GET(naiSpectrometerUrl.status, {});
};

export const fetchNaISpectrum = (params?: { size?: 1024 | 2048 }) => {
  return GET(naiSpectrometerUrl.spectrum, params ?? {});
};

export const clearNaIGammaTotalDose = () => {
  return POST(naiSpectrometerUrl.clearDose, {});
};

export const recalibrateNaISpectrometer = () => {
  return POST(naiSpectrometerUrl.recalibrate, {});
};

export const restartNaISpectrum = () => {
  return POST(naiSpectrometerUrl.restartSpectrum, {});
};

