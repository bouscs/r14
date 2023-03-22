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

export type WatchEvents = {
  // export type WatchEvents<T extends Node> = {
  //   [K in keyof T as `set(${string & K})`]: NodeEvent & {
  //     value: T[K]
  //     previous: T[K]
  //   }
}

export type GetEvents<T extends AnyNode> = T['$events'] extends object
  ? Record<string | number | symbol, NodeEvent> &
      NodeEventTypes &
      T['$events'] &
      T['$components']['$events']
  : Record<string | number | symbol, NodeEvent> &
      NodeEventTypes &
      T['$components']['$events']
