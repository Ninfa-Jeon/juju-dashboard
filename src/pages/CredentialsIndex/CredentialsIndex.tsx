import {
  Button,
  Notification as ReactNotification,
  SearchAndFilter,
  usePortal,
} from "@canonical/react-components";
import type { SearchAndFilterChip } from "@canonical/react-components/dist/components/SearchAndFilter/types";
import classNames from "classnames";
import type { JSX, ReactNode } from "react";
import { useEffect, useId, useMemo, useState } from "react";
import { Link } from "react-router";

import ChipGroup from "components/ChipGroup";
import CredentialsTable from "components/CredentialsTable";
import DestroyModelDialog from "components/DestroyModelDialog";
import LoadingSpinner from "components/LoadingSpinner";
import SegmentedControl from "components/SegmentedControl";
import { VALID_MODEL_GROUPINGS } from "consts";
import useModelAttributes from "hooks/useModelAttributes";
import { useQueryParams } from "hooks/useQueryParams";
import useWindowTitle from "hooks/useWindowTitle";
import { useCheckRelations } from "juju/api-hooks/permissions";
import { JIMMRelation } from "juju/jimm/JIMMV4";
import MainContent from "layout/MainContent";
import {
  getControllerUserTag,
  getWSControllerURL,
} from "store/general/selectors";
import {
  getCloudTags,
  getGroupedModelStatusCounts,
  getModelData,
  getModelListLoaded,
  getModelsError,
  getModelUUIDs,
  getSelectedModelsForDestruction,
  getUserCredentialsState,
  hasModels,
} from "store/juju/selectors";
import { pluralize } from "store/juju/utils/models";
import userCredentialsMiddleware from "store/middleware/source/user-credentials";
import { useAppDispatch, useAppSelector } from "store/store";
import { testId } from "testing/utils";
import type { ModelsGroupedBy } from "urls";
import urls, { externalURLs } from "urls";

import { Label, TestId } from "./types";

// spell-checker:words groupedby

