// Action labels
export const actionsList = {
  storeBakery: "STORE_BAKERY",
  storeVisitURL: "STORE_VISIT_URL",
  updateControllerConnection: "UPDATE_CONTROLLER_CONNECTION",
  LogOut: "FLUSH_LOCAL_STORAGE"
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
    payload: bakery
  };
}

/**
  @param {Object} conn The active controller connection.
*/
export function updateControllerConnection(conn) {
  return {
    type: actionsList.updateControllerConnection,
    payload: conn
  };
}

/**
  @param {String} visitURL The url the user needs to connect to to complete the
    bakery login.
*/
export function storeVisitURL(visitURL) {
  return {
    type: actionsList.storeVisitURL,
    payload: visitURL
  };
}

/**
  Flush localStorage login keys
*/
export function LogOut() {
  localStorage.removeItem("identity");
  localStorage.removeItem("https://api.jujucharms.com/identity");
  return {
    type: actionsList.LogOut,
    payload: true
  };
}
