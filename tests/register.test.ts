import {
  registeRootMeta,
  registeSubMeta,
  registeInjectable,
  getFactoryConfigs,
} from "../src/register";
import { FactoryConfig } from "../src/types";
import { Container } from "inversify";

describe("register", () => {
  const CLASS = Symbol("class");
  const PROPERTY = Symbol("property");

  it("should store root metadata factory config corretly", () => {
    const factory1: FactoryConfig<string> = () => "hello, world!";
    const factory2: FactoryConfig<string> = () => "hello, world!";

    class MyClass {}

    registeRootMeta(MyClass, CLASS, factory1);
    registeRootMeta(MyClass, CLASS, factory2);

    expect(Reflect.getMetadata(CLASS, MyClass)).toEqual([factory1, factory2]);
  });

  it("should store sub metadata factory config correctly", () => {
    const factory1: FactoryConfig<string> = () => "";
    const factory2: FactoryConfig<string> = () => "";
    const factory3: FactoryConfig<string> = () => "";

    const target = () => {};

    registeSubMeta(target, "a", PROPERTY, factory1);
    registeSubMeta(target, "b", PROPERTY, factory2);
    registeSubMeta(target, "a", PROPERTY, factory3);

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

  it("should get factories correctly", () => {
    const ROOT = Symbol("root");
    const SUB = Symbol("sub");

    const target1 = () => {};
    const target2 = () => {};
    const target3 = () => {};
    const factoryConfig = () => {};

    registeSubMeta(target1, "foo", SUB, factoryConfig);
    registeSubMeta(target1, "bar", SUB, factoryConfig);
    registeSubMeta(target1, "foo", SUB, factoryConfig);

    expect(
      getFactoryConfigs(target1, { rootMetadata: ROOT, subMetadata: SUB })
    ).toStrictEqual({
      root: [],
      sub: {
        foo: [factoryConfig, factoryConfig],
        bar: [factoryConfig],
      },
    });

    registeRootMeta(target2, ROOT, factoryConfig);
    registeRootMeta(target2, ROOT, factoryConfig);
    expect(
      getFactoryConfigs(target2, { rootMetadata: ROOT, subMetadata: SUB })
    ).toStrictEqual({
      root: [factoryConfig, factoryConfig],
      sub: {},
    });

    registeRootMeta(target3, ROOT, factoryConfig);
    registeRootMeta(target3, ROOT, factoryConfig);
    registeSubMeta(target3, "foo", SUB, factoryConfig);
    registeSubMeta(target3, "bar", SUB, factoryConfig);
    registeSubMeta(target3, "foo", SUB, factoryConfig);
    expect(
      getFactoryConfigs(target3, { rootMetadata: ROOT, subMetadata: SUB })
    ).toStrictEqual({
      root: [factoryConfig, factoryConfig],
      sub: {
        foo: [factoryConfig, factoryConfig],
        bar: [factoryConfig],
      },
    });
  });
});
