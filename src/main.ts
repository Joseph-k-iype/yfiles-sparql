import './assets/icons/icons.css'
import './style.css'
import './dialog.css'
import {
  GraphComponent,
  GraphViewerInputMode,
  ICommand,
  ShapeNodeStyle,
  Point,
  Size,
  INode,
  PolylineEdgeStyle,
  Arrow,
  Rect,
  HierarchicLayout,
  LayoutExecutor,
  GroupNodeStyle,
  InteriorLabelModel,
  SolidColorFill,
  Stroke,
  CircularLayout,
  OrganicLayout,
  OrthogonalLayout,
  GraphItemTypes,
  DefaultLabelStyle,
  BetweennessCentrality,
  IGraph,
  LouvainModularityClustering,
  ShortestPath,
  IEdge
} from 'yfiles'
import { enableFolding } from './lib/FoldingSupport'
import './lib/yFilesLicense'
import { initializeGraphOverview } from './graph-overview'
import { exportDiagram } from './diagram-export'
import { initializeContextMenu } from './context-menu'
import { initializeGraphSearch } from './graph-search'

const FIXED_NODE_SIZE = new Size(60, 40) // Adjust these values as needed

// Define a palette of colors
const colorPalette = [
  '#FFD700', // Gold
  '#00BFFF', // Deep Sky Blue
  '#DC143C', // Crimson
  '#32CD32', // Lime Green
  '#FF69B4', // Hot Pink
  '#8A2BE2', // Blue Violet
  '#FF8C00', // Dark Orange
  '#7FFF00', // Chartreuse
  '#D2691E', // Chocolate
  '#6495ED', // Cornflower Blue
  '#808080'  // Grey for unspecified types
]

const nodeTypeColors = new Map<string, string>()

// Function to assign colors dynamically to node types
function getNodeColor(nodeType: string): string {
  if (!nodeTypeColors.has(nodeType)) {
    const color = colorPalette[nodeTypeColors.size % colorPalette.length]
    nodeTypeColors.set(nodeType, color)
  }
  return nodeTypeColors.get(nodeType) || '#808080' // Default to grey if not found
}

document.addEventListener('DOMContentLoaded', async () => {
  const graphComponent = await initializeGraphComponent()
  initializeToolbar(graphComponent)
  addQuerySubmissionListener(graphComponent)
  initializeGraphOverview(graphComponent)
  initializeContextMenu(graphComponent)
  initializeGraphSearch(graphComponent)
  initializeSidebar(graphComponent) // Initialize the sidebar for subgraph feature
  exportDiagram(graphComponent, 'svg')
  exportDiagram(graphComponent, 'png')
  exportDiagram(graphComponent, 'pdf')
})

async function initializeGraphComponent(): Promise<GraphComponent> {
  const graphComponent = new GraphComponent('.graph-component-container')
  const inputMode = new GraphViewerInputMode()
  inputMode.addCanvasClickedListener((sender, args) => console.log('Canvas clicked')) // Debugging
  inputMode.addItemDoubleClickedListener((sender, args) => {
    if (INode.isInstance(args.item)) {
      handleNodeClick(args.item as INode, graphComponent)
      console.log('Node double-clicked') // Debugging
    }
  })
  graphComponent.inputMode = inputMode
  initializeTooltips(graphComponent)
  await loadGraph(graphComponent)
  graphComponent.fitGraphBounds()
  return graphComponent
}

function initializeTooltips(graphComponent: GraphComponent) {
  const inputMode = graphComponent.inputMode as GraphViewerInputMode
  inputMode.toolTipItems = GraphItemTypes.NODE // Enable tooltips for nodes
  inputMode.addQueryItemToolTipListener((sender, args) => {
    if (INode.isInstance(args.item)) {
      const node = args.item as INode
      if (node.labels.size > 0) {
        args.toolTip = node.labels.first().text
        args.handled = true
      }
    }
  })
  inputMode.mouseHoverInputMode.enabled = true
}

