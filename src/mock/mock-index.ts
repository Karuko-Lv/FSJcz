import Mock from "mockjs";
//处理路径传参
import { parameteUrl } from "@/utils/query-param"

function ArrSet(Arr: any[], id: string): any[] {
    let obj: any = {}
    const arrays = Arr.reduce((setArr, item) => {
        obj[item[id]] ? '' : (obj[item[id]] = true && setArr.push(item))
        return setArr
    }, [])
    return arrays
}
/**
* @description: min ≤ r ≤ max  随机数
* @param {*} Min
* @param {*} Max
* @return {*}
*/
function RandomNumBoth(Min: any, Max: any) {
    var Range = Max - Min;
    var Rand = Math.random();
    var num = Min + Math.round(Rand * Range); //四舍五入
    return num;
}

let aerosolSamplerMode = "1h";
let aerosolSamplerRunning = false;
let aerosolSamplerStartAt: number | null = null;
let aerosolSamplerStopAt: number | null = null;

let depositionRainTotalMm = 0;
let depositionSystemStatus: "正常运行" | "待机" | "故障" | "维护中" = "正常运行";

let naiWorkStatus: "未开始" | "刻度中" | "刻度成功" = "未开始";
let naiAerosolSwitch: "开启" | "关闭" = "开启";
let naiGammaTotalDose = 0;
let naiSpectrumSize: 1024 | 2048 = 1024;
let naiSpectrumAccumSeconds = 0;
let naiLastUpdateAt = Date.now();
let naiCalibrateEndAt: number | null = null;

const pad2 = (n: number) => `${n}`.padStart(2, "0");
const formatDateTime = (ms: number) => {
    const d = new Date(ms);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
};

const formatTime = (ms: number) => {
    const d = new Date(ms);
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
};

const getAerosolStatus = () => {
    const now = Date.now();
    const realTimeFlow = Number(Mock.Random.float(760, 840, 1, 1));
    const durationSec = aerosolSamplerStartAt ? Math.max(0, Math.floor(((aerosolSamplerRunning ? now : (aerosolSamplerStopAt ?? now)) - aerosolSamplerStartAt) / 1000)) : 0;
    const durationMin = Math.floor(durationSec / 60);
    const durationHour = Math.floor(durationMin / 60);
    const durationLeftMin = durationMin % 60;
    const durationText = aerosolSamplerStartAt ? `${durationHour ? `${durationHour}h` : ""}${durationLeftMin}min` : "0min";
    const volume = aerosolSamplerStartAt ? Number(((realTimeFlow * durationSec) / 3600).toFixed(2)) : 0;
    return {
        mode: aerosolSamplerMode,
        realTimeFlow,
        systemStatus: aerosolSamplerRunning ? "运行" : "待机",
        filterBoxNo: "FB-0216",
        samplingDuration: durationText,
        samplingVolume: volume,
        dustMass: Number(Mock.Random.float(0.12, 0.58, 2, 2)),
        filmThickness: Number(Mock.Random.float(0.08, 0.18, 2, 2)),
        startTime: aerosolSamplerStartAt ? formatDateTime(aerosolSamplerStartAt) : "",
        endTime: aerosolSamplerRunning ? "" : (aerosolSamplerStopAt ? formatDateTime(aerosolSamplerStopAt) : ""),
    };
};

const getDepositionStatus = () => {
    const now = Date.now();
    const r = Math.random();
    if (r < 0.02) depositionSystemStatus = "故障";
    else if (r < 0.04) depositionSystemStatus = "维护中";
    else if (r < 0.10) depositionSystemStatus = "待机";
    else depositionSystemStatus = "正常运行";

    const rainIntensityMmH = Number(Mock.Random.float(0, 12, 1, 1));
    const rainCurrentMm = Number(Mock.Random.float(0, 1.6, 1, 1));
    depositionRainTotalMm = Number((depositionRainTotalMm + rainCurrentMm).toFixed(1));
    const rainIntensityMmMin = Number((rainIntensityMmH / 60).toFixed(1));
    const rainSenseStatus = rainCurrentMm >= 0.2 || rainIntensityMmH >= 2 ? "有雨" : "无雨";

    const baseTemp = Number(Mock.Random.float(8, 18, 1, 1));
    const jitter = () => Number(Mock.Random.float(-1.2, 1.2, 1, 1));
    const tempAmbient = Number((baseTemp + jitter()).toFixed(1));

    return {
        updatedAt: formatTime(now),
        systemStatus: depositionSystemStatus,
        rainTotalMm: depositionRainTotalMm,
        rainCurrentMm,
        rainIntensityMmH,
        rainSenseStatus,
        rainIntensityMmMin,
        tempRainGauge: Number((baseTemp + jitter()).toFixed(1)),
        tempRainSensor: Number((baseTemp + jitter()).toFixed(1)),
        tempSamplingBucket: Number((baseTemp + jitter()).toFixed(1)),
        tempDustCover: Number((baseTemp + jitter()).toFixed(1)),
        tempCabinet: Number((baseTemp + jitter()).toFixed(1)),
        tempAmbient,
        siteTemperature: tempAmbient,
        siteHumidity: Number(Mock.Random.float(70, 98, 1, 1)),
        samplingMode: "自动采样",
        cumulativeSamplingCount: RandomNumBoth(120, 260),
    };
};

