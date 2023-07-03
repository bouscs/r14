import { Component, Node } from '../node'

import * as planck from 'planck'
import { Body2D } from './Body2D'
import { bound } from 'aureamorum'
import { Collider2D } from './Collider2D'

export interface BoxCollider2DProps {
  width: number
  height: number
  offset?: [number, number]
}

export class BoxCollider2D extends Collider2D {
  declare props: BoxCollider2DProps

  constructor(node: Node, props: BoxCollider2DProps) {
    super(node, props)
  }

  createFixture(): planck.Fixture {
    return this.body!.createFixture(
      planck.Polygon([
        planck.Vec2(
          (this.props.offset?.[0] ?? 0) - this.props.width / 2,
          (this.props.offset?.[1] ?? 0) - this.props.height / 2
        ),
        planck.Vec2(
          (this.props.offset?.[0] ?? 0) + this.props.width / 2,
          (this.props.offset?.[1] ?? 0) - this.props.height / 2
        ),
        planck.Vec2(
          (this.props.offset?.[0] ?? 0) + this.props.width / 2,
          (this.props.offset?.[1] ?? 0) + this.props.height / 2
        ),
        planck.Vec2(
          (this.props.offset?.[0] ?? 0) - this.props.width / 2,
          (this.props.offset?.[1] ?? 0) + this.props.height / 2
        )
      ]),
      {
        density: 1,
        friction: 0.3
      }
    )
  }
}
