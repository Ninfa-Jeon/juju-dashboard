import { createPollingSource } from "data/pollingSource";
import type { ConnectionWithFacades } from "juju/types";
import { actions as jujuActions } from "store/juju";
import { toSerializableSourceError } from "store/util";

import { hasConnections } from "../connection/util";
import { createSourceInstance } from "../source-middleware";

export const NOT_AUTHENTICATED_ERROR = "not authenticated with controller";
export const NO_CLOUD_FACADE =
  "Cloud facade is not available on the connection";

export async function getUserCredentials(
  connection: ConnectionWithFacades,
  cloudTags: string[],
): Promise<Record<string, string[]>> {
  const userTag = connection.info.user?.identity;
  if (!userTag) {
    throw new Error(NOT_AUTHENTICATED_ERROR);
  }
  if (!connection.facades.cloud) {
    throw new Error(NO_CLOUD_FACADE);
  }

  const response = await connection.facades.cloud?.userCredentials({
    "user-clouds": cloudTags.map((cloudTag) => ({
      "cloud-tag": cloudTag,
      "user-tag": userTag,
    })),
  });

  const results = response?.results ?? [];
  const credentials: Record<string, string[]> = {};
  cloudTags.forEach((tag, i) => {
    credentials[tag] = results[i]?.result ?? [];
  });
  return credentials;
}

export default createSourceInstance<
  { wsControllerURL: string; cloudTags: string[] },
  Record<string, string[]>
>(
  "user-credentials",
  ({ wsControllerURL: _, cloudTags, meta }) => {
    if (!hasConnections(meta, ["wsControllerURL"])) {
      throw new Error("connection not provided");
    }

    const connection = meta.connections.wsControllerURL;

    return createPollingSource(
      async () => getUserCredentials(connection, cloudTags),
      { interval: { seconds: 30 } },
    );
  },
  {
    setData: ({ cloudTags }, data) =>
      jujuActions.updateUserCredentials({ cloudTags, update: { data } }),
    setError: ({ cloudTags }, error) =>
      jujuActions.updateUserCredentials({
        cloudTags,
        update: { error: toSerializableSourceError(error) },
      }),
    setLoading: ({ cloudTags }, loading) =>
      jujuActions.updateUserCredentials({ cloudTags, update: { loading } }),
  },
  {
    addActionMeta: (_payload) => ({ withConnection: true }),
  },
);
