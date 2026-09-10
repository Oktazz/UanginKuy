"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  assignDevice,
  registerDevice,
  unassignDevice,
  unregisterDevice,
  type DeviceActionResult,
} from "../actions";
import type { Feedback, IotDevice } from "../types";

export function useIoTDevice({
  router,
  onFeedback,
}: {
  router: ReturnType<typeof useRouter>;
  onFeedback: (feedback: Feedback | null) => void;
}) {
  const [deviceId, setDeviceId] = useState("");
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [deviceToDelete, setDeviceToDelete] = useState<IotDevice | null>(null);

  const runDeviceAction = async (
    actionKey: string,
    action: () => Promise<DeviceActionResult>,
  ) => {
    setPendingAction(actionKey);
    onFeedback(null);

    const result = await action();
    onFeedback({
      kind: result.success ? "success" : "error",
      message: result.message,
    });
    setPendingAction(null);
    router.refresh();

    return result;
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData();
    formData.set("deviceId", deviceId);
    const result = await runDeviceAction("register", () =>
      registerDevice(formData),
    );

    if (result.success) setDeviceId("");
  };

  const handleDeviceAssignment = async (
    currentDeviceId: string,
    courierId: string,
  ) => {
    await runDeviceAction(`assign:${currentDeviceId}`, () =>
      courierId
        ? assignDevice(currentDeviceId, courierId)
        : unassignDevice(currentDeviceId),
    );
  };

  const handleDeleteDevice = async () => {
    if (!deviceToDelete) return;

    const deletingId = deviceToDelete.id;
    const result = await runDeviceAction(`delete:${deletingId}`, () =>
      unregisterDevice(deletingId),
    );

    if (result.success) setDeviceToDelete(null);
  };

  return {
    deviceId,
    setDeviceId,
    pendingAction,
    deviceToDelete,
    setDeviceToDelete,
    handleRegister,
    handleDeviceAssignment,
    handleDeleteDevice,
  };
}