export default function Credentials(): JSX.Element {
  useWindowTitle("Credentials");
  const dispatch = useAppDispatch();
  const [selectedModelUUIDs, setSelectedModelUUIDs] = useState<string[]>([]);
  const selectedModelsForDestruction = useAppSelector(
    getSelectedModelsForDestruction,
  );
  const wsControllerURL = useAppSelector(getWSControllerURL);
  const { closePortal, isOpen: showDestroyDialog, Portal } = usePortal();
  const userCredentials = useAppSelector(getUserCredentialsState);
  const cloudTags = useAppSelector(getCloudTags);

  // Start polling for all user credentials.
  useEffect(() => {
    if (wsControllerURL && cloudTags.length) {
      dispatch(
        userCredentialsMiddleware.actions.start({ wsControllerURL, cloudTags }),
      );
    }
    return (): void => {
      if (wsControllerURL && cloudTags.length) {
        dispatch(
          userCredentialsMiddleware.actions.stop({
            wsControllerURL,
            cloudTags,
          }),
        );
      }
    };
  }, [dispatch, wsControllerURL, cloudTags]);

  const [queryParams, setQueryParams] = useQueryParams<{
    groupedby: string;
    cloud: string[];
    owner: string[];
    region: string[];
    credential: string[];
    custom: string[];
  }>({
    groupedby: "status",
    cloud: [],
    owner: [],
    region: [],
    credential: [],
    custom: [],
  });
  const filters = {
    cloud: queryParams.cloud,
    owner: queryParams.owner,
    region: queryParams.region,
    credential: queryParams.credential,
    custom: queryParams.custom,
  };

  const modelsError = useAppSelector(getModelsError);
  const modelsLoaded = useAppSelector(getModelListLoaded);
  const hasSomeModels = useAppSelector(hasModels);
  const modelData = useAppSelector(getModelData);
  const modelUUIDs = useAppSelector(getModelUUIDs);
  const { clouds, regions, owners, credentials } =
    useModelAttributes(modelData);
  const controllerUser = useAppSelector(getControllerUserTag);
  // Each place the relations are checked needs to use a unique ID. The useId
  // hook should return an ID that is unique across the app, but this may need to
  // be replaced with a more robust implementation if there are conflicts.
  const requestId = useId();
  const relations =
    controllerUser && modelUUIDs.length
      ? modelUUIDs.map((modelUUID) => ({
          object: controllerUser,
          relation: JIMMRelation.ADMINISTRATOR,
          target_object: `model-${modelUUID}`,
        }))
      : null;
  useCheckRelations(requestId, relations, true);

  // Sync selected model UUIDs with the models selected for destruction in the store.
  // This helps in clearing local state once the store's selection is cleared.
  useEffect(() => {
    if (selectedModelsForDestruction.length === 0) {
      setSelectedModelUUIDs([]);
    }
  }, [selectedModelsForDestruction]);
  const groupBy: ModelsGroupedBy = useMemo(() => {
    if (
      (VALID_MODEL_GROUPINGS as readonly string[]).includes(
        queryParams.groupedby,
      )
    ) {
      return queryParams.groupedby as ModelsGroupedBy;
    }
    return "status";
  }, [queryParams.groupedby]);

  // Generate chips from available model data
  const generateChips = (
    lead: string,
    values: string[],
  ): SearchAndFilterChip[] => {
    const chipValues: SearchAndFilterChip[] = [];
    values.forEach((value) => {
      chipValues.push({ lead, value });
    });
    return chipValues;
  };

  const { blocked, alert, running } = useAppSelector(
    getGroupedModelStatusCounts,
  );

  let activeFilters: Record<string, string[]> = {};

  const isObjectsEqual = (
    obj1: Record<string, unknown>,
    obj2: Record<string, unknown>,
  ): boolean => JSON.stringify(obj1) === JSON.stringify(obj2);

  const existingSearchData: SearchAndFilterChip[] = [];
  for (const [lead, values] of Object.entries(filters)) {
    values.forEach((value) => {
      if (value) {
        existingSearchData.push({ lead, value });
      }
    });
  }

  const credentialCount = Object.values(userCredentials.credentials).reduce(
    (acc, creds) => acc + creds.length,
    0,
  );

  let content: ReactNode = null;
  if (!modelsLoaded && !modelsError) {
    return <LoadingSpinner />;
  } else if (!hasSomeModels) {
    content = (
      <div className="models">
        <h3>{Label.NOT_FOUND}</h3>
        <p>
          Learn about <a href={externalURLs.addModel}>adding models</a> or{" "}
          <a href={externalURLs.modelAccess}>granting access</a> to existing
          models.
        </p>
      </div>
    );
  } else {
    content = (
      <>
        <span
          className="models__controls"
          data-disabled={credentialCount === 0}
        >
          <SearchAndFilter
            filterPanelData={[
              {
                id: 0,
                heading: "Cloud",
                chips: generateChips("Cloud", clouds),
              },
              {
                id: 1,
                heading: "Region",
                chips: generateChips("Region", regions),
              },
              {
                id: 2,
                heading: "Owner",
                chips: generateChips("Owner", owners),
              },
              {
                id: 3,
                heading: "Credential",
                chips: generateChips("Credential", credentials),
              },
            ]}
            existingSearchData={existingSearchData}
            returnSearchData={(searchData) => {
              // Reset active filters
              activeFilters = {
                cloud: [],
                owner: [],
                region: [],
                credential: [],
                custom: [],
              };

              // Loop search data and pull out each filter
              if (searchData.length) {
                searchData.forEach(({ lead, value }) => {
                  const chipLead = lead ? lead.toLowerCase() : "custom";
                  if (!(chipLead in activeFilters)) {
                    activeFilters[chipLead] = [];
                  }
                  activeFilters[chipLead].push(value);
                });
              }
              if (!isObjectsEqual(activeFilters, filters)) {
                setQueryParams(activeFilters);
              }
            }}
          />
          <span>
            <span className="p-text--default">Group by: </span>
            <SegmentedControl
              activeButton={queryParams.groupedby}
              buttons={VALID_MODEL_GROUPINGS.map((group) => ({
                children: <span className="u-capitalise">{group}</span>,
                key: group,
                to: urls.models.group({
                  groupedby: group as ModelsGroupedBy,
                }),
              }))}
              buttonComponent={Link}
            />
          </span>
        </span>
        <div className={classNames("models", `${groupBy}-group`)}>
          <ChipGroup chips={{ blocked, alert, running }} />
          <CredentialsTable
            groupBy={groupBy}
            onSelectionChange={setSelectedModelUUIDs}
          />
        </div>
      </>
    );
  }

  return (
    <MainContent
      {...testId(TestId.COMPONENT)}
      contentClassName="models__content"
      title={
        <div className="models__header">
          <span className="u-show--large">
            {credentialCount} {pluralize(credentialCount, "credential")}
          </span>
        </div>
      }
      titleComponent="div"
      titleClassName="u-no-max-width u-full-width"
    >
      {showDestroyDialog && selectedModelUUIDs.length === 1 && (
        <Portal>
          <DestroyModelDialog
            modelUUID={selectedModelUUIDs[0]}
            modelName={
              modelData[selectedModelUUIDs[0]]?.model.name ??
              selectedModelUUIDs[0]
            }
            closePortal={closePortal}
          />
        </Portal>
      )}
      {modelsError ? (
        <ReactNotification severity="negative" title="Error">
          {modelsError} Try{" "}
          <Button
            appearance="link"
            onClick={() => {
              window.location.reload();
            }}
          >
            refreshing
          </Button>{" "}
          the page.
        </ReactNotification>
      ) : null}
      {content}
    </MainContent>
  );
}
