import produce from "immer";

import { actionsList } from "./actions";

export default function jujuReducers(state = {}, action) {
  return produce(state, draftState => {
    switch (action.type) {
      case actionsList.updateModelList:
        const modelList = action.payload.userModels.map(model => {
          return {
            lastConnection: model.lastConnection,
            name: model.model.name,
            ownerTag: model.model.ownerTag,
            type: model.model.type,
            uuid: model.model.uuid
          };
        });
        draftState.models = { items: modelList };
        break;
    }
  });
}
