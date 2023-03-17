import { Node } from '../node'
import { Collider2D } from './Collider2D'
import * as planck from 'planck'

export interface CircleCollider2DProps {
  radius: number
}

export class CircleCollider2D extends Collider2D {
  declare props: CircleCollider2DProps

  constructor(node: Node, props: CircleCollider2DProps) {
    super(node, props)
  }

  createFixture(): planck.Fixture {
    return this.body!.createFixture(planck.Circle(this.props.radius), {
      density: 1,
      friction: 0.3
    })
  }
}
