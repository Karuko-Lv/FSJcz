import {GET,POST,FILE,FILEPOST,PUT,GETNOBASE} from "../api";
const indexUrl=  {
    'leftTop':'/bigscreen/countDeviceNum',//左上
    'leftCenter':'/bigscreen/countUserNum',//左中
    "centerMap":"/bigscreen/centerMap",
    "centerBottom":"/bigscreen/installationPlan",

    'leftBottom':"/bigscreen/leftBottom", //坐下
    'rightTop':"/bigscreen/alarmNum", //报警次数
    'rightBottom':'/bigscreen/rightBottom',//右下 
    'rightCenter':'/bigscreen/ranking',// 报警排名
}

export default indexUrl