import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import Topology from "components/Topology/Topology";
import Modal from "@canonical/react-components/dist/components/Modal";

import { getModelUUID, getModelStatus } from "app/selectors";
import { extractCloudName } from "app/utils";
import useSendAnalytics from "app/send-analytics-hook";

import "./_info-panel.scss";

const expandedTopologyDimensions = () => {
  const de = document.documentElement;
  const vw = Math.max(de.clientWidth, window.innerWidth || 0);
  const vh = Math.max(de.clientHeight, window.innerHeight || 0);
  const delta = 300;
  return {
    width: vw - delta,
    height: vh - delta
  };
};

const InfoPanel = () => {
  const { 0: modelName } = useParams();
  const [showExpandedTopology, setShowExpandedTopology] = useState(false);

  const getModelUUIDMemo = useMemo(() => getModelUUID(modelName), [modelName]);
  const modelUUID = useSelector(getModelUUIDMemo);
  const getModelStatusMemo = useMemo(() => getModelStatus(modelUUID), [
    modelUUID
  ]);
  const modelStatusData = useSelector(getModelStatusMemo);

  const cloudProvider = modelStatusData
    ? extractCloudName(modelStatusData.model.cloudTag)
    : "";

  const { width, height } = expandedTopologyDimensions();

  const sendAnalytics = useSendAnalytics();

  return (
    <div className="info-panel">
      {showExpandedTopology ? (
        <Modal
          close={() => setShowExpandedTopology(false)}
          title={modelName.split("/")[1]}
          data-test="topology-modal"
        >
          <Topology width={width} height={height} modelData={modelStatusData} />
        </Modal>
      ) : (
        <div className="info-panel__pictogram">
          <Topology width={300} height={300} modelData={modelStatusData} />
          <i
            className="p-icon--expand"
            onClick={() => {
              setShowExpandedTopology(!showExpandedTopology);
              sendAnalytics({
                category: "User",
                action: "Opened expanded topology"
              });
            }}
          >
            Expand topology
          </i>
        </div>
      )}
      <div className="info-panel__grid">
        <div className="info-panel__grid-item">
          <h4 className="p-muted-heading">Controller</h4>
          <p data-name="controller">
            {modelStatusData ? modelStatusData.model.type : ""}
          </p>
        </div>
        <div className="info-panel__grid-item">
          <h4 className="p-muted-heading">Cloud/Region</h4>
          <p data-name="cloud-region">
            {cloudProvider}
            {modelStatusData ? "/" : ""}
            {modelStatusData ? modelStatusData.model.region : ""}
          </p>
        </div>
        <div className="info-panel__grid-item">
          <h4 className="p-muted-heading">Version</h4>
          <p data-name="version">
            {modelStatusData ? modelStatusData.model.version : ""}
          </p>
        </div>
        <div className="info-panel__grid-item">
          <h4 className="p-muted-heading">SLA</h4>
          <p data-name="sla">
            {modelStatusData ? modelStatusData.model.sla : ""}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InfoPanel;
