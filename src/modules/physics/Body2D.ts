import * as planck from 'planck'
import * as THREE from 'three'

import { Component, Node, NodeEvent } from '../node'
import { engine } from '..'

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

  @Component.on('set(localPosition)')
  onSetLocalPosition(e: NodeEvent & { value: THREE.Vector3 }) {
    this.body.setPosition(new planck.Vec2(e.value.x, e.value.y))
  }

  @Component.on('fixedUpdate')
  fixedUpdate() {
    this.node.position = new THREE.Vector3(
      this.body.getPosition().x,
      this.body.getPosition().y,
      this.node.position.z
    )
    // console.log(this.node.position)
    this.node.rotation = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0, 0, this.body.getAngle())
    )
  }
}
