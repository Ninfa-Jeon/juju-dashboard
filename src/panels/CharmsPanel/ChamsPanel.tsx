import { Button, RadioInput } from "@canonical/react-components";
import Aside from "components/Aside/Aside";
import PanelHeader from "components/PanelHeader/PanelHeader";
import { FormEventHandler, useState } from "react";
import { useSelector } from "react-redux";
import { getCharms } from "store/juju/selectors";
import { StringParam, useQueryParams } from "use-query-params";
import "./_charms-panel.scss";

export default function CharmsPanel() {
  const [, setQuery] = useQueryParams({
    panel: StringParam,
    charm: StringParam,
  });

  const [selectedCharm, setSelectedCharm] = useState<string | null>(null);
  const charms = useSelector(getCharms());
  const handleSubmit: FormEventHandler = (e) => {
    e.preventDefault();
    setQuery({ panel: "charm-actions", charm: selectedCharm });
  };
  return (
    <Aside width="narrow">
      <div className="p-panel charms-panel">
        <PanelHeader title="Choose applications of charm:" />
        <div className="p-panel__content">
          <form
            className="p-form u-fixed-width charm-list"
            onSubmit={handleSubmit}
          >
            <div className="charm-list__items">
              {charms.map((charm) => (
                <div key={charm.url} className="p-form__group">
                  <RadioInput
                    id={charm.url}
                    label={`${charm.meta?.name} (rev: ${charm.revision})`}
                    checked={selectedCharm === charm.url}
                    onChange={() => setSelectedCharm(charm.url)}
                  />
                </div>
              ))}
            </div>
            <div className="actions-panel__drawer u-float">
              <Button type="submit" className="u-float-right">
                Next
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Aside>
  );
}
