import { GraphComponent } from 'yfiles'
import { ExportSupport } from './lib/ExportSupport'

export function exportDiagram(
  graphComponent: GraphComponent,
  format: 'svg' | 'png' | 'pdf'
): void {
  // export the graph of the current view
  const graph = graphComponent.graph

  if (graph.nodes.size === 0) {
    return
  }

  graphComponent.updateContentRect(30)
  const exportArea = graphComponent.contentRect
  switch (format) {
    case 'svg':
      ExportSupport.saveSvg(graph, exportArea, 1)
      break
    case 'png':
      ExportSupport.savePng(graph, exportArea, 1)
      break
    case 'pdf':
      ExportSupport.savePdf(graph, exportArea, 1)
      break
  }
}
