import { Providers } from "./types";
import { Container } from "inversify";
import { processProviders } from "./providers";
import { ParentContainer } from "./token";

// currently use inversify for container
export async function createContainer(
  providers: Providers = [],
  parent?: Container
) {
  const container = new Container();
  if (parent) {
    container.parent = parent;
  }

  await processProviders(
    [{ token: ParentContainer, useValue: container }, ...providers],
    container
  );
  return container;
}
