import { GET, POST } from "../api";

const deviceUrl = {
  list: "/device/list",
  connect: "/api/devices/connect",
  disconnect: "/api/devices/disconnect",
  connectAll: "/api/devices/connect-all",
  disconnectAll: "/api/devices/disconnect-all",
};

export const fetchDeviceList = (param: any = {}) => {
  return GET(deviceUrl.list, param);
};

export const connectDevice = (param: { deviceId: string }) => {
  return POST(deviceUrl.connect, param);
};

export const disconnectDevice = (param: { deviceId: string }) => {
  return POST(deviceUrl.disconnect, param);
};

export const connectAllDevices = () => {
  return POST(deviceUrl.connectAll, {});
};

export const disconnectAllDevices = () => {
  return POST(deviceUrl.disconnectAll, {});
};
