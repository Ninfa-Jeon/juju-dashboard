import React from "react";
import { useSelector } from "react-redux";
import MainTable from "@canonical/react-components/dist/components/MainTable";

import {
  generateStatusElement,
  getModelStatusGroupData,
  extractOwnerName,
} from "app/utils";

import { getGroupedByStatusAndFilteredModelData } from "app/selectors";

import { generateModelDetailsLink, getStatusValue } from "./shared";

/**
  Generates the table headers for the supplied table label.
  @param {String} label The title of the table.
  @param {Number} count The number of elements in the status.
  @returns {Array} The headers for the table.
*/
function generateStatusTableHeaders(label, count) {
  return [
    {
      content: generateStatusElement(label, count),
      sortKey: label.toLowerCase(),
    },
    { content: "Owner", sortKey: "owner" },
    { content: "Configuration", sortKey: "summary" },
    { content: "Cloud/Region", sortKey: "cloud" },
    { content: "Credential", sortKey: "credential" },
    { content: "Controller", sortKey: "controller" },
    {
      content: "Last Updated",
      sortKey: "last-updated",
      className: "u-align--right",
    },
  ];
}

/**
  Generates the warning message for the model name cell.
  @param {Object} model The full model data.
  @return {Object} The react component for the warning message.
*/
const generateWarningMessage = (model) => {
  const { messages } = getModelStatusGroupData(model);
  const title = messages.join("; ");
  return (
    <span className="model-table-list_error-message" title={title}>
      {title}
    </span>
  );
};

/**
  Generates the model name cell.
  @param {Object} model The model data.
  @param {String} groupLabel The status group the model belongs in.
    ex) blocked, alert, running
  @param {String} activeUser The user tag for the active user.
    ex) user-foo@external
  @returns {Object} The React element for the model name cell.
*/
const generateModelNameCell = (model, groupLabel, activeUser) => {
  const link = generateModelDetailsLink(
    model.model.name,
    model.info && model.info.ownerTag,
    activeUser
  );
  return (
    <>
      <div>{link}</div>
      {groupLabel === "blocked" ? generateWarningMessage(model) : null}
    </>
  );
};

/**
  Returns the model info and statuses in the proper format for the table data.
  @param {Object} groupedModels The models grouped by state
  @param {String} activeUser The fully qualified user name tag
    ex) user-foo@external
  @returns {Object} The formatted table data.
*/
function generateModelTableDataByStatus(groupedModels, activeUser) {
  const modelData = {
    blockedRows: [],
    alertRows: [],
    runningRows: [],
  };

  Object.keys(groupedModels).forEach((groupLabel) => {
    const models = groupedModels[groupLabel];
    models.forEach((model) => {
      let owner = "";
      if (model.info) {
        owner = extractOwnerName(model.info.ownerTag);
      }
      modelData[`${groupLabel}Rows`].push({
<<<<<<< Updated upstream
        "data-test-model-id": model?.uuid,
=======
        "data-test-model-uuid": model?.uuid,
>>>>>>> Stashed changes
        columns: [
          {
            "data-test-column": "name",
            content: generateModelNameCell(model, groupLabel, activeUser),
          },
          {
            "data-test-column": "owner",
            content: (
              <a href="#_" className="p-link--soft">
                {owner}
              </a>
            ),
          },
          {
            "data-test-column": "summary",
            content: getStatusValue(model, "summary"),
            className: "u-overflow--visible",
          },
          {
            "data-test-column": "cloud",
            content: (
              <a href="#_" className="p-link--soft">
                {getStatusValue(model, "cloudTag")}/
                {getStatusValue(model, "region")}
              </a>
            ),
          },
          {
            "data-test-column": "credential",
            content: (
              <a href="#_" className="p-link--soft">
                {getStatusValue(model.info, "cloudCredentialTag")}
              </a>
            ),
          },
          {
            "data-test-column": "controller",
            content: getStatusValue(model.info, "controllerName"),
          },
          // We're not currently able to get a last-accessed or updated from JAAS.
          {
            "data-test-column": "updated",
            content: getStatusValue(model.info, "status.since"),
            className: "u-align--right",
          },
        ],
      });
    });
  });

  return modelData;
}

export default function StatusGroup({ activeUser, filters }) {
  const groupedAndFilteredData = useSelector(
    getGroupedByStatusAndFilteredModelData(filters)
  );

  const {
    blockedRows,
    alertRows,
    runningRows,
  } = generateModelTableDataByStatus(groupedAndFilteredData, activeUser);

  const emptyStateMsg = "There are no models with this status";

  return (
    <div className="status-group u-overflow--scroll">
      <MainTable
        headers={generateStatusTableHeaders("Blocked", blockedRows.length)}
        rows={blockedRows}
        emptyStateMsg={emptyStateMsg}
      />
      <MainTable
        headers={generateStatusTableHeaders("Alert", alertRows.length)}
        rows={alertRows}
        emptyStateMsg={emptyStateMsg}
      />
      <MainTable
        headers={generateStatusTableHeaders("Running", runningRows.length)}
        rows={runningRows}
        emptyStateMsg={emptyStateMsg}
      />
    </div>
  );
}
