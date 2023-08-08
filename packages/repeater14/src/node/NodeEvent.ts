import { Node } from './Node'

export class NodeEvent {
  type = 'event'

  stoppedPropagation = false

  stoppedImmediatePropagation = false

  target: Node
}
