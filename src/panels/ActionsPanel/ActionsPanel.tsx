import {
  MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import classNames from "classnames";
import { DefaultRootState, useSelector, useStore } from "react-redux";
import { useParams } from "react-router-dom";
import { executeActionOnUnits, getActionsForApplication } from "juju";
import { getModelUUID } from "app/selectors";
import { generateIconImg } from "app/utils/utils";

import type { EntityDetailsRoute } from "components/Routes/Routes";

import Aside from "components/Aside/Aside";
import PanelHeader from "components/PanelHeader/PanelHeader";
import LoadingHandler from "components/LoadingHandler/LoadingHandler";
import RadioInputBox from "components/RadioInputBox/RadioInputBox";

import ActionOptions from "./ActionOptions";

import "./_actions-panel.scss";

export type ActionData = {
  [key: string]: ActionItem;
};

type ActionItem = {
  description: string;
  params: ActionParams;
};

type ActionParams = {
  description: string;
  properties: ActionProps;
  required: string[];
  title: string;
  type: string;
};

type ActionProps = {
  [key: string]: ActionProp;
};

type ActionProp = {
  description: string;
  type: string;
};

export type ActionOptionsType = ActionOptionDetails[];

type ActionOptionDetails = {
  name: string;
  description: string;
  type: string;
  required: boolean;
};

type ActionOptionValues = {
  [actionName: string]: ActionOptionValue;
};

type ActionOptionValue = {
  [optionName: string]: string;
};

type SetSelectedAction = (actionName: string) => void;

export type OnValuesChange = (
  actionName: string,
  options: ActionOptionValue
) => void;

export default function ActionsPanel(): JSX.Element {
  const appStore = useStore();
  const appState = appStore.getState();
  const { appName, modelName } = useParams<EntityDetailsRoute>();
  const getModelUUIDMemo = useMemo(() => getModelUUID(modelName), [modelName]);
  // Selectors.js is not typescript yet and it complains about the return value
  // of getModelUUID. TSFixMe
  const modelUUID = useSelector(
    getModelUUIDMemo as (state: DefaultRootState) => unknown
  );
  const [disableSubmit, setDisableSubmit] = useState<boolean>(true);
  const [actionData, setActionData] = useState<ActionData>({});
  const [fetchingActionData, setFetchingActionData] = useState(false);
  const [selectedAction, setSelectedAction]: [
    string | undefined,
    SetSelectedAction
  ] = useState<string>();

  const actionOptionsValues = useRef<ActionOptionValues>({});

  useEffect(() => {
    setFetchingActionData(true);
    getActionsForApplication(appName, modelUUID, appStore.getState()).then(
      (actions) => {
        if (actions?.results?.[0]?.actions) {
          setActionData(actions.results[0].actions);
        }
        setFetchingActionData(false);
      }
    );
  }, [appName, appStore, modelUUID]);

  // See above note about selectors.js typings TSFixMe
  const namespace =
    appState.juju?.modelData?.[modelUUID as string]?.applications?.[appName]
      ?.charm;

  const generateSelectedUnitList = () => "..."; // XXX req unit list selection

  const generateTitle = () => (
    <h5>{generateIconImg(appName, namespace)} 0 units selected</h5>
  );

  const executeAction = async () => {
    await executeActionOnUnits(
      // XXX These values are only hard coded until the
      // unit list selection has been implemented.
      ["ceph/0"],
      "delete-pool",
      actionOptionsValues.current["delete-pool"],
      modelUUID,
      appStore.getState()
    );
  };

  const changeHandler = useCallback(
    (actionName, values) => {
      onValuesChange(actionName, values, actionOptionsValues);
      enableSubmit(
        selectedAction,
        actionData,
        actionOptionsValues,
        setDisableSubmit
      );
    },
    [actionData, selectedAction]
  );

  const selectHandler = useCallback(
    (actionName) => {
      setSelectedAction(actionName);
      enableSubmit(
        actionName,
        actionData,
        actionOptionsValues,
        setDisableSubmit
      );
    },
    [actionData]
  );

  return (
    <Aside width="narrow">
      <div className="p-panel actions-panel">
        <PanelHeader title={generateTitle()} />
        <div className="actions-panel__unit-list">
          Run action on {appName}: {generateSelectedUnitList()}
        </div>
        <div className="actions-panel__action-list">
          <LoadingHandler data={actionData} loading={fetchingActionData}>
            {Object.keys(actionData).map((actionName) => (
              <RadioInputBox
                name={actionName}
                description={actionData[actionName].description}
                onSelect={selectHandler}
                selectedInput={selectedAction}
                key={actionName}
              >
                <ActionOptions
                  name={actionName}
                  data={actionData}
                  onValuesChange={changeHandler}
                />
              </RadioInputBox>
            ))}
          </LoadingHandler>
        </div>
        <div className="actions-panel__drawer">
          <button
            className={classNames(
              "p-button--positive actions-panel__run-action"
            )}
            disabled={disableSubmit}
            onClick={executeAction}
          >
            Run action
          </button>
        </div>
      </div>
    </Aside>
  );
}

function onValuesChange(
  actionName: string,
  values: ActionOptionValue,
  optionValues: MutableRefObject<ActionOptionValues>
) {
  const updatedValues: ActionOptionValue = {};
  Object.keys(values).forEach((key) => {
    updatedValues[key.replace(`${actionName}-`, "")] = values[key];
  });

  optionValues.current = {
    ...optionValues.current,
    [actionName]: updatedValues,
  };
}

function enableSubmit(
  selectedAction: string | undefined,
  actionData: ActionData,
  optionsValues: MutableRefObject<ActionOptionValues>,
  setDisableSubmit: (disable: boolean) => void
) {
  if (selectedAction) {
    if (hasNoOptions(selectedAction, optionsValues.current)) {
      setDisableSubmit(false);
      return;
    }
    if (
      requiredPopulated(selectedAction, actionData, optionsValues.current) &&
      optionsValidate(selectedAction, optionsValues.current)
    ) {
      setDisableSubmit(false);
      return;
    }
  }
  setDisableSubmit(true);
}

type ValidationFnProps = (
  selectedAction: string,
  optionValues: ActionOptionValues
) => boolean;

type RequiredPopulated = (
  selectedAction: string,
  actionData: ActionData,
  optionValues: ActionOptionValues
) => boolean;

const hasNoOptions: ValidationFnProps = (selected, optionValues) => {
  // If there are no options stored then it doesn't have any.
  if (!optionValues[selected]) {
    return true;
  }
  return Object.keys(optionValues[selected]).length === 0;
};

const requiredPopulated: RequiredPopulated = (
  selected,
  actionData,
  optionsValues
) => {
  const required = actionData[selected].params.required;
  if (required.length === 0) {
    return true;
  }
  return !required.some((option) => optionsValues[selected][option] === "");
};

const optionsValidate: ValidationFnProps = (selected, optionsValues) => {
  // XXX TODO
  return true;
};
