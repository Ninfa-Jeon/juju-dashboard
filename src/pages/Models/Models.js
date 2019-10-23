import React from "react";
import { useSelector } from "react-redux";

import Layout from "components/Layout/Layout";
import Header from "components/Header/Header";
import TableList from "components/TableList/TableList";
import ButtonToggle from "components/ButtonToggle/ButtonToggle";
import FilterTags from "components/FilterTags/FilterTags";

import { getGroupedModelStatusCounts } from "app/selectors";

import "./_models.scss";

function pluralize(value, string) {
  if (value && (value === 0 || value > 1)) {
    return string + "s";
  }
  return string;
}

export default function Models() {
  const { blocked, alert, running } = useSelector(getGroupedModelStatusCounts);
  const models = blocked + alert + running;
  return (
    <Layout>
      <Header>
        <div className="models__header">
          <div className="models__count">
            {`${models} ${pluralize(
              models,
              "model"
            )}: ${blocked} blocked, ${alert} ${pluralize(
              alert,
              "alert"
            )}, ${running} running`}
          </div>
          <ButtonToggle />
          <FilterTags />
          <i className="p-icon--user">Account icon</i>
        </div>
      </Header>
      <div className="p-strip is-shallow">
        <div className="row">
          <TableList />
        </div>
      </div>
    </Layout>
  );
}
