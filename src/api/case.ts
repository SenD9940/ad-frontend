function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.getPrototypeOf(value) === Object.prototype
  )
}

function toSnakeCase(key: string): string {
  return key.replace(/[A-Z]/g, (ch) => `_${ch.toLowerCase()}`)
}

function toCamelCase(key: string): string {
  return key.replace(/_([a-z])/g, (_, ch: string) => ch.toUpperCase())
}

export function keysToSnakeCase<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => keysToSnakeCase(item)) as T
  }

  if (!isPlainObject(value)) {
    return value
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [
      toSnakeCase(key),
      keysToSnakeCase(nested),
    ]),
  ) as T
}

export function keysToCamelCase<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => keysToCamelCase(item)) as T
  }

  if (!isPlainObject(value)) {
    return value
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [
      toCamelCase(key),
      keysToCamelCase(nested),
    ]),
  ) as T
}
