import {
  processFactory,
  processProviders,
  processFactories,
  processDecorators,
} from "../src/providers";
import { FactoryConfig, Providers, DecoratorMetadata } from "../src/types";
import { Container, injectable } from "inversify";
import {
  PreviousData,
  SubData,
  Result,
  Root,
  RootInstance,
} from "../src/token";
import { makeDecorator } from "../src/decorators";

describe("providers", () => {
  it("should process factory config correctly", async () => {
    // should call the factory
    const factoryConfig = jest.fn(() => "hello world");
    let container = new Container();

    const result = await processFactory(container, factoryConfig);
    expect(result).toBe("hello world");
    expect(factoryConfig.mock.calls.length).toBe(1);
  });

  it("should provide required dependecies correctly", async () => {
    const factory = jest.fn((prefix: string, message: string) => {
      expect(prefix).toBe("me");
      expect(message).toBe("hello world");

      return `${prefix}: ${message}`;
    });
    const factoryConfig: FactoryConfig<string> = {
      deps: () => ["prefix", "message"],
      factory,
    };

    const container = new Container();
    container.bind("prefix").toConstantValue("me");
    container.bind("message").toConstantValue("hello world");

    const result = await processFactory(container, factoryConfig);
    expect(result).toEqual("me: hello world");
  });

  it("should async process factory", async () => {
    const factory = jest.fn(() => Promise.resolve("success"));

    const container = new Container();
    const result = await processFactory(container, factory);
    expect(result).toEqual("success");
  });

  it("should async process list of factories", async () => {
    let data = await processFactories([
      () => Promise.resolve("hello"),
      {
        deps: () => [PreviousData],
        factory: (previous: string) => `${previous} world`,
      },
    ]);
    expect(data).toEqual({
      result: "hello world",
      data: ["hello", "hello world"],
    });

    // container with parent
    const container = new Container();
    container.bind("prefix").toConstantValue("me");

    data = await processFactories(
      [
        {
          deps: () => ["prefix"],
          factory: (prefix: string) => `${prefix}:`,
        },
        {
          deps: () => [PreviousData],
          factory: (prev) => `${prev} hello world`,
        },
      ],
      container
    );

    expect(data).toEqual({
      result: "me: hello world",
      data: ["me:", "me: hello world"],
    });

    // should inject previous result
    const factory = jest.fn((result: string) => {
      expect(result).toBe("hello world");
      return `result: ${result}`;
    });

    data = await processFactories([
      () => "hello world",
      { deps: () => [Result], factory },
    ]);

    expect(data).toEqual({
      result: "result: hello world",
      data: ["hello world", "result: hello world"],
    });
  });

  it("should processing list of providers correctly", async () => {
    const container = new Container();

    @injectable()
    class MyClass {}

    const StringToken = Symbol("string");
    const FactoryToken = Symbol("factory");

    let providers: Providers = [
      MyClass,
      { useValue: "hello world", token: StringToken },
      {
        token: FactoryToken,
        useFactory: {
          deps: () => [StringToken],
          factory: jest.fn((str: string) => Promise.resolve(str)),
        },
      },
    ];

    await processProviders(providers, container);

    expect(container.get(MyClass)).toBeTruthy();
    expect(container.get(MyClass)).toBeInstanceOf(MyClass);
    const inst1 = container.get(MyClass);
    expect(container.get(MyClass)).toStrictEqual(inst1);

    expect(container.get(StringToken)).toBe("hello world");
    expect(container.get(FactoryToken)).toBe("hello world");

    // should create a container
    providers = [{ useValue: "hello world", token: StringToken }];
    const customContainer = await processProviders(providers);
    expect(customContainer.get(StringToken)).toBe("hello world");
  });

  describe("processing decorator", () => {
    const CLASS = Symbol("class");
    const SUB = Symbol("sub");
    const metadatas: DecoratorMetadata = {
      rootMetadata: CLASS,
      subMetadata: SUB,
    };

    let Decorator;
    beforeEach(() => {
      Decorator = makeDecorator(
        {
          on: ["class", "method"],
          callback: () => ({
            deps: () => [PreviousData],
            factory: (prev) => `${prev} factory`,
          }),
        },
        metadatas
      );
    });

    it("should provide target and target instance", async () => {
      const factoryMock = jest.fn((root, rootInstance) => {
        expect(root).toBeTruthy();
        expect(rootInstance).toBeTruthy();
        expect(root).toBe(Foo);
        expect(rootInstance).toBeInstanceOf(Foo);
      });

      const Decorator = makeDecorator(
        {
          on: ["class"],
          callback: () => ({
            deps: () => [Root, RootInstance],
            factory: factoryMock,
          }),
        },
        metadatas
      );

      @Decorator
      class Foo {}

      await processDecorators(Foo, metadatas, undefined, {
        makeInstance: true,
      });
      expect(factoryMock).toBeCalled();
    });

    it("should processing decorator factory correctly", async () => {
      const ClassDecorator = makeDecorator(
        {
          on: "class",
          callback: () => ({
            deps: () => [SubData],
            factory: (sub) => sub,
          }),
        },
        { rootMetadata: CLASS, subMetadata: SUB }
      );

      @ClassDecorator
      @Decorator
      class MyClass {
        @Decorator
        prop;

        @Decorator
        @Decorator
        method() {}
      }

      const data = await processDecorators(MyClass, {
        rootMetadata: CLASS,
        subMetadata: SUB,
      });
      const sub = { method: [" factory", " factory factory"] };
      const root = [" factory", { ...sub }];

      expect(data).toEqual({ result: { ...sub }, data: { root, sub } });

      // should provide outside key
      const container = new Container();
      container.bind("hello").toConstantValue("hello");

      const HelloDecorator = makeDecorator(
        {
          on: "class",
          callback: () => ({
            deps: () => ["hello"],
            factory: (hello: string) => hello,
          }),
        },
        { rootMetadata: CLASS, subMetadata: SUB }
      );

      @HelloDecorator
      class HelloClass {}

      const helloData = await processDecorators(
        HelloClass,
        {
          rootMetadata: CLASS,
          subMetadata: SUB,
        },
        container
      );

      expect(helloData).toEqual({
        result: "hello",
        data: { root: ["hello"], sub: {} },
      });
    });
  });
});
