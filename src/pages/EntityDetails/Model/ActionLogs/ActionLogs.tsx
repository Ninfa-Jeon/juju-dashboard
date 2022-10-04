import { useEffect, useMemo, useState } from "react";
import { useSelector, useStore } from "react-redux";
import { useParams, Link } from "react-router-dom";
import classnames from "classnames";

import ModularTable from "@canonical/react-components/dist/components/ModularTable/ModularTable";
import Spinner from "@canonical/react-components/dist/components/Spinner/Spinner";

import { getModelUUID, getModelStatus } from "app/selectors";
import { queryOperationsList } from "juju/index";
import { generateIconImg, generateStatusElement } from "app/utils/utils";

import type { EntityDetailsRoute } from "components/Routes/Routes";
import { TSFixMe } from "types";

type ApplicationList = { [key: string]: any };

type Operations = Operation[];

type Operation = {
  operation: string;
  actions: Action[];
};

type TableRows = TableRow[];

type TableRow = {
  application: string;
  id: string;
  status: string;
  taskId: string;
  message: string;
  completed: string;
};

// https://github.com/juju/js-libjuju/blob/master/api/facades/action-v6.ts#L27
type Action = {
  action: ActionData;
  enqueued: string;
  started: string;
  completed: string;
  status: string;
  message: string;
};

type ActionData = {
  tag: string;
  receiver: string;
  name: string;
};

type ApplicationData = {
  charm: string;
};

function generateLinkToApp(
  appName: string,
  userName: string,
  modelName: string
) {
  return (
    <Link to={`/models/${userName}/${modelName}/app/${appName}`}>
      {appName}
    </Link>
  );
}

function generateAppIcon(
  application: ApplicationData | undefined,
  appName: string,
  userName: string,
  modelName: string
) {
  // If the user has executed actions with an application and then removed
  // that application it'll no longer be in the model data so in this
  // case we need to fail gracefully.
  if (application) {
    return (
      <>
        {generateIconImg(appName, application.charm)}
        {generateLinkToApp(appName, userName, modelName)}
      </>
    );
  }
  return <>{appName}</>;
}

export default function ActionLogs() {
  const [operations, setOperations] = useState<Operations>([]);
  const [fetchedOperations, setFetchedOperations] = useState(false);
  const { userName, modelName } = useParams<EntityDetailsRoute>();
  const appStore = useStore();
  const getModelUUIDMemo = useMemo(() => getModelUUID(modelName), [modelName]);
  // Selectors.js is not typescript yet and it complains about the return value
  // of getModelUUID. TSFixMe
  const modelUUID = useSelector(getModelUUIDMemo as (state: TSFixMe) => string);
  const modelStatusData = useSelector(
    getModelStatus(modelUUID) as (state: TSFixMe) => {
      applications: ApplicationList;
    }
  );

  const applicationList = () => Object.keys(modelStatusData.applications);

  useEffect(() => {
    async function fetchData() {
      const operationList = await queryOperationsList(
        {
          applications: applicationList,
        },
        modelUUID,
        appStore.getState()
      );
      setOperations(operationList.results);
      setFetchedOperations(true);
    }
    fetchData();
    // XXX Temporarily disabled.
    // Used to stop it re-requesting every time state changes.
    // appStore and applicationList removed from dependency graph
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelUUID]);

  const tableData = useMemo(() => {
    const rows: TableRows = [];
    operations &&
      operations.forEach((operationData) => {
        const operationId = operationData.operation.split("-")[1];
        // The action name is being defined like this because the action name is
        // only contained in the actions array and not on the operation level.
        // Even though at the current time an operation is the same action
        // performed across multiple units of the same application. I expect
        // that the CLI may gain this functionality in the future and we'll have
        // to update this code to display the correct action name.
        let actionName = "";
        operationData.actions.forEach((actionData, index) => {
          actionName = actionData.action.name;
          let defaultRow: TableRow = {
            application: "-",
            id: "-",
            status: "-",
            taskId: "",
            message: "",
            completed: "",
          };
          let newData = {};
          if (index === 0) {
            // If this is the first row then add the application row.
            // The reciever is in the format "unit-ceph-mon-0" to "ceph-mon"
            const parts = actionData.action.receiver.match(/unit-(.+)-\d+/);
            const appName = parts && parts[1];
            if (!appName) {
              console.error(
                "Unable to parse action receiver",
                actionData.action.receiver
              );
              return;
            }
            newData = {
              application: generateAppIcon(
                modelStatusData.applications[appName],
                appName,
                userName,
                modelName
              ),
              id: `${operationId}/${actionName}`,
              status: generateStatusElement(
                actionData.status,
                undefined,
                true,
                true
              ),
            };
            rows.push({
              ...defaultRow,
              ...newData,
            });
          }
          newData = {
            application: (
              <>
                <span className="entity-details__unit-indent">└</span>
                <span>
                  {actionData.action.receiver.replace(
                    /unit-(.+)-(\d+)/,
                    "$1/$2"
                  )}
                </span>
              </>
            ),
            id: "",
            status: generateStatusElement(
              actionData.status,
              undefined,
              true,
              true
            ),
            taskId: actionData.action.tag.split("-")[1],
            message: actionData.message || "-",
            completed: actionData.completed,
          };

          rows.push({
            ...defaultRow,
            ...newData,
          });
        });
      });
    return rows;
  }, [operations, modelStatusData.applications, userName, modelName]);

  const columnData = useMemo(
    () => [
      {
        Header: "application",
        accessor: "application",
      },
      {
        Header: "operation id/name",
        accessor: "id",
      },
      {
        Header: "status",
        accessor: "status",
      },
      {
        Header: "task id",
        accessor: "taskId",
      },
      {
        Header: "action message",
        accessor: "message",
      },
      {
        Header: "completion time",
        accessor: "completed",
      },
    ],
    []
  );

  const emptyMsg = `There are no action logs available yet for ${modelName}`;

  return (
    <div
      className={classnames("entity-details__action-logs", {
        "entity-details__loading": !fetchedOperations,
      })}
    >
      {!fetchedOperations ? (
        <Spinner />
      ) : (
        <ModularTable
          emptyMsg={emptyMsg}
          columns={columnData}
          data={tableData}
        />
      )}
    </div>
  );
}
