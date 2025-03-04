import { useCallback, useEffect, useMemo } from "react";

import { ENABLED_FLAGS } from "consts";

import useLocalStorage from "./useLocalStorage";
import { useQueryParams } from "./useQueryParams";

type FlagQueryParams = {
  "enable-flag": string[];
  "disable-flag": string[];
};

export default function useFeatureFlags() {
  const [queryParams] = useQueryParams<FlagQueryParams>({
    "enable-flag": [],
    "disable-flag": [],
  });
  const [enabledFlags, setEnabledFlags] = useLocalStorage<string[]>(
    ENABLED_FLAGS,
    [],
  );

  const getFinalFlags = useCallback(() => {
    const enabledParams = queryParams["enable-flag"];
    const disabledParams = queryParams["disable-flag"];

    // Combine the new and existing flags and use Set to dedupe.
    const enabled = Array.from(new Set([...enabledFlags, ...enabledParams]));
    // Filter out any flags that should be disabled.
    return enabled.filter((flag) => !disabledParams.includes(flag));
  }, [queryParams, enabledFlags]);

  const finalFlags = useMemo(() => getFinalFlags(), [getFinalFlags]);

  useEffect(() => {
    setEnabledFlags(finalFlags);
  }, [setEnabledFlags, finalFlags, enabledFlags]);
}
