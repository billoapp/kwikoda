// lib/deviceId.ts
export function getDeviceId(): string {
  const storageKey = 'kwikoda_device_id';
  
  let deviceId = localStorage.getItem(storageKey);
  
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(storageKey, deviceId);
  }
  
  return deviceId;
}

export function getBarDeviceKey(barId: string): string {
  const deviceId = getDeviceId();
  return `${deviceId}_${barId}`;
}