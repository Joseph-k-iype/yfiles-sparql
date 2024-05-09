import './yFilesLicense'
import type { LayoutDescriptor } from 'yfiles'
import { LayoutExecutorAsyncWorker, LayoutGraph } from 'yfiles'
import { getAlgorithm } from './LayoutUtils'

function applyLayout(
  graph: LayoutGraph,
  layoutDescriptor: LayoutDescriptor
): void {
  return getAlgorithm(layoutDescriptor).applyLayout(graph)
}

self.addEventListener(
  'message',
  (e: MessageEvent) => {
    const currentTransaction = e.data.transaction
    const executor = new LayoutExecutorAsyncWorker(applyLayout)
    executor.process(e.data).then((e: any) => {
      e.transaction = currentTransaction
      ;((self as unknown) as Worker).postMessage(e)
    })
  },
  false
)
