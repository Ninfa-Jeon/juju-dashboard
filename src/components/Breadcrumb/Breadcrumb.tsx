import { Link, useParams } from "react-router-dom";

import type { EntityDetailsRoute } from "components/Routes/Routes";
import React from "react";

export default function Breadcrumb(): JSX.Element {
  const {
    userName,
    modelName,
    appName,
    unitId,
    machineId,
  } = useParams<EntityDetailsRoute>();

  const generateModelURL = function (): string {
    if (userName && machineId) {
      return `/models/${userName}/${modelName}?activeView=machines`;
    } else if (userName) {
      return `/models/${modelName}/${modelName}?activeView=apps`;
    } else {
      return `/models/${modelName}`;
    }
  };

  let isNestedEntityPage = !!appName || !!unitId || !!machineId;

  return (
    <nav className="p-breadcrumbs" aria-label="Breadcrumb navigation">
      <ol className="p-breadcrumbs__items" data-test="breadcrumb-items">
        {isNestedEntityPage ? (
          <>
            <li className="p-breadcrumbs__item" data-test="breadcrumb-model">
              <Link to={generateModelURL()}>{modelName}</Link>
            </li>
            <li className="p-breadcrumbs__item" data-test="breadcrumb-section">
              <Link to={generateModelURL()}>
                {!!appName && <span>Applications</span>}
                {!!unitId && <span>Units</span>}
                {!!machineId && <span>Machines</span>}
              </Link>
            </li>
            <li
              className="p-breadcrumbs__item"
              data-test="breadcrumb-application"
            >
              <strong>
                {!!appName && <span>{appName}</span>}
                {!!unitId && <span>{unitId}</span>}
                {!!machineId && <span>{machineId}</span>}
              </strong>
            </li>
          </>
        ) : (
          <li className="p-breadcrumbs__item" data-test="breadcrumb-model">
            <strong>{modelName}</strong>
          </li>
        )}
      </ol>
    </nav>
  );
}
