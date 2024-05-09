
import type {
  FillConvertible,
  GeneratorLike,
  IdProviderConvertible,
  PointConvertible,
  RectConvertible,
  ShapeNodeShapeStringValues,
  StrokeConvertible,
} from 'yfiles'
import {
  Arrow,
  ArrowType,
  DefaultLabelStyle,
  EdgeCreator,
  EdgePathLabelModel,
  Fill,
  GraphBuilder,
  GroupNodeStyle,
  GroupNodeStyleTabPosition,
  IArrow,
  IGraph,
  ImageNodeStyle,
  InteriorLabelModel,
  LabelCreator,
  NodeCreator,
  Point,
  PolylineEdgeStyle,
  Rect,
  ShapeNodeShape,
  ShapeNodeStyle,
  ShapeNodeStyleRenderer,
  Size,
  StringTemplateNodeStyle,
  Stroke,
} from 'yfiles'

import type { LabelConfiguration } from './GraphBuilderUtils'
import {
  asLayoutParameterForEdges,
  asLayoutParameterForGroupNodes,
  asLayoutParameterForNodes,
  configureLabelCreator,
  maybeAddBinding,
} from './GraphBuilderUtils'

// start node-visualization-component-imports
// Please do not delete this comment!
// On app export, node visualization component import are added here.
// end node-visualization-component-imports

export type IdProvider<T> =
  | ((dataItem: T, canonicalId?: any | null) => any)
  | IdProviderConvertible<T>

export type EdgesSourceData<T> = {
  data: T[]
  idProvider: IdProvider<T>
  sourceIdProvider: ((dataItem: T) => any) | string
  targetIdProvider: ((dataItem: T) => any) | string
  edgeCreator?: EdgeCreator<any>
}

export type NodesSourceData<T> = {
  data: T[]
  idProvider: IdProvider<T>
  parentIdProvider?: ((dataItem: T) => any) | string
  nodeCreator?: NodeCreator<any>
}

export type NodeCreatorConfiguration<T> = {
  template?: string
  tagProvider?: ((dataItem: T) => any) | null
  isGroupProvider?: ((dataItem: T) => boolean) | null
  layout?: ((dataItem: T) => Rect | RectConvertible) | null
  x?: ((dataItem: T) => number) | null
  y?: ((dataItem: T) => number) | null
  width?: ((dataItem: T) => number) | null
  height?: ((dataItem: T) => number) | null
  styleProvider: NodeStyle
  fill?: ((dataItem: T) => Fill | FillConvertible) | null
  shape?: ((dataItem: T) => ShapeNodeShape | ShapeNodeShapeStringValues) | null
  stroke?: ((dataItem: T) => Stroke | StrokeConvertible) | null
  tabFill?: ((dataItem: T) => Fill | FillConvertible) | null
  tabBackgroundFill?: ((dataItem: T) => Fill | FillConvertible) | null
  image?: ((dataItem: T) => string | null | undefined) | null
  templateFileNumber?: string
}

export type NodeStyle =
  | 'ShapeNodeStyle'
  | 'ImageNodeStyle'
  | 'TemplateNodeStyle'
  | 'VueJSNodeStyle'
  | 'GroupNodeStyle'
  | 'ReactHtmlNodeStyle'
  | 'ReactSvgNodeStyle'

export type EdgesSourceDataConfiguration<T> = {
  idProvider?: IdProvider<T>
  sourceIdProvider?: ((dataItem: T) => any) | string
  targetIdProvider?: ((dataItem: T) => any) | string
}

export function buildEdgesSourceData<T = any>(
  state: { data: T[]; edgeCreator?: EdgeCreator<any> },
  configuration: EdgesSourceDataConfiguration<T>
): EdgesSourceData<T> {
  return {
    data: state.data,
    idProvider: configuration.idProvider!,
    sourceIdProvider: configuration.sourceIdProvider!,
    targetIdProvider: configuration.targetIdProvider!,
    edgeCreator: state.edgeCreator,
  }
}

export type NodesSourceDataConfiguration<T = any> = {
  idProvider?: IdProvider<T> | null
  parentIdProvider?: ((dataItem: T) => any) | string
}