const formatHHMMSS = (sec: number) => {
    const s = Math.max(0, Math.floor(sec));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    return `${pad2(h)}:${pad2(m)}:${pad2(ss)}`;
};

const getNaIStatus = () => {
    const now = Date.now();
    const deltaSec = Math.max(0, Math.floor((now - naiLastUpdateAt) / 1000));
    naiLastUpdateAt = now;

    if (naiWorkStatus === "刻度中" && naiCalibrateEndAt && now >= naiCalibrateEndAt) {
        naiWorkStatus = "刻度成功";
        naiCalibrateEndAt = null;
    }

    const cps = Number(Mock.Random.float(80, 520, 1, 1));
    const gammaDoseRate = Number(Mock.Random.float(0.05, 0.45, 3, 3));
    if (naiWorkStatus === "刻度成功") {
        naiSpectrumAccumSeconds += deltaSec || 1;
        naiGammaTotalDose = Number((naiGammaTotalDose + gammaDoseRate * ((deltaSec || 1) / 3600)).toFixed(3));
    }

    return {
        updatedAt: formatTime(now),
        workStatus: naiWorkStatus,
        aerosolSwitch: naiAerosolSwitch,
        cps,
        gammaDoseRate,
        gammaDoseRateUnit: "µSv/h",
        gammaTotalDose: naiGammaTotalDose,
        gammaTotalDoseUnit: "µSv",
        spectrumAccumSeconds: naiSpectrumAccumSeconds,
        spectrumAccumTime: formatHHMMSS(naiSpectrumAccumSeconds),
        spectrumSize: naiSpectrumSize,
    };
};

