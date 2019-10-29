import React from "react";

export const generateStatusIcon = status => {
  let statusClass = status ? `is-${status.toLowerCase()}` : "";
  return <span className={"status-icon " + statusClass}>{status}</span>;
};

export const generateSpanClass = (className, value) => {
  return <span className={className}>{value}</span>;
};
