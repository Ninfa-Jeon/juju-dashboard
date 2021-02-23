import Header from "components/Header/Header";
import BaseLayout from "layout/BaseLayout/BaseLayout";

import FadeIn from "animations/FadeIn";

import useLocalStorage from "hooks/useLocalStorage";
import useWindowTitle from "hooks/useWindowTitle";

import "./settings.scss";

export default function Settings() {
  useWindowTitle("Settings");

  const [disableAnalytics, setDisableAnalytics] = useLocalStorage(
    "disableAnalytics",
    false
  );

  return (
    <BaseLayout>
      <Header>
        <span className="l-content settings__header">Settings</span>
      </Header>
      <FadeIn isActive={true}>
        <div className="l-content settings">
          <div className="settings__toggles">
            <div className="settings__toggles-group">
              <label>
                Disable analytics
                <input
                  type="checkbox"
                  className="p-switch"
                  defaultChecked={disableAnalytics}
                  onChange={() => {
                    setDisableAnalytics(!disableAnalytics);
                  }}
                />
                <div className="p-switch__slider"></div>
              </label>
              <div className="settings__toggles-info">
                You will need to refresh your browser for this setting to take
                effect.
              </div>
            </div>
          </div>
        </div>
      </FadeIn>
    </BaseLayout>
  );
}
