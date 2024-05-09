import { isIterable } from './CollectionUtils'

export type ProjectionConfiguration<T> = {
  binding?: (item: T) => any
}

export function project<T = any>(
  inValue: any | undefined,
  { binding }: ProjectionConfiguration<T>
): any {
  if (typeof inValue === 'string' || typeof inValue === 'number') {
    throw new Error('Projection node is only applicable to objects.')
  }

  if (!binding || !inValue) {
    return null
  }

  return isIterable(inValue) ? mapExtract(inValue, binding) : binding(inValue)
}

function mapExtract<T = unknown>(
  iterable: Iterable<T>,
  binding: (dataItem: any) => any
): Iterable<unknown> {
  const result: T[] = []
  for (const item of iterable) {
    result.push(binding(item))
  }
  return result
}
