import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { RootState } from "store/store";
import { rootStateFactory } from "testing/factories";
import { generalStateFactory, configFactory } from "testing/factories/general";
import {
  cloudInfoStateFactory,
  jujuStateFactory,
} from "testing/factories/juju/juju";
import { renderComponent } from "testing/utils";

import AddCredentialPanel from "./AddCredentialPanel";
import { Label as FieldsLabel } from "./Fields/types";
import { Label } from "./types";

describe("AddCredentialPanel", () => {
  let state: RootState;

  beforeEach(() => {
    state = rootStateFactory.build({
      general: generalStateFactory.build({
        config: configFactory.build({
          controllerAPIEndpoint: "wss://example.com/api",
        }),
      }),
      juju: jujuStateFactory.build({
        cloudInfo: cloudInfoStateFactory.build({
          clouds: {
            "cloud-aws": {
              type: "ec2",
              regions: [
                { name: "us-east-1", endpoint: "" },
                { name: "us-west-2", endpoint: "" },
              ],
            },
            "cloud-gce": {
              type: "gce",
              regions: [
                { name: "us-central1", endpoint: "" },
                { name: "us-east1", endpoint: "" },
              ],
            },
          },
        }),
      }),
    });
  });

  it("renders the submit button disabled initially", () => {
    renderComponent(<AddCredentialPanel />, {
      state,
      url: "/?panel=add-credential",
    });

    const submitButton = screen.getByRole("button", { name: Label.SUBMIT });
    expect(submitButton).toHaveAttribute("aria-disabled", "true");
  });

  it("disables the region field until a cloud is selected", () => {
    renderComponent(<AddCredentialPanel />, {
      state,
      url: "/?panel=add-credential",
    });

    const regionField = screen.getByRole("combobox", {
      name: FieldsLabel.REGION,
    });
    expect(regionField).toBeDisabled();
  });

  it("enables auth type dropdown when cloud is selected", async () => {
    renderComponent(<AddCredentialPanel />, {
      state,
      url: "/?panel=add-credential",
    });

    const cloudDropdown = screen.getByRole("combobox", {
      name: FieldsLabel.CLOUD,
    });
    const authTypeDropdown = screen.getByRole("combobox", {
      name: FieldsLabel.AUTH_TYPE,
    });

    // Auth type should be disabled initially
    expect(authTypeDropdown).toBeDisabled();

    // Select a cloud
    await userEvent.selectOptions(cloudDropdown, "cloud-aws");

    // Auth type dropdown should now be enabled
    await waitFor(() => {
      expect(authTypeDropdown).not.toBeDisabled();
    });
  });

  it("keeps submit disabled until required auth fields are filled", async () => {
    renderComponent(<AddCredentialPanel />, {
      state,
      url: "/?panel=add-credential",
    });

    await userEvent.type(
      screen.getByRole("textbox", { name: FieldsLabel.NAME }),
      "my-credential",
    );
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: FieldsLabel.CLOUD }),
      "cloud-aws",
    );

    const secretKey = screen.getByLabelText(/Secret Key/);
    const submitButton = screen.getByRole("button", { name: Label.SUBMIT });
    expect(submitButton).toHaveAttribute("aria-disabled", "true");

    await userEvent.type(await screen.findByLabelText(/Access Key/), "key");
    await userEvent.type(secretKey, "secret");

    // Vanilla doesn't display validation until the field loses focus.
    await act(() => fireEvent.blur(secretKey));
    expect(submitButton).not.toHaveAttribute("aria-disabled", "true");
  });
});
