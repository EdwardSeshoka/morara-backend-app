import {
  loadRuntimeEnvironmentConfiguration,
  type RuntimeEnvironmentConfiguration
} from "./EnvironmentResolver.js";

export type Env = RuntimeEnvironmentConfiguration;

export function loadEnv(): Env {
  return loadRuntimeEnvironmentConfiguration();
}
