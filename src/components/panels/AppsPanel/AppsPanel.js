import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { getConfig } from "app/selectors";
import SlidePanel from "components/SlidePanel/SlidePanel";
import MainTable from "@canonical/react-components/dist/components/MainTable";

import useModelStatus from "hooks/useModelStatus";

import {
  generateEntityIdentifier,
  unitTableHeaders,
  machineTableHeaders,
  relationTableHeaders,
  generateMachineRows,
  generateRelationRows,
  generateUnitRows,
} from "pages/Models/Details/generators";

import {
  extractRevisionNumber,
  generateStatusElement,
  filterModelStatusDataByApp,
} from "app/utils";

import "./_apps-panel.scss";

export default function AppsPanel({ isActive, onClose, entity }) {
  // Get model status info
  const modelStatusData = useModelStatus();

  const { baseAppURL } = useSelector(getConfig);

  // Filter model status via selected entity
  const filteredModelStatusData = filterModelStatusDataByApp(
    modelStatusData,
    entity
  );

  // Generate panel header for given entity
  const generateAppPanelHeader = (app, baseAppURL, entity) => {
    return (
      <div className="slidepanel-apps-header">
        {app && (
          <div className="row">
            <div className="col-3">
              <div>
                {generateEntityIdentifier(
                  app.charm,
                  entity,
                  false,
                  baseAppURL,
                  true // disable link
                )}
              </div>
              <span className="u-capitalise">
                {app.status?.status
                  ? generateStatusElement(app.status.status)
                  : "-"}
              </span>
            </div>
            <div className="col-3">
              <div className="slidepanel-apps__kv">
                <span className="slidepanel-apps__label">Charm: </span>
                <span title={app.charm} className="slidepanel-apps__value">
                  {app.charm}
                </span>
              </div>

              <div className="slidepanel-apps__kv">
                <span className="slidepanel-apps__label">OS:</span>
                <span className="slidepanel-apps__value">Ubuntu</span>
              </div>

              <div className="slidepanel-apps__kv">
                <span className="slidepanel-apps__label">Revision:</span>
                <span className="slidepanel-apps__value">
                  {extractRevisionNumber(app.charm) || "-"}
                </span>
              </div>

              <div className="slidepanel-apps__kv">
                <span className="slidepanel-apps__label">Version:</span>
                <span className="slidepanel-apps__value">
                  {app.workloadVersion || "-"}
                </span>
              </div>
            </div>
            <div className="col-6">
              {/* Notes - not currently implemented/available */}
            </div>
          </div>
        )}
      </div>
    );
  };

  const appPanelHeader = useMemo(
    () =>
      generateAppPanelHeader(
        modelStatusData?.applications[entity],
        baseAppURL,
        entity
      ),
    [modelStatusData, entity, baseAppURL]
  );

  const machinesSlidePanelRows = useMemo(
    () => generateMachineRows(filteredModelStatusData),
    [filteredModelStatusData]
  );

  const unitSlidePanelRows = useMemo(
    () => generateUnitRows(filteredModelStatusData, baseAppURL),
    [baseAppURL, filteredModelStatusData]
  );

  const relationSlidePanelRows = useMemo(
    () => generateRelationRows(filteredModelStatusData, baseAppURL),
    [filteredModelStatusData, baseAppURL]
  );

  // Check for loading status
  const isLoading = !filteredModelStatusData?.applications?.[entity];

  return (
    <SlidePanel isActive={isActive} onClose={onClose} isLoading={isLoading}>
      <div className="apps-panel">
        {appPanelHeader}
        <div className="slide-panel__tables">
          <MainTable
            headers={unitTableHeaders}
            rows={unitSlidePanelRows}
            className="model-details__units p-main-table"
            sortable
            emptyStateMsg={"There are no units in this model"}
          />
          <MainTable
            headers={machineTableHeaders}
            rows={machinesSlidePanelRows}
            className="model-details__machines p-main-table"
            sortable
            emptyStateMsg={"There are no machines in this model"}
          />
          <MainTable
            headers={relationTableHeaders}
            rows={relationSlidePanelRows}
            className="model-details__relations p-main-table"
            sortable
            emptyStateMsg={"There are no relations in this model"}
          />
        </div>
      </div>
    </SlidePanel>
  );
}
