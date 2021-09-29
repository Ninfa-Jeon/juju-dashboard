import { StrictMode } from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { applyMiddleware, combineReducers, createStore } from "redux";
import thunk from "redux-thunk";
import { composeWithDevTools } from "redux-devtools-extension";
import { Bakery, BakeryStorage } from "@canonical/macaroon-bakery";
import * as Sentry from "@sentry/browser";
import App from "components/App/App";
import checkAuth from "app/check-auth";
import rootReducer from "app/root";
import uiReducer from "ui";

import {
  connectAndStartPolling,
  storeBakery,
  storeConfig,
  storeVersion,
  storeVisitURL,
} from "app/actions";

import jujuReducer from "juju/reducer";

import { version as appVersion } from "../package.json";

import * as serviceWorker from "./serviceWorker";

if (process.env.NODE_ENV === "production") {
  Sentry.init({
    dsn: "https://5f679e274f34464194e9592a91ed65d4@sentry.is.canonical.com//29",
  });
  Sentry.setTag("dashboardVersion", appVersion);
}

// Sometimes the config.js file hasn't been parsed by the time this code is
// executed. This is a simple debounce so that in the event it's not it'll wait
// a few cycles before trying again.
let checkCounter = 0;
const checkConfigExists = () => {
  if (!window.jujuDashboardConfig) {
    if (checkCounter < 5) {
      checkCounter++;
      setTimeout(checkConfigExists, 500);
      return;
    } else {
      console.error(
        "Configuration values not defined unable to bootstrap application"
      );
    }
  } else {
    bootstrap();
  }
};
checkConfigExists();

function bootstrap() {
  const config = window.jujuDashboardConfig;
  // It's possible that the charm is generating a relative path for the
  // websocket because it is providing the API on the same host as the
  // application assets.
  // If we were provided with a relative path for the endpoint then we need
  // to build the full correct path for the websocket to connect to.
  const controllerAPIEndpoint = config.controllerAPIEndpoint;
  if (controllerAPIEndpoint.indexOf("://") === -1) {
    const protocol =
      window.location.protocol.indexOf("https") === -1 ? "ws" : "wss";
    config.controllerAPIEndpoint = `${protocol}://${window.location.host}${controllerAPIEndpoint}`;
  }

  if (process.env.NODE_ENV === "production") {
    Sentry.setTag("isJuju", config.isJuju);
  }

  const reduxStore = createStore(
    combineReducers({
      root: rootReducer,
      juju: jujuReducer,
      ui: uiReducer,
    }),
    // Order of the middleware is important
    composeWithDevTools(applyMiddleware(checkAuth, thunk))
  );

  reduxStore.dispatch(storeConfig(config));
  reduxStore.dispatch(storeVersion(appVersion));

  const bakery = new Bakery({
    visitPage: (resp) => {
      reduxStore.dispatch(storeVisitURL(resp.Info.VisitURL));
    },
    storage: new BakeryStorage(localStorage, {}),
  });
  reduxStore.dispatch(storeBakery(bakery));
  if (config.identityProviderAvailable) {
    // If an identity provider is available then try and connect automatically
    // If not then wait for the login UI to trigger this
    reduxStore.dispatch(connectAndStartPolling(reduxStore, bakery));
  }

  const rootElement = document.getElementById("root");

  ReactDOM.render(
    <Provider store={reduxStore}>
      <StrictMode>
        <App />
      </StrictMode>
    </Provider>,
    rootElement
  );
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
