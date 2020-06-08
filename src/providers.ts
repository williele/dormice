// processing all types of providers

import { Container } from "inversify";
import {
  FactoryConfig,
  Providers,
  DecoratorMetadata,
  Constructable,
  ProcessResult,
} from "./types";
import { getFactoryConfigs } from "./register";
import { RootInstance, PreviousData, SubData } from "./token";
import { createContainer } from "./container";

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

/**
 * process list of factories
 */
export async function processFactories<T>(
  factoryConfigs: FactoryConfig<T>[],
  container?: Container
): Promise<T[]> {
  let result: T[] = [];
  for (const factory of factoryConfigs) {
    const subContainer = await createContainer([], container);

    // binding previous data
    subContainer.bind(PreviousData).toConstantValue(result);
    const data = await processFactory(subContainer, factory);

    // push previous data
    result = [...result, data];
  }

  return result;
}

// process all type of providers
export async function processProviders(
  providers: Providers,
  container?: Container
): Promise<Container> {
  // if no container input, then create one
  container = container || new Container();

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
  return container;
}

/**
 * processing all configs from a class decorators
 * @param decoratorFactories decorator factories config
 */
export async function processDecorators<R, S>(
  target: Constructable,
  metadataKeys: DecoratorMetadata,
  container?: Container
): Promise<ProcessResult<R, S>> {
  const factories = getFactoryConfigs<R, S>(target, metadataKeys);

  // create class container
  const rootContainer = await createContainer([], container);

  // make target instance
  const instance = rootContainer.resolve(target);
  // bind root instance
  rootContainer.bind(RootInstance).toConstantValue(instance);

  // solve sub factories
  const subData: { [key: string]: S[] } = {};
  for (const key in factories.sub) {
    subData[key] = await processFactories(factories.sub[key], rootContainer);
  }
  // binding sub data to root container
  rootContainer.bind(SubData).toConstantValue(subData);

  // solve root factories
  const rootData: R[] = await processFactories(factories.root, rootContainer);

  return {
    result: rootData[rootData.length - 1],
    data: { root: rootData, sub: subData },
  };
}
