import './assets/icons/icons.css'
import './style.css'
import './dialog.css'
import {
  GraphComponent,
  GraphViewerInputMode,
  ICommand,
  ScrollBarVisibility,
  ShapeNodeStyle,
  Point,
  Size,
  INode,
  PolylineEdgeStyle,
  Arrow,
  Rect,
  HierarchicLayout,
  IMapper,
  LayoutExecutor,
  GroupNodeStyle,
  InteriorLabelModel,
  SolidColorFill,
  Stroke,
  CircularLayout,
  OrganicLayout,
  OrthogonalLayout,
  IGraph,
  GraphItemTypes,
  ShortestPathAlgorithm,
  ShortestPath,
  DefaultGraph,
  BetweennessCentrality,
  LouvainModularityClustering,
  SimpleNode
} from 'yfiles'
import { enableFolding } from './lib/FoldingSupport'
import './lib/yFilesLicense'
import { initializeGraphOverview } from './graph-overview'
// import { initializeTooltips } from './tooltips'
import { exportDiagram } from './diagram-export'
import { initializeContextMenu } from './context-menu'
import { initializeGraphSearch } from './graph-search'

const FIXED_NODE_SIZE = new Size(60, 40) // Adjust these values as needed

const nodeTypeColors: { [type: string]: string } = {
  type1: '#FFD700', // Gold
  type2: '#DC143C', // Crimson
  type3: '#00BFFF', // Deep Sky Blue
  type4: '#32CD32', // Lime Green
  default: '#808080' // Grey for unspecified types
}

document.addEventListener('DOMContentLoaded', async () => {
  const graphComponent = await initializeGraphComponent()
  initializeToolbar(graphComponent)
  addQuerySubmissionListener(graphComponent)
  initializeGraphOverview(graphComponent)
  initializeContextMenu(graphComponent)
  initializeGraphSearch(graphComponent)
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
    const color = nodeTypeColors[node.type] || nodeTypeColors['default'] // Use color based on type, or default if type is unknown

    const newNode = graph.createNode({
      layout: new Rect(new Point(Math.random() * 800, Math.random() * 500), FIXED_NODE_SIZE),
      style: new ShapeNodeStyle({
        fill: color, // Set fill color based on node type
        stroke: 'black',
        shape: 'rectangle'
      }),
      labels: [node.label]
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
  if (result.nodeClusterIds.forEach) {
    // Assuming nodeClusterIds behaves like a Map<INode, number>
    result.nodeClusterIds.forEach((node, clusterId) => {
      // Ensure 'node' is actually an INode and that 'clusterId' is the number
      if (node instanceof INode) {
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
