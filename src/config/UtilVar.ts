interface UtilVarType {
    baseUrl:string,
    code:string|number,
    noContentCode:number,
    ENC:boolean,//是否进行加密
}

const UtilVar:UtilVarType = {
    baseUrl:"",
    code:401, //登陆过期
    noContentCode:204, //请求成功但没有内容
    ENC:false,

}

const normalizeBaseUrl = (url: string) => url.replace(/\/+$/, "");
const defaultBaseUrl = "http://192.168.1.233:8080";

const runtimeType:any = {

    production: () => {
        const envUrl = (import.meta as any)?.env?.VITE_API_BASE_URL;
        UtilVar.baseUrl = normalizeBaseUrl(typeof envUrl === "string" && envUrl ? envUrl : defaultBaseUrl);
    },
    //开发环境
    development: () => {
        const envUrl = (import.meta as any)?.env?.VITE_API_BASE_URL;
        UtilVar.baseUrl = normalizeBaseUrl(typeof envUrl === "string" && envUrl ? envUrl : defaultBaseUrl);

    },
    hash:()=>{

    }
    
}
// console.log(import.meta.env)
runtimeType[import.meta.env.MODE]&&runtimeType[import.meta.env.MODE]()
export default UtilVar
