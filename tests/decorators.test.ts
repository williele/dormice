import { makeDecorator } from "../src/decorators";
import { DecoratorInfo, DecoratorConfig, FactoryConfig } from "../src/types";

describe("decorators builder", () => {
  it("should make single target decorator correctly", () => {
    const mockFactory = () => {};
    const mockCallback = jest.fn((info: DecoratorInfo) => {
      expect(info.on).toEqual("class");
      return mockFactory;
    });

    const processCallback = jest.fn(
      (info: DecoratorInfo, factoryConfig: FactoryConfig<any>) => {
        expect(info).toBeTruthy();
        expect(factoryConfig).toBe(mockFactory);
        expect(info.on).toBe("class");
      }
    );

    const Decorator = makeDecorator(
      { on: ["class"], callback: mockCallback },
      processCallback
    );

    @Decorator
    @Decorator
    class MyClass {}

    expect(mockCallback.mock.calls.length).toBe(2);
  });

  it("should make multiple targets decorator correctly", () => {
    const mockFactory = () => {};
    const mockCallback = jest.fn((info: DecoratorInfo) => {
      expect(["class", "method"]).toContainEqual(info.on);
      return mockFactory;
    });

    const Decorator = makeDecorator({
      on: ["class", "method"],
      callback: mockCallback,
    });

    @Decorator
    class MyClass {
      @Decorator
      prop: string;

      @Decorator
      method() {}
    }

    // ignore properties
    expect(mockCallback.mock.calls.length).toBe(2);
  });

  it("should make decorator for all target correctly", () => {
    const mockFactory = () => {};
    const mockCallback = jest.fn((info: DecoratorInfo) => {
      expect(["class", "method", "property"]).toContain(info.on);
      return mockFactory;
    });
    const processCallback = jest.fn(
      (info: DecoratorInfo, factoryConfig: FactoryConfig<any>) => {
        expect(factoryConfig).toBe(mockFactory);
        expect(info).toBeTruthy();
      }
    );

    const Decorator = makeDecorator(
      { on: ["class", "property", "method"], callback: mockCallback },
      processCallback
    );

    @Decorator
    class MyClass {
      @Decorator
      prop: string;

      @Decorator
      method() {}
    }

    expect(mockCallback.mock.calls.length).toBe(3);
    expect(processCallback.mock.calls.length).toBe(3);
  });

  it("should make multistep decorator work corretly", () => {
    interface Special {
      message: string;
    }

    function makeSpecialDecorator(config: DecoratorConfig<Special>) {
      return makeDecorator(config);
    }

    const Decorator = makeSpecialDecorator({
      on: ["class", "property"],
      callback: () => () => ({ message: "hello world" }),
    });

    @Decorator
    class MyClass {
      @Decorator
      prop;
    }
  });
});