export function buildNodesSourceData<T = any>(
  state: { data: T[]; nodeCreator?: NodeCreator<any> },
  configuration: NodesSourceDataConfiguration<T>
): NodesSourceData<T> {
  return {
    data: state.data,
    idProvider: configuration.idProvider!,
    parentIdProvider: configuration.parentIdProvider!,
    nodeCreator: state.nodeCreator,
  }
}

export function createLabelCreator<T = any>(
  labelConfiguration: LabelConfiguration<T>,
  nodes: boolean
): LabelCreator<T> {
  const creator = new LabelCreator<T>()
  configureLabelCreator(
    labelConfiguration,
    creator,
    nodes ? asLayoutParameterForNodes : asLayoutParameterForEdges
  )
  return creator
}

export function buildNodeCreator<T = any>(
  labelConfigurations: LabelConfiguration<any>[] | undefined,
  configuration: NodeCreatorConfiguration<T>
): NodeCreator<T> {
  const nodeCreator = newConfiguredNodeCreator<T>()

  if (configuration.styleProvider === 'ImageNodeStyle') {
    nodeCreator.styleProvider = (item: any) => {
      return new ImageNodeStyle({ image: configuration.image!(item) })
    }
  } else if (configuration.styleProvider === 'ShapeNodeStyle') {
    maybeAddBinding(
      nodeCreator.styleBindings,
      'fill',
      makeEmptyValueNull(configuration.fill)
    )
    maybeAddBinding(
      nodeCreator.styleBindings,
      'stroke',
      makeEmptyValueNull(configuration.stroke)
    )

    const shapeBinding = configuration.shape
    if (shapeBinding) {
      nodeCreator.styleProvider = (item: any) => {
        return new ShapeNodeStyle({
          shape: shapeBinding(item),
          stroke: null,
          fill: null,
        })
      }
    }
  } else if (configuration.styleProvider === 'VueJSNodeStyle') {
    const vuejsNodeStyle = null
    nodeCreator.styleProvider = () => vuejsNodeStyle
  } else if (configuration.styleProvider === 'ReactSvgNodeStyle') {
    if (configuration.template) {
      const jsx = createReactRenderFunction(configuration.template || '<g></g>')
      const reactNodeStyle = null
      nodeCreator.styleProvider = () => reactNodeStyle
    } else if (configuration.templateFileNumber) {
      // start node-visualization-component-nodestyle-svg
      // Please do not delete this comment!
      // On app export, the node style is instantiated via the imports at the top.
      nodeCreator.styleProvider = () => null
      // end node-visualization-component-nodestyle-svg
    } else {
      throw new Error(
        'Node creator configuration missing both template _and_ componentFile'
      )
    }
  } else if (configuration.styleProvider === 'ReactHtmlNodeStyle') {
    if (configuration.template) {
      const jsx = createReactRenderFunction(
        configuration.template || '<div></div>'
      )
      const reactNodeStyle = null
      nodeCreator.styleProvider = () => reactNodeStyle
    } else if (configuration.templateFileNumber) {
      // start node-visualization-component-nodestyle-html
      // Please do not delete this comment!
      // On app export, the node style is instantiated via the imports at the top.
      nodeCreator.styleProvider = () => null
      // end node-visualization-component-nodestyle-html
    } else {
      throw new Error(
        'Node creator configuration missing both template _and_ componentFile'
      )
    }
  } else if (configuration.styleProvider === 'TemplateNodeStyle') {
    const stringTemplateNodeStyle = new StringTemplateNodeStyle({
      svgContent: configuration.template || '<g/>',
    })
    nodeCreator.styleProvider = () => stringTemplateNodeStyle
  } else if (configuration.styleProvider === 'GroupNodeStyle') {
    maybeAddBinding(
      nodeCreator.styleBindings,
      'contentAreaFill',
      makeEmptyValueNull(configuration.fill)
    )
    maybeAddBinding(
      nodeCreator.styleBindings,
      'stroke',
      makeEmptyValueNull(configuration.stroke)
    )
    maybeAddBinding(
      nodeCreator.styleBindings,
      'tabFill',
      makeEmptyValueNull(configuration.tabFill)
    )

    nodeCreator.styleProvider = (item: any) => {
      return new GroupNodeStyle({
        tabPosition: GroupNodeStyleTabPosition.TOP,
        stroke: 'black',
        contentAreaFill: null,
        tabFill: 'black',
        contentAreaInsets: 10,
      })
    }
  }

  if (configuration.layout) {
    // @ts-ignore layoutProvider expects Provider<Rect> while layout is Provider<Rect|RectConvertible>
    nodeCreator.layoutProvider = configuration.layout
  }
  maybeAddBinding(nodeCreator.layoutBindings, 'x', configuration.x)
  maybeAddBinding(nodeCreator.layoutBindings, 'y', configuration.y)
  maybeAddBinding(nodeCreator.layoutBindings, 'width', configuration.width)
  maybeAddBinding(nodeCreator.layoutBindings, 'height', configuration.height)

  if (configuration.tagProvider) {
    nodeCreator.tagProvider = configuration.tagProvider
  }

  if (configuration.isGroupProvider) {
    nodeCreator.isGroupPredicate = configuration.isGroupProvider
  }

  if (labelConfigurations) {
    applyLabelConfiguration(
      labelConfigurations,
      nodeCreator,
      true,
      configuration.styleProvider === 'GroupNodeStyle'
    )
  }

  return nodeCreator
}

