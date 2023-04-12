import { Class, EventEmitter, Signal } from 'aureamorum'
import { Node } from './Node'
import { NodeEventListener } from './NodeEventListener'
import { AnyNode, GetEvents } from './types'
import { NodeEvent } from './NodeEvent'

export interface ComponentProps {}

export type ComponentNode<T extends Component> = Node & {
  $components: T
}

export abstract class Component {
  node!: Node
  props: ComponentProps

  declare $events: unknown

  static define<C extends Class<Component>>(
    componentClass: C,
    props: ConstructorParameters<C>[1]
  ) {
    return function (this: Node<InstanceType<C>>) {
      return new componentClass(this, props) as InstanceType<C>
    }
  }

  static on<
    This extends Component,
    EventName extends keyof GetEvents<This['node']>
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
        e: GetEvents<This['node']>[EventName]
      ) => void | ((listener: NodeEventListener) => void),
      context: ClassMethodDecoratorContext<
        This,
        (
          this: This,
          e: GetEvents<This['node']>[EventName]
        ) => void | ((listener: NodeEventListener) => void)
      >
    ) => {
      context.addInitializer(function (this: This) {
        let listener: NodeEventListener
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

  constructor(node: Node, props: ComponentProps) {
    this.props = props

    this.node = node

    this.node.components.push(this)
  }
}
