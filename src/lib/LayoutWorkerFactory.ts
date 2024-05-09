let layoutWorker: Worker | undefined

export function getLayoutWorker(): Worker {
  if (!layoutWorker) {
    layoutWorker = new Worker(new URL('./Layout.worker.ts', import.meta.url), {
      type: 'module',
    })
  }
  return layoutWorker!
}