function makeEmptyValueNull<T>(
  binding:
    | ((dataItem: T) => Fill | FillConvertible | Stroke | StrokeConvertible)
    | null
    | undefined
) {
  return (dataItem: T) => {
    if (!binding) {
      return null
    }
    const result = binding(dataItem)
    if (typeof result === 'string' && result.trim().length === 0) {
      return null
    }
    return result
  }
}

/**
 * Wrap the user's JSX in a render function such that the user does not need to explicitly define the arrow function
 * but just the template.
 */
function createReactRenderFunction(userJsx: string): string {
  return `({width, height, detail, selected, tag}) => (<>${userJsx}</>)`
}

function applyLabelConfiguration<T>(
  labelConfigurations: LabelConfiguration<any>[],
  creator: EdgeCreator<T> | NodeCreator<T>,
  nodes: boolean,
  groupNodes: boolean = false
) {
  for (const labelConfiguration of labelConfigurations) {
    let labelCreator: LabelCreator<any>
    const labelsBinding = labelConfiguration.labelsBinding
    const textBinding = labelConfiguration.textBinding
    if (textBinding) {
      if (labelsBinding) {
        labelCreator = creator.createLabelsSource({
          data: labelsBinding,
          text: textBinding,
        }).labelCreator
      } else {
        labelCreator = creator.createLabelBinding(textBinding)
      }
      configureLabelCreator(
        labelConfiguration,
        labelCreator,
        nodes
          ? groupNodes
            ? asLayoutParameterForGroupNodes
            : asLayoutParameterForNodes
          : asLayoutParameterForEdges
      )
    }
  }
}

function getArrow(
  arrowBinding: ((dataItem: any) => any) | null | undefined,
  item: any
): ArrowType {
  return arrowBinding ? arrowBinding(item) : ArrowType.NONE
}

function getStroke(
  binding: ((dataItem: any) => string | null | undefined) | null | undefined,
  item: any
): Stroke | null {
  if (binding) {
    const strokeString = binding(item)
    if (strokeString) {
      return Stroke.from(strokeString)
    }
  }
  return null
}

function createArrow(
  arrowBinding: ((dataItem: any) => any) | null | undefined,
  strokeBinding: ((dataItem: any) => any) | null | undefined,
  item: any
): Arrow {
  const stroke = getStroke(strokeBinding, item)
  return new Arrow({
    type: getArrow(arrowBinding, item),
    fill: stroke ? stroke.fill : null,
    stroke: stroke
      ? new Stroke({ fill: stroke.fill, lineCap: 'square' })
      : null,
    scale: stroke ? stroke.thickness : 1,
  })
}

export type EdgeCreatorConfiguration<T> = {
  tagProvider?: (dataItem: T) => any
  stroke?: (dataItem: T) => Stroke | StrokeConvertible
  sourceArrow?: (dataItem: T) => string
  targetArrow?: (dataItem: T) => string
  bendsProvider?:
    | ((
        dataItem: T
      ) =>
        | Point[]
        | PointConvertible[]
        | Iterable<Point | PointConvertible>
        | (() => GeneratorLike<Point | PointConvertible>)
        | null
        | undefined)
    | null
}

