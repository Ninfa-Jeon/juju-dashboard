import { execSync } from "child_process";

import {
  type Resource,
  CloudAccessTypes,
  ModelAccessTypes,
  ResourceType,
} from "../fixtures/setup";

export class JujuHelpers {
  private cleanupStack: Resource[];

  constructor(cleanupStack?: Resource[]) {
    this.cleanupStack = cleanupStack || [];
  }

  async removeModel(
    modelName: string,
    owner: string | undefined = process.env.USERNAME,
  ) {
    execSync(`juju destroy-model ${owner}/${modelName} --force --no-prompt`);
  }

  async removeUser(userName: string) {
    execSync(`juju remove-user ${userName} -y`);
  }

  async revokeCloud(userName: string, accessType: string | CloudAccessTypes) {
    execSync(
      `juju revoke-cloud ${userName} ${accessType} ${process.env.PROVIDER}`,
    );
  }

  async addToCleanupStack(
    resourceName: string,
    type: ResourceType,
    owner: string | undefined = process.env.USERNAME,
  ) {
    this.cleanupStack.push({ resourceName, type, owner });
  }

  async addModel(
    modelName: string,
    owner: string | undefined = process.env.USERNAME,
  ) {
    execSync(`juju add-model ${modelName}`);
    await this.addToCleanupStack(modelName, ResourceType.MODEL, owner);
  }

  async addUser(userName: string) {
    execSync(
      `juju add-user --controller ${process.env.CONTROLLER_NAME} ${userName}`,
    );
    await this.addToCleanupStack(userName, ResourceType.USER, "");
    execSync(
      `{ echo password2; echo password2; } | juju change-user-password ${userName}`,
    );
  }

  async grantCloud(userName: string, accessType: CloudAccessTypes) {
    execSync(
      `juju grant-cloud ${userName} ${accessType} ${process.env.PROVIDER}`,
    );
    await this.addToCleanupStack(accessType, ResourceType.CLOUD, userName);
  }

  async jujuLogout() {
    execSync("juju logout");
  }

  async jujuLogin(
    userName: string | undefined = process.env.USERNAME,
    password: string | undefined = process.env.PASSWORD,
  ) {
    if (!userName || !password) {
      throw new Error("Cannot login without credentials");
    }
    execSync(`echo ${password} | juju login -u ${userName} --no-prompt`);
  }

  async adminLogin() {
    await this.jujuLogout();
    await this.jujuLogin();
    execSync("juju switch controller");
  }

  async addCredential() {
    execSync(
      `juju add-credential ${process.env.PROVIDER} -f e2e/helpers/dummy-credentials.yaml -c ${process.env.CONTROLLER_NAME}`,
    );
  }

  async grantModelAccess(
    accessType: ModelAccessTypes,
    modelName: string,
    userName: string | undefined = process.env.USERNAME,
  ) {
    if (!userName) {
      throw new Error("Cannot login without username");
    }
    execSync(`juju grant ${userName} ${accessType} ${modelName}`);
  }

  async addSharedModel(modelName: string, userName: string) {
    await this.addUser(userName);
    await this.grantCloud(userName, CloudAccessTypes.ADD_MODEL);
    await this.jujuLogout();
    await this.jujuLogin(userName, "password2");
    await this.addCredential();
    await this.addModel(modelName, userName);
    await this.grantModelAccess(ModelAccessTypes.READ, modelName);
    await this.adminLogin();
  }

  async cleanup() {
    console.log("Running Juju cleanup...");
    await this.adminLogin();

    while (this.cleanupStack.length > 0) {
      const resource = this.cleanupStack.pop();
      if (resource) {
        const { resourceName, type, owner = "" } = resource;
        console.log(`Removing Juju ${type}: ${resourceName}`);
        try {
          if (type === ResourceType.MODEL) {
            await this.removeModel(resourceName, owner);
          } else if (type === ResourceType.USER) {
            await this.removeUser(resourceName);
          } else if (type === ResourceType.CLOUD) {
            await this.revokeCloud(owner, resourceName);
          }
        } catch (error) {
          console.warn(`Error removing ${type} ${resourceName}:`, error);
        }
      }
    }
  }
}
