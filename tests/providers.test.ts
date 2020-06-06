import { processFactory, processProviders } from "../src/providers";
import { FactoryConfig, Providers } from "../src/types";
import { Container, injectable } from "inversify";

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

  it("should processing list of providers correctly", async () => {
    const container = new Container();

    @injectable()
    class MyClass {}

    const StringToken = Symbol("string");
    const FactoryToken = Symbol("factory");

    const providers: Providers = [
      MyClass,
      { useValue: "hello world", token: StringToken },
      {
        token: FactoryToken,
        useFactory: {
          deps: () => [StringToken],
          factory: jest.fn((str: string) => {
            return Promise.resolve(str);
          }),
        },
      },
    ];

    await processProviders(container, providers);

    expect(container.get(MyClass)).toBeTruthy();
    expect(container.get(MyClass)).toBeInstanceOf(MyClass);
    const inst1 = container.get(MyClass);
    expect(container.get(MyClass)).toStrictEqual(inst1);

    expect(container.get(StringToken)).toBe("hello world");
    expect(container.get(FactoryToken)).toBe("hello world");
  });
});
