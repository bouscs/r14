import { Component, Node } from '../node'

import * as THREE from 'three'
import * as planck from 'planck'
import { bound } from 'aureamorum'
import { Body2D } from './Body2D'
import { engine } from '../engine'

export abstract class Collider2D extends Component {
  fixture?: planck.Fixture
  body?: planck.Body
  abstract createFixture(): planck.Fixture

  constructor(node: Node, props: any) {
    super(node, props)

    this.updateFixture()
  }

  @bound
  updateFixture() {
    if (this.body) {
      this.body.destroyFixture(this.fixture!)
    }

    this.body = this.node.getComponent(Body2D).body

    if (!this.body) {
      this.body = engine.planck.world.createBody({
        type: 'static'
      })
    }

    this.fixture = this.createFixture()
  }
}
