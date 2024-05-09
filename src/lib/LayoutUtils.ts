import type {
  CircularLayoutConfig,
  HierarchicLayoutConfig,
  INode,
  LayoutDescriptor,
  OrganicLayoutConfig,
  OrthogonalLayoutConfig,
  TreeLayoutConfig,
} from 'yfiles'
import {
  CircularLayout,
  DefaultNodePlacer,
  GenericLabeling,
  HierarchicLayout,
  HierarchicLayoutData,
  ILayoutAlgorithm,
  LayoutData,
  MinimumNodeSizeStage,
  OrganicLayout,
  OrganicLayoutData,
  OrthogonalLayout,
  PartitionGridData,
  TreeLayout,
  TreeReductionStage,
} from 'yfiles'

export type ExtendedTreeLayoutConfig = TreeLayoutConfig & {
  nodeDistance?: number
}
type GridDescriptor = {
  gridColumns?: ((nodeTag: any) => number) | null
  gridRows?: ((nodeTag: any) => number) | null
}
export type ExtendedHierarchicLayoutConfig = HierarchicLayoutConfig &
  GridDescriptor
export type ExtendedOrganicLayoutConfig = OrganicLayoutConfig & GridDescriptor
export type LayoutConfiguration = (
  | LayoutDescriptor
  | {
      name: 'TreeLayout'
      properties?: ExtendedTreeLayoutConfig
    }
  | {
      name: 'HierarchicLayout'
      properties?: ExtendedHierarchicLayoutConfig
    }
  | {
      name: 'OrganicLayout'
      properties?: ExtendedOrganicLayoutConfig
    }
) & {
  worker?: boolean
}

export function getAlgorithm(
  layoutDescriptor: LayoutDescriptor
): ILayoutAlgorithm {
  let layout: ILayoutAlgorithm
  switch (layoutDescriptor.name) {
    case 'OrganicLayout':
      layout = getOrganicLayout(layoutDescriptor.properties)
      break
    case 'OrthogonalLayout':
      layout = getOrthogonalLayout(layoutDescriptor.properties)
      break
    case 'CircularLayout':
      layout = getCircularLayout(layoutDescriptor.properties)
      break
    case 'TreeLayout':
      layout = getTreeLayout(
        layoutDescriptor.properties as ExtendedTreeLayoutConfig
      )
      break
    case 'HierarchicLayout':
    default:
      layout = getHierarchicLayout(
        layoutDescriptor.properties as HierarchicLayoutConfig
      )
      break
  }
  return new MinimumNodeSizeStage(layout)
}

function createNodeTagIndexFunction(
  bindingFunction: ((dataItem: any) => any) | null | undefined
): ((node: INode) => number | null) | null {
  if (bindingFunction) {
    return (node) => {
      const value = bindingFunction(node.tag)
      if (typeof value === 'undefined' || value === null) {
        return 0
      } else {
        return Number(value) | 0
      }
    }
  } else {
    return null
  }
}

function createPartitionGridData(
  configuration: LayoutConfiguration
): null | PartitionGridData {
  const properties = configuration.properties as
    | ExtendedHierarchicLayoutConfig
    | ExtendedOrganicLayoutConfig
  if (properties) {
    const columnFunction = createNodeTagIndexFunction(properties.gridColumns)
    const rowFunction = createNodeTagIndexFunction(properties.gridRows)
    if (columnFunction || rowFunction) {
      const gridData = new PartitionGridData()
      if (rowFunction) {
        gridData.rowIndices.delegate = rowFunction as (key: INode) => number
      }
      if (columnFunction) {
        gridData.columnIndices.delegate = columnFunction as (
          key: INode
        ) => number
      }
      return gridData
    }
  }
  return null
}

export function getLayoutData(
  configuration: LayoutConfiguration
): LayoutData | null {
  switch (configuration.name) {
    case 'OrganicLayout': {
      const partitionGridData = createPartitionGridData(configuration)
      if (partitionGridData !== null) {
        return new OrganicLayoutData({ partitionGridData })
      }
      break
    }
    case 'HierarchicLayout': {
      const partitionGridData = createPartitionGridData(configuration)
      if (partitionGridData !== null) {
        return new HierarchicLayoutData({ partitionGridData })
      }
      break
    }
  }
  return null
}

function getHierarchicLayout(
  configuration: ExtendedHierarchicLayoutConfig = {}
): ILayoutAlgorithm {
  const args = {
    ...configuration,
    orthogonalRouting:
      configuration.orthogonalRouting !== undefined
        ? configuration.orthogonalRouting
        : true,
  }
  delete args.gridColumns
  delete args.gridRows
  return new HierarchicLayout(args)
}

function getOrganicLayout(
  configuration: ExtendedOrganicLayoutConfig = {}
): ILayoutAlgorithm {
  const args = { ...configuration }
  delete args.gridColumns
  delete args.gridRows
  const layout = new OrganicLayout(args)
  ;(layout.labeling as GenericLabeling).placeEdgeLabels = true
  ;(layout.labeling as GenericLabeling).placeNodeLabels = false
  return layout
}

function getOrthogonalLayout(
  configuration: OrthogonalLayoutConfig = {}
): ILayoutAlgorithm {
  return new OrthogonalLayout({ ...configuration })
}

function getCircularLayout(
  configuration: CircularLayoutConfig = {}
): ILayoutAlgorithm {
  const layout = new CircularLayout({ ...configuration })
  ;(layout.labeling as GenericLabeling).placeEdgeLabels = true
  ;(layout.labeling as GenericLabeling).placeNodeLabels = false
  return layout
}

function getTreeLayout(
  configuration: ExtendedTreeLayoutConfig = {}
): ILayoutAlgorithm {
  const args = { ...configuration }
  delete args.nodeDistance
  const layout = new TreeLayout(args)

  const nodePlacer = layout.defaultNodePlacer as DefaultNodePlacer
  const nodeDistance = configuration.nodeDistance
  if (nodeDistance !== undefined) {
    nodePlacer.horizontalDistance = nodeDistance
    nodePlacer.verticalDistance = nodeDistance
  }
  return new TreeReductionStage(layout)
}

export function getLayoutDescriptor(
  configuration: LayoutConfiguration
): LayoutDescriptor {
  const descriptor = {
    ...configuration,
    properties: { ...configuration.properties },
  } as LayoutDescriptor
  if (
    configuration.name === 'OrganicLayout' ||
    configuration.name === 'HierarchicLayout'
  ) {
    const properties = descriptor.properties as
      | ExtendedOrganicLayoutConfig
      | ExtendedHierarchicLayoutConfig
    delete properties.gridColumns
    delete properties.gridRows
  }
  return descriptor
}
