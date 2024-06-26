import {
  GraphComponent,
  GraphEditorInputMode,
  GraphViewerInputMode,
  ICommand,
  IModelItem,
  INode,
  Point,
  PopulateItemContextMenuEventArgs,
  Rect,
  Size,
} from 'yfiles'
import { ContextMenu } from './lib/ContextMenu'
import './context-menu.css'

export function initializeContextMenu(graphComponent: GraphComponent): void {
  const inputMode = graphComponent.inputMode as
    | GraphEditorInputMode
    | GraphViewerInputMode

  // Create a context menu. In this demo, we use our sample context menu implementation but you can use any other
  // context menu widget as well. See the Context Menu demo for more details about working with context menus.
  const contextMenu = new ContextMenu(graphComponent)

  // Add event listeners to the various events that open the context menu. These listeners then
  // call the provided callback function which in turn asks the current ContextMenuInputMode if a
  // context menu should be shown at the current location.
  contextMenu.addOpeningEventListeners(graphComponent, (location) => {
    if (
      inputMode.contextMenuInputMode.shouldOpenMenu(
        graphComponent.toWorldFromPage(location)
      )
    ) {
      contextMenu.show(location)
    }
  })

  // Add an event listener that populates the context menu according to the hit elements, or cancels showing a menu.
  // This PopulateItemContextMenu is fired when calling the ContextMenuInputMode.shouldOpenMenu method above.
  inputMode.addPopulateItemContextMenuListener((_, evt) =>
    populateContextMenu(contextMenu, graphComponent, evt)
  )

  // Add a listener that closes the menu when the input mode requests this
  inputMode.contextMenuInputMode.addCloseMenuListener(() => {
    contextMenu.close()
  })

  // If the context menu closes itself, for example because a menu item was clicked, we must inform the input mode
  contextMenu.onClosedCallback = () => {
    inputMode.contextMenuInputMode.menuClosed()
  }
}

/**
 * Populates the context menu based on the item the mouse hovers over.
 * @param contextMenu The context menu.
 * @param graphComponent The given graphComponent
 * @param args The event args.
 */
function populateContextMenu(
  contextMenu: ContextMenu,
  graphComponent: GraphComponent,
  args: PopulateItemContextMenuEventArgs<IModelItem>
): void {
  // The 'showMenu' property is set to true to inform the input mode that we actually want to show a context menu
  // for this item (or more generally, the location provided by the event args).
  // If you don't want to show a context menu for some locations, set 'false' in this cases.
  args.showMenu = true

  contextMenu.clearItems()

  const node = args.item instanceof INode ? args.item : null
  // If the cursor is over a node select it
  updateSelection(graphComponent, node)

  // Create the context menu items
  const selectedNodes = graphComponent.selection.selectedNodes
  if (selectedNodes.size > 0) {
    contextMenu.addMenuItem('Zoom to node', () => {
      let targetRect = selectedNodes.at(0)!.layout.toRect()
      selectedNodes.forEach((node) => {
        targetRect = Rect.add(targetRect, node.layout.toRect())
      })
      graphComponent.zoomToAnimated(targetRect.getEnlarged(100))
    })
  } else {
    // no node has been hit
    contextMenu.addMenuItem('Fit Graph Bounds', () =>
      ICommand.FIT_GRAPH_BOUNDS.execute(null, graphComponent)
    )
  }
}

/**
 * Helper function that updates the node selection state when the context menu is opened on a node.
 * @param graphComponent The given graphComponent
 * @param node The node or `null`.
 */
function updateSelection(
  graphComponent: GraphComponent,
  node: INode | null
): void {
  if (node === null) {
    // clear the whole selection
    graphComponent.selection.clear()
  } else if (!graphComponent.selection.selectedNodes.isSelected(node)) {
    // no - clear the remaining selection
    graphComponent.selection.clear()
    // and select the node
    graphComponent.selection.selectedNodes.setSelected(node, true)
    // also update the current item
    graphComponent.currentItem = node
  }
}
