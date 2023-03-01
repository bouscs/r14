import { Node } from './Node'
import { NodeEvent } from './NodeEvent'
import { NodeEventListener } from './NodeEventListener'

export type NodeEventCallback<
  N extends Node = any,
  EventName extends keyof N['$events'] = any
> = (
  e: N['$events'][EventName]
) => void | ((listener: NodeEventListener<N, EventName>) => void)

export type FixedUpdateEvent = NodeEvent & {
  time: number
}
