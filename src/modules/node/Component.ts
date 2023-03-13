export interface Component {
  new (props: Record<string, any>): Component
}

export abstract class Component {
  node!: Node
  props: Record<string, any>

  constructor(props: any) {
    this.props = props as this['props']
  }

  connect(node: Node) {}
}
