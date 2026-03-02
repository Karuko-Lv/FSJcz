import dayjs from "dayjs";

export type Metric = {
  label: string;
  value: string | number;
  unit?: string;
};

export type Trend = {
  xAxis: string[];
  yUnit?: string;
  series: Array<{
    name: string;
    data: number[];
  }>;
};

export const dashboardDemo = {
  aerosolSampler: {
    title: "气溶胶采样器",
    subtitle: "NAS1000 超大流量气溶胶采样器",
    statusText: "运行正常",
    updatedAt: "10:37:32",
    metrics: [
      { label: "瞬时采样流量", value: 814, unit: "m³/h" },
      { label: "采样流量", value: 800, unit: "m³/h" },
      { label: "采样时长", value: 56, unit: "min" },
      { label: "累计采样体积", value: 391.93, unit: "m³" },
    ] satisfies Metric[],
    chartTitle: "2026年1月13日至2026年1月26日（单位:m³/h）",
    chartUnit: "m³/h",
    chartYMin: 600,
    chartYMax: 1200,
    chartXAxis: [
      "1月13日24时",
      "1月14日24时",
      "1月15日24时",
      "1月16日24时",
      "1月17日24时",
      "1月18日24时",
      "1月19日24时",
      "1月20日24时",
      "1月21日24时",
      "1月22日24时",
      "1月23日24时",
      "1月24日24时",
      "1月25日24时",
    ],
    chartData: [814, 802, 821, 808, 816, 805, 812, 809, 817, 806, 813, 804, 800],
  },
  airTritiumSampler: {
    title: "空气碘采样器",
    subtitle: "1号空气碘采样器",
    statusText: "运行正常",
    updatedAt: "10:37:32",
    metrics: [
      { label: "瞬时采样流量", value: 77.7, unit: "L/min" },
    ] satisfies Metric[],
    extraRow: { label: "采样滤膜ID:", value: "IF-0635" },
    chartTitle: "2026年1月13日至2026年1月26日（单位:L/min）",
    chartUnit: "L/min",
    chartYMin: 0,
    chartYMax: 100,
    chartXAxis: [
      "1月13日24时",
      "1月14日24时",
      "1月15日24时",
      "1月16日24时",
      "1月17日24时",
      "1月18日24时",
      "1月19日24时",
      "1月20日24时",
      "1月21日24时",
      "1月22日24时",
      "1月23日24时",
      "1月24日24时",
      "1月25日24时",
    ],
    chartData: [77, 78, 77, 79, 78, 77, 78, 77, 78, 77, 78, 77, 77],
  },
  iodideMonitor: {
    title: "碘化钠谱仪",
    subtitle: "碘化钠谱仪监测",
    statusText: "运行正常",
    updatedAt: dayjs().format("HH:mm:ss"),
    metrics: [
      { label: "剂量率", value: 0.298, unit: "µGy/h" },
      { label: "累计剂量", value: 10.853, unit: "µGy" },
      { label: "工作温度", value: 24.3, unit: "°C" },
      { label: "工作电压", value: 16.8, unit: "V" },
    ] satisfies Metric[],
    chartTitle: "2026年1月13日至2026年1月26日（单位:µGy/h）",
    chartUnit: "µGy/h",
    chartXAxis: ["1月13日24时", "1月15日24时", "1月17日24时", "1月19日24时", "1月21日24时", "1月23日24时", "1月25日24时"],
    chartData: [0.298, 0.298, 0.297, 0.298, 0.298, 0.298, 0.298],
  },
  highPressureIonChamber: {
    title: "高气压电离室",
    subtitle: "高气压电离室监测",
    statusText: "运行正常",
    updatedAt: dayjs().format("HH:mm:ss"),
    metrics: [
      { label: "剂量率", value: 0.288, unit: "µGy/h" },
      { label: "累计剂量", value: 113.033, unit: "µGy" },
      { label: "工作温度", value: 28.8, unit: "°C" },
      { label: "工作压力", value: 3.7, unit: "bar" },
    ] satisfies Metric[],
    chartTitle: "2026年1月13日至2026年1月26日（单位:µGy/h）",
    chartUnit: "µGy/h",
    chartXAxis: ["1月13日24时", "1月15日24时", "1月17日24时", "1月19日24时", "1月21日24时", "1月23日24时", "1月25日24时"],
    chartData: [0.288, 0.288, 0.288, 0.288, 0.288, 0.288, 0.288],
  },
  stationStatus: {
    title: "站房状态总览",
    statusText: "运行正常",
    updatedAt: dayjs().format("HH:mm:ss"),
    alerts: [
      { level: "info", time: "2026/01/23 08:16:04", text: "站房门禁：正常" },
      { level: "warn", time: "2026/01/23 09:05:55", text: "水浸传感器：告警" },
      { level: "info", time: "2026/01/23 10:12:18", text: "视频监控：在线" },
    ] satisfies Array<{
      level: "info" | "warn" | "error";
      time: string;
      text: string;
    }>,
    deviceOptions: ["设备A", "设备B", "设备C"],
    comms: [
      { time: "11:23:45", name: "气溶胶采样器", status: "在线" },
      { time: "11:24:12", name: "碘化钠谱仪监测", status: "在线" },
      { time: "11:25:47", name: "高气压电离室", status: "在线" },
    ],
  },
  weatherStation: {
    title: "自动气象站",
    statusText: "运行正常",
    updatedAt: dayjs().format("HH:mm:ss"),
    metrics: [
      { label: "风速", value: 4.9, unit: "m/s" },
      { label: "大气压强", value: 1045.5, unit: "hPa" },
      { label: "降水强度", value: 0.0, unit: "mm/min" },
      { label: "温度", value: 9.4, unit: "°C" },
      { label: "湿度", value: 93.2, unit: "%" },
      { label: "雨量", value: 0.0, unit: "mm" },
    ] satisfies Metric[],
    windDirectionDeg: 20,
    windDirectionText: "东北",
    temperatureTrend: {
      xAxis: ["08:00", "09:00", "10:00", "11:00", "12:00"],
      yUnit: "°C",
      series: [
        { name: "温度", data: [9.6, 9.5, 9.3, 9.4, 9.4] },
      ],
    } satisfies Trend,
  },
  wetDryDeposition: {
    title: "温湿度传感器",
  },
};
