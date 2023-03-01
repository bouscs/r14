import {
  EventArgs,
  EventEmitter,
  EventListOf,
  EventListener,
  Signal,
  bound
} from 'aureamorum'

export interface NodeEvents {
  destroy: () => void
  fixedUpdate: (time: number) => void
}

export type NodeEventsOf<T extends Node> = T extends Node<infer E> ? E : never

export class Node<EventList extends NodeEvents = NodeEvents> {
  destroySignal = new Signal({ once: true })

  private _listeners: {
    [K in keyof EventList]?: Set<
      (...args: any[]) => void | ((listener: EventListener) => void)
    >
  } = {}

  private _onceListeners: {
    [K in keyof EventList]?: Set<
      (...args: any[]) => void | ((listener: EventListener) => void)
    >
  } = {}

  static on<
    EventList extends NodeEvents,
    This extends Node<EventList>,
    EventName extends keyof NodeEventsOf<This>
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
        ...args: EventArgs<NodeEventsOf<This>, EventName>
      ) =>
        | void
        | ((listener: EventListener<NodeEventsOf<This>, EventName>) => void),
      context: ClassMethodDecoratorContext<
        This,
        (
          this: This,
          ...args: EventArgs<NodeEventsOf<This>, EventName>
        ) =>
          | void
          | ((listener: EventListener<NodeEventsOf<This>, EventName>) => void)
      >
    ) => {
      context.addInitializer(function (this: This) {
        let listener: EventListener<NodeEventsOf<This>, EventName>
        if (options.once) {
          listener = this.once(event as any, originalMethod.bind(this)) as any
        } else {
          listener = this.on(event as any, originalMethod.bind(this)) as any
        }

        listener.until(this.destroySignal)

        if (options.until) {
          const until = options.until.call(this)
          if (until instanceof Signal) {
            listener.until(until)
          } else {
            listener.until(until[0], until[1])
          }
        }
      })
    }
  }

  on<EventName extends keyof EventList>(
    eventName: EventName,
    listener: EventList[EventName]
  ): EventListener<EventList, EventName> {
    if (!this._listeners[eventName]) {
      this._listeners[eventName] = new Set()
    }

    this._listeners[eventName]!.add(listener as any)

    return new EventListener(
      this as unknown as EventEmitter,
      eventName as any,
      listener as any
    ) as any
  }

  once<EventName extends keyof EventList>(
    eventName: EventName,
    listener: EventList[EventName]
  ): EventListener<EventList, EventName> {
    if (!this._onceListeners[eventName]) {
      this._onceListeners[eventName] = new Set()
    }

    this._onceListeners[eventName]!.add(listener as any)

    return new EventListener(
      this as unknown as EventEmitter,
      eventName as any,
      listener as any
    ) as any
  }

  off<EventName extends keyof EventList>(
    eventName: EventName,
    listener: EventList[EventName]
  ): void {
    if (this._listeners[eventName]) {
      this._listeners[eventName]!.delete(listener as any)

      if (this._listeners[eventName]!.size === 0) {
        delete this._listeners[eventName]
      }
    }

    if (this._onceListeners[eventName]) {
      this._onceListeners[eventName]!.delete(listener as any)

      if (this._onceListeners[eventName]!.size === 0) {
        delete this._onceListeners[eventName]
      }
    }
  }

  emit<EventName extends keyof EventList>(
    eventName: EventName,
    ...args: EventArgs<EventList, EventName>
  ): void {
    const callListener = (
      listener: (
        ...args: any[]
      ) =>
        | void
        | ((
            listener: EventListener<
              Record<string, (...args: any[]) => void>,
              any
            >
          ) => void)
    ) => {
      const result = listener(...args)

      if (typeof result === 'function') {
        result(new EventListener(this as any, eventName as any, listener))
      }
    }

    if (this._listeners[eventName]) {
      for (const listener of this._listeners[eventName]!) {
        callListener(listener)
      }
    }

    if (this._onceListeners[eventName]) {
      for (const listener of this._onceListeners[eventName]!) {
        callListener(listener)
      }

      this._onceListeners[eventName]!.clear()

      delete this._onceListeners[eventName]
    }
  }

  @bound
  free() {
    this.destroySignal.call()
  }
}
