import { Node, NodeEventTypes } from './Node'
import { NodeEvent } from './NodeEvent'
import { NodeEventListener } from './NodeEventListener'

export type NodeEventCallback<
  EventName extends string | number | symbol = string | number | symbol,
  EventData = NodeEvent
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
