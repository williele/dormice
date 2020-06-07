// constructable class shorthand type
export type Constructable<T = any> = { new (...args): T };

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

// list of providers
export type ProviderToken = string | symbol;

export type ProviderValue = {
  token: ProviderToken;
  useValue: any;
};
export type ProviderFactory = {
  token: ProviderToken;
  useFactory: FactoryConfig<any>;
};
export type Provider = ProviderValue | ProviderFactory | Constructable;
export type Providers = Provider[];

/**
 * configuration for customize make decorator
 */
export interface DecoratorConfig<T> {
  // which type of decorators is this.
  // definition by a array, for it can be multiple types
  on: ("class" | "method" | "property" | "parameter")[];
  // callback provide information about decorator for customizer
  // callback should return a factory config to store on metadata to later processing
  callback: (info: DecoratorInfo) => FactoryConfig<T>;
}

/**
 * configuration for config metadata
 * auto store factory config into there metadata
 */
export interface DecoratorMetadata {
  // where to store class factory config
  rootMetadata?: symbol;
  // where to store property factory config
  subMetadata?: symbol;
}

/**
 * decorator factory schema
 */
export interface DecoratorFactories<R, S> {
  root: FactoryConfig<R>[];
  sub: { [key: string]: FactoryConfig<S>[] };
}

/**
 * decorator data after process factories
 */
export interface DecoratorData<R, S> {
  root: R[];
  sub: { [key: string]: S[] };
}

/**
 * decorator information use for callback to customizer
 */
export interface DecoratorInfo {
  // where is the decotor deploy on
  // parameter and method will return both as method
  on: "class" | "method" | "property" | "parameter";
  // target object will be decorate
  target: any;
  // if decorator use on method (parameter) or property
  // this will be method or property name
  key?: string;
  // if decorator use on parameter
  // paremeter info about index
  index?: number;
  // if decorator use on method
  // class method information about descriptor
  descriptor?: PropertyDescriptor;
  // if decorator use on property
  // this will be property type
  type?: any;
  // if decorator use on list method or paramter
  // this will be all paramters type of method
  paramTypes?: any;
  // if decorator use on a paramter
  // this is a type of parameter
  paramType?: any;
  // if decorator use on method (parameter)
  // this will be the method return type
  returnType?: any;
}
