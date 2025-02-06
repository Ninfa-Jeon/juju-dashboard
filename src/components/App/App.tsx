import type { LogLevelDesc } from "loglevel";
import { useEffect } from "react";
import { initialize, pageview } from "react-ga";

import ConnectionError from "components/ConnectionError";
import ErrorBoundary from "components/ErrorBoundary";
import Routes from "components/Routes";
import { getAnalyticsEnabled } from "store/general/selectors";
import { useAppSelector } from "store/store";
import { logger } from "utils/logger";

import "../../scss/index.scss";

export type Props = {
  // The level of logging to be used by the logger.
  logLevel?: LogLevelDesc;
};

function App({ logLevel = logger.levels.SILENT }: Props) {
  const isProduction = import.meta.env.PROD;
  const analyticsEnabled = useAppSelector(getAnalyticsEnabled);
  if (isProduction && analyticsEnabled) {
    initialize("UA-1018242-68");
    pageview(window.location.href.replace(window.location.origin, ""));
  }

  useEffect(() => {
    logger.setDefaultLevel(logLevel);
  }, [logLevel]);

  return (
    <ErrorBoundary>
      <ConnectionError>
        <Routes />
      </ConnectionError>
    </ErrorBoundary>
  );
}

export default App;
