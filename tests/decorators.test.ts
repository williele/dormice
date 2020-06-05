import { Container } from "inversify";
import { makeDecorator } from "../src/decorators";
import { DecoratorInfo } from "../src/types";

describe("decorators builder", () => {
  const CLASS = Symbol("class");
  const METHOD = Symbol("multiple");
  const PROPERTY = Symbol("property");

  it("should make single target decorator correctly", () => {
    const mockFactory = () => {};
    const mockCallback = jest.fn((info: DecoratorInfo) => {
      expect(info.on).toEqual("class");
      return mockFactory;
    });

    const Decorator = makeDecorator({
      on: ["class"],
      classMetadata: CLASS,
      injectable: true,
      callback: mockCallback,
    });

    @Decorator
    @Decorator
    class MyClass {}

    expect(mockCallback.mock.calls.length).toBe(2);
    // should make it injectable
    const container = new Container();
    container.bind(MyClass).toSelf();
    expect(container.get(MyClass)).toBeTruthy();
    // should store the factory config
    expect(Reflect.getMetadata(CLASS, MyClass)).toBe(mockFactory);
  });

  it("should make multiple targets decorator correctly", () => {
    const mockFactory = () => {};
    const mockCallback = jest.fn((info: DecoratorInfo) => {
      expect(["class", "method"]).toContainEqual(info.on);
      return mockFactory;
    });

    const Decorator = makeDecorator({
      on: ["class", "method"],
      classMetadata: CLASS,
      methodMetadata: METHOD,
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
    // should store factory config in the right place
    expect(Reflect.getMetadata(CLASS, MyClass)).toBe(mockFactory);
    expect(Reflect.getMetadata(METHOD, MyClass)).toBe(mockFactory);
  });

  it("should throw error if metedata not provide", () => {
    const Decorator = makeDecorator({
      on: ["class", "method", "property"],
      callback: () => () => {},
    });

    expect(() => {
      @Decorator
      class MyClass {}
    }).toThrow();

    expect(() => {
      class MyClass {
        @Decorator
        prop;
      }
    }).toThrow();

    expect(() => {
      class MyClass {
        @Decorator
        method() {}
      }
    }).toThrow();
  });

  it("should make decorator for all target correctly", () => {
    const mockFactory = () => {};
    const mockCallback = jest.fn((info: DecoratorInfo) => {
      expect(["class", "method", "property"]).toContain(info.on);
      return mockFactory;
    });
    const Decorator = makeDecorator({
      on: ["class", "property", "method"],
      callback: mockCallback,
      classMetadata: CLASS,
      methodMetadata: METHOD,
      propertyMetadata: PROPERTY,
    });

    @Decorator
    class MyClass {
      @Decorator
      prop: string;

      @Decorator
      method() {}
    }

    expect(mockCallback.mock.calls.length).toBe(3);
    expect(Reflect.getMetadata(CLASS, MyClass)).toBe(mockFactory);
    expect(Reflect.getMetadata(METHOD, MyClass)).toBe(mockFactory);
    expect(Reflect.getMetadata(PROPERTY, MyClass)).toBe(mockFactory);
  });
});
