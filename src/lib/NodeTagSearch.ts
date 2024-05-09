import GraphSearch from './GraphSearch'
import { GraphComponent, INode } from 'yfiles'

export default class NodeTagSearch extends GraphSearch {
  constructor(graphComponent: GraphComponent) {
    super(graphComponent)
  }

  matches(node: INode, text: string): boolean {
    const labelMatch = super.matches(node, text)
    if (labelMatch) {
      return true
    }
    if (node.tag) {
      const data = node.tag
      return Object.keys(data).some((key) => {
        const value = data[key]
        if (typeof value === 'string') {
          return value.toLowerCase().indexOf(text.toLowerCase()) !== -1
        }
        return false
      })
    }
    return false
  }
}
