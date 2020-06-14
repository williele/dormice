import { createContainer } from "../src/container";
import { ParentContainer } from "../src/token";
import { injectable } from "inversify";

describe("container", () => {
  it("should is singleton", async () => {
    @injectable()
    class Test {}

    const container = await createContainer([Test]);
    expect(container.get(Test)).toBe(container.get(Test));
  });

  it("should create container correctly", async () => {
    let container = await createContainer();

    // get the container itself
    expect(container.get(ParentContainer)).toBe(container);
    container.bind("root").toConstantValue("root");

    // should solve some providers
    container = await createContainer(
      [
        { token: "foo", useValue: "foo" },
        { token: "bar", useFactory: () => "bar" },
        {
          token: "sum",
          useFactory: {
            deps: () => ["foo", "bar"],
            factory: (foo: string, bar: string) => `${foo} ${bar}`,
          },
        },
      ],
      container
    );

    expect(container.get(ParentContainer)).toBe(container);
    expect(container.get("root")).toBe("root");
    expect(container.get("foo")).toBe("foo");
    expect(container.get("bar")).toBe("bar");
    expect(container.get("sum")).toBe("foo bar");
  });
});
