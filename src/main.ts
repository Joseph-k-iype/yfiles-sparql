// import './assets/icons/icons.css';
// import './style.css';
// import './dialog.css';
// import {
//   GraphComponent,
//   GraphViewerInputMode,
//   ICommand,
//   ScrollBarVisibility,
//   ShapeNodeStyle,
//   Point,
//   Size,
//   INode,
//   PolylineEdgeStyle,
//   Arrow,
//   Rect,
//   IEnumerableConvertible
// } from 'yfiles';
// import { enableFolding } from './lib/FoldingSupport';
// import loadGraph from './lib/loadGraph';
// import './lib/yFilesLicense';
// import { initializeGraphOverview } from './graph-overview';
// import { initializeTooltips } from './tooltips';
// import { exportDiagram } from './diagram-export';
// import { initializeContextMenu } from './context-menu';
// import { initializeGraphSearch } from './graph-search';

// document.addEventListener('DOMContentLoaded', async () => {
//   const graphComponent = await initializeGraphComponent();
//   initializeToolbar(graphComponent);
//   addQuerySubmissionListener(graphComponent);
// });

// async function initializeGraphComponent(): Promise<GraphComponent> {
//   const graphComponent = new GraphComponent(document.querySelector('.graph-component-container')!);
//   graphComponent.inputMode = new GraphViewerInputMode();
//   graphComponent.graph = enableFolding(await loadGraph());
//   graphComponent.fitGraphBounds();
//   return graphComponent;
// }

// function initializeToolbar(graphComponent: GraphComponent) {
//   document.getElementById('btn-increase-zoom')!.addEventListener('click', () => {
//     ICommand.INCREASE_ZOOM.execute(null, graphComponent);
//   });
//   document.getElementById('btn-decrease-zoom')!.addEventListener('click', () => {
//     ICommand.DECREASE_ZOOM.execute(null, graphComponent);
//   });
//   document.getElementById('btn-fit-graph')!.addEventListener('click', () => {
//     ICommand.FIT_GRAPH_BOUNDS.execute(null, graphComponent);
//   });
// }

// function addQuerySubmissionListener(graphComponent: GraphComponent) {
//   document.getElementById('submitQueries')!.addEventListener('click', () => {
//     const nodesQuery = (document.getElementById('nodesQuery') as HTMLInputElement).value;
//     const edgesQuery = (document.getElementById('edgesQuery') as HTMLInputElement).value;
//     const groupsQuery = (document.getElementById('groupsQuery') as HTMLInputElement).value;
//     fetch('http://localhost:8000/query', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({ nodesQuery, edgesQuery, groupsQuery })
//     })
//     .then(response => response.json())
//     .then(data => {
//       applyGraphData(graphComponent, data);
//     })
//     .catch(error => console.error('Error:', error));
//   });
// }

// function applyGraphData(graphComponent: GraphComponent, data: { nodes: any[], edges: any[], groups: any[] }) {
//   const graph = graphComponent.graph;
//   graph.clear();

//   const nodesMap = new Map<string, INode>();
//   const typeToGroupNodeMap = new Map<string, INode>();

//   // Create nodes
//   data.nodes.forEach(node => {
//     const newNode = graph.createNode({
//       layout: new Rect(new Point(Math.random() * 800, Math.random() * 500), new Size(50, 30)),
//       style: new ShapeNodeStyle({
//         fill: 'lightblue',
//         stroke: 'black',
//         shape: 'rectangle'
//       }),
//       tag: node.id
//     });
//     graph.addLabel(newNode, node.label); // Adding labels to the nodes
//     nodesMap.set(node.id, newNode);
//   });

//   // Create edges
//   data.edges.forEach(edge => {
//     const sourceNode = nodesMap.get(edge.source);
//     const targetNode = nodesMap.get(edge.target);
//     if (sourceNode && targetNode) {
//       graph.createEdge(sourceNode, targetNode, new PolylineEdgeStyle({
//         stroke: '2px solid black',
//         targetArrow: new Arrow({ type: 'triangle', fill: 'black' })
//       }));
//     }
//   });

//   // Prepare group nodes based on types and prepare to group nodes
//   data.groups.forEach(group => {
//     // Create or get the existing group node for the type
//     if (!typeToGroupNodeMap.has(group.type)) {
//       const groupNode = graph.createGroupNode({
//         layout: new Rect(0, 0, 300, 200), // Give some initial size
//         style: new ShapeNodeStyle({
//           fill: 'lightgray',
//           stroke: 'black'
//         }),
//         labels: [group.type]
//       });
//       typeToGroupNodeMap.set(group.type, groupNode);
//     }
//   });

//   // Assign nodes to the respective group nodes
//   data.nodes.forEach(node => {
//     const groupType = data.groups.find(g => g.id === node.id)?.type;
//     if (groupType) {
//       const groupNode = typeToGroupNodeMap.get(groupType);
//       if (groupNode) {
//         const individualNode = nodesMap.get(node.id);
//         if (individualNode) {
//           graph.setParent(individualNode, groupNode);
//         }
//       }
//     }
//   });

