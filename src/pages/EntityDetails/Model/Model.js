import { useMemo, useCallback } from "react";
import MainTable from "@canonical/react-components/dist/components/MainTable";
import { useSelector } from "react-redux";
import { useQueryParams, StringParam, withDefault } from "use-query-params";
import { useHistory, useParams } from "react-router-dom";

import {
  appsOffersTableHeaders,
  machineTableHeaders,
  relationTableHeaders,
  offersTableHeaders,
  consumedTableHeaders,
  localApplicationTableHeaders,
  remoteApplicationTableHeaders,
} from "tables/tableHeaders";

import {
  generateLocalApplicationRows,
  generateRemoteApplicationRows,
  generateConsumedRows,
  generateMachineRows,
  generateRelationRows,
  generateOffersRows,
  generateAppOffersRows,
} from "tables/tableRows";

import InfoPanel from "components/InfoPanel/InfoPanel";

import EntityDetails from "pages/EntityDetails/EntityDetails";
import EntityInfo from "components/EntityInfo/EntityInfo";

import useModelStatus from "hooks/useModelStatus";
import useTableRowClick from "hooks/useTableRowClick";

import ChipGroup from "components/ChipGroup/ChipGroup";

import { getConfig } from "app/selectors";

import { extractCloudName } from "app/utils/utils";

import {
  generateSecondaryCounts,
  generateUnitSecondaryCounts,
} from "../counts";

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

const Model = () => {
  const { baseAppURL } = useSelector(getConfig);
  const modelStatusData = useModelStatus();
  const history = useHistory();
  const { userName, modelName } = useParams();

  const [query, setQuery] = useQueryParams({
    panel: StringParam,
    entity: StringParam,
    activeView: withDefault(StringParam, "apps"),
  });

  const tableRowClick = useTableRowClick();

  const panelRowClick = useCallback(
    (entityName, entityPanel) => {
      // This can be removed when all entities are moved to top level aside panels
      if (entityPanel === "apps") {
        history.push(`/models/${userName}/${modelName}/app/${entityName}`);
      } else {
        return setQuery({ panel: entityPanel, entity: entityName });
      }
    },
    [setQuery, history, modelName, userName]
  );

  const localApplicationTableRows = useMemo(() => {
    return generateLocalApplicationRows(
      modelStatusData,
      tableRowClick,
      baseAppURL,
      query
    );
  }, [modelStatusData, tableRowClick, baseAppURL, query]);
  const remoteApplicationTableRows = useMemo(() => {
    return generateRemoteApplicationRows(
      modelStatusData,
      panelRowClick,
      baseAppURL,
      query
    );
  }, [modelStatusData, panelRowClick, baseAppURL, query]);
  const machinesTableRows = useMemo(() => {
    return generateMachineRows(modelStatusData, tableRowClick, query?.entity);
  }, [modelStatusData, tableRowClick, query]);

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

  const cloudProvider = modelStatusData
    ? extractCloudName(modelStatusData.model["cloud-tag"])
    : "";

  const ModelEntityData = {
    controller: modelStatusData?.model.type,
    "Cloud/Region": `${cloudProvider} / ${modelStatusData?.model.region}`,
    version: modelStatusData?.model.version,
    sla: modelStatusData?.model.sla,
  };

  return (
    <EntityDetails type="model">
      <div>
        <InfoPanel />
        {modelStatusData && <EntityInfo data={ModelEntityData} />}
      </div>
      <div className="entity-details__main u-overflow--scroll">
        {renderCounts(query.activeView, modelStatusData)}
        {shouldShow("apps", query.activeView) && (
          <>
            {appOffersRows.length > 0 && (
              <MainTable
                headers={appsOffersTableHeaders}
                rows={appOffersRows}
                className="entity-details__offers p-main-table"
                sortable
                emptyStateMsg={"There are no offers associated with this model"}
              />
            )}
            {localApplicationTableRows.length > 0 ? (
              <MainTable
                headers={localApplicationTableHeaders}
                rows={localApplicationTableRows}
                className="entity-details__apps p-main-table"
                sortable
                emptyStateMsg={"There are no applications in this model"}
              />
            ) : (
              <span>
                There are no applications associated with this model. Learn
                about{" "}
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
                emptyStateMsg={"There are no remote applications in this model"}
              />
            )}
          </>
        )}
        {shouldShow("machines", query.activeView) &&
          machinesTableRows.length > 0 && (
            <MainTable
              headers={machineTableHeaders}
              rows={machinesTableRows}
              className="entity-details__machines p-main-table"
              sortable
              emptyStateMsg={"There are no machines in this model"}
            />
          )}
        {shouldShow("integrations", query.activeView) &&
        relationTableRows.length > 0 ? (
          <>
            {shouldShow("relations-title", query.activeView) && (
              <h5>Relations ({relationTableRows.length})</h5>
            )}
            <MainTable
              headers={relationTableHeaders}
              rows={relationTableRows}
              className="entity-details__relations p-main-table"
              sortable
              emptyStateMsg={"There are no relations in this model"}
            />
            {shouldShow("relations-title", query.activeView) && (
              <>
                {consumedTableRows.length > 0 ||
                  (offersTableRows.length > 0 && (
                    <h5>
                      Cross-model relations (
                      {consumedTableRows.length + offersTableRows.length})
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
                emptyStateMsg={"There are no remote relations in this model"}
              />
            )}
            {offersTableRows.length > 0 && (
              <MainTable
                headers={offersTableHeaders}
                rows={offersTableRows}
                className="entity-details__relations p-main-table"
                sortable
                emptyStateMsg={"There are no connected offers in this model"}
              />
            )}
          </>
        ) : (
          <>
            {query.activeView === "integrations" && (
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
    </EntityDetails>
  );
};

export default Model;
