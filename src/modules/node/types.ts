import { Node, NodeEventTypes } from './Node'
import { NodeEvent } from './NodeEvent'
import { NodeEventListener } from './NodeEventListener'

export type NodeEventCallback<
  Events extends NodeEventTypes = NodeEventTypes,
  EventName extends keyof Events = any
> = (
  e: Events[EventName]
) => void | ((listener: NodeEventListener<Events, EventName>) => void)

export type FixedUpdateEvent = NodeEvent & {
  time: number
}

export type NodeEvents<N extends Node> = N extends Node<infer E> ? E : never
