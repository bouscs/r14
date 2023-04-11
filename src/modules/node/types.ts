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

export interface NodeEventTypes extends Record<string | number, NodeEvent> {
  destroy: NodeEvent
  fixedUpdate: FixedUpdateEvent
  preUpdate: UpdateEvent
  update: UpdateEvent
  awake: NodeEvent
  start: NodeEvent
  add: NodeEvent & {
    parent: Node
    child: Node
  }
  parentChanged: NodeEvent & {
    parent: Node | null
  }
  [key: `set(${string})`]: NodeEvent & {
    value: any
    previous: any
  }
}

export type GetEvents<T extends Node> = NodeEventTypes &
  (T['$events'] extends Record<string | number, NodeEvent>
    ? T['$events']
    : NodeEventTypes) &
  (T['$components']['$events'] extends Record<string | number, NodeEvent>
    ? T['$components']['$events']
    : NodeEventTypes)
