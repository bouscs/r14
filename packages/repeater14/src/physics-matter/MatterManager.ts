import { bound } from 'bouscs-util'
import { RepeaterEngine } from '../engine'
import * as Matter from 'matter-js'

export class MatterManager {
  engine: RepeaterEngine
  matterEngine: Matter.Engine
  render: Matter.Render

  constructor(engine: RepeaterEngine) {
    this.engine = engine

    this.matterEngine = Matter.Engine.create()
    this.matterEngine.gravity.y = 10 * this.engine.clock.fixedTimeStep

    this.engine.clock.on('fixedUpdate', this.step)

    Matter.Composite.add(this.matterEngine.world, [
      Matter.Bodies.rectangle(4, 0, 8, 0.5, { isStatic: true }),
      Matter.Bodies.rectangle(4, -6, 8, 0.5, { isStatic: true }),
      Matter.Bodies.rectangle(8, -3, 0.5, 6, { isStatic: true }),
      Matter.Bodies.rectangle(0, -3, 0.5, 6, { isStatic: true })
    ])

    this.render = Matter.Render.create({
      element: document.body,
      engine: this.matterEngine,
      bounds: {
        max: {
          x: 8,
          y: 0
        },
        min: {
          x: 0,
          y: -6
        }
      },
      options: {
        showDebug: true
      }
    })
    Matter.Render.setPixelRatio(this.render, 'auto' as any)
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
