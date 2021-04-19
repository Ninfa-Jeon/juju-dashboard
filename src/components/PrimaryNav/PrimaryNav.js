import { useSelector } from "react-redux";
import { NavLink } from "react-router-dom";

import { getGroupedModelStatusCounts, getAppVersion } from "app/selectors";

import Logo from "components/Logo/Logo";
import UserMenu from "components/UserMenu/UserMenu";

// Style imports
import "./_primary-nav.scss";

const pages = [
  {
    label: "Models",
    path: "/models",
    icon: "models",
  },
  {
    label: "Controllers",
    path: "/controllers",
    icon: "controllers",
  },
];

const PrimaryNav = () => {
  const { blocked } = useSelector(getGroupedModelStatusCounts);
  const appVersion = useSelector(getAppVersion);

  return (
    <nav className="p-primary-nav">
      <div className="p-primary-nav__header">
        <Logo />
      </div>

      <ul className="p-list is-internal">
        {pages.map((navItem) => (
          <li key={navItem.path} className="p-list__item">
            <NavLink
              className="p-list__link"
              isActive={(match) => {
                if (match && match.url.includes(navItem.path)) {
                  return true;
                }
              }}
              to={navItem.path}
              activeClassName="is-selected"
            >
              <i className={`p-icon--${navItem.icon} is-light`}></i>
              {navItem.label}
              {navItem.label === "Models" && blocked > 0 ? (
                <span className="entity-count">{blocked}</span>
              ) : (
                ""
              )}
            </NavLink>
          </li>
        ))}
      </ul>
      <hr className="p-primary-nav__divider" />
      <div className="p-primary-nav__bottom">
        <ul className="p-list">
          <li className="p-list__item">
            <a
              className="p-list__link"
              href="https://github.com/canonical-web-and-design/jaas-dashboard/issues/new"
              target="_blank"
              rel="noopener noreferrer"
            >
              Report a bug
            </a>
          </li>
        </ul>
      </div>
      <hr className="p-primary-nav__divider" />
      <div className="p-primary-nav__bottom">
        <ul className="p-list">
          <li className="p-list__item">
            <span className="version">Version {appVersion}</span>
            <span className="p-label--new">Beta</span>
          </li>
        </ul>
      </div>
      <UserMenu />
    </nav>
  );
};

export default PrimaryNav;
