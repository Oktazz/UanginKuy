export type IotLiveSample = {
  weight: number;
  measuredAt: string;
  stable: boolean;
};

export function iotLiveKey(deviceId: string) {
  return `iot:live:${deviceId}`;
}

export function iotDeviceRegistrationKey(deviceId: string) {
  return `iot:registered:${deviceId}`;
}

export function isIotLiveSample(value: unknown): value is IotLiveSample {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const sample = value as Record<string, unknown>;
  return (
    typeof sample.weight === "number" &&
    Number.isFinite(sample.weight) &&
    typeof sample.measuredAt === "string" &&
    typeof sample.stable === "boolean"
  );
}
