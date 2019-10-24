import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { getMacaroons } from "app/selectors";
import classNames from "classnames";

import cleanUpTerminal from "./cleanup-terminal";
import setupTerminal from "./setup-terminal";

import "./_terminal.scss";

const Terminal = ({ address, modelName }) => {
  const terminalElement = useRef(null);
  const macaroons = useSelector(getMacaroons);

  useEffect(() => {
    const creds = { macaroons };
    const terminalInstance = setupTerminal(
      address,
      creds,
      modelName,
      terminalElement
    );

    return cleanUpTerminal(terminalInstance);
  }, [address, macaroons, modelName]);

  const [terminalVisible, setTerminalVisible] = useState(false);

  return (
    <div
      className={classNames("p-terminal", {
        "is-visible": terminalVisible
      })}
    >
      <div
        className="p-terminal__header"
        onClick={() => setTerminalVisible(!terminalVisible)}
      >
        <span>Juju Terminal</span>
        <div className="p-terminal__toggle">
          <i className="p-icon--contextual-menu">Toggle Terminal visibility</i>
        </div>
      </div>
      <div className="p-terminal__shell" ref={terminalElement}></div>
    </div>
  );
};

export default Terminal;
