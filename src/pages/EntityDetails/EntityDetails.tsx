import { PropsWithChildren, useEffect, useState } from "react";

import { SearchBox, Spinner, Tabs } from "@canonical/react-components";
import { useSelector, useStore } from "react-redux";
import { useParams } from "react-router-dom";
import { StringParam, useQueryParams, withDefault } from "use-query-params";

import BaseLayout from "layout/BaseLayout/BaseLayout";

import Breadcrumb from "components/Breadcrumb/Breadcrumb";
import Header from "components/Header/Header";
import SlidePanel from "components/SlidePanel/SlidePanel";
import WebCLI from "components/WebCLI/WebCLI";

import ConfigPanel from "panels/ConfigPanel/ConfigPanel";
import OffersPanel from "panels/OffersPanel/OffersPanel";
import RemoteAppsPanel from "panels/RemoteAppsPanel/RemoteAppsPanel";

import { getControllerDataByUUID } from "app/selectors";
import {
  getModelApplications,
  getModelInfo,
  getModelUUID,
} from "store/juju/selectors";

import useWindowTitle from "hooks/useWindowTitle";

import FadeIn from "animations/FadeIn";

import { getUserPass } from "store/general/selectors";
import "./_entity-details.scss";

type Props = {
  type?: string;
  onApplicationsFilter?: (query: string) => void;
};

function generatePanelContent(activePanel: string, entity: string) {
  switch (activePanel) {
    case "remoteApps":
      return <RemoteAppsPanel entity={entity} />;
    case "offers":
      return <OffersPanel entity={entity} />;
  }
}

const EntityDetails = ({
  type,
  onApplicationsFilter,
  children,
}: PropsWithChildren<Props>) => {
  const { userName, modelName } = useParams();
  const modelUUID = useSelector(getModelUUID(modelName, userName));
  const modelInfo = useSelector(getModelInfo(modelUUID));
  const applications = useSelector(getModelApplications(modelUUID));

  const [query, setQuery] = useQueryParams({
    panel: StringParam,
    entity: StringParam,
    activeView: withDefault(StringParam, "apps"),
    filterQuery: StringParam,
  });
  const [applicationsFilterQuery, setApplicationsFilterQuery] =
    useState<string>(query.filterQuery || "");

  const setActiveView = (view?: string) => {
    setQuery({ activeView: view });
  };

  const { panel: activePanel, entity, activeView } = query;
  const closePanelConfig = { panel: undefined, entity: undefined };

  const store = useStore();
  const storeState = store.getState();

  const [showWebCLI, setShowWebCLI] = useState(false);

  // In a JAAS environment the controllerUUID will be the sub controller not
  // the primary controller UUID that we connect to.
  const controllerUUID = modelInfo?.["controller-uuid"];
  // The primary controller data is the controller endpoint we actually connect
  // to. In the case of a normally bootstrapped controller this will be the
  // same as the model controller, however in a JAAS environment, this primary
  // controller will be JAAS and the model controller will be different.
  const primaryControllerData = useSelector(
    getControllerDataByUUID(controllerUUID)
  );

  useEffect(() => {
    // perform applications search when filter query has an initial value
    if (applicationsFilterQuery) {
      onApplicationsFilter?.(applicationsFilterQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let credentials = null;
  let controllerWSHost = "";
  if (primaryControllerData) {
    credentials = getUserPass(storeState, primaryControllerData[0]);
    controllerWSHost = primaryControllerData[0]
      .replace("wss://", "")
      .replace("/api", "");
  }

  const handleNavClick = (e: MouseEvent, section: string) => {
    e.preventDefault();
    (e.target as HTMLAnchorElement)?.scrollIntoView({
      behavior: "smooth",
      block: "end",
      inline: "nearest",
    });
    setActiveView(section);
  };

  useEffect(() => {
    // XXX Remove me once we have the 2.9 build.
    if (modelInfo && modelInfo?.version.indexOf("2.9") !== -1) {
      // The Web CLI is only available in Juju controller versions 2.9 and
      // above. This will allow us to only show the shell on multi-controller
      // setups with different versions where the correct controller version
      // is available.
      setShowWebCLI(true);
    }
  }, [modelInfo]);

  useWindowTitle(modelInfo?.name ? `Model: ${modelInfo?.name}` : "...");

  const generateActivePanel = () => {
    if (activePanel === "config") {
      const charm = entity ? applications?.[entity]?.["charm-url"] : null;
      if (!entity || !charm) {
        return null;
      }
      return (
        <ConfigPanel
          appName={entity}
          charm={charm}
          modelUUID={modelUUID}
          onClose={() => setQuery(closePanelConfig)}
        />
      );
    } else if (activePanel === "remoteApps" || activePanel === "offers") {
      return (
        <SlidePanel
          isActive={activePanel}
          onClose={() => setQuery(closePanelConfig)}
          isLoading={!entity}
          className={`${activePanel}-panel`}
        >
          {entity ? generatePanelContent(activePanel, entity) : null}
        </SlidePanel>
      );
    }
  };

  const generateTabItems = () => {
    let items = [
      {
        active: activeView === "apps",
        label: "Applications",
        onClick: (e: MouseEvent) => handleNavClick(e, "apps"),
      },
      {
        active: activeView === "integrations",
        label: "Integrations",
        onClick: (e: MouseEvent) => handleNavClick(e, "integrations"),
      },
      {
        active: activeView === "action-logs",
        label: "Action Logs",
        onClick: (e: MouseEvent) => handleNavClick(e, "action-logs"),
      },
    ];

    if (modelInfo?.type !== "kubernetes") {
      items.push({
        active: activeView === "machines",
        label: "Machines",
        onClick: (e: MouseEvent) => handleNavClick(e, "machines"),
      });
    }

    return items;
  };

  const handleFilterSubmit = () => {
    setQuery({ filterQuery: applicationsFilterQuery });
    onApplicationsFilter?.(applicationsFilterQuery);
  };
  return (
    <BaseLayout>
      <Header>
        <div className="entity-details__header">
          <Breadcrumb />
          <div
            className="entity-details__view-selector"
            data-testid="view-selector"
          >
            {modelInfo && type === "model" && (
              <Tabs links={generateTabItems()} />
            )}
          </div>
          {activeView === "apps" && (
            <SearchBox
              className="u-no-margin"
              placeholder="Filter applications"
              onKeyDown={(e) => {
                if (e.code === "Enter") handleFilterSubmit();
              }}
              onSearch={handleFilterSubmit}
              externallyControlled
              value={applicationsFilterQuery}
              onChange={(v) => setApplicationsFilterQuery(v)}
            />
          )}
        </div>
      </Header>
      {!modelInfo ? (
        <div className="entity-details__loading" data-testid="loading-spinner">
          <Spinner />
        </div>
      ) : (
        <FadeIn isActive={!!modelInfo}>
          <div className="l-content">
            <div className={`entity-details entity-details__${type}`}>
              <>
                {children}
                {generateActivePanel()}
              </>
            </div>
          </div>
        </FadeIn>
      )}
      {showWebCLI && (
        <WebCLI
          controllerWSHost={controllerWSHost}
          credentials={credentials}
          modelUUID={modelUUID}
        />
      )}
    </BaseLayout>
  );
};

export default EntityDetails;
