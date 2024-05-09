import './graph-search.css'
import { GraphComponent } from 'yfiles'
import NodeTagSearch from './lib/NodeTagSearch'

export function initializeGraphSearch(graphComponent: GraphComponent): void {
  const graphSearch = new NodeTagSearch(graphComponent)
  graphSearch.registerEventListener(
    document.getElementById('graph-search-input')!
  )
}
