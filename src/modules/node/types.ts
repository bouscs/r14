import { Node } from './Node'
import { NodeEvent } from './NodeEvent'
import { NodeEventListener } from './NodeEventListener'

export type NodeEventCallback<
  Events extends Node['$events'] = Node['$events'],
  EventName extends keyof Events = any
> = (
  e: Events[EventName]
) => void | ((listener: NodeEventListener<Events, EventName>) => void)

export type FixedUpdateEvent = NodeEvent & {
  time: number
}
