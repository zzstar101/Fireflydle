import { useCallback, useEffect, useState } from "react";
import { useNetworkStatus } from "./network-status";
import {
  inspectSpecialModePack,
  prepareSpecialModePack,
  type SpecialModeId,
} from "./special-mode-pack";

export type SpecialModePackState =
  "checking" | "downloading" | "ready" | "missing" | "unsupported" | "error";

export function useSpecialModePack(modeId: SpecialModeId | null, prepareOnEntry = false) {
  const online = useNetworkStatus();
  const [state, setState] = useState<SpecialModePackState>("checking");

  const refresh = useCallback(async () => {
    if (!modeId) {
      setState("unsupported");
      return;
    }
    setState("checking");
    const inspection = await inspectSpecialModePack(modeId);
    if (inspection === "ready" || inspection === "unsupported" || !online || !prepareOnEntry) {
      setState(inspection);
      return;
    }
    setState("downloading");
    try {
      await prepareSpecialModePack(modeId);
      setState("ready");
    } catch {
      setState("error");
    }
  }, [modeId, online, prepareOnEntry]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { online, state, retry: refresh };
}
