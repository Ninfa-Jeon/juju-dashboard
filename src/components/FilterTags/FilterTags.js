import React, { useState, useRef, useEffect } from "react";
import classNames from "classnames";

import "./_filter-tags.scss";

const FilterTags = () => {
  const [filterPanel, setFilterPanel] = useState(false);
  const node = useRef();

  const handleClick = e => {
    // Check if click is outside of filter panel
    if (!node.current.contains(e.target)) {
      // If so, close the panel
      setFilterPanel(false);
    }
  };

  useEffect(() => {
    // Add listener on document to capture click events
    document.addEventListener("mousedown", handleClick);
    // return function to be called when unmounted
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);

  return (
    <div className="p-filter-tags" ref={node}>
      <form>
        <input
          type="text"
          placeHolder="Filter terms"
          className="p-filter-tags__input"
          onFocus={() => setFilterPanel(true)}
        />
      </form>
      <div
        className={classNames("p-card--highlighted p-filter-panel", {
          "is-visible": filterPanel
        })}
      >
        <div className="p-filter-panel__section">
          <h4 className="p-filter-panel__heading">Owner</h4>
          <ul className="p-list p-filter-panel__list">
            <li className="p-filter-panel__item is-selected">is-team</li>
            <li className="p-filter-panel__item">dev-team</li>
            <li className="p-filter-panel__item">yellow-team</li>
          </ul>
        </div>
        <div className="p-filter-panel__section">
          <h4 className="p-filter-panel__heading">Cloud</h4>
          <ul className="p-list p-filter-panel__list">
            <li className="p-filter-panel__item">AWS</li>
            <li className="p-filter-panel__item">Google</li>
          </ul>
        </div>
        <div className="p-filter-panel__section">
          <h4 className="p-filter-panel__heading">Region</h4>
          <ul className="p-list p-filter-panel__list">
            <li className="p-filter-panel__item">eu-west-1</li>
            <li className="p-filter-panel__item">eu-west-2</li>
          </ul>
        </div>
        <div className="p-filter-panel__section">
          <h4 className="p-filter-panel__heading">Credential</h4>
          <ul className="p-list p-filter-panel__list">
            <li className="p-filter-panel__item">cred-1</li>
            <li className="p-filter-panel__item">cred-2</li>
          </ul>
        </div>
        <div className="p-filter-panel__section">
          <h4 className="p-filter-panel__heading">Controller</h4>
          <ul className="p-list p-filter-panel__list">
            <li className="p-filter-panel__item">prodstack-1</li>
            <li className="p-filter-panel__item">prodstack-2</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FilterTags;
