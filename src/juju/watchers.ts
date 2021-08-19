import mergeWith from "lodash.mergewith";

import type {
  AllWatcherDelta,
  ApplicationData,
  DeltaMessageData,
  ModelData,
  ModelWatcherData,
} from "./types";

import {
  DeltaChangeTypes,
  DeltaEntityTypes,
  ReduxDeltaEntityTypes,
} from "./types";

function generateModelWatcherBase(): ModelData {
  return {
    actions: {},
    applications: {},
    charms: {},
    machines: {},
    model: {
      "cloud-tag": "",
      "controller-uuid": "",
      "is-controller": false,
      "model-uuid": "",
      config: {},
      constraints: {},
      life: "",
      name: "",
      owner: "",
      region: "",
      sla: {
        level: "",
        owner: "",
      },
      status: {
        current: "",
        message: "",
        since: "",
        version: "",
      },
      type: "",
      version: "",
    },
    relations: {},
    units: {},
  };
}

function _processDelta(
  actionType: string,
  delta: DeltaMessageData,
  modelData: ModelData,
  entityType: ReduxDeltaEntityTypes,
  key: string
): void {
  if (actionType === DeltaChangeTypes.CHANGE) {
    const formatted = {
      [key]: delta,
    };
    mergeWith(modelData[entityType], formatted);
  } else if (
    actionType === DeltaChangeTypes.REMOVE &&
    entityType !== ReduxDeltaEntityTypes.MODEL
  ) {
    delete modelData[entityType][key];
  }
}

export function processDeltas(
  modelWatcherData: ModelWatcherData,
  deltas: AllWatcherDelta[]
) {
  if (!deltas) {
    return;
  }
  deltas.forEach((delta) => {
    // Delta is in the format of [entityType, actionType, data].
    const modelUUID = delta[2]["model-uuid"];
    if (!modelWatcherData[modelUUID]) {
      modelWatcherData[modelUUID] = generateModelWatcherBase();
    }
    const modelData = modelWatcherData[modelUUID];
    const _process = _processDelta.bind(null, delta[1], delta[2], modelData);
    if (delta[0] === DeltaEntityTypes.ACTION) {
      _process(ReduxDeltaEntityTypes.ACTIONS, delta[2].id);
    } else if (delta[0] === DeltaEntityTypes.APPLICATION) {
      const formatted: ApplicationData = {
        [delta[2].name]: delta[2],
      };
      if (formatted[delta[2].name]["unit-count"] === undefined) {
        formatted[delta[2].name]["unit-count"] = 0;
      }
      mergeWith(modelData[ReduxDeltaEntityTypes.APPLICATIONS], formatted);
    } else if (delta[0] === DeltaEntityTypes.CHARM) {
      _process(ReduxDeltaEntityTypes.CHARMS, delta[2]["charm-url"]);
    } else if (delta[0] === DeltaEntityTypes.MACHINE) {
      _process(ReduxDeltaEntityTypes.MACHINES, delta[2].id);
    } else if (delta[0] === DeltaEntityTypes.MODEL) {
      if (delta[1] === DeltaChangeTypes.CHANGE) {
        mergeWith(modelWatcherData[modelUUID].model, delta[2]);
      }
    } else if (delta[0] === DeltaEntityTypes.RELATION) {
      _process(ReduxDeltaEntityTypes.RELATIONS, delta[2].key);
    } else if (delta[0] === DeltaEntityTypes.UNIT) {
      _process(ReduxDeltaEntityTypes.UNITS, delta[2].name);
      const applicationUnitCounts: { [key: string]: number } = {};
      // We loop through the full modelData units list every time there is a
      // unit delta so that we don't have to keep reference to the delta type
      // when adding and removing units to other applications. At the time
      // of writing this does not appear to be a performance issue but something
      // to keep an eye on for those with many hundreds of units.
      Object.entries(modelData.units).forEach(([key, value]) => {
        const applicationName = key.split("/")[0];
        if (applicationUnitCounts[applicationName] === undefined) {
          applicationUnitCounts[applicationName] = 0;
        }
        applicationUnitCounts[applicationName] += 1;
      });
      Object.entries(applicationUnitCounts).forEach(
        ([applicationName, count]) => {
          if (!modelData.applications[applicationName]) {
            // @ts-ignore
            modelData.applications[applicationName] = {};
          }
          modelData.applications[applicationName]["unit-count"] = count;
        }
      );
    }
  });
  return modelWatcherData;
}
