import { getDebugText, TILE_SIZE } from '../constants'

export class Slot extends Phaser.GameObjects.Zone {
  constructor(scene, x, y, attributes) {
    super(scene, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
    this._x = x
    this._y = y
    this._attributes = attributes

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
    this.sprite.setTintFill(0x666666)
    scene.add.existing(this.sprite)
    this.sprite.setDepth(0)
    getDebugText(this.scene, x, y)
  }

  get attributes() {
    return this._attributes
  }

  destroy() {
    this.sprite.destroy()
    super.destroy()
  }

  hover() {
    this.sprite.setTintFill(0x999999)
  }

  unhover() {
    this.sprite.setTintFill(0x666666)
  }
}
