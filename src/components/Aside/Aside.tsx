import { ReactElement } from "react";
import classnames from "classnames";

import "./_aside.scss";

type Props = {
  children: ReactElement;
  width: "wide" | "narrow" | undefined;
  pinned: boolean;
};

export default function Aside({
  children,
  width = undefined,
  pinned = false,
}: Props) {
  return (
    <div
      className={classnames("l-aside", {
        "is-narrow": width === "narrow",
        "is-wide": width === "wide",
        "is-pinned": pinned === true,
      })}
    >
      {children}
    </div>
  );
}
