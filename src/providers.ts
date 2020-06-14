// processing all types of providers

import { Container } from "inversify";
import {
  FactoryConfig,
  Providers,
  DecoratorMetadata,
  Constructable,
  ProcessResult,
  ProcessDecoratorOptions,
} from "./types";
import { getFactoryConfigs } from "./register";
import {
  PreviousData,
  SubData,
  Result,
  SubResult,
  Target,
  TargetInstance,
} from "./token";
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
): Promise<{ result: T | undefined; data: T[] }> {
  let data: T[] = [];
  let result: T | undefined = undefined;

  for (const factory of factoryConfigs) {
    const subContainer = await createContainer(
      [
        { token: PreviousData, useValue: data },
        { token: Result, useValue: result },
      ],
      container
    );
    // solve
    const factorydata = await processFactory(subContainer, factory);

    // push previous data
    data = [...data, factorydata];
    result = factorydata;
  }

  return { result, data };
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
  container?: Container,
  options: ProcessDecoratorOptions = {}
): Promise<ProcessResult<R, S>> {
  const factories = getFactoryConfigs<R, S>(target, metadataKeys);

  // create class container
  const rootContainer = await createContainer([], container);

  // bind target
  rootContainer.bind(Target).toConstantValue(target);
  // resolve on target instance
  if (options.makeInstance === true) {
    // make target instance
    const instance = rootContainer.resolve(target);
    // bind target instance
    rootContainer.bind(TargetInstance).toConstantValue(instance);
  }

  // solve sub factories
  const subData: { [key: string]: S[] } = {};
  const subResult: { [key: string]: S } = {};
  for (const key in factories.sub) {
    const configs = await processFactories(factories.sub[key], rootContainer);

    if (configs.data.length) subData[key] = configs.data;
    if (configs.result) subResult[key] = configs.result;
  }

  // binding sub data and sub result to root container
  rootContainer.bind(SubData).toConstantValue(subData);
  rootContainer.bind(SubResult).toConstantValue(subResult);

  // solve root factories
  const configs = await processFactories(factories.root, rootContainer);

  return {
    result: configs.result,
    data: { root: configs.data, sub: subData },
  };
}
