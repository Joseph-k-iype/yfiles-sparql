import type { GraphComponent, IGraph, INode } from 'yfiles'
import {
  Color,
  GraphHighlightIndicatorManager,
  IndicatorNodeStyleDecorator,
  INodeStyle,
  Insets,
  Point,
  Rect,
  ShapeNodeStyle,
  Stroke,
  StyleDecorationZoomPolicy,
} from 'yfiles'

export default class GraphSearch {
  graphComponent: GraphComponent
  searchHighlightIndicatorManager: GraphHighlightIndicatorManager
  matchingNodes: INode[] = []
  searchText = ''

  /**
   * Registers event listeners at the search box.
   *
   * The search result is updated on every key press and the 'ENTER' key zooms the viewport to the currently
   * matching nodes.
   *
   * @param searchBox The search box element.
   * @param autoCompleteSuggestions A list of possible auto-complete suggestion strings. If omitted, no auto-complete will be available
   */
  registerEventListener(
    searchBox: HTMLElement,
    autoCompleteSuggestions?: string[]
  ): void {
    if (autoCompleteSuggestions && searchBox instanceof HTMLInputElement) {
      const datalist = document.createElement('datalist')
      datalist.id = searchBox.id + '-autocomplete'
      searchBox.setAttribute('list', datalist.id)
      if (searchBox.parentElement) {
        searchBox.parentElement.insertBefore(datalist, searchBox)
      }
      this.updateAutoCompleteSuggestions(searchBox, autoCompleteSuggestions)
    }

    searchBox.addEventListener('input', (e) => {
      const input = e.target as HTMLInputElement
      this.updateSearch(input.value)

      // Zoom to search result if an element from the auto-completion list has been selected
      // How to detect this varies between browsers, sadly
      if (
        !(e instanceof InputEvent) /* Chrome */ ||
        e.inputType === 'insertReplacementText' /* Firefox */
      ) {
        // Determine whether we actually selected an element from the list
        if (hasSelectedElementFromDatalist(input, this.searchText)) {
          this.zoomToSearchResult()
        }
      }
    })

    // adds the listener that will focus to the result of the search
    searchBox.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        this.zoomToSearchResult()
      }
    })

    // adds the listener to enable auto-completion
    searchBox.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        return
      }
    })
  }

  /**
   * Creates a new instance of this class with the default highlight style.
   *
   * @param graphComponent The graphComponent on which the search will be applied
   */
  constructor(graphComponent: GraphComponent) {
    this.graphComponent = graphComponent
    // initialize the default highlight style
    const highlightColor = Color.TOMATO
    this.searchHighlightIndicatorManager = new GraphHighlightIndicatorManager({
      nodeStyle: new IndicatorNodeStyleDecorator({
        wrapped: new ShapeNodeStyle({
          stroke: new Stroke(
            highlightColor.r,
            highlightColor.g,
            highlightColor.b,
            220,
            3
          ),
          fill: null,
        }),
        padding: 3,
        zoomPolicy: StyleDecorationZoomPolicy.MIXED,
      }),
    })
    this.searchHighlightIndicatorManager.install(graphComponent)

    // Update the current search highlights if the graph changes during search.
    const onItemsChanged = () => {
      this.updateSearch(this.searchText)
    }

    this.addGraphListeners(this.graphComponent.graph, onItemsChanged)

    // In the AppGenerator, the loadGraph function creates a new graph that is set
    // on the GraphComponent _and_ the graph loading _can_ run _after_ the instantiation
    // of the graph search. We therefore need to listen for a changed graph and add
    // graph listeners on change.
    this.graphComponent.addGraphChangedListener(() => {
      this.addGraphListeners(this.graphComponent.graph, onItemsChanged)
    })
  }

  addGraphListeners(graph: IGraph, onItemsChanged: () => void) {
    graph.addNodeCreatedListener(onItemsChanged)
    graph.addNodeRemovedListener(onItemsChanged)
    graph.addLabelAddedListener(onItemsChanged)
    graph.addLabelRemovedListener(onItemsChanged)
    graph.addLabelTextChangedListener(onItemsChanged)
  }

  /**
   * Gets the decoration style used for highlighting the matching nodes.
   */
  get highlightStyle(): INodeStyle | null {
    return this.searchHighlightIndicatorManager.nodeStyle
  }

  /**
   * Sets the decoration style used for highlighting the matching nodes.
   * @param highlightStyle The given highlight style
   */
  set highlightStyle(highlightStyle: INodeStyle | null) {
    this.searchHighlightIndicatorManager.nodeStyle = highlightStyle
  }

  /**
   * Updates the search results for the given search query.
   * @param searchText The text of the search query.
   */
  updateSearch(searchText: string): void {
    // we use the search highlight manager to highlight matching items
    const manager = this.searchHighlightIndicatorManager

    this.searchText = searchText

    // first remove previous highlights
    manager.clearHighlights()
    this.matchingNodes = []
    if (searchText && searchText.trim() !== '') {
      this.graphComponent.graph.nodes
        .filter((node) => this.matches(node, searchText))
        .forEach((node) => {
          manager.addHighlight(node)
          this.matchingNodes.push(node)
        })
    }
  }

  /**
   * Updates the auto-complete list for the given search field with
   * the given new suggestions.
   *
   * This will do nothing, unless auto-complete has been configured with initial suggestions
   * in the {@link registerEventListener} call.
   *
   * @param input An HTML `input` element that is used as a search input.
   * @param autoCompleteSuggestions A list of possible auto-complete suggestion strings.
   */
  updateAutoCompleteSuggestions(
    input: HTMLInputElement,
    autoCompleteSuggestions: string[]
  ) {
    const datalist = input.list
    if (!datalist) {
      return
    }
    while (datalist.lastChild) {
      datalist.lastChild.remove()
    }
    for (const item of autoCompleteSuggestions) {
      const option = document.createElement('option')
      option.value = item
      datalist.appendChild(option)
    }
  }

  /**
   * Zooms to the nodes that match the result of the current search.
   */
  zoomToSearchResult(): Promise<void> {
    if (this.matchingNodes.length === 0) {
      return Promise.resolve()
    }

    const maxRect = this.matchingNodes
      .map((node) => node.layout.toRect())
      .reduce((prev, current) => Rect.add(prev, current))
    if (!maxRect.isFinite) {
      return Promise.resolve()
    }

    const rect = maxRect.getEnlarged(new Insets(20))
    const componentWidth = this.graphComponent.size.width
    const componentHeight = this.graphComponent.size.height
    const maxPossibleZoom = Math.min(
      componentWidth / rect.width,
      componentHeight / rect.height
    )
    const zoom = Math.min(maxPossibleZoom, 1.5)
    return this.graphComponent.zoomToAnimated(
      new Point(rect.centerX, rect.centerY),
      zoom
    )
  }

  /**
   * Specifies whether the given node is a match when searching for the given text.
   *
   * This implementation searches for the given string in the label text of the nodes.
   * Overwrite this method to implement custom matching rules.
   *
   * @param node The node to be examined
   * @param text The text to be queried
   * @returns True if the node matches the text, false otherwise
   */
  matches(node: INode, text: string): boolean {
    return node.labels.some(
      (label) => label.text.toLowerCase().indexOf(text.toLowerCase()) !== -1
    )
  }
}

function hasSelectedElementFromDatalist(
  input: HTMLInputElement,
  searchText: string
) {
  if (input.list) {
    for (const option of Array.from(input.list.children)) {
      if (option instanceof HTMLOptionElement && option.value === searchText) {
        return true
      }
    }
  }
  return false
}
