import { TSFixMe } from "types";

// See https://github.com/juju/juju/blob/develop/apiserver/params/multiwatcher.go
// for the Juju types for the AllWatcher responses.

export interface ModelWatcherData {
  [uuid: string]: ModelData;
}

export type AllWatcherDelta = [DeltaEntity, DeltaType, Delta];

type DeltaEntity =
  | "action"
  | "application"
  | "charm"
  | "machine"
  | "model"
  | "relation";
type DeltaType = "add" | "change" | "remove";

// XXX Type different Delta types based on the values of DeltaEntity/DeltaType.
type Delta = TSFixMe;

interface ModelData {
  applications: Applications;
}

interface Applications {
  name: string;
}

// Delta Types

type IPAddress = string;
type UnitId = string;
type NumberAsString = string;
type Life = "alive" | string; // xxx what other values for life are there?
type DeprecatedString = string;

interface ActionChangeDelta {
  "model-uuid": string;
  id: NumberAsString;
  receiver: UnitId;
  name: string;
  status: "failed" | string; // xxx what are the other values?
  message: string;
  results: ActionResult;
  enqueued: string; // xxx 2021-07-20T16:21:28Z what type?
  started: string; // xxx 2021-07-20T16:21:28Z what type?
  completed: string; // xxx 2021-07-20T16:21:28Z what type?
}

interface ActionResult {
  Code: NumberAsString;
  Stderr: string;
  // xxx what other keys are possible?
}
interface MachineChangeDelta {
  addresses: AddressData | null;
  "agent-status": Status;
  "container-type": string; // xxx typically empty? What can this contain?
  "hardware-characteristics": HardwareCharacteristics | undefined;
  "has-vote": boolean;
  id: NumberAsString;
  "instance-id": string;
  "instance-status": Status;
  jobs: string[]; // xxx [ "JobHostUnits" ] what else can this be?
  life: Life;
  "model-uuid": string;
  series: string;
  "supported-containers": null; // xxx what are other valid values for this?
  "supported-containers-known": boolean;
  "wants-vote": boolean;
}

interface AddressData {
  value: IPAddress;
  type: "ipv4" | string;
  scope: "public" | "local-cloud" | "local-cloud" | "local-machine" | string;
}

interface Status {
  current: "allocating" | "pending" | "running" | "waiting" | string; // xxx what are the other statuses?
  message: string;
  since: string; // xxx 2021-07-26T20:29:24.018591937Z what date type is this?
  version: string; // xxx typically empty? What can this contain?
}

interface HardwareCharacteristics {
  arch: string;
  mem: number;
  "root-disk": number;
  "cpu-cores": number;
  "cpu-power": number;
  "availability-zone": string;
}

interface UnitChangeDelta {
  "agent-status": Status;
  "charm-url": string; // xxx will this no longer be populated with CH?
  "machine-id": NumberAsString;
  "model-uuid": string;
  "port-ranges": null; // xxx what do real values look like?
  "private-address": DeprecatedString;
  "public-address": DeprecatedString;
  "workload-status": Status;
  application: string;
  life: Life;
  name: string;
  ports: string[]; // xxx or is it an array of numbers?
  principal: string; // xxx possible spelling error? What does this mean?
  series: string;
  subordinate: boolean;
}
