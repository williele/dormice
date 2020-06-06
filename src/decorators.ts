import { injectable } from "inversify";
import { DecoratorConfig, DecoratorInfo, FactoryConfig } from "./types";
import { INJECTABLED } from "./metakeys";

/**
 * this function make multiple type of decorators
 * class, properties and methods or parameters
 *
 * it required factory config for later process during bootstraping
 * and a callback function for addition custom modifier
 */
export function makeDecorator<T = any>(
  config: DecoratorConfig<T>,
  callback?: (info: DecoratorInfo, config: FactoryConfig<T>) => any
) {
  return (target, key?: string, descriptor?: PropertyDescriptor) => {
    // get reflect type in metadata
    const typeInfo: Partial<DecoratorInfo> = {
      type: key && Reflect.getMetadata("design:type", target, key),
      returnType: key && Reflect.getMetadata("design:returntype", target, key),
      paramType: key && Reflect.getMetadata("design:paramtypes", target, key),
    };

    // method
    if (
      key !== undefined &&
      descriptor !== undefined &&
      config.on.includes("method")
    ) {
      const info: DecoratorInfo = {
        on: "method",
        target,
        key,
        descriptor,
        ...typeInfo,
      };

      // get factory config
      const factoryConfig = config.callback(info);

      if (callback) return callback(info, factoryConfig);
      else return;
    }

    // property
    if (
      key !== undefined &&
      descriptor === undefined &&
      config.on.includes("property")
    ) {
      const info: DecoratorInfo = {
        on: "property",
        target,
        key,
        ...typeInfo,
      };

      // get factory config
      const factoryConfig = config.callback(info);

      if (callback) return callback(info, factoryConfig);
      else return;
    }

    // class
    else if (config.on.includes("class") && typeof target === "function") {
      const info: DecoratorInfo = { on: "class", target, ...typeInfo };

      // get factory config
      const factoryConfig = config.callback(info);

      if (callback) return callback(info, factoryConfig);
      else return target;
    }
  };
}
