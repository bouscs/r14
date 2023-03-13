import * as Matter from 'matter-js'
import { engine } from '../../main'
import { Component, FixedUpdateEvent, Node } from '../node'
import { Vector3 } from 'three'

export class Body2D extends Component {
  matterBody: Matter.Body
  shape?: Matter.Body

  constructor(node: Node, props: any) {
    super(node, props)

    this.matterBody = Matter.Body.create({
      position: {
        x: this.node.position.x * 10,
        y: this.node.position.y * 10
      },
      parts: []
    })
    Matter.World.add(engine.matter.matterEngine.world, this.matterBody)
  }

  setShape(shape: Matter.Body) {
    if (this.shape) {
      Matter.World.remove(engine.matter.matterEngine.world, this.shape)

      Matter.Body.setParts(this.matterBody, [])
    }

    this.shape = shape

    // const shape2 = Matter.Bodies.circle(
    //   this.node.position.x * 10 + 50,
    //   this.node.position.y * 10 + 50,
    //   100,
    //   {}
    // )
    Matter.World.add(engine.matter.matterEngine.world, this.shape)
    // Matter.World.add(engine.matter.matterEngine.world)

    Matter.Body.setParts(this.matterBody, [this.shape])
  }

  @Component.on('fixedUpdate')
  fixedUpdate() {
    const local = this.node.worldToLocal(
      new Vector3(
        this.matterBody.position.x,
        this.matterBody.position.y,
        this.node.position.z
      )
    )
    this.node.localPosition.set(local.x, local.y, this.node.position.z)
    this.node.localRotation.setFromAxisAngle(
      new Vector3(0, 0, 1),
      this.matterBody.angle
    )
  }
}
