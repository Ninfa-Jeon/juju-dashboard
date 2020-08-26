import React from "react";
import configureStore from "redux-mock-store";
import { Provider } from "react-redux";
import { mount } from "enzyme";
import { MemoryRouter } from "react-router";
import TestRoute from "components/Routes/TestRoute";
import dataDump from "testing/complete-redux-store-dump";

import ModelDetails from "./ModelDetails";

jest.mock("components/Topology/Topology", () => {
  const Topology = () => <div className="topology"></div>;
  return Topology;
});

const mockStore = configureStore([]);

describe("ModelDetail Container", () => {
  it("renders the details pane", () => {
    const store = mockStore(dataDump);
    const wrapper = mount(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/models/group-test"]}>
          <TestRoute path="/models/*">
            <ModelDetails />
          </TestRoute>
        </MemoryRouter>
      </Provider>
    );
    expect(wrapper.find("Topology").length).toBe(1);
    expect(wrapper.find(".model-details__main table").length).toBe(4);
  });

  it("renders the details pane for models shared-with-me", () => {
    const store = mockStore(dataDump);
    const wrapper = mount(
      <Provider store={store}>
        <MemoryRouter
          initialEntries={["/models/space-man@external/frontend-ci"]}
        >
          <TestRoute path="/models/*">
            <ModelDetails />
          </TestRoute>
        </MemoryRouter>
      </Provider>
    );
    expect(wrapper.find(".model-details__main table").length).toBe(4);
  });

  it("renders the machine details section", () => {
    const store = mockStore(dataDump);
    const wrapper = mount(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/models/spaceman@external/mymodel"]}>
          <TestRoute path="/models/*">
            <ModelDetails />
          </TestRoute>
        </MemoryRouter>
      </Provider>
    );
    expect(
      wrapper
        .find(".model-details__main table")
        .at(2)
        .hasClass("model-details__machines")
    ).toBe(true);
  });

  it("subordinate rows render correct amount", () => {
    const store = mockStore(dataDump);
    const wrapper = mount(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/models/sub-test"]}>
          <TestRoute path="/models/*">
            <ModelDetails />
          </TestRoute>
        </MemoryRouter>
      </Provider>
    );
    expect(wrapper.find(".model-details__main .subordinate").length).toEqual(2);
  });

  it("view filters hide and show tables", () => {
    const store = mockStore(dataDump);
    const wrapper = mount(
      <Provider store={store}>
        <MemoryRouter
          initialEntries={["/models/spaceman@external/hadoopspark"]}
        >
          <TestRoute path="/models/*">
            <ModelDetails />
          </TestRoute>
        </MemoryRouter>
      </Provider>
    );
    expect(wrapper.find(".model-details__main table").length).toBe(4);
    wrapper.find("[data-test='apps'] button").simulate("click");
    expect(wrapper.find(".model-details__main table").length).toBe(1);
    expect(wrapper.find("table.model-details__apps").length).toBe(1);
    wrapper.find("[data-test='apps'] button").simulate("click");
    expect(wrapper.find(".model-details__main table").length).toBe(4);
    wrapper.find("[data-test='machines'] button").simulate("click");
    expect(
      wrapper.find(".model-details__main table.model-details__machines").length
    ).toBe(1);
    wrapper.find("[data-test='relations'] button").simulate("click");
    expect(
      wrapper.find(".model-details__main table.model-details__relations").length
    ).toBe(1);
    expect(wrapper.find(".model-details__main table").length).toBe(2);
  });

  it("app names link to charm store pages", () => {
    const store = mockStore(dataDump);
    const wrapper = mount(
      <Provider store={store}>
        <MemoryRouter
          initialEntries={["/models/spaceman@external/hadoopspark"]}
        >
          <TestRoute path="/models/*">
            <ModelDetails />
          </TestRoute>
        </MemoryRouter>
      </Provider>
    );
    const appsFirstRowLink = wrapper
      .find(".model-details__apps tr [data-test='app-link']")
      .at(1);
    expect(appsFirstRowLink.prop("href")).toEqual(
      "https://www.jaas.ai/u/activedev/failtester/precise/7"
    );
  });

  it("supports local charms", () => {
    const store = mockStore(dataDump);
    const wrapper = mount(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/models/admin/local-test"]}>
          <TestRoute path="/models/*">
            <ModelDetails />
          </TestRoute>
        </MemoryRouter>
      </Provider>
    );
    expect(
      wrapper.find(".model-details__apps tr[data-app='cockroachdb']").length
    ).toBe(1);
    expect(
      wrapper
        .find(
          ".model-details__apps tr[data-app='cockroachdb'] td[data-test-column='store']"
        )
        .text()
    ).toBe("Local");
  });

  it("displays the correct scale value", () => {
    const store = mockStore(dataDump);
    const testApp = "kibana";
    const wrapper = mount(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/models/new-search-aggregate"]}>
          <TestRoute path="/models/*">
            <ModelDetails />
          </TestRoute>
        </MemoryRouter>
      </Provider>
    );
    const applicationRow = wrapper.find(`tr[data-app="${testApp}"]`);
    expect(applicationRow.find("td[data-test-column='scale']").text()).toBe(
      "1"
    );
  });
});
