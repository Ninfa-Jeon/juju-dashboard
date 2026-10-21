import { screen } from "@testing-library/react";

import { jujuStateFactory } from "testing/factories/juju/juju";
import { rootStateFactory } from "testing/factories/root";
import { renderComponent } from "testing/utils";

import CredentialsTable from "./CredentialsTable";

describe("CredentialsTable", () => {
  it("renders columns and cloud rows without model-only column classes or checkboxes", () => {
    const state = rootStateFactory.build({
      juju: jujuStateFactory.build({
        userCredentials: {
          credentials: { "cloud-aws": ["cloudcred-aws_admin_default"] },
        },
      }),
    });

    renderComponent(<CredentialsTable />, { state });

    expect(screen.getByRole("columnheader", { name: "Cloud" })).toHaveClass(
      "credentials-table__cloud",
    );
    expect(
      screen.getByRole("columnheader", { name: "Credentials" }),
    ).toHaveClass("credentials-table__credentials");
    expect(screen.getAllByRole("cell", { name: "cloud-aws" })).toHaveLength(2);
    expect(document.querySelector(".cloud")).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("renders an empty state while credentials are unavailable", () => {
    renderComponent(<CredentialsTable />);

    expect(screen.getByText("No credentials")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });
});
