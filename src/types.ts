// factory is a function which return configuration stack
export type Factory<T> =
  | ((...args: any[]) => T)
  | ((...args: any[]) => Promise<T>);

/**
 * factory config use for making decorators
 * it required a factory function, and optionally can request some dependecies
 * dependecies inject will be factory function arguments
 */
export type FactoryConfig<T> =
  | {
      deps: () => any[]; // request list of dependecies
      factory: Factory<T>;
    }
  | Factory<T>;

/**
 * configuration for customize make decorator
 */
export interface DecoratorConfig<T> {
  // which type of decorators is this.
  // definition by a array, for it can be multiple types
  on: ("class" | "method" | "property")[];
  // callback provide information about decorator for customizer
  // callback should return a factory config to store on metadata to later processing
  callback: (info: DecoratorInfo) => FactoryConfig<T>;
}

export interface DecoratorInfo {
  // where is the decotor deploy on
  // parameter and method will return both as method
  on: "class" | "method" | "property";
  // target object will be decorate
  target: any;
  // if decorator use on method (parameter) or property
  // this will be method or property name
  key?: string;
  // if decorator use on method (parameter)
  // class method information about descriptor
  descriptor?: PropertyDescriptor;
  // if decorator use on property
  // this will be property type
  type?: any;
  // if decorator use on parameter
  // this will be paramter type
  paramType?: any;
  // if decorator use on method (parameter)
  // this will be the method return type
  returnType?: any;
}
