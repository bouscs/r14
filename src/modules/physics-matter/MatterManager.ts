import { bound } from 'aureamorum'
import { RepeaterEngine } from '../engine'
import * as Matter from 'matter-js'

export class MatterManager {
  engine: RepeaterEngine

  matterEngine: Matter.Engine

  render: Matter.Render

  constructor(engine: RepeaterEngine) {
    this.engine = engine

    this.matterEngine = Matter.Engine.create()
    this.matterEngine.gravity.y = -10

    this.engine.clock.on('fixedUpdate', this.step)

    Matter.Composite.add(this.matterEngine.world, [
      Matter.Bodies.rectangle(400, 0, 800, 50, { isStatic: true }),
      Matter.Bodies.rectangle(400, 600, 800, 50, { isStatic: true }),
      Matter.Bodies.rectangle(800, 300, 50, 600, { isStatic: true }),
      Matter.Bodies.rectangle(0, 300, 50, 600, { isStatic: true })
    ])

    this.render = Matter.Render.create({
      element: document.body,
      engine: this.matterEngine
    })
    Matter.Render.run(this.render)
  }

  @bound
  step() {
    Matter.Engine.update(
      this.matterEngine,
      this.engine.clock.fixedTimeStep * 1000
    )
  }
}
