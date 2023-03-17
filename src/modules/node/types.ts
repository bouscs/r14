import { Node, NodeEvent, NodeEventListener } from '.'

export type NodeEventCallback<EventData = any> = (
  e: EventData
) => void | ((listener: NodeEventListener) => void)

export type FixedUpdateEvent = NodeEvent & {
  time: number
}

export type UpdateEvent = NodeEvent & {
  time: number
  delta: number
}

export type NodeTemplate = {
  (): Node | Node[]
}

export type AnyNode = Node & {
  $events: any
  $components: any
}

export interface NodeEventTypes {
  destroy: NodeEvent
  fixedUpdate: FixedUpdateEvent
  update: UpdateEvent
  awake: NodeEvent
  start: NodeEvent
}

export type GetEvents<T extends AnyNode> = T['$events'] &
  NodeEventTypes &
  T['$components']['$events']
