import './tooltips.css'
import {
  GraphComponent,
  GraphEditorInputMode,
  GraphItemTypes,
  GraphViewerInputMode,
  IModelItem,
  Point,
  QueryItemToolTipEventArgs,
  TimeSpan,
  INode,
  IEdge,
} from 'yfiles'

/**
 * Dynamic tooltips are implemented by adding a tooltip provider as an event handler for
 * the {@link MouseHoverInputMode.addQueryToolTipListener QueryToolTip} event of the
 * GraphEditorInputMode using the
 * {@link ToolTipQueryEventArgs} parameter.
 * The {@link ToolTipQueryEventArgs} parameter provides three relevant properties:
 * Handled, QueryLocation, and ToolTip. The Handled property is a flag which indicates
 * whether the tooltip was already set by one of possibly several tooltip providers. The
 * QueryLocation property contains the mouse position for the query in world coordinates.
 * The tooltip is set by setting the ToolTip property.
 */
export function initializeTooltips(graphComponent: GraphComponent): void {
  const inputMode = graphComponent.inputMode as
    | GraphEditorInputMode
    | GraphViewerInputMode

  // show tooltips only for nodes and edges
  inputMode.toolTipItems = GraphItemTypes.NODE | GraphItemTypes.EDGE

  // Customize the tooltip's behavior to our liking.
  const mouseHoverInputMode = inputMode.mouseHoverInputMode
  mouseHoverInputMode.toolTipLocationOffset = new Point(15, 15)
  mouseHoverInputMode.delay = TimeSpan.fromMilliseconds(500)
  mouseHoverInputMode.duration = TimeSpan.fromSeconds(5)

  // Register a listener for when a tooltip should be shown.
  inputMode.addQueryItemToolTipListener(
    (
      src: GraphEditorInputMode | GraphViewerInputMode,
      args: QueryItemToolTipEventArgs<IModelItem>
    ) => {
      if (args.handled) {
        // Tooltip content has already been assigned -> nothing to do.
        return
      }

      // Use a rich HTML element as tooltip content. Alternatively, a plain string would do as well.
      args.toolTip = createContent(
        args.item!,
        inputMode.inputModeContext!.canvasComponent! as GraphComponent
      )

      // Indicate that the tooltip content has been set.
      args.handled = true
    }
  )
}

/**
 * The tooltip may either be a plain string or it can also be a rich HTML element.
 * In tihs case, we use a simple HTML div.
 */
function createContent(
  item: IModelItem,
  graphComponent: GraphComponent
): HTMLElement {
  let tooltip = ''
  // there should be only nodes and edges due to inputMode.tooltipItems
  if (item instanceof INode) {
    tooltip = `Node #${graphComponent.graph.nodes.indexOf(item) + 1}`
  } else if (item instanceof IEdge) {
    tooltip = `Edge #${graphComponent.graph.edges.indexOf(item) + 1}`
  }

  // build the tooltip container
  const tooltipContainer = document.createElement('div')
  tooltipContainer.className = 'tooltip'
  tooltipContainer.innerText = tooltip
  return tooltipContainer
}
