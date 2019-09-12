import React from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

import MainTable from "../MainTable/MainTable";

/**
  Returns the model info and statuses in the proper format for the table data.
  @param {Object} state The application state.
  @returns {Object} The formatted table data.
*/
function generateModelTableData(state) {
  const models = state.juju.models;
  const modelInfo = state.juju.modelInfo;
  return Object.keys(models).map(modelUUID => {
    const modelListData = models[modelUUID];
    const modelInfoData = modelInfo[modelUUID];
    const modelStatus = state.juju.modelStatuses[modelUUID];
    const modelDetailsPath = `/models/${modelListData.name}`;
    const modelDetailsLink = (
      <Link to={modelDetailsPath}>{modelListData.name}</Link>
    );
    return {
      columns: [
        { content: modelDetailsLink },
        { content: modelListData.ownerTag.split("@")[0].replace("user-", "") },
        { content: getStatusValue(modelStatus, "summary") },
        { content: getStatusValue(modelStatus, "cloudTag") },
        { content: getStatusValue(modelStatus, "region") },
        { content: getStatusValue(modelInfoData, "cloudCredentialTag") },
        // We're not currently able to get the controller name from the API.
        // so display the controller UUID instead.
        { content: getStatusValue(modelInfoData, "controllerUuid") },
        // We're not currently able to get a last-accessed or updated from JAAS.
        { content: "unavailable" }
      ]
    };
  });
}

/**
  Used to fetch the values from status as it won't be defined when the
  modelInfo data is.
  @param {Object|undefined} status The status for the model.
  @param {String} key The key to fetch.
  @returns {String} The computed value for the requested field if defined, or
    an empty string.
*/
function getStatusValue(status, key) {
  let returnValue = "";
  if (typeof status === "object" && status !== null) {
    switch (key) {
      case "summary":
        const applicationKeys = Object.keys(status.applications);
        const applicationCount = applicationKeys.length;
        const machineCount = Object.keys(status.machines).length;
        const unitCount = applicationKeys.reduce(
          (prev, key) =>
            prev + Object.keys(status.applications[key].units).length,
          0
        );
        returnValue =
          applicationCount +
          " applications, " +
          machineCount +
          " machines, " +
          unitCount +
          " units";
        break;
      case "cloudTag":
        returnValue = status.model.cloudTag.replace("cloud-", "");
        break;
      case "region":
        returnValue = status.model.region;
        break;
      case "cloudCredentialTag":
        returnValue = status.cloudCredentialTag.split("cloudcred-")[1];
        break;
      case "controllerUuid":
        returnValue = status.controllerUuid;
        break;
      default:
        console.log(`unsupported status value key: ${key}`);
        break;
    }
  }
  return returnValue;
}

const modelTableHeaders = [
  { content: "Name", sortKey: "name" },
  { content: "Owner", sortKey: "owner" },
  { content: "Summary", sortKey: "summary" },
  { content: "Cloud", sortKey: "cloud" },
  { content: "Region", sortKey: "region" },
  { content: "Credential", sortKey: "credential" },
  { content: "Controller", sortKey: "controller" },
  { content: "Last Updated", sortKey: "last-updated" }
];

function TableList() {
  const modelData = useSelector(generateModelTableData);
  return <MainTable headers={modelTableHeaders} rows={modelData} sortable />;
}

export default TableList;
