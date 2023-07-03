type Node = Record<string | number | symbol, any>
type DOMElement = Node

export namespace JSX {
  type Element = (() => Node) | (() => Node[])
  type EventFunctionAttributes<T extends Node> = {
    [Key in keyof Pick<T['$events'], string> as `on:${Key}`]: T['$events'][Key]
  }

  type A<T> = {
    [Key in T]: number
  }

  interface DOMAttributes<T extends Node>
    extends EventFunctionAttributes<T>,
      A<T> {
    test: number
  }

  interface HTMLAttributes<T extends Node> extends DOMAttributes<T> {}
}
