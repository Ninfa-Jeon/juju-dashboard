import {
  getBakery,
  getJujuAPIInstance,
  getPingerIntervalId,
} from "app/selectors";

import connectAndListModels from "app/model-poller";

import { clearModelData } from "juju/actions";

// Action labels
export const actionsList = {
  logOut: "LOG_OUT",
  storeBakery: "STORE_BAKERY",
  storeConfig: "STORE_CONFIG",
  storeLoginError: "STORE_LOGIN_ERROR",
  storeUserPass: "STORE_USER_PASS",
  storeVersion: "STORE_VERSION",
  storeVisitURL: "STORE_VISIT_URL",
  updateControllerConnection: "UPDATE_CONTROLLER_CONNECTION",
  updateJujuAPIInstance: "UPDATE_JUJU_API_INSTANCE",
  updatePingerIntervalId: "UPDATE_PINGER_INTERVAL_ID",
};

// Action creators
/**
  @param {Bakery} bakery The instance of the bakery that's to be used for the
  application to interact as the active user. This bakery contains private data
  and should not be dumped wholesale from the redux store.
*/
export function storeBakery(bakery) {
  return {
    type: actionsList.storeBakery,
    payload: bakery,
  };
}

/**
  @param {Object} config The configuration values for the application.
*/
export function storeConfig(config) {
  return {
    type: actionsList.storeConfig,
    payload: config,
  };
}

/**
  @param {String} error The error message to store.
*/
export function storeLoginError(error) {
  return {
    type: actionsList.storeLoginError,
    payload: error,
  };
}

/**
  @param {String} version The version of the application.
*/
export function storeVersion(version) {
  return {
    type: actionsList.storeVersion,
    payload: version,
  };
}

/**
  @param {Object} credentials The users credentials in the format
    {user: ..., password: ...}
*/
export function storeUserPass(credentials) {
  return {
    type: actionsList.storeUserPass,
    payload: credentials,
  };
}

/**
  @param {String} wsControllerURL The URL of the websocket connection.
  @param {Object} conn The active controller connection.
*/
export function updateControllerConnection(wsControllerURL, conn) {
  return {
    type: actionsList.updateControllerConnection,
    payload: {
      wsControllerURL,
      conn,
    },
  };
}

/**
  @param {String} wsControllerURL The URL of the websocket connection.
  @param {Object} juju The active Juju api instance.
*/
export function updateJujuAPIInstance(wsControllerURL, juju) {
  return {
    type: actionsList.updateJujuAPIInstance,
    payload: {
      wsControllerURL,
      juju,
    },
  };
}

export function updatePingerIntervalId(intervalId) {
  return {
    type: actionsList.updatePingerIntervalId,
    payload: intervalId,
  };
}

/**
  @param {String} visitURL The url the user needs to connect to to complete the
    bakery login.
*/
export function storeVisitURL(visitURL) {
  return {
    type: actionsList.storeVisitURL,
    payload: visitURL,
  };
}

// Thunks
/**
  Flush bakery from redux store
*/
export function logOut(getState) {
  return async function logOut(dispatch) {
    const state = getState();
    const bakery = getBakery(state);
    const juju = getJujuAPIInstance(state);
    const pingerIntervalId = getPingerIntervalId(state);
    bakery.storage._store.removeItem("identity");
    bakery.storage._store.removeItem("https://api.jujucharms.com/identity");
    juju.logout();
    clearInterval(pingerIntervalId);
    dispatch({
      type: actionsList.logOut,
    });
    dispatch(clearModelData());
  };
}

/**
  Trigger the connection and polling of models.
  @param {Object} reduxStore The reduxStore.
  @param {Object} bakery The bakery.
*/
export function connectAndStartPolling(reduxStore, bakery) {
  return async function connectAndStartPolling(dispatch) {
    let additionalControllers = null;
    try {
      const data = window.localStorage.getItem("additionalControllers");
      additionalControllers = JSON.parse(data);
    } catch (e) {
      // XXX Add to Sentry.
      console.log("oops bad data in the additionalControllers localStorage");
    }
    connectAndListModels(reduxStore, bakery, additionalControllers);
  };
}