function initializeToolbar(graphComponent: GraphComponent) {
  const toolbar = document.querySelector('.toolbar');
  console.log('Toolbar HTML structure:', toolbar?.innerHTML); // Debugging

  const layoutDropdown = document.querySelector('#layoutDropdown + .dropdown-menu');
  const analysisDropdown = document.querySelector('#analysisDropdown + .dropdown-menu');

  if (layoutDropdown) {
    console.log('Layout dropdown found'); // Debugging
    layoutDropdown.addEventListener('click', function (event) {
      const target = event.target as HTMLElement;
      console.log('Layout dropdown item clicked', target); // Debugging
      if (target && target.tagName === 'A') {
        const layoutType = target.getAttribute('data-layout');
        if (layoutType) {
          console.log(`Applying layout: ${layoutType}`); // Debugging
          applyLayout(graphComponent, layoutType);
        }
      }
    });
  } else {
    console.error('Layout dropdown not found!');
  }

  if (analysisDropdown) {
    console.log('Analysis dropdown found'); // Debugging
    analysisDropdown.addEventListener('click', function (event) {
      const target = event.target as HTMLElement;
      console.log('Analysis dropdown item clicked', target); // Debugging
      if (target && target.tagName === 'A') {
        const analysisType = target.getAttribute('data-analysis');
        if (analysisType) {
          console.log(`Performing analysis: ${analysisType}`); // Debugging
          performGraphAnalysis(graphComponent, analysisType);
        }
      }
    });
  } else {
    console.error('Analysis dropdown not found!');
  }

  // Initialize zoom and fit graph buttons
  document.getElementById('btn-increase-zoom')!.addEventListener('click', () => {
    ICommand.INCREASE_ZOOM.execute(null, graphComponent);
  });
  document.getElementById('btn-decrease-zoom')!.addEventListener('click', () => {
    ICommand.DECREASE_ZOOM.execute(null, graphComponent);
  });
  document.getElementById('btn-fit-graph')!.addEventListener('click', () => {
    ICommand.FIT_GRAPH_BOUNDS.execute(null, graphComponent);
  });
}

async function loadGraph(graphComponent: GraphComponent) {
  const graph = graphComponent.graph
  graph.clear()
  return graph // Placeholder for initial graph setup
}

function addQuerySubmissionListener(graphComponent: GraphComponent) {
  document.getElementById('submitQueries')!.addEventListener('click', () => {
    const nodesQuery = (document.getElementById('nodesQuery') as HTMLInputElement).value
    const edgesQuery = (document.getElementById('edgesQuery') as HTMLInputElement).value
    const groupsQuery = (document.getElementById('groupsQuery') as HTMLInputElement).value
    fetch('http://localhost:8000/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ nodesQuery, edgesQuery, groupsQuery })
    })
      .then((response) => response.json())
      .then((data) => {
        applyGraphData(graphComponent, data)
        populateNodeList(graphComponent) // Populate the node list after loading the graph
      })
      .catch((error) => console.error('Error:', error))
  })
}

function applyLayout(graphComponent: GraphComponent, layoutType: any) {
  let layout
  switch (layoutType) {
    case 'hierarchic':
      layout = new HierarchicLayout()
      break
    case 'organic':
      layout = new OrganicLayout()
      break
    case 'orthogonal':
      layout = new OrthogonalLayout()
      break
    case 'circular':
      layout = new CircularLayout()
      break
    default:
      layout = new HierarchicLayout()
  }
  const executor = new LayoutExecutor({
    graphComponent,
    layout,
    duration: 500 // Duration in milliseconds
  })
  executor.start().catch((error) => console.error('Layout execution failed:', error))
}

function applyGraphData(
  graphComponent: GraphComponent,
  data: { nodes: any[]; edges: any[]; groups?: any[] }
) {
  const graph = graphComponent.graph
  graph.clear()

  const nodesMap = new Map<string, INode>()
  let typeToGroupMap = new Map<string, INode>()

  if (data.groups && data.groups.length > 0) {
    typeToGroupMap = createGroups(graph, data.groups)
  }

  data.nodes.forEach((node) => {
    const groupNode = node.type ? typeToGroupMap.get(node.type) : null
    const color = getNodeColor(node.type) // Use dynamic color assignment

    const newNode = graph.createNode({
      layout: new Rect(new Point(Math.random() * 800, Math.random() * 800), FIXED_NODE_SIZE), // Position randomly
      style: new ShapeNodeStyle({
        fill: new SolidColorFill(color),
        stroke: new Stroke('black', 1.5)
      }),
      labels: [{
        text: node.label || node.id,
        style: new DefaultLabelStyle({
          wrapping: 'character-ellipsis', // Truncate text with ellipsis
          horizontalTextAlignment: 'center',
          verticalTextAlignment: 'center',
          textSize: 12,
          font: 'Arial'
        }),
        preferredSize: new Size(FIXED_NODE_SIZE.width - 10, FIXED_NODE_SIZE.height - 10) // Adjust size to fit within node
      }]
    })
    if (groupNode) {
      graph.setParent(newNode, groupNode)
    }
    nodesMap.set(node.id, newNode)
  })

  createEdges(graph, data.edges, nodesMap)

  if (typeToGroupMap.size > 0) {
    adjustGroupNodes(graph)
  }

  graphComponent.fitGraphBounds()
}

