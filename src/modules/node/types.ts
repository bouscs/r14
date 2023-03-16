import { Node, NodeEvent, NodeEventListener } from '.'

export type NodeEventCallback<
  EventName extends string | number | symbol = any,
  EventData = any
> = (
  e: EventData
) => void | ((listener: NodeEventListener<EventName, EventData>) => void)

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
}
