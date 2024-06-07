import {
  CollapsibleNodeStyleDecorator,
  FoldingManager,
  GroupNodeStyle,
  GroupNodeStyleIconType,
  IGraph,
  Insets,
  Stroke,
  GroupNodeStyleTabPosition,
  InteriorStretchLabelModel
} from 'yfiles'

export function enableFolding(masterGraph: IGraph): IGraph {
  // Set up group node defaults
  masterGraph.groupNodeDefaults.style = new GroupNodeStyle({
    tabPosition: GroupNodeStyleTabPosition.LEFT,
    tabFill: 'lightgrey',
    tabBackgroundFill: 'darkgrey',
    contentAreaInsets: Insets.from(15),
    cornerRadius: 10,
    stroke: Stroke.from('2px solid #2c3e50'),
    tabHeight: 24,
    tabWidth: 100
  })

  masterGraph.groupNodeDefaults.labels.layoutParameter = InteriorStretchLabelModel.SOUTH

  // Apply collapsible node style decorator
  masterGraph.groupNodeDefaults.style = new CollapsibleNodeStyleDecorator({
    wrapped: masterGraph.groupNodeDefaults.style,
    buttonPlacement: InteriorStretchLabelModel.SOUTH
  })

  const foldingManager = new FoldingManager(masterGraph)
  const foldingView = foldingManager.createFoldingView()
  const foldingGraph = foldingView.graph

  return foldingGraph
}
