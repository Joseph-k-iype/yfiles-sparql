import { project } from './Projection'
import {
  buildEdgeCreator,
  buildEdgesSourceData,
  buildGraph,
  buildLabelConfiguration,
  buildNodeCreator,
  buildNodesSourceData,
} from './GraphBuilder'
import { arrange } from './Layout'

export default async function loadGraph() {
  const labelConfiguration = await buildLabelConfiguration({
    textBinding: (item) => item.name,
    placement: () => 'topright',
    fill: () => '#eeeeee',
  })
  const nodeCreator = await buildNodeCreator([labelConfiguration], {
    styleProvider: 'GroupNodeStyle',
    fill: () => '#eeeeee',
    shape: () => 'rectangle',
    stroke: () => '#242265',
    tabFill: () => '#242265',
  })
  const labelConfiguration2 = await buildLabelConfiguration({
    textBinding: (item) => item.name,
    placement: () => 'top',
    fill: () => '#333333',
  })
  const labelConfiguration3 = await buildLabelConfiguration({
    textBinding: (item) => item.position,
    placement: () => 'bottom',
    fill: () => '#eeeeee',
  })
  const nodeCreator2 = await buildNodeCreator(
    [labelConfiguration3, labelConfiguration2],
    {
      width: () => 160,
      height: () => 50,
      styleProvider: 'ShapeNodeStyle',
      fill: () => 'dodgerblue',
      shape: () => 'rectangle',
      stroke: () => 'dodgerblue',
    }
  )
  const labelConfiguration4 = await buildLabelConfiguration({
    textBinding: (item) => item.label,
    placement: () => 'center',
    fill: () => '#eee',
  })
  const edgeCreator = await buildEdgeCreator([labelConfiguration4], {
    stroke: () => '#CC0000',
    sourceArrow: () => 'none',
    targetArrow: () => 'default',
  })
  const value =
    '{\n  "nodes": [\n    {\n      "id": 0,\n      "group": "group0",\n      "position": "Chief Executive Officer",\n      "name": "Eric Joplin",\n      "email": "ejoplin@yoyodyne.com",\n      "phone": "555-0100",\n      "fax": "555-0101",\n      "businessUnit": "Executive Unit",\n      "status": "present",\n      "icon": "#usericon_male1"\n    },\n    {\n      "id": 1,\n      "group": "group1",\n      "position": "Vice President of Engineering",\n      "name": "Mildred Shark",\n      "email": "mshark@yoyodyne.com",\n      "phone": "555-0156",\n      "fax": "555-0157",\n      "businessUnit": "Engineering",\n      "status": "present",\n      "icon": "#usericon_female2"\n    },\n    {\n      "id": 2,\n      "group": "group1",\n      "position": "Engineering Manager",\n      "name": "Martha Barnes",\n      "email": "mbarnes@yoyodyne.com",\n      "phone": "555-0158",\n      "fax": "555-0159",\n      "businessUnit": "Engineering",\n      "status": "present",\n      "icon": "#usericon_female3"\n    },\n    {\n      "id": 3,\n      "group": "group10",\n      "position": "Senior Tool Designer",\n      "name": "Maria Dossantos",\n      "email": "mdossantos@yoyodyne.com",\n      "phone": "555-0160",\n      "fax": "555-0161",\n      "businessUnit": "Engineering",\n      "status": "present",\n      "icon": "#usericon_female1"\n    },\n    {\n      "id": 4,\n      "group": "group10",\n      "position": "Tool Designer",\n      "name": "Hector Donald",\n      "email": "hdonald@yoyodyne.com",\n      "phone": "555-0162",\n      "fax": "555-0163",\n      "businessUnit": "Engineering",\n      "status": "present",\n      "icon": "#usericon_male2"\n    },\n    {\n      "id": 5,\n      "group": "group10",\n      "position": "Tool Designer",\n      "name": "Michelle Douglas",\n      "email": "mdouglas@yoyodyne.com",\n      "phone": "555-0228",\n      "fax": "555-0229",\n      "businessUnit": "Engineering",\n      "status": "present",\n      "icon": "#usericon_female3"\n    },\n    {\n      "id": 6,\n      "group": "group10",\n      "position": "Tool Designer",\n      "name": "Bonnie Penney",\n      "email": "bpenney@yoyodyne.com",\n      "phone": "555-0234",\n      "fax": "555-0235",\n      "businessUnit": "Engineering",\n      "status": "present",\n      "icon": "#usericon_female1"\n    },\n    {\n      "id": 7,\n      "group": "group10",\n      "position": "Tool Designer",\n      "name": "Francis Webster",\n      "email": "fwebster@yoyodyne.com",\n      "phone": "555-0236",\n      "fax": "555-0237",\n      "businessUnit": "Engineering",\n      "status": "present",\n      "icon": "#usericon_male2"\n    },\n    {\n      "id": 8,\n      "group": "group10",\n      "position": "Tool Designer",\n      "name": "Gregory Arnold",\n      "email": "garnold@yoyodyne.com",\n      "phone": "555-0238",\n      "fax": "555-0239",\n      "businessUnit": "Engineering",\n      "status": "present",\n      "icon": "#usericon_male3"\n    },\n    {\n      "id": 9,\n      "group": "group11",\n      "position": "Senior Design Engineer",\n      "name": "Laurie Aitken",\n      "email": "laitken@yoyodyne.com",\n      "phone": "555-0164",\n      "fax": "555-0165",\n      "businessUnit": "Engineering",\n      "status": "present",\n      "icon": "#usericon_female2"\n    },\n    {\n      "id": 10,\n      "group": "group11",\n      "position": "Design Engineer",\n      "name": "Carla Clark",\n      "email": "cclark@yoyodyne.com",\n      "phone": "555-0242",\n      "fax": "555-0243",\n      "businessUnit": "Engineering",\n      "status": "unavailable",\n      "icon": "#usericon_female3"\n    },\n    {\n      "id": 11,\n      "group": "group11",\n      "position": "Design Engineer",\n      "name": "Cynthia Judd",\n      "email": "cjudd@yoyodyne.com",\n      "phone": "555-0244",\n      "fax": "555-0245",\n      "businessUnit": "Engineering",\n      "status": "unavailable",\n      "icon": "#usericon_female1"\n    },\n    {\n      "id": 12,\n      "group": "group11",\n      "position": "Design Engineer",\n      "name": "Robert Finn",\n      "email": "rfinn@yoyodyne.com",\n      "phone": "555-0246",\n      "fax": "555-0247",\n      "businessUnit": "Engineering",\n      "status": "present",\n      "icon": "#usericon_male2"\n    },\n    {\n      "id": 13,\n      "group": "group11",\n      "position": "Design Engineer",\n      "name": "Willie Schaub",\n      "email": "wschaub@yoyodyne.com",\n      "phone": "555-0248",\n      "fax": "555-0249",\n      "businessUnit": "Engineering",\n      "status": "present",\n      "icon": "#usericon_male3"\n    },\n    {\n      "id": 14,\n      "group": "group11",\n      "position": "Design Engineer",\n      "name": "Edwin Nagy",\n      "email": "enagy@yoyodyne.com",\n      "phone": "555-0166",\n      "fax": "555-0167",\n      "businessUnit": "Engineering",\n      "status": "present",\n      "icon": "#usericon_male1"\n    },\n    {\n      "id": 15,\n      "group": "group12",\n      "position": "R & D Manager",\n      "name": "John Payne",\n      "email": "jpayne@yoyodyne.com",\n      "phone": "555-0168",\n      "fax": "555-0169",\n      "businessUnit": "Engineering",\n      "status": "present",\n      "icon": "#usericon_male2"\n    },\n    {\n      "id": 16,\n      "group": "group12",\n      "position": "R & D Engineer",\n      "name": "Rana Oxborough",\n      "email": "roxborough@yoyodyne.com",\n      "phone": "555-0176",\n      "fax": "555-0177",\n      "businessUnit": "Engineering",\n      "status": "present",\n      "icon": "#usericon_female3"\n    },\n    {\n      "id": 17,\n      "group": "group12",\n      "position": "R & D Engineer",\n      "name": "Gary Olsen",\n      "email": "golsen@yoyodyne.com",\n      "phone": "555-0178",\n      "fax": "555-0179",\n      "businessUnit": "Engineering",\n      "status": "present",\n      "icon": "#usericon_male1"\n    },\n    {\n      "id": 18,\n      "group": "group12",\n      "position": "R & D Engineer",\n      "name": "Matthew Finney",\n      "email": "mfinney@yoyodyne.com",\n      "phone": "555-0206",\n      "fax": "555-0207",\n      "businessUnit": "Engineering",\n      "status": "travel",\n      "icon": "#usericon_male2"\n    },\n    {\n      "id": 19,\n      "group": "group12",\n      "position": "R & D Engineer",\n      "name": "Julius Kelly",\n      "email": "jkelly@yoyodyne.com",\n      "phone": "555-0208",\n      "fax": "555-0209",\n      "businessUnit": "Engineering",\n      "status": "present",\n      "icon": "#usericon_male3"\n    },\n    {\n      "id": 20,\n      "group": "group12",\n      "position": "R & D Engineer",\n      "name": "Charles Wylam",\n      "email": "cwylam@yoyodyne.com",\n      "phone": "555-0212",\n      "fax": "555-0213",\n      "businessUnit": "Engineering",\n      "status": "present",\n      "icon": "#usericon_male1"\n    }\n  ],\n\n  "edges": [\n    {\n      "fromNode": 0,\n      "toNode": 1\n    },\n    {\n      "fromNode": 1,\n      "toNode": 2\n    },\n    {\n      "fromNode": 2,\n      "toNode": 3\n    },\n    {\n      "fromNode": 2,\n      "toNode": 9\n    },\n    {\n      "fromNode": 2,\n      "toNode": 15\n    },\n    {\n      "fromNode": 3,\n      "toNode": 4\n    },\n    {\n      "fromNode": 3,\n      "toNode": 5\n    },\n    {\n      "fromNode": 3,\n      "toNode": 6\n    },\n    {\n      "fromNode": 3,\n      "toNode": 7\n    },\n    {\n      "fromNode": 3,\n      "toNode": 8\n    },\n    {\n      "fromNode": 9,\n      "toNode": 10\n    },\n    {\n      "fromNode": 9,\n      "toNode": 11\n    },\n    {\n      "fromNode": 9,\n      "toNode": 12\n    },\n    {\n      "fromNode": 9,\n      "toNode": 13\n    },\n    {\n      "fromNode": 9,\n      "toNode": 14\n    },\n    {\n      "fromNode": 15,\n      "toNode": 16\n    },\n    {\n      "fromNode": 15,\n      "toNode": 17\n    },\n    {\n      "fromNode": 15,\n      "toNode": 18\n    },\n    {\n      "fromNode": 15,\n      "toNode": 19\n    },\n    {\n      "fromNode": 15,\n      "toNode": 20\n    }\n  ],\n\n  "groups": [\n    { "id": "group0", "name": "Board" },\n    { "id": "group1", "name": "Engineering"  },\n    {\n      "id": "group10",\n      "parentGroup": "group1",\n      "name": "Design"\n    },\n    {\n      "id": "group11",\n      "parentGroup": "group1",\n      "name": "R & D"\n    },\n    {\n      "id": "group12",\n      "parentGroup": "group1",\n      "name": "Tools"\n    }\n  ]\n}\n'
  const data = JSON.parse(value)
  const out = await project(data, { binding: (item) => item.groups })
  const nodesSource = await buildNodesSourceData(
    { data: out, nodeCreator },
    {
      idProvider: (item) => item.id,
      parentIdProvider: (item) => item.parentGroup,
    }
  )
  const out2 = await project(data, { binding: (item) => item.edges })
  const edgesSource = await buildEdgesSourceData(
    { data: out2, edgeCreator },
    {
      sourceIdProvider: (item) => item.fromNode,
      targetIdProvider: (item) => item.toNode,
    }
  )
  const out3 = await project(data, { binding: (item) => item.nodes })
  const nodesSource2 = await buildNodesSourceData(
    { data: out3, nodeCreator: nodeCreator2 },
    { idProvider: (item) => item.id, parentIdProvider: (item) => item.group }
  )
  const graph = await buildGraph({
    nodesSources: [nodesSource2, nodesSource],
    edgesSources: [edgesSource],
  })
  const out4 = await arrange(graph, {
    worker: true,
    name: 'HierarchicLayout',
    properties: {
      layoutOrientation: 'left-to-right',
      integratedEdgeLabeling: true,
      nodeToNodeDistance: 55,
      automaticEdgeGrouping: true,
      minimumLayerDistance: 0,
    },
  })

  return out4
}
