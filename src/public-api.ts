export * from "./decorators";
export * from "./register";
export * from "./providers";
export * from "./token";
export * from "./types";
export * from "./container";

// wrapper inversify
import { inject } from "inversify";

export { Container } from "inversify";
export const Inject = inject;
