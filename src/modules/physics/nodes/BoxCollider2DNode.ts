import { Node, NodeProps } from '../../node'

export interface BoxCollider2DNodeProps extends NodeProps {
  width: number
  height: number
  offset?: [number, number]
}

export class BoxCollider2DNode extends Node {
  public width: number
  public height: number

  constructor(props: BoxCollider2DNodeProps) {
    super(props)

    this.width = props.width
    this.height = props.height
  }
}
