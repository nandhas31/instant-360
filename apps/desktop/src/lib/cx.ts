export type ClassValue = string | false | null | undefined;

/** Joins truthy class names together; falsy values are skipped. */
export function cx(...values: ReadonlyArray<ClassValue>): string {
  return values.filter(Boolean).join(" ");
}
