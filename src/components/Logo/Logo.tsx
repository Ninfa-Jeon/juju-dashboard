import { useSelector } from "react-redux";

// Image imports
import jaasText from "static/images/logo/jaas-text.svg";
import jujuText from "static/images/logo/juju-text.svg";
import logoMark from "static/images/logo/logo-mark.svg";
import { getIsJuju } from "store/general/selectors";

import "./_logo.scss";

export default function Logo() {
  const isJuju = useSelector(getIsJuju);

  return (
    <a href={isJuju ? "https://juju.is" : "https://jaas.ai"} className="logo">
      <img src={logoMark} alt="Juju logo mark" height="20" width="20" />
      <img
        className="logo__text hide-collapsed"
        src={isJuju ? jujuText : jaasText}
        height="20"
        alt="Juju logo"
      />
    </a>
  );
}
