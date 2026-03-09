/**
 * This file is here if you later want a more generic middleware pipeline builder.
 * Right now handlers already call middleware explicitly to stay simple.
 */
export const buildHandler = <T>(handler: T) => handler;
