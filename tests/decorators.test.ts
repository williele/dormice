import { makeDecorator } from "../src/decorators";
import { DecoratorInfo, DecoratorConfig } from "../src/types";
import { Container } from "inversify";
import { processDecorators } from "../src/providers";
import { Result } from "../src/token";

describe("decorators builder", () => {
  it("should make single target decorator correctly", () => {
    const mockFactory = () => {};
    const mockCallback = jest.fn((info: DecoratorInfo) => {
      expect(info.on).toEqual("class");
      return mockFactory;
    });

    const Decorator = makeDecorator({
      on: ["class"],
      callback: mockCallback,
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
      callback: mockCallback,
    });

    @Decorator
    class MyClass {
      @Decorator
      prop: string;

      @Decorator
      @Decorator
      method(@Decorator foo: string) {
        return foo;
      }
    }

    // ignore properties
    expect(mockCallback.mock.calls.length).toBe(3);
    expect(MyClass).toBeTruthy(); // placeholding
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
        callback: mockCallback,
      },
      { rootMetadata: ROOT, subMetadata: SUB }
    );

    @Decorator
    class MyClass {
      @Decorator
      prop: string;

      @Decorator
      method(@Decorator foo: string, @Decorator bar: string) {
        return foo + bar;
      }
    }

    expect(mockCallback.mock.calls.length).toBe(5);
    expect(Reflect.getMetadata(ROOT, MyClass)).toStrictEqual([mockFactory]);
    expect(Reflect.getMetadata(SUB, MyClass)).toStrictEqual({
      prop: [mockFactory],
      method: [mockFactory, mockFactory, mockFactory],
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
      callback: () => () => ({ message: "hello world" }),
    });
  });

  it("should inheritance correctly", async () => {
    const ROOT = Symbol("root");
    const SUB = Symbol("sub");

    const Decorator = (message: string) =>
      makeDecorator(
        {
          on: ["class", "property"],
          callback: () => ({
            deps: () => [Result],
            factory: (result = "") => `${result}${message}`,
          }),
        },
        { rootMetadata: ROOT, subMetadata: SUB }
      );

    // should inheritance correctly
    @Decorator("first")
    class FirstClass {
      @Decorator("propfirst")
      prop: string;
    }

    @Decorator("second")
    class SecondClass extends FirstClass {
      @Decorator("propsecond")
      prop: string;
    }

    let configs = await processDecorators(FirstClass, {
      rootMetadata: ROOT,
      subMetadata: SUB,
    });
    expect(configs.result).toBe("first");
    expect(configs.data).toEqual({
      root: ["first"],
      sub: { prop: ["propfirst"] },
    });

    configs = await processDecorators(SecondClass, {
      rootMetadata: ROOT,
      subMetadata: SUB,
    });
    expect(configs.result).toBe("firstsecond");
    expect(configs.data).toEqual({
      root: ["first", "firstsecond"],
      sub: { prop: ["propfirst", "propfirstpropsecond"] },
    });

    // should give default from accestor
    class ThirdClass extends SecondClass {}

    configs = await processDecorators(ThirdClass, {
      rootMetadata: ROOT,
      subMetadata: SUB,
    });
    expect(configs.result).toBe("firstsecond");
    expect(configs.data).toEqual({
      root: ["first", "firstsecond"],
      sub: { prop: ["propfirst", "propfirstpropsecond"] },
    });
  });
});
