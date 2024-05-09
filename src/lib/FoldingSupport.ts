import {
  CollapsibleNodeStyleDecorator,
  FoldingManager,
  GroupNodeStyle,
  GroupNodeStyleIconType,
  IGraph,
} from 'yfiles'

export function enableFolding(masterGraph: IGraph): IGraph {
  var groupNodeDefaults = masterGraph.groupNodeDefaults
  if (groupNodeDefaults.style instanceof GroupNodeStyle) {
    groupNodeDefaults.style.groupIcon = GroupNodeStyleIconType.MINUS
  } else {
    groupNodeDefaults.style = new CollapsibleNodeStyleDecorator(
      groupNodeDefaults.style
    )
  }
  for (const node of masterGraph.nodes) {
    if (masterGraph.isGroupNode(node)) {
      if (!(node.style instanceof GroupNodeStyle)) {
        masterGraph.setStyle(
          node,
          new CollapsibleNodeStyleDecorator(node.style)
        )
      } else {
        node.style.groupIcon = GroupNodeStyleIconType.MINUS
      }
    }
  }
  return new FoldingManager(masterGraph).createFoldingView().graph
}