export function buildEdgeCreator<T = any>(
  labelConfigurations: LabelConfiguration<any>[] | undefined,
  configuration: EdgeCreatorConfiguration<T>
): EdgeCreator<any> {
  const edgeCreator = newConfiguredEdgeCreator<T>()

  const edgeDefaults = edgeCreator.defaults
  edgeDefaults.shareStyleInstance = false

  if (configuration.tagProvider) {
    edgeCreator.tagProvider = configuration.tagProvider
  }

  maybeAddBinding(
    edgeCreator.styleBindings,
    'stroke',
    makeEmptyValueNull(configuration.stroke)
  )
  maybeAddBinding(edgeCreator.styleBindings, 'sourceArrow', (item: T) =>
    createArrow(
      configuration.sourceArrow,
      makeEmptyValueNull(configuration.stroke),
      item
    )
  )
  maybeAddBinding(edgeCreator.styleBindings, 'targetArrow', (item: T) =>
    createArrow(
      configuration.targetArrow,
      makeEmptyValueNull(configuration.stroke),
      item
    )
  )

  edgeCreator.styleProvider = () => {
    return new PolylineEdgeStyle({
      stroke: null,
      sourceArrow: IArrow.NONE,
      targetArrow: IArrow.NONE,
    })
  }

  if (configuration.bendsProvider) {
    edgeCreator.bendsProvider = configuration.bendsProvider
  }

  if (labelConfigurations) {
    applyLabelConfiguration(labelConfigurations, edgeCreator, false)
  }

  return edgeCreator
}

export function buildLabelConfiguration<T = any>(
  configuration: LabelConfiguration<T>
): LabelConfiguration<T> {
  return {
    labelsBinding: configuration.labelsBinding,
    textBinding: configuration.textBinding,
    placement: configuration.placement,
    fill: configuration.fill,
  }
}

export function buildGraph(state: {
  nodesSources: NodesSourceData<any>[]
  edgesSources?: EdgesSourceData<any>[]
}): IGraph {
  const builder = new GraphBuilder()

  for (const src of state.nodesSources) {
    if (!src.data) {
      continue
    }

    const nodesSource = builder.createNodesSource({
      data: src.data,
      id: src.idProvider,
      parentId: src.parentIdProvider,
    })
    nodesSource.nodeCreator = src.nodeCreator
      ? src.nodeCreator
      : newConfiguredNodeCreator()
  }

  for (const src of state.edgesSources || []) {
    if (!src.data) {
      continue
    }

    const edgesSource = builder.createEdgesSource(
      src.data,
      src.sourceIdProvider,
      src.targetIdProvider,
      src.idProvider || null
    )
    edgesSource.edgeCreator = src.edgeCreator
      ? src.edgeCreator
      : newConfiguredEdgeCreator()
  }

  builder.updateGraph()
  return builder.graph
}

function newConfiguredNodeCreator<T>(): NodeCreator<T> {
  const nodeCreator = new NodeCreator<T>()
  const nodeDefaults = nodeCreator.defaults
  nodeDefaults.style = new ShapeNodeStyle({
    shape: 'round-rectangle',
    fill: '#eee',
    stroke: '#323232',
  })
  ;(nodeDefaults.style
    .renderer as ShapeNodeStyleRenderer).roundRectArcRadius = 3
  nodeDefaults.shareStyleInstance = false
  nodeDefaults.size = new Size(60, 30)

  const labelDefaults = nodeDefaults.labels
  labelDefaults.style = new DefaultLabelStyle({
    textSize: 14,
    textFill: 'black',
  })
  labelDefaults.shareStyleInstance = true
  labelDefaults.layoutParameter = InteriorLabelModel.SOUTH
  return nodeCreator
}

function newConfiguredEdgeCreator<T>(): EdgeCreator<T> {
  const edgeCreator = new EdgeCreator<T>()
  const edgeDefaults = edgeCreator.defaults
  edgeDefaults.style = new PolylineEdgeStyle({
    stroke: '#eee',
    smoothingLength: 5,
    targetArrow: '#eee medium triangle',
  })
  edgeDefaults.shareStyleInstance = false

  const labelDefaults = edgeDefaults.labels
  labelDefaults.style = new DefaultLabelStyle({
    textSize: 12,
    textFill: '#eee',
  })
  labelDefaults.shareStyleInstance = true
  labelDefaults.layoutParameter = new EdgePathLabelModel({
    autoRotation: false,
  }).createRatioParameter()
  return edgeCreator
}
