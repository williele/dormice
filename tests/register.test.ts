import {
  registeClassMeta,
  registePropertyMeta,
  registeInjectable,
} from "../src/register";
import { FactoryConfig } from "../src/types";
import { Container } from "inversify";

describe("register", () => {
  const CLASS = Symbol("class");
  const PROPERTY = Symbol("property");

  it("should store class metadata factory config corretly", () => {
    const factory1: FactoryConfig<string> = () => "hello, world!";
    const factory2: FactoryConfig<string> = () => "hello, world!";

    class MyClass {}

    registeClassMeta(MyClass, CLASS, factory1);
    registeClassMeta(MyClass, CLASS, factory2);

    expect(Reflect.getMetadata(CLASS, MyClass)).toEqual([factory1, factory2]);
  });

  it("should store property metadata factory config correctly", () => {
    const factory1: FactoryConfig<string> = () => "";
    const factory2: FactoryConfig<string> = () => "";
    const factory3: FactoryConfig<string> = () => "";

    const target = () => {};

    registePropertyMeta(target, "a", PROPERTY, factory1);
    registePropertyMeta(target, "b", PROPERTY, factory2);
    registePropertyMeta(target, "a", PROPERTY, factory3);

    expect(Reflect.getMetadata(PROPERTY, target)).toEqual({
      a: [factory1, factory3],
      b: [factory2],
    });
  });

  it("should registe injectable correctly", () => {
    class MyClass {}

    let target = registeInjectable(MyClass);
    target = registeInjectable(MyClass);

    const container = new Container();
    container.bind(target).toSelf();
    expect(container.get(MyClass)).toBeTruthy();
    expect(container.get(MyClass)).toBeInstanceOf(MyClass);

    const inst1 = container.get(MyClass);
    expect(container.get(MyClass)).toStrictEqual(inst1);
  });
});
