import { TILE_SIZE } from '../constants'

export class Slot extends Phaser.GameObjects.Zone {
  constructor(scene, x, y) {
    super(scene, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
    this._x = x
    this._y = y

    this.scene = scene
    this.setDropZone()
    this.setOrigin(0.5)
    // this.setCollideWorldBounds(true, 0.2, 0.2)
    this.sprite = new Phaser.GameObjects.Sprite(
      scene,
      x * TILE_SIZE,
      y * TILE_SIZE,
      'tiles',
    )

    this.sprite.setOrigin(0.5)
    this.sprite.setTintFill(0x00ff00)
    scene.add.existing(this.sprite)
    this.sprite.setDepth(0)
  }
  destroy() {
    this.sprite.destroy()
    super.destroy()
  }
}
