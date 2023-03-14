import { Component, Node } from '../node'

import * as planck from 'planck'
import { Body2D } from './Body2D'
import { bound } from 'aureamorum'

export interface BoxCollider2DProps {
  width: number
  height: number
  offset?: [number, number]
}

export class BoxCollider2D extends Component {
  width: number
  height: number
  offset: [number, number]

  fixture?: planck.Fixture
  body?: planck.Body

  constructor(node: Node, props: BoxCollider2DProps) {
    super(node, props)
    this.width = props.width
    this.height = props.height
    this.offset = props.offset || [0, 0]

    this.updateFixture()
  }

  @bound
  updateFixture() {
    if (this.body) {
      this.body.destroyFixture(this.fixture!)
    }

    this.body = this.node.getComponent(Body2D).body

    if (this.body) {
      this.fixture = this.body.createFixture(
        planck.Polygon([
          planck.Vec2(
            this.offset[0] - this.width / 2,
            this.offset[1] - this.height / 2
          ),
          planck.Vec2(
            this.offset[0] + this.width / 2,
            this.offset[1] - this.height / 2
          ),
          planck.Vec2(
            this.offset[0] + this.width / 2,
            this.offset[1] + this.height / 2
          ),
          planck.Vec2(
            this.offset[0] - this.width / 2,
            this.offset[1] + this.height / 2
          )
        ]),
        {
          density: 1,
          friction: 0.3
        }
      )
    }
  }
}
