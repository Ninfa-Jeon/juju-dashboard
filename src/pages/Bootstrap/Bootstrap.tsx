import {
  Button,
  Notification as ReactNotification,
} from "@canonical/react-components";
import type { ChangeEvent, FormEvent, JSX } from "react";
import { useMemo, useState } from "react";

type BootstrapRunRequest = {
  cloud: string;
  region: string;
  controllerName: string;
  dashboardType: "k8s" | "machine";
  credentialName: string;
};

type BootstrapRunResponse =
  | {
      ok: false;
      error: string;
    }
  | {
      ok: true;
      dashboardUrl: string;
      controllerName: string;
    };

const getBridgeParams = (): {
  bridgeBaseURL: string;
  bridgeToken: string;
} => {
  if (typeof window === "undefined") {
    return { bridgeBaseURL: "", bridgeToken: "" };
  }
  const params = new URLSearchParams(window.location.search);
  return {
    bridgeBaseURL: params.get("bridgeBaseURL") ?? "",
    bridgeToken: params.get("bridgeToken") ?? "",
  };
};

const Bootstrap = (): JSX.Element => {
  const { bridgeBaseURL, bridgeToken } = getBridgeParams();
  const [form, setForm] = useState<BootstrapRunRequest>({
    cloud: "",
    region: "",
    controllerName: "controller",
    dashboardType: "machine",
    credentialName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<null | string>(null);

  const canSubmit = useMemo(
    () =>
      !!bridgeBaseURL && !!bridgeToken && !!form.cloud && !!form.controllerName,
    [bridgeBaseURL, bridgeToken, form.cloud, form.controllerName],
  );

  const updateField =
    (field: keyof BootstrapRunRequest) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
    };

  const runBootstrap = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    setError(null);
    if (!bridgeBaseURL || !bridgeToken) {
      setError("Missing bridge connection details from launch URL.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/bootstrap/run", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${bridgeToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const result = (await response.json()) as BootstrapRunResponse;
      if (!response.ok || !result.ok) {
        setError(result.ok ? "Bootstrap failed." : result.error);
        return;
      }

      window.location.assign(result.dashboardUrl);
    } catch {
      setError("Unable to reach the local Juju bridge.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-strip">
      <div className="row">
        <div className="col-8 col-medium-4">
          <h1 className="p-heading--2">Set up your first controller</h1>
          <p>
            Start the bootstrap flow and this page will redirect to the real
            dashboard when setup completes.
          </p>
          {error ? (
            <ReactNotification severity="negative" title="Bootstrap failed">
              {error}
            </ReactNotification>
          ) : null}
          <form onSubmit={(event) => void runBootstrap(event)}>
            <label htmlFor="cloud" className="p-form__label">
              Cloud
            </label>
            <input
              id="cloud"
              className="p-form-validation__input"
              type="text"
              value={form.cloud}
              onChange={updateField("cloud")}
              required
            />

            <label htmlFor="region" className="p-form__label">
              Region
            </label>
            <input
              id="region"
              className="p-form-validation__input"
              type="text"
              value={form.region}
              onChange={updateField("region")}
            />

            <label htmlFor="credentialName" className="p-form__label">
              Credential name
            </label>
            <input
              id="credentialName"
              className="p-form-validation__input"
              type="text"
              value={form.credentialName}
              onChange={updateField("credentialName")}
            />

            <label htmlFor="controllerName" className="p-form__label">
              Controller name
            </label>
            <input
              id="controllerName"
              className="p-form-validation__input"
              type="text"
              value={form.controllerName}
              onChange={updateField("controllerName")}
              required
            />

            <label htmlFor="dashboardType" className="p-form__label">
              Dashboard type
            </label>
            <select
              id="dashboardType"
              className="p-form-validation__input"
              value={form.dashboardType}
              onChange={updateField("dashboardType")}
            >
              <option value="machine">Machine</option>
              <option value="k8s">Kubernetes</option>
            </select>

            <Button
              type="submit"
              appearance="positive"
              disabled={!canSubmit || loading}
              className="u-no-margin--top"
            >
              {loading ? "Starting bootstrap..." : "Start bootstrap"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Bootstrap;
