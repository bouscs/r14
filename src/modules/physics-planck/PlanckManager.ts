import * as planck from 'planck'
import { engine } from '..'
import { bound } from 'aureamorum'

export class PlanckManager {
  world: planck.World

  worldBounds: planck.Body

  constructor() {
    const gravity = planck.Vec2(0, -9.81)
    this.world = planck.World({
      gravity
    })

    engine.clock.on('fixedUpdate', this.step)

    this.worldBounds = this.world.createBody({ type: 'static' })
    this.worldBounds.createFixture(
      planck.Edge(planck.Vec2(4, 3), planck.Vec2(-4, 3))
    )
    this.worldBounds.createFixture(
      planck.Edge(planck.Vec2(-4, 3), planck.Vec2(-4, -3))
    )
    this.worldBounds.createFixture(
      planck.Edge(planck.Vec2(-4, -3), planck.Vec2(4, -3))
    )
    this.worldBounds.createFixture(
      planck.Edge(planck.Vec2(4, -3), planck.Vec2(4, 3))
    )

    console.log(this.worldBounds)
  }

  @bound
  step() {
    this.world.step(engine.clock.fixedTimeStep)
  }
}