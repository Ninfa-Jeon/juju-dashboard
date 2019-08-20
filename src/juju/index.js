import jujulib from "@canonical/jujulib";
import modelManager from "@canonical/jujulib/api/facades/model-manager-v5";
import { Bakery } from "@canonical/macaroon-bakery";

const options = {
  debug: true,
  facades: [modelManager],
  bakery: new Bakery({
    visitPage: resp => {
      // XXX Surface message to UI.
      console.log("visit this URL to login:", resp.Info.VisitURL); // eslint-disable-line no-console
    }
  })
};

const controllerURL = process.env.REACT_APP_CONTROLLER_URL;

/**
  Connects to the controller at the url defined in the REACT_APP_CONTROLLER_URL
  environment variable.
  @returns {Object} conn The controller connection instance.
*/
async function loginWithBakery() {
  const juju = await jujulib.connect(controllerURL, options);
  const conn = await juju.login({});
  return conn;
}

/**
  Fetches the model list from the supplied Juju controller connection.
  @param {Object} conn The controller connection instance.
  @returns {Object} models The list of model objects under the key `userModels`.
 */
async function fetchModelList(conn) {
  const modelManager = conn.facades.modelManager;
  const models = await modelManager.listModels({ tag: conn.info.identity });
  return models;
}

export { fetchModelList, loginWithBakery };
