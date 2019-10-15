import React, { useState } from "react";
import { Link } from "react-router-dom";
import classNames from "classnames";

import "./_primary-nav.scss";

const pages = [
  { label: "Models", path: "/" },
  { label: "Controllers", path: "/controllers" },
  { label: "Usage", path: "/usage" },
  { label: "Logs", path: "/logs" }
];

const PrimaryNav = () => {
  const currentLocation = window.location.pathname;
  const [extNavOpen, setExtNavOpen] = useState(false);
  return (
    <nav
      className={classNames("p-primary-nav", { "ext-nav-open": extNavOpen })}
    >
      <div className="p-primary-nav__header">
        <Link to="/">
          <img
            className="p-primary-nav__logo"
            src="https://assets.ubuntu.com/v1/a9e0ed4a-jaas-logo1.svg"
            alt="JAAS logo"
          />
        </Link>
        <button
          className="p-primary-nav__toggle"
          onClick={() => setExtNavOpen(!extNavOpen)}
        >
          <i className="p-icon--contextual-menu">Toggle external navigation</i>
        </button>
      </div>
      <ul className="p-list is-external">
        <li className="p-list__item">
          <a
            href="https://jaas.ai/store"
            target="_blank"
            rel="noopener noreferrer"
          >
            Store
          </a>
        </li>
        <li className="p-list__item">
          <a
            href="https://jaas.ai/about"
            target="_blank"
            rel="noopener noreferrer"
          >
            About
          </a>
        </li>
        <li className="p-list__item">
          <a
            href="https://jaas.ai/how-it-works"
            target="_blank"
            rel="noopener noreferrer"
          >
            How it works
          </a>
        </li>
        <li className="p-list__item">
          <a
            className="p-link--external"
            href="https://discourse.jujucharms.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Discourse
          </a>
        </li>
        <li className="p-list__item">
          <a className="p-link--external" href="https://jaas.ai/docs/">
            Docs
          </a>
        </li>
      </ul>
      <ul className="p-list is-internal">
        {pages.map(navItem => (
          <li
            key={navItem.path}
            className={classNames("p-list__item", {
              "is-selected": currentLocation === navItem.path
            })}
          >
            <Link className="p-list__link" to={navItem.path}>
              {navItem.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default PrimaryNav;
