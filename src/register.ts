import { FactoryConfig, DecoratorMetadata, DecoratorFactories } from "./types";
import { INJECTABLED } from "./metakeys";
import { injectable } from "inversify";

/**
 * registe a factory config into sub (property or method) data
 * @param target target property
 * @param key object key
 * @param metadatakey metadata key
 * @param factoryConfig factory config from make decorator
 */
export function registeSubMeta<T>(
  target,
  key: string,
  metadatakey: symbol,
  factoryConfig: FactoryConfig<T>
) {
  Object.freeze(factoryConfig);

  const registers: { [key: string]: FactoryConfig<T>[] } =
    Reflect.getMetadata(metadatakey, target) || {};
  registers[key] = registers[key] || [];
  registers[key].push(factoryConfig);

  Reflect.defineMetadata(metadatakey, registers, target);
}

/**
 * store a factory config into root metadata
 * @param target target class
 * @param metadataKey metadata key
 * @param factoryConfig factory config from make decorator
 */
export function registeRootMeta<T>(
  target,
  metadataKey: string | symbol,
  factoryConfig: FactoryConfig<T>
) {
  Object.freeze(factoryConfig);

  const registers: FactoryConfig<T>[] =
    Reflect.getMetadata(metadataKey, target) || [];
  registers.push(factoryConfig);

  // define
  Reflect.defineMetadata(metadataKey, registers, target);
}

/**
 * make target injectable if not yet
 * @param target target class
 */
export function registeInjectable(target) {
  const injectabled = Reflect.getMetadata(INJECTABLED, target) || false;
  if (!injectabled) {
    Reflect.defineMetadata(INJECTABLED, true, target);
    return injectable()(target);
  } else {
    return target;
  }
}

/**
 * get factories configs store inside target object
 * @param target target object
 * @param metadata root and sub metadata where to store factory confg
 */
export function getFactoryConfigs<R, S>(
  target,
  metadata: DecoratorMetadata
): DecoratorFactories<R, S> {
  return {
    root:
      (metadata.rootMetadata &&
        Reflect.getMetadata(metadata.rootMetadata, target)) ||
      [],
    sub:
      (metadata.subMetadata &&
        Reflect.getMetadata(metadata.subMetadata, target)) ||
      {},
  };
}
