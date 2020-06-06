// processing all types of providers

import { Container } from "inversify";
import { FactoryConfig, Providers } from "./types";

// process a factory by factory config
// provide neccessary dependencies for factory
export async function processFactory<T>(
  container: Container,
  factoryConfig: FactoryConfig<T>
): Promise<T> {
  if (typeof factoryConfig === "function") {
    return factoryConfig();
  } else {
    const { deps, factory } = factoryConfig;

    const dependencies = deps && deps().map((dep) => container.get(dep));
    return factory(...dependencies);
  }
}

// process all type of providers
export async function processProviders(
  container: Container,
  providers: Providers
) {
  for (const provider of providers) {
    //  class
    if (typeof provider === "function") {
      container.bind(provider).toSelf();
    }

    // value
    else if ("useValue" in provider) {
      container.bind(provider.token).toConstantValue(provider.useValue);
    }

    // factory
    /* istanbul ignore else*/
    else if ("useFactory" in provider) {
      const value = await processFactory(container, provider.useFactory);
      container.bind(provider.token).toConstantValue(value);
    }
  }
}
