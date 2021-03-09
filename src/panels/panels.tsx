import { useQueryParam, StringParam } from "use-query-params";
import { AnimatePresence } from "framer-motion";

import ActionsPanel from "panels/ActionsPanel/ActionsPanel";
import RegisterController from "panels/RegisterController/RegisterController";

import "./_panels.scss";

export default function Panels() {
  const panelQs = useQueryParam("panel", StringParam)[0];

  const generatePanel = () => {
    switch (panelQs) {
      case "register-controller":
        return <RegisterController />;
      case "execute-action":
        return <ActionsPanel />;
      default:
        return null;
    }
  };
  return <AnimatePresence>{panelQs && generatePanel()}</AnimatePresence>;
}
