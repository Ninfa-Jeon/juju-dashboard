import { createSource } from "data/sourceBase";
import type { ConnectionWithFacades } from "juju/types";
import { actions as jujuActions } from "store/juju";
import type { CredentialContentsState } from "store/juju/types";
import {
  extractCredentialName,
  getCredentialContentsKey,
} from "store/juju/utils/models";
import { toSerializableSourceError } from "store/util";

import { hasConnections } from "../connection/util";
import { createSourceInstance } from "../source-middleware";

export async function getCredentialContents(
  connection: ConnectionWithFacades,
  credentialTags: string[],
): Promise<CredentialContentsState["contents"]> {
  if (!connection.info.user?.identity) {
    throw new Error("not authenticated with controller");
  }
  if (!connection.facades.cloud) {
    throw new Error("Cloud facade is not available on the connection");
  }

  const credentials = credentialTags.map((tag) => {
    const [cloud, , name] = extractCredentialName(tag);
    return { cloud, name };
  });
  const response = await connection.facades.cloud.credentialContents({
    credentials: credentials.map(({ cloud, name }) => ({
      "cloud-name": cloud,
      "credential-name": name,
    })),
    "include-secrets": false,
  });

  return Object.fromEntries(
    credentials.map(({ cloud, name }, index) => {
      const result = response.results?.[index] ?? {
        error: {
          code: "missing-result",
          message: "No credential contents were returned",
        },
      };
      return [getCredentialContentsKey(cloud, name), result];
    }),
  );
}

export default createSourceInstance<
  {
    wsControllerURL: string;
    credentialTags: string[];
  },
  CredentialContentsState["contents"]
>(
  "credential-contents",
  ({ meta, credentialTags }) => {
    if (!hasConnections(meta, ["wsControllerURL"])) {
      throw new Error("connection not provided");
    }

    const connection = meta.connections.wsControllerURL;

    return createSource<CredentialContentsState["contents"]>(
      ({ load, sourceDone }) => {
        const refetch = (): void => {
          if (!sourceDone.aborted) {
            load(getCredentialContents(connection, credentialTags), sourceDone);
          }
        };

        queueMicrotask(refetch);
        return { refetch };
      },
    );
  },
  {
    setData: (_args, data) =>
      jujuActions.updateCredentialContents({
        update: { data },
      }),
    setError: (_args, error) =>
      jujuActions.updateCredentialContents({
        update: { error: toSerializableSourceError(error) },
      }),
    setLoading: (_args, loading) =>
      jujuActions.updateCredentialContents({
        update: { loading },
      }),
  },
  {
    addActionMeta: () => ({ withConnection: true }),
  },
);
