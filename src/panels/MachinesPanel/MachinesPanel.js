import { useMemo, useCallback } from "react";
import MainTable from "@canonical/react-components/dist/components/MainTable";
import cloneDeep from "clone-deep";

import useModelStatus from "hooks/useModelStatus";

import { generateStatusElement } from "app/utils/utils";

import {
  generateUnitRows,
  generateLocalApplicationRows,
} from "tables/tableRows";

import {
  localApplicationTableHeaders,
  unitTableHeaders,
} from "tables/tableHeaders";

import "../_panels.scss";

export default function MachinesPanel({ entity: machineId, panelRowClick }) {
  const modelStatusData = useModelStatus();
  const machine = modelStatusData?.machines[machineId];

  // Generate panel header for given entity
  const generateMachinesPanelHeader = useCallback(() => {
    const getHardwareSpecs = () => {
      if (!machine) return {};
      const hardware = {};
      const hardwareArr = machine.hardware.split(" ");
      hardwareArr.forEach((spec) => {
        const [name, value] = spec.split("=");
        hardware[name] = value;
      });
      return hardware;
    };
    const hardware = getHardwareSpecs();
    return (
      <div className="panel-header">
        {machine && (
          <div className="row">
            <div className="col-4">
              <div className="machines-panel__id">
                <i className="p-icon--machines"></i>
                <strong>
                  <span className="entity-name">
                    Machine '{machineId}' - {machine?.series}
                  </span>
                </strong>
              </div>
              <span className="u-capitalise entity-status">
                {generateStatusElement(machine["agent-status"].status)}
              </span>
              <span>{}</span>
            </div>

            <div className="col-4">
              <div className="panel__kv">
                <span className="panel__label">Memory</span>
                <span className="panel__value">{hardware["mem"] || "-"}</span>
              </div>
              <div className="panel__kv">
                <span className="panel__label">Disk</span>
                <span className="panel__value">
                  {hardware["root-disk"] || "-"}
                </span>
              </div>
              <div className="panel__kv">
                <span className="panel__label">CPU</span>
                <span className="panel__value">
                  {hardware["cpu-power"] || "-"}
                </span>
              </div>
              <div className="panel__kv">
                <span className="panel__label">Cores</span>
                <span className="panel__value">{hardware["cores"] || "-"}</span>
              </div>
            </div>
            <div className="col-4">{machine["agent-status"].info}</div>
          </div>
        )}
      </div>
    );
  }, [machine, machineId]);

  const machinePanelHeader = useMemo(
    () => generateMachinesPanelHeader(modelStatusData?.applications[machineId]),
    [modelStatusData, machineId, generateMachinesPanelHeader]
  );

  const filteredModelStatusDataByApp = useCallback(
    (machineId) => {
      const filteredModelStatusData = cloneDeep(modelStatusData);
      filteredModelStatusData &&
        Object.keys(filteredModelStatusData.applications).forEach(
          (application) => {
            const units =
              filteredModelStatusData.applications[application]?.units || {};

            if (Object.entries(units).length) {
              Object.values(units).forEach((unit) => {
                if (
                  // Delete any app without a unit matching this machineId...
                  unit.machine !== machineId ||
                  // ...delete any app without units at all
                  !Object.entries(units).length
                ) {
                  delete filteredModelStatusData.applications[application];
                }
              });
            } else {
              delete filteredModelStatusData.applications[application];
            }
          }
        );
      return filteredModelStatusData;
    },
    [modelStatusData]
  );

  const filteredModelStatusDataByUnit = useCallback(
    (machineId) => {
      const filteredModelStatusData = cloneDeep(modelStatusData);
      filteredModelStatusData &&
        Object.keys(filteredModelStatusData.applications).forEach(
          (application) => {
            const units =
              filteredModelStatusData.applications[application].units || {};
            for (let [key, unit] of Object.entries(units)) {
              if (unit.machine !== machineId) {
                delete filteredModelStatusData.applications[application].units[
                  key
                ];
              }
            }
          }
        );
      return filteredModelStatusData;
    },
    [modelStatusData]
  );

  // Generate apps table content
  const applicationRows = useMemo(
    () =>
      generateLocalApplicationRows(
        filteredModelStatusDataByApp(machineId),
        panelRowClick
      ),
    [filteredModelStatusDataByApp, machineId, panelRowClick]
  );

  // Generate units table content
  const unitRows = useMemo(
    () =>
      generateUnitRows(filteredModelStatusDataByUnit(machineId), panelRowClick),
    [filteredModelStatusDataByUnit, machineId, panelRowClick]
  );

  return (
    <>
      {machinePanelHeader}
      <div className="slide-panel__tables">
        <MainTable
          headers={unitTableHeaders}
          rows={unitRows}
          className="entity-details__units p-main-table"
          sortable
          emptyStateMsg={"There are no units in this model"}
        />
        <MainTable
          headers={localApplicationTableHeaders}
          rows={applicationRows}
          className="entity-details__apps p-main-table"
          sortable
          emptyStateMsg={"There are no apps in this model"}
        />
      </div>
    </>
  );
}
