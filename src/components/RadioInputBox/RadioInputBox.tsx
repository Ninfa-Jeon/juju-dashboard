import { useEffect, useState, ReactNode } from "react";
import classnames from "classnames";

import type {
  ActionOptions,
  SetSelectedAction,
} from "panels/ActionsPanel/ActionsPanel";

import "./_radio-input-box.scss";

type Props = {
  name: string;
  description: string;
  options: ActionOptions;
  selectedAction: string | undefined;
  onSelect: SetSelectedAction;
};

export default function RadioInputBox({
  name,
  description,
  options,
  selectedAction,
  onSelect,
}: Props): JSX.Element {
  const [opened, setOpened] = useState<boolean>(false);

  useEffect(() => {
    setOpened(selectedAction === name);
  }, [selectedAction, name]);

  const handleSelect = () => {
    onSelect(name);
  };
  const labelId = `actionRadio-${name}`;

  const generateDescription = (description: string): ReactNode => {
    // 30 is a magic number, the width of the available text area of the field
    // If the width of the actions area increases then this number will need
    // to be adjusted accordingly.
    if (description.length > 30) {
      return (
        <details className="radio-input-box__details">
          <summary>
            <span>{description}</span>
            &nbsp;
          </summary>
          <span>{description}</span>
        </details>
      );
    }
    return description;
  };

  const generateOptions = (options: ActionOptions): JSX.Element => {
    return (
      <form>
        {options.map((option) => {
          const inputKey = `${option.name}Input`;
          return (
            <>
              <label
                className={classnames("radio-input-box__label", {
                  "radio-input-box__label--required": option.required,
                })}
                htmlFor={inputKey}
              >
                {option.name}
              </label>
              <input
                className="radio-input-box__input"
                type="text"
                id={inputKey}
                name={inputKey}
              ></input>
              {generateDescription(option.description)}
            </>
          );
        })}
      </form>
    );
  };

  return (
    <div className="radio-input-box" aria-expanded={opened}>
      <label className="p-radio radio-input-box__label">
        <input
          type="radio"
          className="p-radio__input"
          name="actionRadioSelector"
          aria-labelledby={labelId}
          onClick={handleSelect}
          onChange={handleSelect}
        />
        <span className="p-radio__label" id={labelId}>
          {name}
        </span>
      </label>
      <div className="radio-input-box__content">
        <div className="radio-input-box__description">{description}</div>
        <div className="radio-input-box__options">
          {generateOptions(options)}
        </div>
      </div>
    </div>
  );
}
