import { Icon } from "@canonical/react-components";
import { useMemo, type JSX } from "react";

import DataTable from "components/DataTable";
import TruncatedTooltip from "components/TruncatedTooltip";
import {
  getCredentialContentsState,
  getCredentialsWithContents,
  getUserCredentialsState,
} from "store/juju/selectors";
import { useAppSelector } from "store/store";

type Props = {
  onSelectionChange?: (selectedUUIDs: string[]) => void;
};

export default function CredentialsTable({
  onSelectionChange,
}: Props): JSX.Element {
  const credentialContents = useAppSelector(getCredentialContentsState);
  const userCredentials = useAppSelector(getUserCredentialsState);
  const credentials = useAppSelector(getCredentialsWithContents);
  const credentialContentError = Object.values(
    credentialContents.contents,
  ).find(({ error }) => error)?.error?.message;

  const column = useMemo(
    () => DataTable.columnBuilder<(typeof credentials)[number]>(),
    [],
  );

  return (
    <DataTable
      selectable={false}
      getKey={(row) => row.credential}
      groupBy="status"
      data={credentials}
      isRowDisabled={() => false}
      isRowLoading={() => false}
      noRowsMessage={
        (typeof userCredentials.errors === "string"
          ? userCredentials.errors
          : null) ??
        credentialContents.errors?.message ??
        credentialContentError ??
        (userCredentials.loading || credentialContents.loading
          ? "Loading credentials..."
          : "No credentials")
      }
      onSelectionChange={onSelectionChange}
      columns={{
        status: column({
          header: "Status",
          sortable: true,
          className: "credentials-table__status",
          map: ({ contents }) => contents?.result?.models?.length ?? 0,
          renderCell: (modelsCount) => (
            <TruncatedTooltip message={modelsCount}>
              <Icon
                name={
                  modelsCount
                    ? "status-succeeded-small"
                    : "status-waiting-small"
                }
              />
              <span className="u-sh1">
                {modelsCount ? "In use" : "Not in use"}
              </span>
            </TruncatedTooltip>
          ),
        }),
        name: column({
          header: "Name",
          sortable: true,
          className: "credentials-table__name",
          map: ({ name }) => name,
          renderCell: (credentialName) => (
            <TruncatedTooltip message={credentialName}>
              {credentialName}
            </TruncatedTooltip>
          ),
        }),
        cloud: column({
          header: "Cloud",
          sortable: true,
          className: "credentials-table__cloud",
          map: ({ cloud }) => cloud,
          renderCell: (cloudName) => (
            <TruncatedTooltip message={cloudName}>{cloudName}</TruncatedTooltip>
          ),
        }),
        authType: column({
          header: "Auth Type",
          sortable: true,
          className: "credentials-table__auth-type",
          map: ({ contents }) =>
            contents?.result?.content?.["auth-type"] ?? "-",
          renderCell: (authType) => (
            <TruncatedTooltip message={authType}>{authType}</TruncatedTooltip>
          ),
        }),
        models: column({
          header: "Models",
          className: "credentials-table__models",
          map: ({ contents }) => contents?.result?.models?.length ?? 0,
        }),
      }}
    />
  );
}
