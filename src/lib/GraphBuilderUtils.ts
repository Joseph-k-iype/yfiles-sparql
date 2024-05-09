import {
  DefaultLabelStyle,
  Fill,
  GroupNodeLabelModel,
  ILabelModelParameter,
  InteriorLabelModel,
  LabelCreator,
  NinePositionsEdgeLabelModel,
  ObjectBindings,
} from 'yfiles'

import type { FillConvertible } from 'yfiles'

export enum LabelPlacement {
  /*
   * Do not change the case of enum values. They are used for string comparison
   * with "toLowerCase" method asLayoutParameter
   */

  // node values (used for bound node label placement and text node _and_ edge label placement)
  TopLeft = 'topleft',
  Top = 'top',
  TopRight = 'topright',
  Left = 'left',
  Center = 'center',
  Right = 'right',
  Bottom = 'bottom',
  BottomLeft = 'bottomleft',
  BottomRight = 'bottomright',

  // edge values (used for bound edge label placement)
  SourceAbove = 'sourceabove',
  CenteredAbove = 'centeredabove',
  TargetAbove = 'targetabove',
  SourceCentered = 'sourcecentered',
  CenterCentered = 'centercentered',
  TargetCentered = 'targetcentered',
  SourceBelow = 'sourcebelow',
  CenteredBelow = 'centeredbelow',
  TargetBelow = 'targetbelow',
}

export function asLayoutParameterForNodes(placement: string) {
  if (!placement) {
    return InteriorLabelModel.CENTER
  }
  placement.replace('_', '')
  switch (placement.toLowerCase()) {
    case LabelPlacement.TopLeft:
      return InteriorLabelModel.NORTH_WEST
    case LabelPlacement.Top:
      return InteriorLabelModel.NORTH
    case LabelPlacement.TopRight:
      return InteriorLabelModel.NORTH_EAST
    case LabelPlacement.Left:
      return InteriorLabelModel.WEST
    case LabelPlacement.Center:
      return InteriorLabelModel.CENTER
    case LabelPlacement.Right:
      return InteriorLabelModel.EAST
    case LabelPlacement.BottomLeft:
      return InteriorLabelModel.SOUTH_WEST
    case LabelPlacement.Bottom:
      return InteriorLabelModel.SOUTH
    case LabelPlacement.BottomRight:
      return InteriorLabelModel.SOUTH_EAST
    default:
      return InteriorLabelModel.CENTER
  }
}

export function asLayoutParameterForGroupNodes(placement: string) {
  // we just let the label sit in the tab position
  return new GroupNodeLabelModel().createDefaultParameter()
}

export function asLayoutParameterForEdges(placement: string) {
  if (!placement) {
    return NinePositionsEdgeLabelModel.CENTER_BELOW
  }
  placement.replace('_', '')
  switch (placement.toLowerCase()) {
    case LabelPlacement.TopLeft:
    case LabelPlacement.SourceAbove:
      return NinePositionsEdgeLabelModel.SOURCE_ABOVE
    case LabelPlacement.CenteredAbove:
    case LabelPlacement.Top:
      return NinePositionsEdgeLabelModel.CENTER_ABOVE
    case LabelPlacement.TargetAbove:
    case LabelPlacement.TopRight:
      return NinePositionsEdgeLabelModel.TARGET_ABOVE
    case LabelPlacement.SourceCentered:
    case LabelPlacement.Left:
      return NinePositionsEdgeLabelModel.SOURCE_CENTERED
    case LabelPlacement.CenterCentered:
    case LabelPlacement.Center:
      return NinePositionsEdgeLabelModel.CENTER_CENTERED
    case LabelPlacement.TargetCentered:
    case LabelPlacement.Right:
      return NinePositionsEdgeLabelModel.TARGET_CENTERED
    case LabelPlacement.SourceBelow:
    case LabelPlacement.BottomLeft:
      return NinePositionsEdgeLabelModel.SOURCE_BELOW
    case LabelPlacement.CenteredBelow:
    case LabelPlacement.Bottom:
      return NinePositionsEdgeLabelModel.CENTER_BELOW
    case LabelPlacement.TargetBelow:
    case LabelPlacement.BottomRight:
      return NinePositionsEdgeLabelModel.TARGET_BELOW
    default:
      return NinePositionsEdgeLabelModel.CENTER_BELOW
  }
}

export type LabelConfiguration<T> = {
  labelsBinding?: (dataItem: T) => any
  textBinding?: (dataItem: any) => string | null
  placement?: (dataItem: any) => string
  fill?: (dataItem: any) => Fill | FillConvertible
}

export function configureLabelCreator<T>(
  labelConfiguration: LabelConfiguration<T>,
  labelCreator: LabelCreator<T>,
  layoutParameterProvider: (placement: string) => ILabelModelParameter
) {
  labelCreator.defaults.style = new DefaultLabelStyle()
  labelCreator.defaults.shareStyleInstance = false

  const placementBinding = labelConfiguration.placement
  if (placementBinding) {
    labelCreator.layoutParameterProvider = (item: T) => {
      return layoutParameterProvider(placementBinding(item))
    }
  }
  maybeAddBinding(
    labelCreator.styleBindings,
    'textFill',
    labelConfiguration.fill
  )
}

export function maybeAddBinding(
  bindings: ObjectBindings<unknown>,
  propertyName: string = 'fill',
  provider: ((dataItem: any) => unknown) | any
): void {
  if (provider) {
    bindings.addBinding(propertyName, provider)
  }
}
