import { DefaultGraph, IGraph, LayoutExecutorAsync } from 'yfiles'

import { getLayoutWorker } from './LayoutWorkerFactory'
import type { LayoutConfiguration } from './LayoutUtils'
import { getAlgorithm, getLayoutData, getLayoutDescriptor } from './LayoutUtils'

export function arrange<T extends IGraph | undefined>(
  graph: T | undefined,
  configuration: LayoutConfiguration
): T | IGraph | Promise<T | IGraph> {
  if (graph) {
    const layoutWorker = getLayoutWorker()
    if (configuration.worker && layoutWorker) {
      return runLayoutAsync(graph!, configuration).then(() => graph)
    } else {
      runLayoutSync(graph!, configuration)
      return graph
    }
  }
  return new DefaultGraph()
}

function runLayoutSync(
  graph: IGraph,
  configuration: LayoutConfiguration
): void {
  const layout = getAlgorithm(configuration)
  const layoutData = getLayoutData(configuration)
  graph.applyLayout(layout, layoutData)
}

let transaction = 0
function runLayoutAsync(
  graph: IGraph,
  configuration: LayoutConfiguration
): Promise<void> {
  const layoutWorker = getLayoutWorker()

  function webWorkerMessageHandler(data: any) {
    const currentTransaction = transaction
    transaction++

    data.transaction = currentTransaction

    return new Promise<object>((resolve) => {
      layoutWorker.addEventListener(
        'message',
        function onmessage(e: MessageEvent) {
          if (e.data.transaction === currentTransaction) {
            layoutWorker.removeEventListener('message', onmessage)
            resolve(e.data)
          }
        }
      )

      layoutWorker.postMessage(data)
    })
  }

  // create an asynchronous layout executor that calculates a layout on the worker
  const executor = new LayoutExecutorAsync({
    messageHandler: webWorkerMessageHandler,
    graph,
    layoutDescriptor: getLayoutDescriptor(configuration),
    layoutData: getLayoutData(configuration),
  })

  return executor.start()
}
