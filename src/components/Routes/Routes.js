import { useEffect } from "react";
import { Route, Redirect, Switch, useLocation } from "react-router-dom";

import Login from "components/LogIn/LogIn";

import Controllers from "pages/Controllers/Controllers";
import Models from "pages/Models/Models";
import EntityDetails from "pages/EntityDetails/EntityDetails";
import Settings from "pages/Settings/Settings";
import NotFound from "pages/NotFound/NotFound";

import useAnalytics from "hooks/useAnalytics";

export const paths = {
  "/": { redirect: "/models" },
  "/models": { component: Models },
  "/models/:userName/:modelName?": { component: EntityDetails },
  "/controllers": { component: Controllers },
  "/settings": { component: Settings },
};

export function Routes() {
  const sendAnalytics = useAnalytics();
  const location = useLocation();

  useEffect(() => {
    // Send an analytics event when the URL changes.
    sendAnalytics({
      path: window.location.href.replace(window.location.origin, ""),
    });
  }, [location, sendAnalytics]);

  const routes = Object.entries(paths).map((path) => {
    const Component = path[1].component;
    if (path[1].redirect) {
      return (
        <Route key={path[0]} path={path[0]} exact>
          <Redirect to={path[1].redirect} />
        </Route>
      );
    }
    return (
      <Route key={path[0]} path={path[0]} exact>
        <Login>
          <Component />
        </Login>
      </Route>
    );
  });

  return (
    <Switch>
      {routes}
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}
