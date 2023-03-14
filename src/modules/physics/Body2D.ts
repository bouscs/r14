import * as planck from 'planck'
import * as THREE from 'three'

import { Component, Node } from '../node'
import { engine } from '../../main'

export interface Body2DProps {
  type?: 'static' | 'dynamic' | 'kinematic'
}

export class Body2D extends Component {
  body: planck.Body

  constructor(node: Node, props: Body2DProps = {}) {
    super(node, props)

    this.body = engine.planck.world.createBody({
      type: props.type ?? 'dynamic',
      position: planck.Vec2(node.position.x, node.position.y),
      angle: new THREE.Euler().setFromQuaternion(node.rotation).z
    })
  }

  @Component.on('fixedUpdate')
  fixedUpdate() {
    this.node.position = new THREE.Vector3(
      this.body.getPosition().x,
      this.body.getPosition().y,
      this.node.position.z
    )
    this.node.rotation = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0, 0, this.body.getAngle())
    )
  }
}