//   // Fit the graph to ensure all elements are visible
//   graphComponent.fitGraphBounds();
// }

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
  LayoutExecutor,
  GroupNodeStyle,
  InteriorLabelModel,
  SolidColorFill,
  Stroke,
  CircularLayout,
  OrganicLayout,
  OrthogonalLayout
} from 'yfiles'
import { enableFolding } from './lib/FoldingSupport'
import './lib/yFilesLicense'
import { initializeGraphOverview } from './graph-overview'
import { initializeTooltips } from './tooltips'
import { exportDiagram } from './diagram-export'
import { initializeContextMenu } from './context-menu'
import { initializeGraphSearch } from './graph-search'

document.addEventListener('DOMContentLoaded', async () => {
  const graphComponent = await initializeGraphComponent()
  initializeToolbar(graphComponent)
  addQuerySubmissionListener(graphComponent)
  initializeGraphOverview(graphComponent)
  initializeTooltips(graphComponent)
  initializeContextMenu(graphComponent)
  initializeGraphSearch(graphComponent)
  exportDiagram(graphComponent, 'svg')
  exportDiagram(graphComponent, 'png')
  exportDiagram(graphComponent, 'pdf')
  document.getElementById('btn-increase-zoom')!.click()
  document.getElementById('btn-decrease-zoom')!.click()
  document.getElementById('btn-fit-graph')!.click()
})

async function initializeGraphComponent(): Promise<GraphComponent> {
  const graphComponent = new GraphComponent(document.querySelector('.graph-component-container')!)
  graphComponent.inputMode = new GraphViewerInputMode()
  await loadGraph(graphComponent)
  graphComponent.fitGraphBounds()
  return graphComponent
}

function initializeToolbar(graphComponent: GraphComponent) {
  const layoutDropdown = document.querySelector('.dropdown-menu');
  if (layoutDropdown) {
    layoutDropdown.addEventListener('click', function(event) {
      // Ensure that the event target is an HTMLElement to access HTMLElement-specific properties
      const target = event.target as HTMLElement;
      if (target && target.tagName === 'A') {
        const layoutType = target.getAttribute('data-layout');
        if (layoutType) {
          applyLayout(graphComponent, layoutType);
        }
      }
    });
  }

  document.getElementById('btn-increase-zoom')!.addEventListener('click', () => {
    ICommand.INCREASE_ZOOM.execute(null, graphComponent)
  })
  document.getElementById('btn-decrease-zoom')!.addEventListener('click', () => {
    ICommand.DECREASE_ZOOM.execute(null, graphComponent)
  })
  document.getElementById('btn-fit-graph')!.addEventListener('click', () => {
    ICommand.FIT_GRAPH_BOUNDS.execute(null, graphComponent)
  })
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
  let layout;
  switch (layoutType) {
    case 'hierarchic':
      layout = new HierarchicLayout();
      break;
    case 'organic':
      layout = new OrganicLayout();
      break;
    case 'orthogonal':
      layout = new OrthogonalLayout();
      break;
    case 'circular':
      layout = new CircularLayout();
      break;
    default:
      layout = new HierarchicLayout();
  }
  const executor = new LayoutExecutor({
    graphComponent,
    layout,
    duration: 500  // Duration in milliseconds
  });
  executor.start().catch(error => console.error('Layout execution failed:', error));
}


function applyGraphData(
  graphComponent: GraphComponent,
  data: { nodes: any[]; edges: any[]; groups: any[] }
) {
  const graph = graphComponent.graph
  graph.clear()

  const nodesMap = new Map<string, INode>()
  const typeToGroupMap = new Map<string, INode>()

  // Create one group node per type
  data.groups.forEach((group) => {
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

  // Assign nodes to the group based on their type
  data.nodes.forEach((node) => {
    const groupNode = typeToGroupMap.get(node.type)
    const nodeSize = new Size(Math.random() * 50 + 30, Math.random() * 30 + 20)
    const newNode = graph.createNode(
      groupNode,
      new Rect(new Point(Math.random() * 800, Math.random() * 500), nodeSize),
      new ShapeNodeStyle({
        fill: 'lightblue',
        stroke: 'black',
        shape: 'rectangle'
      })
    )
    graph.addLabel(newNode, node.label)
    nodesMap.set(node.id, newNode)
  })

  // Create edges
  data.edges.forEach((edge) => {
    const sourceNode = nodesMap.get(edge.source)
    const targetNode = nodesMap.get(edge.target)
    if (sourceNode && targetNode) {
      const newEdge = graph.createEdge(
        sourceNode,
        targetNode,
        new PolylineEdgeStyle({
          stroke: '2px solid black',
          targetArrow: new Arrow({ type: 'triangle', fill: 'black' })
        })
      )
    }
  })

  // Adjust group nodes to enclose their children properly
  graph.nodes
    .filter((node) => graph.isGroupNode(node))
    .forEach((groupNode) => {
      graph.adjustGroupNodeLayout(groupNode)
    })

  // Fit the graph to ensure all elements are visible
  graphComponent.fitGraphBounds()
}
