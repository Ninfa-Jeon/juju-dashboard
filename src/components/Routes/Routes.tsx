import type { JSX } from "react";
import { Navigate, createBrowserRouter, RouterProvider } from "react-router";

import Login from "components/LogIn";
import BaseLayout from "layout/BaseLayout";
import AddModel from "pages/AddModel";
import AdvancedSearch from "pages/AdvancedSearch";
import Bootstrap from "pages/Bootstrap";
import ControllersIndex from "pages/ControllersIndex";
import Logs from "pages/Logs";
import ModelDetails from "pages/ModelDetails";
import ModelsIndex from "pages/ModelsIndex";
import PageNotFound from "pages/PageNotFound";
import PermissionsPage from "pages/Permissions";
import { getConfig, getIsJuju } from "store/general/selectors";
import { useAppSelector } from "store/store";
import urls from "urls";

const BOOTSTRAP_MODE_QUERY_KEY = "bootstrapMode";
const isBootstrapModeFromURL = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }
  const params = new URLSearchParams(window.location.search);
  return params.get(BOOTSTRAP_MODE_QUERY_KEY) === "true";
};

export function Routes(): JSX.Element {
  const config = useAppSelector(getConfig);
  const isJuju = useAppSelector(getIsJuju);

  // Check URL params directly — avoids race condition with Redux store
  // propagation where useAppSelector(getBootstrapMode) returns undefined
  // on the first render.
  if (isBootstrapModeFromURL()) {
    const bootstrapRouter = createBrowserRouter(
      [
        {
          path: "/",
          element: <Bootstrap />,
        },
        {
          path: urls.bootstrap,
          element: <Bootstrap />,
        },
        {
          path: "*",
          element: <Navigate to={urls.bootstrap} replace />,
        },
      ],
      { basename: config?.baseAppURL },
    );

    return <RouterProvider router={bootstrapRouter} />;
  }

  const authenticatedRoutes = [
    {
      path: urls.models.index,
      element: <ModelsIndex />,
    },
    {
      path: urls.models.addModel,
      element: <AddModel />,
    },
    {
      path: `${urls.model.index(null)}/*`,
      element: <ModelDetails />,
    },
    {
      path: urls.controllers,
      element: <ControllersIndex />,
    },
  ];

  // These routes are only available for JAAS and the isJuju value can't change
  // at runtime so they are excluded here.
  if (!isJuju) {
    authenticatedRoutes.push(
      {
        path: urls.logs,
        element: <Logs />,
      },
      {
        path: urls.search,
        element: <AdvancedSearch />,
      },
      {
        path: `${urls.permissions}/*`,
        element: <PermissionsPage />,
      },
    );
  }

  const router = createBrowserRouter(
    [
      {
        path: "/",
        element: <BaseLayout />,
        children: [
          {
            path: urls.index,
            element: <Navigate to={urls.models.index} />,
          },
          {
            path: "/",
            element: <Login />,
            children: authenticatedRoutes,
          },
          {
            path: "*",
            element: <PageNotFound />,
          },
        ],
      },
    ],
    { basename: config?.baseAppURL },
  );

  return <RouterProvider router={router} />;
}

export default Routes;
