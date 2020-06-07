import { makeDecorator } from "../src/decorators";
import { DecoratorInfo, DecoratorConfig, FactoryConfig } from "../src/types";
import { Container } from "inversify";

describe("decorators builder", () => {
  it("should make single target decorator correctly", () => {
    const mockFactory = () => {};
    const mockCallback = jest.fn((info: DecoratorInfo) => {
      expect(info.on).toEqual("class");
      return mockFactory;
    });

    const Decorator = makeDecorator({
      on: ["class"],
      callback: mockCallback
    });

    @Decorator
    @Decorator
    class MyClass {}

    expect(mockCallback.mock.calls.length).toBe(2);
    // should injectable
    const container = new Container();
    container.bind(MyClass).toSelf();
    const inst = container.get(MyClass);
    expect(container.get(MyClass)).toStrictEqual(inst);
  });

  it("should make multiple targets decorator correctly", () => {
    const mockFactory = () => {};
    const mockCallback = jest.fn((info: DecoratorInfo) => {
      expect(["class", "method"]).toContainEqual(info.on);
      return mockFactory;
    });

    const Decorator = makeDecorator({
      on: ["class", "method"],
      callback: mockCallback
    });

    @Decorator
    class MyClass {
      @Decorator
      prop: string;

      @Decorator
      @Decorator
      method(@Decorator foo: string) {}
    }

    // ignore properties
    expect(mockCallback.mock.calls.length).toBe(3);
  });

  it("should make decorator for all target correctly", () => {
    const ROOT = Symbol("root");
    const SUB = Symbol("sub");

    const mockFactory = () => {};
    const mockCallback = jest.fn((info: DecoratorInfo) => {
      expect(["class", "method", "property", "parameter"]).toContain(info.on);
      if (info.on === "parameter") {
        expect(info.paramType).toBe(String);
      }
      return mockFactory;
    });
    const Decorator = makeDecorator(
      {
        on: ["class", "property", "method", "parameter"],
        callback: mockCallback
      },
      { rootMetadata: ROOT, subMetadata: SUB }
    );

    @Decorator
    class MyClass {
      @Decorator
      prop: string;

      @Decorator
      method(@Decorator foo: string, @Decorator bar: string) {}
    }

    expect(mockCallback.mock.calls.length).toBe(5);
    expect(Reflect.getMetadata(ROOT, MyClass)).toStrictEqual([mockFactory]);
    expect(Reflect.getMetadata(SUB, MyClass)).toStrictEqual({
      prop: [mockFactory],
      method: [mockFactory, mockFactory, mockFactory]
    });
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
      callback: () => () => ({ message: "hello world" })
    });

    @Decorator
    class MyClass {
      @Decorator
      prop;
    }
  });
});
