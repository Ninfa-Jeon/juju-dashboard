import { useEffect, useMemo, useState, useCallback } from "react";
import MainTable from "@canonical/react-components/dist/components/MainTable";
import Spinner from "@canonical/react-components/dist/components/Spinner";
import { useDispatch, useSelector, useStore } from "react-redux";
import { useParams } from "react-router-dom";
import { useQueryParams, StringParam, withDefault } from "use-query-params";

import ButtonGroup from "components/ButtonGroup/ButtonGroup";
import InfoPanel from "components/InfoPanel/InfoPanel";
import BaseLayout from "layout/BaseLayout/BaseLayout";
import Header from "components/Header/Header";
import SlidePanel from "components/SlidePanel/SlidePanel";
import WebCLI from "components/WebCLI/WebCLI";
import ChipGroup from "components/ChipGroup/ChipGroup";

import LocalAppsPanel from "panels/LocalAppsPanel/LocalAppsPanel";
import RemoteAppsPanel from "panels/RemoteAppsPanel/RemoteAppsPanel";
import MachinesPanel from "panels/MachinesPanel/MachinesPanel";
import OffersPanel from "panels/OffersPanel/OffersPanel";
import ConfigPanel from "panels/ConfigPanel/ConfigPanel";
import UnitsPanel from "panels/UnitsPanel/UnitsPanel";

import {
  getConfig,
  getControllerDataByUUID,
  getModelControllerDataByUUID,
  getModelUUID,
  getUserPass,
} from "app/selectors";

import useModelStatus from "hooks/useModelStatus";
import useWindowTitle from "hooks/useWindowTitle";

import FadeIn from "animations/FadeIn";

import { fetchAndStoreModelStatus } from "juju";
import { fetchModelStatus } from "juju/actions";

import {
  generateLocalApplicationRows,
  generateRemoteApplicationRows,
  generateConsumedRows,
  generateMachineRows,
  generateRelationRows,
  generateOffersRows,
  generateAppOffersRows,
} from "tables/tableRows";

import {
  appsOffersTableHeaders,
  machineTableHeaders,
  relationTableHeaders,
  offersTableHeaders,
  consumedTableHeaders,
  localApplicationTableHeaders,
  remoteApplicationTableHeaders,
} from "tables/tableHeaders";

import "./_entity-details.scss";

const shouldShow = (segment, activeView) => {
  switch (activeView) {
    case "apps":
      if (segment === "apps") {
        return true;
      }
      return false;
    case "units":
    case "machines":
    case "integrations":
      if (segment === "relations-title") {
        return true;
      }
      return segment === activeView;
  }
};

const incrementCounts = (status, counts) => {
  if (counts[status]) {
    counts[status] = counts[status] += 1;
  } else {
    counts[status] = 1;
  }
  return counts;
};

const formatCounts = (counts) =>
  Object.entries(counts).map((statusSet) => ({
    count: statusSet[1],
    label: statusSet[0],
  }));

const generateSecondaryCounts = (modelStatusData, segment, selector) => {
  return formatCounts(
    Object.entries(modelStatusData[segment]).reduce((counts, section) => {
      const status = section[1][selector].status;
      return incrementCounts(status, counts);
    }, {})
  );
};

const generateUnitSecondaryCounts = (modelStatusData) => {
  const counts = {};
  let totalUnits = 0;
  const applications = modelStatusData.applications;
  Object.keys(applications).forEach((applicationName) => {
    const units = applications[applicationName].units || [];
    Object.keys(units).forEach((unitId) => {
      const status = units[unitId]["agent-status"].status;
      totalUnits += 1;
      return incrementCounts(status, counts);
    });
  });
  return [formatCounts(counts), totalUnits];
};

const renderCounts = (activeView, modelStatusData) => {
  if (!modelStatusData) return null;
  let chips = null;
  switch (activeView) {
    case "apps":
      chips = generateSecondaryCounts(
        modelStatusData,
        "applications",
        "status"
      );
      break;
    case "units":
      [chips] = generateUnitSecondaryCounts(modelStatusData);
      break;
    case "machines":
      chips = generateSecondaryCounts(
        modelStatusData,
        "machines",
        "agent-status"
      );
      break;
    case "relations":
      return null;
  }

  return <ChipGroup chips={chips} />;
};

function generatePanelContent(activePanel, entity, panelRowClick) {
  switch (activePanel) {
    case "apps":
      return <LocalAppsPanel entity={entity} panelRowClick={panelRowClick} />;
    case "remoteApps":
      return <RemoteAppsPanel entity={entity} panelRowClick={panelRowClick} />;
    case "machines":
      return <MachinesPanel entity={entity} panelRowClick={panelRowClick} />;
    case "offers":
      return <OffersPanel entity={entity} panelRowClick={panelRowClick} />;
    case "units":
      return <UnitsPanel entity={entity} panelRowClick={panelRowClick} />;
  }
}

