import { useMemo, useCallback } from "react";
import MainTable from "@canonical/react-components/dist/components/MainTable";
import cloneDeep from "clone-deep";
import { useParams } from "react-router-dom";

import useModelStatus from "hooks/useModelStatus";
import useTableRowClick from "hooks/useTableRowClick";

import {
  machineTableHeaders,
  localApplicationTableHeaders,
} from "tables/tableHeaders";

import {
  generateMachineRows,
  generateLocalApplicationRows,
} from "tables/tableRows";

import { extractRevisionNumber } from "app/utils/utils";

import EntityDetails from "pages/EntityDetails/EntityDetails";
import InfoPanel from "components/InfoPanel/InfoPanel";
import EntityInfo from "components/EntityInfo/EntityInfo";

export default function Unit() {
  const { unitId } = useParams();
  const unitIdentifier = unitId.replace("-", "/");
  const modelStatusData = useModelStatus();
  const tableRowClick = useTableRowClick();
  const appName = unitIdentifier?.split("/")[0];
  const unit = modelStatusData?.applications[appName]?.units[unitIdentifier];
  const app = modelStatusData?.applications[appName];

  const filteredModelStatusDataByMachine = useCallback(
    (unit) => {
      const filteredModelStatusData = cloneDeep(modelStatusData);
      if (unit?.machine) {
        Object.keys(filteredModelStatusData.machines).forEach((machineId) => {
          if (machineId !== unit.machine) {
            delete filteredModelStatusData.machines[machineId];
          }
        });
      }
      return filteredModelStatusData;
    },
    [modelStatusData]
  );

  const filteredModelStatusDataByApp = useCallback(
    (appName) => {
      const filteredModelStatusData = cloneDeep(modelStatusData);
      filteredModelStatusData &&
        Object.keys(filteredModelStatusData.applications).forEach(
          (application) => {
            if (application !== appName) {
              delete filteredModelStatusData.applications[application];
            }
          }
        );
      return filteredModelStatusData;
    },
    [modelStatusData]
  );

  // Generate machines table content
  const machineRows = useMemo(
    () =>
      generateMachineRows(
        filteredModelStatusDataByMachine(unit, "machines"),
        tableRowClick
      ),
    [filteredModelStatusDataByMachine, tableRowClick, unit]
  );

  // Generate apps table content
  const applicationRows = useMemo(
    () =>
      generateLocalApplicationRows(
        filteredModelStatusDataByApp(appName),
        tableRowClick
      ),
    [filteredModelStatusDataByApp, tableRowClick, appName]
  );

  const UnitEntityData = {
    charm: app.charm || "-",
    os: "-",
    revision: extractRevisionNumber(app.charm) || "-",
    version: app["workload-version"] || "-",
    info: app.status.info,
    provider: modelStatusData?.info?.["provider-type"],
  };

  return (
    <EntityDetails>
      <div>
        <InfoPanel />
        <EntityInfo data={UnitEntityData} />
      </div>
      <div className="entity-details__main u-overflow--scroll">
        <div className="slide-panel__tables">
          {modelStatusData.info["provider-type"] !== "kubernetes" && (
            <MainTable
              headers={machineTableHeaders}
              rows={machineRows}
              className="entity-details__machines p-main-table"
              sortable
              emptyStateMsg={"There are no machines in this model"}
            />
          )}
          <MainTable
            headers={localApplicationTableHeaders}
            rows={applicationRows}
            className="entity-details__apps p-main-table"
            sortable
            emptyStateMsg={"There are no apps in this model"}
          />
        </div>
      </div>
    </EntityDetails>
  );
}
