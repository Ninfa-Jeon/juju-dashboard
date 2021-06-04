import { useState, useEffect } from "react";
import { useStore, useSelector, useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import { Formik, Field, Form } from "formik";
import cloneDeep from "clone-deep";
import useModelStatus from "hooks/useModelStatus";
import { setModelSharingPermissions } from "juju";
import { motion } from "framer-motion";

import { getModelControllerDataByUUID } from "app/selectors";

import Aside from "components/Aside/Aside";
import PanelHeader from "components/PanelHeader/PanelHeader";
import ShareCard from "components/ShareCard/ShareCard";

import type { EntityDetailsRoute } from "components/Routes/Routes";
import type { TSFixMe } from "types";

import "./share-model.scss";

type ModelControllerData = {
  additionalController: boolean;
  path: string;
  url: string;
  uuid: string;
  version: string;
};

type User = {
  user: string;
  "display-name": string;
  "last-connection": string | null;
  access: string;
};

type UsersAccess = {
  [key: string]: string;
};

type UserAccess = {
  name: string;
  access: string | null;
};

type DefaultRootState = {};

export default function ShareModel() {
  const { modelName } = useParams<EntityDetailsRoute>();
  const dispatch = useDispatch();
  const store = useStore();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [usersAccess, setUsersAccess] = useState<UsersAccess>({});
  const [newUserFormSubmitActive, setNewUserFormSubmitActive] = useState(false);

  const modelStatusData: TSFixMe = useModelStatus() || null;

  const controllerUUID = modelStatusData?.info?.["controller-uuid"];
  const modelUUID = modelStatusData?.info.uuid;

  const modelControllerDataByUUID =
    getModelControllerDataByUUID(controllerUUID);

  const modelControllerData: ModelControllerData = useSelector(
    modelControllerDataByUUID as (
      state: DefaultRootState
    ) => ModelControllerData
  );

  const modelControllerURL = modelControllerData?.url;
  const users = modelStatusData?.info?.users;

  useEffect(() => {
    const clonedUserAccess: UsersAccess | null = cloneDeep(usersAccess);

    users?.forEach((user: User) => {
      const displayName = user["user"];

      if (clonedUserAccess) {
        clonedUserAccess[displayName] = user?.["access"];
        setUsersAccess(clonedUserAccess);
      }
    });
  }, [users]); // eslint-disable-line react-hooks/exhaustive-deps

  const isOwner = (user: string) => {
    return user === modelStatusData?.info["owner-tag"].replace("user-", "");
  };

  const userAlreadyHasAccess = (userName: string, users: User[]) => {
    return users.some((userEntry: User) => userEntry.user === userName);
  };

  const handleValidateNewUser = (values: TSFixMe) => {
    setNewUserFormSubmitActive(
      values.username !== "" && values.accessLevel !== null
    );
  };

  const handleAccessSelectChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    userName: string
  ) => {
    const clonedUserAccess = cloneDeep(usersAccess);
    if (clonedUserAccess) {
      clonedUserAccess[userName] = e.target.value;
    }
    setUsersAccess(clonedUserAccess);
    const updatedUserAccess: UserAccess = {
      name: userName,
      access: e.target.value,
    };
    const response = await setModelSharingPermissions(
      modelControllerURL,
      modelUUID,
      store.getState,
      updatedUserAccess,
      usersAccess?.[userName],
      "grant",
      dispatch
    );
    const error = response?.results[0]?.error?.message;
    if (error) {
      setErrorMsg(error);
    }
  };

  const handleRemoveUser = async (userName: string) => {
    const userAccess: UserAccess = { name: userName, access: null };

    await setModelSharingPermissions(
      modelControllerURL,
      modelUUID,
      store.getState,
      userAccess,
      usersAccess?.[userName],
      "revoke",
      dispatch
    );
  };

  const handleNewUserFormSubmit = async (
    values: UserAccess,
    resetForm: () => void
  ) => {
    setErrorMsg(null);

    if (userAlreadyHasAccess(values.name, users)) {
      setErrorMsg(`'${values.name}' already has access to this model.`);
    }

    const response = await setModelSharingPermissions(
      modelControllerURL,
      modelUUID,
      store.getState,
      {
        name: values.name,
        access: values.access,
      },
      undefined,
      "grant",
      dispatch
    );
    const error = response?.results[0]?.error?.message;
    if (error) {
      setErrorMsg(error);
    } else {
      resetForm();
    }
  };

  return (
    <Aside loading={!modelStatusData} isSplit={true}>
      <motion.div layout className="p-panel share-model">
        <PanelHeader
          title={
            <div className="title-wrapper">
              <i className="p-icon--share"></i>
              <h4>Share {modelName}</h4>
            </div>
          }
        />
        {errorMsg && (
          <div className="p-notification--negative">
            <p className="p-notification__response" role="status">
              <span className="p-notification__status">Error:</span>
              {errorMsg}
            </p>
            <button
              className="p-icon--close"
              aria-label="Close notification"
              aria-controls="notification"
              onClick={() => {
                setErrorMsg(null);
              }}
            >
              Close
            </button>
          </div>
        )}
        <div className="p-panel__content aside-split-wrapper">
          <div className="aside-split-col">
            <h5>Sharing with:</h5>
            {users?.map((userObj: User) => {
              const userName = userObj["user"];
              const lastConnected = userObj["last-connection"];
              return (
                <ShareCard
                  key={userName}
                  userName={userName}
                  lastConnected={lastConnected}
                  access={usersAccess?.[userName]}
                  isOwner={isOwner(userName)}
                  removeUser={handleRemoveUser}
                  accessSelectChange={handleAccessSelectChange}
                />
              );
            })}
          </div>
          <div className="aside-split-col">
            <h4>Add new user</h4>
            <Formik
              initialValues={{
                name: "",
                access: "read",
              }}
              validate={(values) => handleValidateNewUser(values)}
              onSubmit={(values, { resetForm }) =>
                handleNewUserFormSubmit(values, resetForm)
              }
            >
              <Form>
                <label className="is-required" htmlFor="username">
                  Username
                </label>
                <Field
                  required
                  type="text"
                  placeholder="Username"
                  name="name"
                />
                <label className="is-required" htmlFor=" ">
                  Access level
                </label>
                <div className="p-radio">
                  <label htmlFor="accessRead">
                    <Field
                      id="accessRead"
                      type="radio"
                      className="p-radio__input"
                      name="access"
                      aria-labelledby="Read"
                      value="read"
                    />
                    <span className="p-radio__label" id="accessLevel1">
                      read
                      <span className="help-text">
                        A user can view the state of the model
                      </span>
                    </span>
                  </label>
                </div>

                <div className="p-radio">
                  <label htmlFor="accessWrite">
                    <Field
                      id="accessWrite"
                      type="radio"
                      className="p-radio__input"
                      name="access"
                      aria-labelledby="Write"
                      value="write"
                    />
                    <span className="p-radio__label" id="accessLevel2">
                      write
                      <span className="help-text">
                        In addition to 'read' abilities, a user can
                        modify/configure models
                      </span>
                    </span>
                  </label>
                </div>

                <div className="p-radio">
                  <label htmlFor="accessAdmin">
                    <Field
                      id="accessAdmin"
                      type="radio"
                      className="p-radio__input"
                      name="access"
                      aria-labelledby="Admin"
                      value="admin"
                    />
                    <span className="p-radio__label" id="accessLevel3">
                      admin
                      <span className="help-text">
                        In addition to 'write' abilities, a user can perform
                        model upgrades and connect to machines via juju ssh.
                        Makes the user an effective model owner.
                      </span>
                    </span>
                  </label>
                </div>
                <div className="action-wrapper">
                  <button
                    className="p-button--positive"
                    type="submit"
                    disabled={!newUserFormSubmitActive}
                  >
                    Add user
                  </button>
                </div>
              </Form>
            </Formik>
          </div>
        </div>
      </motion.div>
    </Aside>
  );
}