// Helper function to create group nodes based on group data
function createGroups(graph: IGraph, groups: any[]) {
  const typeToGroupMap = new Map()
  groups.forEach((group: { type: any }) => {
    if (!typeToGroupMap.has(group.type)) {
      const groupNodeStyle = new GroupNodeStyle({
        tabPosition: 'top-leading',
        cornerRadius: 10,
        contentAreaInsets: [15, 10, 10, 10],
        stroke: new Stroke('2px solid #2c3e50'),
        tabHeight: 24,
        tabWidth: 100
      })
      const groupNode = graph.createGroupNode({
        layout: new Rect(0, 0, 500, 300),
        style: groupNodeStyle
      })
      graph.addLabel(groupNode, group.type, InteriorLabelModel.NORTH)
      typeToGroupMap.set(group.type, groupNode)
    }
  })
  return typeToGroupMap
}

// Function to create edges between nodes
function createEdges(graph: IGraph, edges: any[], nodesMap: Map<string, INode>) {
  edges.forEach((edge: { source: any; target: any }) => {
    const sourceNode = nodesMap.get(edge.source)
    const targetNode = nodesMap.get(edge.target)
    if (sourceNode && targetNode) {
      graph.createEdge(
        sourceNode,
        targetNode,
        new PolylineEdgeStyle({
          stroke: '2px solid black',
          targetArrow: new Arrow({ type: 'triangle', fill: 'black' })
        })
      )
    }
  })
}

// Function to adjust group nodes layout
function adjustGroupNodes(graph: IGraph) {
  graph.nodes
    .filter((node: any) => graph.isGroupNode(node))
    .forEach((groupNode: any) => {
      graph.adjustGroupNodeLayout(groupNode)
    })
}

let selectedNodes: INode[] = []

function handleNodeClick(node: INode, graphComponent: GraphComponent) {
  console.log('Handling node click') // Debugging
  selectedNodes.push(node)
  if (selectedNodes.length === 2) {
    highlightShortestPath(graphComponent)
    selectedNodes = [] // Reset for next selection
  }
}

function highlightShortestPath(graphComponent: GraphComponent) {
  const graph = graphComponent.graph
  if (selectedNodes.length !== 2) return

  const [sourceNode, targetNode] = selectedNodes

  // Create a new instance of ShortestPath with the required properties.
  const shortestPath = new ShortestPath({
    source: sourceNode, // specifying the source node
    sink: targetNode, // specifying the target node
    directed: false // assuming the graph is undirected; adjust this as needed
  })

  // Run the shortest path algorithm.
  const result = shortestPath.run(graph)

  // Check if a path exists
  if (!result) {
    console.log('No path found') // Debugging
    return
  }

  // Clear existing edge styles.
  graph.edges.forEach((edge) =>
    graph.setStyle(
      edge,
      new PolylineEdgeStyle({
        stroke: '1px solid black',
        targetArrow: new Arrow({ type: 'triangle', fill: 'black' })
      })
    )
  )

  // Highlight edges in the shortest path.
  result.edges.forEach((edge) => {
    graph.setStyle(
      edge,
      new PolylineEdgeStyle({
        stroke: '3px solid red',
        targetArrow: new Arrow({ type: 'triangle', fill: 'red' })
      })
    )
  })

  graphComponent.invalidate()
}

function performGraphAnalysis(graphComponent: GraphComponent, analysisType: string) {
  switch (analysisType) {
    case 'betweenness':
      console.log('centrality clicked')
      calculateBetweennessCentrality(graphComponent)
      break
    case 'modularity':
      performModularityClustering(graphComponent)
      break
    default:
      console.error('Unknown analysis type:', analysisType)
  }
}

function calculateBetweennessCentrality(graphComponent: GraphComponent) {
  const graph = graphComponent.graph;
  const centrality = new BetweennessCentrality();
  const result = centrality.run(graph);

  // Debug: Log output to see the centrality values
  console.log('Centrality Results:', result.nodeCentrality.values);

  graph.nodes.forEach(node => {
    const centralityValue = result.nodeCentrality.get(node) || 0;
    console.log(`Node ${node.tag}: ${centralityValue}`); // Debugging
    const nodeStyle = node.style.clone() as ShapeNodeStyle;
    nodeStyle.fill = getCentralityColor(centralityValue);
    graph.setStyle(node, nodeStyle);
  });
  graphComponent.invalidate();  // Ensuring the graph is redrawn
}