const getNaISpectrum = (size: 1024 | 2048) => {
    const accum = Math.max(0, naiSpectrumAccumSeconds);
    const scale = 1 + Math.min(6, accum / 60);
    const out: number[] = new Array(size);

    const peak = (x: number, center: number, sigma: number, height: number) => {
        const z = (x - center) / sigma;
        return height * Math.exp(-0.5 * z * z);
    };

    const centers = size === 1024 ? [140, 360, 720, 890] : [280, 720, 1440, 1760];

    for (let i = 0; i < size; i++) {
        const base =
            peak(i, centers[0], 18, 12) +
            peak(i, centers[1], 30, 20) +
            peak(i, centers[2], 46, 14) +
            peak(i, centers[3], 24, 18);
        const noise = Math.random() * 0.9;
        out[i] = Math.max(0, Math.floor((base + noise) * scale));
    }

    return { size, counts: out };
};
//左中
export default [
    {
        url: "/bigscreen/countUserNum",
        type: "get",
        response: () => {
            const a = Mock.mock({
                success: true,
                data: {
                    offlineNum: '@integer(50, 100)',
                    alarmNum: '@integer(20, 100)',
                    lockNum: '@integer(10, 50)',
                    totalNum: 368
                }
            })
            a.data.onlineNum = a.data.totalNum - a.data.offlineNum - a.data.lockNum - a.data.alarmNum
            return a
        },
    },
    {
        url: "/bigscreen/countDeviceNum",
        type: "get",
        response: () => {
            const a = Mock.mock({
                success: true,
                data: {
                    alarmNum: '@integer(100, 1000)',
                    offlineNum: '@integer(0, 50)',
                    totalNum: 698
                }
            })
            a.data.onlineNum = a.data.totalNum - a.data.offlineNum
            return a
        }
    },
    //左下
    {
        url: "/bigscreen/leftBottom",
        type: "get",
        response: () => {
            const a = Mock.mock({
                success: true,
                data: {
                    "list|20": [
                        {
                            provinceName: "@province()",
                            cityName: '@city()',
                            countyName: "@county()",
                            createTime: "@datetime('yyyy-MM-dd HH:mm:ss')",
                            deviceId: "6c512d754bbcd6d7cd86abce0e0cac58",
                            "gatewayno|+1": 10000,
                            "onlineState|1": [0, 1],

                        }
                    ]
                }
            })
            return a
        }
    },
    //右上
    {
        url: "/bigscreen/alarmNum",
        type: "get",
        response: () => {
            const a = Mock.mock({
                success: true,
                data: {
                    dateList: ['2021-11', '2021-12', '2022-01', '2022-02', '2022-03', "2022-04"],
                    "numList|6": [
                        '@integer(0, 1000)'
                    ],
                    "numList2|6": [
                        '@integer(0, 1000)'
                    ]
                }
            })
            return a
        }
    },
    //右中
    {
        url: "/bigscreen/ranking",
        type: "get",
        response: () => {
            let num = Mock.mock({ "list|80": [{ value: "@integer(50,1000)", name: "@city()" }] }).list
            //   console.log("ranking",num);
            let newNum: any = [], numObj: any = {}
            num.map((item: any) => {
                if (!numObj[item.name] && newNum.length < 8) {
                    numObj[item.name] = true
                    newNum.push(item)
                }
            })
            let arr = newNum.sort((a: any, b: any) => {
                return b.value - a.value
            })
            let a = {
                success: true,
                data: arr
            }
            return a
        }
    },
    //右下
    {
        url: "/bigscreen/rightBottom",
        type: "get",
        response: () => {
            const a = Mock.mock({
                success: true,
                data: {
                    "list|40": [{
                        alertdetail: "@csentence(5,10)",
                        "alertname|1": ["水浸告警", "各种报警"],
                        alertvalue: "@float(60, 200)",
                        createtime: "2022-04-19 08:38:33",
                        deviceid: null,
                        "gatewayno|+1": 10000,
                        phase: "A1",
                        sbInfo: "@csentence(10,18)",
                        "terminalno|+1": 100,
                        provinceName: "@province()",
                        cityName: '@city()',
                        countyName: "@county()",
                    }],

                }
            })
            return a
        }
    },
    //安装计划
    {
        url: "/bigscreen/installationPlan",
        type: "get",
        response: () => {

            let num = RandomNumBoth(26, 32);
            const a = Mock.mock({
                ["category|" + num]: ["@city()"],
                ["barData|" + num]: ["@integer(10, 100)"],
            })
            let lineData = [], rateData = [];
            for (let index = 0; index < num; index++) {
                let lineNum = Mock.mock('@integer(0, 100)') + a.barData[index]
                lineData.push(lineNum)
                let rate = a.barData[index] / lineNum;
                rateData.push((rate * 100).toFixed(0))
            }
            a.lineData = lineData
            a.rateData = rateData
            return {
                success: true,
                data: a
            }
        }
    },
    {
        url: "/bigscreen/centerMap",
        type: "get",
        response: (options: any) => {
            let params = parameteUrl(options.url)
            //不是中国的时候
            if (params.regionCode && !["china"].includes(params.regionCode)) {
                const a = Mock.mock({
                    success: true,
                    data: {
                        "dataList|100": [
                            {
                                name: "@city()",
                                value: '@integer(1, 1000)'
                            }
                        ],
                        regionCode: params.regionCode,//-代表中国
                    }
                })
                return a
            } else {
                const a = Mock.mock({
                    success: true,
                    data: {
                        "dataList|12": [
                            {
                                name: "@province()",
                                value: '@integer(1, 1100)'
                            }
                        ],
                        regionCode: 'china',
                    }
                })
                // 去重
                a.data.dataList = ArrSet(a.data.dataList, "name")
                return a
            }
        }
    }
    ,
    {
        url: "/device/list",
        type: "get",
        response: () => {
            return {
                success: true,
                data: {
                    list: [
                        { id: "DEV-001", name: "NAS1000 气溶胶采样器", online: true },
                        { id: "DEV-002", name: "空气碘采样器", online: true },
                        { id: "DEV-003", name: "碘化物监测", online: true },
                        { id: "DEV-004", name: "高气压电离室", online: true },
                        { id: "DEV-005", name: "自动气象站", online: true },
                        { id: "DEV-006", name: "GS-1000 干湿沉降采样器", online: false }
                    ]
                }
            }
        }
    },
    {
        url: "/device/connect",
        type: "post",
        response: () => {
            const r = Math.random();
            if (r < 0.15) return { success: false, msg: "权限不足，无法连接该设备" };
            if (r < 0.30) return { success: false, msg: "设备无响应，请检查电源或网络" };
            if (r < 0.40) return { success: false, msg: "网络超时，请稍后重试" };
            return { success: true, msg: "连接成功" }
        }
    },
    {
        url: "/device/disconnect",
        type: "post",
        response: () => {
            const r = Math.random();
            if (r < 0.10) return { success: false, msg: "断开失败：设备正忙，请稍后再试" };
            if (r < 0.20) return { success: false, msg: "网络超时，请稍后重试" };
            return { success: true, msg: "断开成功" }
        }
    },
    {
        url: "/api/devices/connect",
        type: "post",
        response: (param: any) => {
            const body = typeof param?.body === "string" ? JSON.parse(param.body) : (param?.body ?? {});
            if (!body?.deviceId) return { success: false, message: "请求体中缺少deviceId", deviceId: "" };
            const r = Math.random();
            if (r < 0.15) return { success: false, message: "连接设备失败", deviceId: body.deviceId };
            return { success: true, message: "连接设备成功", deviceId: body.deviceId }
        }
    },
    {
        url: "/api/devices/disconnect",
        type: "post",
        response: (param: any) => {
            const body = typeof param?.body === "string" ? JSON.parse(param.body) : (param?.body ?? {});
            if (!body?.deviceId) return { success: false, message: "请求体中缺少deviceId", deviceId: "" };
            const r = Math.random();
            if (r < 0.15) return { success: false, message: "断开设备连接失败", deviceId: body.deviceId };
            return { success: true, message: "断开设备连接成功", deviceId: body.deviceId }
        }
    },
    {
        url: "/api/devices/connect-all",
        type: "post",
        response: () => {
            const r = Math.random();
            if (r < 0.12) return { success: false, message: "连接所有设备失败" };
            return { success: true, message: "连接所有设备成功" }
        }
    },
    {
        url: "/api/devices/disconnect-all",
        type: "post",
        response: () => {
            const r = Math.random();
            if (r < 0.10) return { success: false, message: "断开所有设备连接失败" };
            return { success: true, message: "断开所有设备连接成功" }
        }
    },
    {
        url: "/sampler/aerosol/status",
        type: "get",
        response: () => {
            return { success: true, data: getAerosolStatus() }
        }
    },
    {
        url: "/sampler/aerosol/mode",
        type: "post",
        response: (param: any) => {
            const body = typeof param?.body === "string" ? JSON.parse(param.body) : (param?.body ?? {});
            const mode = body?.mode;
            if (mode !== "1h" && mode !== "6h" && mode !== "24h") return { success: false, msg: "工作模式参数错误" };
            aerosolSamplerMode = mode;
            return { success: true, msg: "工作模式已下发" }
        }
    },
    {
        url: "/sampler/aerosol/start",
        type: "post",
        response: () => {
            if (aerosolSamplerRunning) return { success: true, msg: "采样器已处于运行状态" };
            aerosolSamplerRunning = true;
            aerosolSamplerStartAt = Date.now();
            aerosolSamplerStopAt = null;
            return { success: true, msg: "启动成功" }
        }
    },
    {
        url: "/sampler/aerosol/stop",
        type: "post",
        response: () => {
            if (!aerosolSamplerRunning) return { success: true, msg: "采样器已处于停止状态" };
            aerosolSamplerRunning = false;
            aerosolSamplerStopAt = Date.now();
            return { success: true, msg: "停止成功" }
        }
    },
    {
        url: "/sampler/aerosol/comm-check",
        type: "post",
        response: () => {
            const r = Math.random();
            if (r < 0.15) return { success: false, msg: "通信异常：设备无响应" };
            if (r < 0.25) return { success: false, msg: "通信异常：网络超时" };
            return { success: true, msg: "通信正常" }
        }
    },
    {
        url: "/sampler/deposition/status",
        type: "get",
        response: () => {
            return { success: true, data: getDepositionStatus() }
        }
    },
    {
        url: "/spectrometer/nai/status",
        type: "get",
        response: () => {
            const r = Math.random();
            if (r < 0.02) return { success: false, msg: "状态读取失败：设备无响应" }
            return { success: true, data: getNaIStatus() }
        }
    },
    {
        url: "/spectrometer/nai/spectrum",
        type: "get",
        response: (param: any) => {
            const sizeRaw = param?.query?.size;
            const size = sizeRaw === "2048" ? 2048 : 1024;
            naiSpectrumSize = size;
            const r = Math.random();
            if (r < 0.02) return { success: false, msg: "能谱读取失败：网络超时" }
            return { success: true, data: getNaISpectrum(size) }
        }
    },
    {
        url: "/spectrometer/nai/clear-dose",
        type: "post",
        response: () => {
            if (naiWorkStatus === "刻度中") return { success: false, msg: "刻度中不可清空剂量" }
            naiGammaTotalDose = 0;
            return { success: true, msg: "累积剂量已清空" }
        }
    },
    {
        url: "/spectrometer/nai/recalibrate",
        type: "post",
        response: () => {
            if (naiWorkStatus === "刻度中") return { success: false, msg: "正在刻度中，请稍后" }
            naiWorkStatus = "刻度中";
            naiCalibrateEndAt = Date.now() + 5000;
            return { success: true, msg: "已开始重新刻度" }
        }
    },
    {
        url: "/spectrometer/nai/restart-spectrum",
        type: "post",
        response: () => {
            if (naiWorkStatus === "刻度中") return { success: false, msg: "刻度中不可重新采集能谱" }
            naiSpectrumAccumSeconds = 0;
            naiLastUpdateAt = Date.now();
            return { success: true, msg: "已重新开始采集能谱" }
        }
    }
];

