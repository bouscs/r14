import { EventEmitter, Signal } from 'aureamorum'
import { Node, NodeEventTypes } from './Node'
import { NodeEventListener } from './NodeEventListener'

export interface ComponentProps {}

export interface Component {
  new (node: Node, props: Record<string, any>): Component
}

export abstract class Component<N extends Node = Node> {
  node!: N
  props: ComponentProps

  declare $events: NodeEventTypes

  static on<
    This extends Component,
    EventName extends keyof This['node']['$events']
  >(
    event: EventName,
    options: {
      once?: boolean
      until?: (this: This) => Signal | [EventEmitter, string]
    } = {}
  ) {
    return (
      originalMethod: (
        this: This,
        e: This['node']['$events'][EventName]
      ) =>
        | void
        | ((
            listener: NodeEventListener<
              EventName,
              This['node']['$events'][EventName]
            >
          ) => void),
      context: ClassMethodDecoratorContext<
        This,
        (
          this: This,
          e: This['node']['$events'][EventName]
        ) =>
          | void
          | ((
              listener: NodeEventListener<
                EventName,
                This['node']['$events'][EventName]
              >
            ) => void)
      >
    ) => {
      context.addInitializer(function (this: This) {
        let listener: NodeEventListener<
          EventName,
          This['node']['$events'][EventName]
        >
        if (options.once) {
          listener = this.node.once(
            event as any,
            originalMethod.bind(this) as any
          )
        } else {
          listener = this.node.on(
            event as any,
            originalMethod.bind(this) as any
          )
        }

        listener.until(this.node.destroySignal)

        if (options.until) {
          const until = options.until.call(this)
          if (until instanceof Signal) {
            listener.until(until)
          } else {
            ;(listener as any).until(until[0], until[1])
          }
        }
      })
    }
  }

  constructor(node: N, props: ComponentProps) {
    this.props = props

    this.node = node

    this.node.components.push(this)
  }
}
