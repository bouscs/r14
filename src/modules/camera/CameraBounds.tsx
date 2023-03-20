import { Vector3 } from 'three'
import { Component, Node } from '../node'
import { Body2D, BoxCollider2D } from '../physics'
import { Camera } from './Camera'

@Node.template(() => (
  <>
    <Node
      name="top"
      components={[
        Component.define(Body2D, { type: 'static' }),
        Component.define(BoxCollider2D, { width: 1, height: 1 })
      ]}
    />
    <Node
      name="right"
      components={[
        Component.define(Body2D, { type: 'static' }),
        Component.define(BoxCollider2D, { width: 1, height: 1 })
      ]}
    />
    <Node
      name="bottom"
      components={[
        Component.define(Body2D, { type: 'static' }),
        Component.define(BoxCollider2D, { width: 1, height: 1 })
      ]}
    />
    <Node
      name="left"
      components={[
        Component.define(Body2D, { type: 'static' }),
        Component.define(BoxCollider2D, { width: 1, height: 1 })
      ]}
    />
  </>
))
export class CameraBounds extends Node {
  name = 'CameraBounds'

  @Node.child('top')
  accessor top!: Node

  @Node.child('right')
  accessor right!: Node

  @Node.child('bottom')
  accessor bottom!: Node

  @Node.child('left')
  accessor left!: Node

  @Node.parent()
  accessor camera!: Camera

  @Node.on('awake')
  awake() {
    if (this.camera.props.mode === 'perspective')
      throw new Error('CameraBounds only works with orthographic cameras')

    const top = this.top.getComponent(BoxCollider2D)
    const right = this.right.getComponent(BoxCollider2D)
    const bottom = this.bottom.getComponent(BoxCollider2D)
    const left = this.left.getComponent(BoxCollider2D)

    top.props.width = this.camera.props.width
    top.props.offset = [0, this.camera.props.height / 2]
    right.props.height = this.camera.props.height
    right.props.offset = [this.camera.props.width / 2, 0]
    bottom.props.width = this.camera.props.width
    bottom.props.offset = [0, -this.camera.props.height / 2]
    left.props.height = this.camera.props.height
    left.props.offset = [-this.camera.props.width / 2, 0]

    top.updateFixture()
    right.updateFixture()
    bottom.updateFixture()
    left.updateFixture()
  }
}