function performModularityClustering(graphComponent: GraphComponent) {
  const graph = graphComponent.graph;
  const clustering = new LouvainModularityClustering();
  const result = clustering.run(graph);

  // Check if nodeClusterIds is iterable like a Map
  if (result.nodeClusterIds) {
    result.nodeClusterIds.forEach(entry => {
      const node = entry.key;
      const clusterId = entry.value;
      if (INode.isInstance(node)) {
        console.log(`Node ${node.tag} is in cluster ${clusterId}`);
        const nodeStyle = node.style.clone() as ShapeNodeStyle;
        nodeStyle.fill = getClusterColor(clusterId);
        graph.setStyle(node, nodeStyle);
      } else {
        console.error('Unexpected data type encountered: node is not an INode');
      }
    });
  } else {
    console.error('nodeClusterIds does not support forEach or is not correctly referenced');
  }

  graphComponent.invalidate(); // Redraw the graph with new styles
}

function getCentralityColor(value: number): SolidColorFill {
  const intensity = Math.min(value * 255, 255);
  return new SolidColorFill(255, intensity, intensity);
}

function getClusterColor(clusterId: number): SolidColorFill {
  const colors = ['red', 'green', 'blue', 'yellow', 'purple'];
  return new SolidColorFill(colors[clusterId % colors.length]);
}

// Sidebar initialization
function initializeSidebar(graphComponent: GraphComponent) {
  const searchInput = document.getElementById('node-search') as HTMLInputElement
  const nodeList = document.getElementById('node-list') as HTMLElement
  searchInput.addEventListener('input', () => {
    filterNodes(graphComponent, searchInput.value, nodeList)
  })

  const generateSubgraphButton = document.getElementById('generate-subgraph') as HTMLButtonElement
  generateSubgraphButton.addEventListener('click', () => {
    generateSubgraph(graphComponent, nodeList)
  })
}

function populateNodeList(graphComponent: GraphComponent) {
  const nodeList = document.getElementById('node-list') as HTMLElement
  nodeList.innerHTML = ''
  graphComponent.graph.nodes.forEach((node) => {
    const listItem = document.createElement('div')
    listItem.className = 'list-group-item'
    listItem.innerHTML = `
      <input type="checkbox" class="node-checkbox" data-node-id="${node.tag}">
      <span>${node.labels.size > 0 ? node.labels.first().text : ''}</span>
    `
    nodeList.appendChild(listItem)
  })
}

function filterNodes(graphComponent: GraphComponent, searchTerm: string, nodeList: HTMLElement) {
  const items = nodeList.querySelectorAll('.list-group-item')
  items.forEach((item) => {
    const listItem = item as HTMLElement // Cast item to HTMLElement
    const nodeName = listItem.querySelector('span')?.textContent || ''
    const matches = nodeName.toLowerCase().includes(searchTerm.toLowerCase())
    listItem.style.display = matches ? '' : 'none'
  })
}

function generateSubgraph(graphComponent: GraphComponent, nodeList: HTMLElement) {
  const selectedNodeIds: string[] = []
  const checkboxes = nodeList.querySelectorAll('.node-checkbox')
  checkboxes.forEach((checkbox) => {
    if ((checkbox as HTMLInputElement).checked) {
      const nodeId = (checkbox as HTMLInputElement).dataset.nodeId
      if (nodeId) {
        selectedNodeIds.push(nodeId)
      }
    }
  })

  const subgraph = createSubgraph(graphComponent.graph, selectedNodeIds)
  displaySubgraph(subgraph, graphComponent)
}

function createSubgraph(graph: IGraph, selectedNodeIds: string[]): IGraph {
  const subgraph = new GraphComponent().graph
  const nodeMap = new Map<INode, INode>()

  selectedNodeIds.forEach((nodeId) => {
    const node = graph.nodes.find((n) => n.tag === nodeId)
    if (node) {
      const newNode = subgraph.createNode({
        layout: node.layout.toRect(),
        style: node.style,
        labels: node.labels.toArray().map(label => ({ text: label.text })) // Ensure correct label format
      })
      nodeMap.set(node, newNode)
    }
  })

  graph.edges.forEach((edge) => {
    const sourceNode = nodeMap.get(edge.sourceNode?.tag) as INode | undefined
    const targetNode = nodeMap.get(edge.targetNode?.tag) as INode | undefined
    if (sourceNode && targetNode) {
      subgraph.createEdge({
        source: sourceNode,
        target: targetNode,
        style: edge.style
      })
    }
  })

  return subgraph
}

function displaySubgraph(subgraph: IGraph, graphComponent: GraphComponent) {
  const subgraphComponent = new GraphComponent()
  subgraphComponent.graph = subgraph
  subgraphComponent.fitGraphBounds()

  const subgraphWindow = window.open('', '_blank', 'width=800,height=600')
  if (subgraphWindow) {
    subgraphWindow.document.write('<html><head><title>Subgraph</title></head><body></body></html>')
    subgraphWindow.document.body.appendChild(subgraphComponent.div)
    subgraphComponent.div.style.height = '100%'
    subgraphComponent.div.style.width = '100%'
  }
}
