export function isIterable(o: any): o is Iterable<unknown> {
  return o !== null && typeof o !== 'undefined' && Symbol.iterator in o
}