const EntityDetails = () => {
  const { modelName } = useParams();

  const dispatch = useDispatch();
  const store = useStore();
  const storeState = store.getState();

  const [showWebCLI, setShowWebCLI] = useState(false);

  const getModelUUIDMemo = useMemo(() => getModelUUID(modelName), [modelName]);
  const modelUUID = useSelector(getModelUUIDMemo);
  const modelStatusData = useModelStatus();
  // In a JAAS environment the controllerUUID will be the sub controller not
  // the primary controller UUID that we connect to.
  const controllerUUID = modelStatusData?.info["controller-uuid"];
  // The primary controller data is the controller endpoint we actually connect
  // to. In the case of a normally bootstrapped controller this will be the
  // same as the model controller, however in a JAAS environment, this primary
  // controller will be JAAS and the model controller will be different.
  const primaryControllerData = useSelector(
    getControllerDataByUUID(controllerUUID)
  );
  const modelControllerData = useSelector(
    getModelControllerDataByUUID(controllerUUID)
  );
  let credentials = null;
  let controllerWSHost = "";
  if (primaryControllerData) {
    credentials = getUserPass(primaryControllerData[0], storeState);
    controllerWSHost = primaryControllerData[0]
      .replace("wss://", "")
      .replace("/api", "");
  }

  const { baseAppURL } = useSelector(getConfig);
  const showWebCLIConfig = useSelector(getConfig).showWebCLI;

  const [query, setQuery] = useQueryParams({
    panel: StringParam,
    entity: StringParam,
    activeView: withDefault(StringParam, "apps"),
  });

  const setActiveView = (view) => {
    setQuery({ activeView: view });
  };

  const panelRowClick = useCallback(
    (entityName, entityPanel) => {
      return setQuery({ panel: entityPanel, entity: entityName });
    },
    [setQuery]
  );

  // Until we switch to the new lib and watcher model we want to trigger a
  // refresh of the model data when a user submits a cli command so that it
  // doesn't look like it did nothing.
  const refreshModel = () => {
    fetchAndStoreModelStatus(
      modelUUID,
      primaryControllerData[0],
      dispatch,
      store.getState
    );
  };

  useEffect(() => {
    // XXX Remove me once we have the 2.9 build.
    if (
      (modelControllerData &&
        modelControllerData.version.indexOf("2.9") !== -1) ||
      showWebCLIConfig
    ) {
      // The Web CLI is only available in Juju controller versions 2.9 and
      // above. This will allow us to only show the shell on multi-controller
      // setups with different versions where the correct controller version
      // is available.
      setShowWebCLI(true);
    }
  }, [modelControllerData, showWebCLIConfig]);

  useEffect(() => {
    if (modelUUID !== null && modelStatusData === null) {
      // This model may not be in the first batch of models that we request
      // status from in the main loop so update the status now.
      dispatch(fetchModelStatus(modelUUID));
    }
  }, [dispatch, modelUUID, modelStatusData]);

  const localApplicationTableRows = useMemo(() => {
    return generateLocalApplicationRows(
      modelStatusData,
      panelRowClick,
      baseAppURL,
      query
    );
  }, [modelStatusData, panelRowClick, baseAppURL, query]);

  const remoteApplicationTableRows = useMemo(() => {
    return generateRemoteApplicationRows(
      modelStatusData,
      panelRowClick,
      baseAppURL,
      query
    );
  }, [modelStatusData, panelRowClick, baseAppURL, query]);

  const machinesTableRows = useMemo(() => {
    return generateMachineRows(modelStatusData, panelRowClick, query?.entity);
  }, [modelStatusData, panelRowClick, query]);

  const relationTableRows = useMemo(
    () => generateRelationRows(modelStatusData, baseAppURL),
    [modelStatusData, baseAppURL]
  );

  const consumedTableRows = useMemo(
    () => generateConsumedRows(modelStatusData, baseAppURL),
    [modelStatusData, baseAppURL]
  );
  const offersTableRows = useMemo(
    () =>
      generateOffersRows(
        modelStatusData,
        panelRowClick,
        baseAppURL,
        query?.entity
      ),
    [modelStatusData, panelRowClick, baseAppURL, query]
  );
  const appOffersRows = useMemo(
    () =>
      generateAppOffersRows(modelStatusData, panelRowClick, baseAppURL, query),
    [modelStatusData, panelRowClick, baseAppURL, query]
  );

  const { panel: activePanel, entity, activeView } = query;
  const closePanelConfig = { panel: undefined, entity: undefined };

  useWindowTitle(
    modelStatusData?.model?.name
      ? `Model: ${modelStatusData.model.name}`
      : "..."
  );

  return (
    <BaseLayout>
      <Header>
        <div className="entity-details__header">
          <strong className="entity-details__title">
            {modelStatusData ? modelStatusData.model.name : "..."}
          </strong>
          <div className="entity-details__view-selector">
            {modelStatusData && (
              <ButtonGroup
                buttons={["apps", "integrations", "machines"]}
                label="View:"
                activeButton={activeView}
                setActiveButton={setActiveView}
              />
            )}
          </div>
        </div>
      </Header>
      {!modelStatusData ? (
        <div className="entity-details__loading">
          <Spinner />
        </div>
      ) : (
        <FadeIn isActive={modelStatusData}>
          <div className="l-content">
            <div className="entity-details">
              <InfoPanel />
              <div className="entity-details__main u-overflow--scroll">
                {renderCounts(activeView, modelStatusData)}
                {shouldShow("apps", activeView) && (
                  <>
                    {appOffersRows.length > 0 && (
                      <MainTable
                        headers={appsOffersTableHeaders}
                        rows={appOffersRows}
                        className="entity-details__offers p-main-table"
                        sortable
                        emptyStateMsg={
                          "There are no offers associated with this model"
                        }
                      />
                    )}
                    {localApplicationTableRows.length > 0 ? (
                      <MainTable
                        headers={localApplicationTableHeaders}
                        rows={localApplicationTableRows}
                        className="entity-details__apps p-main-table"
                        sortable
                        emptyStateMsg={
                          "There are no applications in this model"
                        }
                      />
                    ) : (
                      <span>
                        There are no applications associated with this model.
                        Learn about{" "}
                        <a
                          className="p-link--external"
                          href="https://juju.is/docs/deploying-applications"
                        >
                          deploying applications
                        </a>
                      </span>
                    )}
                    {remoteApplicationTableRows?.length > 0 && (
                      <MainTable
                        headers={remoteApplicationTableHeaders}
                        rows={remoteApplicationTableRows}
                        className="entity-details__remote-apps p-main-table"
                        sortable
                        emptyStateMsg={
                          "There are no remote applications in this model"
                        }
                      />
                    )}
                  </>
                )}
                {shouldShow("machines", activeView) &&
                  machinesTableRows.length > 0 && (
                    <MainTable
                      headers={machineTableHeaders}
                      rows={machinesTableRows}
                      className="entity-details__machines p-main-table"
                      sortable
                      emptyStateMsg={"There are no machines in this model"}
                    />
                  )}
                {shouldShow("integrations", activeView) &&
                relationTableRows.length > 0 ? (
                  <>
                    {shouldShow("relations-title", activeView) && (
                      <h5>Relations ({relationTableRows.length})</h5>
                    )}
                    <MainTable
                      headers={relationTableHeaders}
                      rows={relationTableRows}
                      className="entity-details__relations p-main-table"
                      sortable
                      emptyStateMsg={"There are no relations in this model"}
                    />
                    {shouldShow("relations-title", activeView) && (
                      <>
                        {consumedTableRows.length > 0 ||
                          (offersTableRows.length > 0 && (
                            <h5>
                              Cross-model relations (
                              {consumedTableRows.length +
                                offersTableRows.length}
                              )
                            </h5>
                          ))}
                      </>
                    )}
                    {consumedTableRows.length > 0 && (
                      <MainTable
                        headers={consumedTableHeaders}
                        rows={consumedTableRows}
                        className="entity-details__relations p-main-table"
                        sortable
                        emptyStateMsg={
                          "There are no remote relations in this model"
                        }
                      />
                    )}
                    {offersTableRows.length > 0 && (
                      <MainTable
                        headers={offersTableHeaders}
                        rows={offersTableRows}
                        className="entity-details__relations p-main-table"
                        sortable
                        emptyStateMsg={
                          "There are no connected offers in this model"
                        }
                      />
                    )}
                  </>
                ) : (
                  <>
                    {activeView === "integrations" && (
                      <span data-testid="no-integrations-msg">
                        There are no integrations associated with this model -{" "}
                        <a
                          className="p-link--external"
                          href="https://juju.is/integration"
                        >
                          learn more about integration
                        </a>
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
            {activePanel === "config" ? (
              <ConfigPanel
                appName={entity}
                charm={modelStatusData.applications[entity].charm}
                modelUUID={modelStatusData.uuid}
                onClose={() => setQuery(closePanelConfig)}
              />
            ) : (
              <SlidePanel
                isActive={activePanel}
                onClose={() => setQuery(closePanelConfig)}
                isLoading={!entity}
                className={`${activePanel}-panel`}
              >
                {generatePanelContent(
                  activePanel,
                  entity,
                  panelRowClick,
                  modelStatusData
                )}
              </SlidePanel>
            )}
          </div>
        </FadeIn>
      )}
      {showWebCLI && (
        <WebCLI
          controllerWSHost={controllerWSHost}
          credentials={credentials}
          modelUUID={modelUUID}
          refreshModel={refreshModel}
        />
      )}
    </BaseLayout>
  );
};

export default EntityDetails;
