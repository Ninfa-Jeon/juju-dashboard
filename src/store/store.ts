import type { UnknownAction } from "@reduxjs/toolkit";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { useCallback } from "react";
import type { TypedUseSelectorHook } from "react-redux";
import { useDispatch, useSelector, useStore } from "react-redux";

import generalReducer from "store/general";
import jujuReducer from "store/juju";
import checkAuth from "store/middleware/check-auth";
import { modelPollerMiddleware } from "store/middleware/model-poller";
import { notificationsMiddleware } from "store/middleware/notifications";
import { logger } from "utils/logger";

import { listenerMiddleware } from "./listenerMiddleware";
import processMiddleware from "./middleware/process";
import sourceMiddleware from "./middleware/source";

type PreloadedState = Record<string, unknown>;

// Assigning undefined as that is the type required by configureStore.
let preloadedState: PreloadedState | undefined = undefined;
if (
  !import.meta.env.PROD &&
  typeof import.meta.env.VITE_APP_MOCK_STORE === "string"
) {
  try {
    preloadedState = JSON.parse(
      import.meta.env.VITE_APP_MOCK_STORE,
    ) as PreloadedState;
  } catch (error) {
    logger.error("VITE_APP_MOCK_STORE could not be parsed");
  }
}

// Bootstrap mode: check URL params at store creation time so the first
// render already has the correct state. This avoids a race condition where
// dispatching the config after render causes Routes() to read stale state.
const BOOTSTRAP_MODE_QUERY_KEY = "bootstrapMode";
const isBootstrapModeFromLocation = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }
  const params = new URLSearchParams(window.location.search);
  return params.get(BOOTSTRAP_MODE_QUERY_KEY) === "true";
};

if (isBootstrapModeFromLocation()) {
  const params = new URLSearchParams(window.location.search);
  const bridgeBaseURL = params.get("bridgeBaseURL") ?? undefined;
  const bridgeToken = params.get("bridgeToken") ?? undefined;
  preloadedState = {
    general: {
      appVersion: null,
      config: {
        analyticsEnabled: false,
        baseAppURL: "/",
        bootstrapMode: true,
        bridgeBaseURL,
        bridgeToken,
        controllerAPIEndpoint: "",
        identityProviderURL: "",
        isJuju: true,
      },
      connectionError: null,
      controllerConnections: null,
      controllerFeatures: null,
      credentials: null,
      login: null,
      pingerIntervalIds: null,
      visitURLs: null,
    },
    juju: {
      auditEvents: {
        items: [],
        loading: false,
        loaded: false,
        errors: null,
        limit: 20,
      },
      crossModelQuery: {
        results: null,
        loading: false,
        loaded: false,
        errors: null,
      },
      secrets: {},
      cloudInfo: { clouds: null, loading: false, loaded: false, errors: null },
      userCredentials: {
        items: null,
        loading: false,
        loaded: false,
        errors: null,
      },
      models: {},
      modelsError: null,
      modelData: null,
      controllers: {},
      addModel: { loading: false, loaded: false, success: false, errors: null },
      migrationTargets: {
        items: null,
        loading: false,
        loaded: false,
        errors: null,
      },
      supportedVersions: {
        items: null,
        loading: false,
        loaded: false,
        errors: null,
      },
      rebacAllowed: {},
      rebacRelationships: {},
      checkRelationsErrors: {},
    },
  };
}

const store = configureStore({
  // Order of the middleware is important
  middleware: (getDefaultMiddleware) => {
    // Construct the middleware in such a way that the types don't get lost as
    // suggested by the Redux Toolkit docs:
    // https://redux-toolkit.js.org/usage/usage-with-typescript#correct-typings-for-the-dispatch-type
    const middleware = getDefaultMiddleware({
      serializableCheck: {
        ignoredActionPaths: ["meta.connections"],
      },
    });
    // The checkAuth middleware must be first.
    middleware.unshift(checkAuth);
    middleware.push(listenerMiddleware.middleware);
    middleware.push(notificationsMiddleware);
    middleware.push(modelPollerMiddleware);
    middleware.push(...sourceMiddleware);
    middleware.push(processMiddleware);
    return middleware;
  },
  preloadedState,
  reducer: combineReducers({
    general: generalReducer,
    juju: jujuReducer,
  }),
});

export type RootState = ReturnType<typeof store.getState>;

export type Store = typeof store;
export type AppDispatch = typeof store.dispatch;
export const useAppStore = useStore<RootState>;
// This hook can be used in place of useDispatch to get correctly typed dispatches using thunks or
// action objects as suggested by the docs:
// https://redux-toolkit.js.org/usage/usage-with-typescript#correct-typings-for-the-dispatch-type
export const useAppDispatch: () => AppDispatch = useDispatch;
// This hook can be used in place of useDispatch to get correctly typed dispatches that return promises.
export const usePromiseDispatch = (): (<Result>(
  action: UnknownAction,
) => Promise<Result>) => {
  const dispatch = useAppDispatch();
  return useCallback(
    async <Result>(action: UnknownAction) =>
      (dispatch as (action: UnknownAction) => Promise<Result>)(action),
    [dispatch],
  );
};
// This hook annotates the selectors using the store state.
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
