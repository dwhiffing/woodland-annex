import { ATTRIBUTES, DIRECTIONS, getDebugText, TILE_SIZE } from '../constants'
import { Slot } from './Slot'

export class Tile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, index = 0) {
    super(scene, x * TILE_SIZE, y * TILE_SIZE, 'tiles', index)
    this._x = x
    this._y = y
    this.scene = scene
    this.index = index
    this.setOrigin(0.5)
    this.setDepth(10)
    this.setInteractive()
    this.scene.input.setDraggable(this)
    this.scene.add.existing(this)
    this.setScrollFactor(0)
    this._attributes = ATTRIBUTES[index]
    this.unhover()
    this.on('pointerover', this.hover)
    this.on('pointerout', this.unhover)

    getDebugText(this.scene, x, y)
  }

  get attributes() {
    const tileAngle = (this.angle < 0 ? this.angle + 360 : this.angle) / 90
    const result = rotate(this._attributes, -tileAngle)
    return result
  }

  disable() {
    this.disabled = true
    this.scene.input.setDraggable(this, false)
    this.setDepth(1)
    this.addSlots()
    this.unhover()
  }

  unhover() {
    this.setAlpha(0.7)
  }

  hover() {
    if (this.disabled) return
    this.setAlpha(1)
  }

  addSlots() {
    this.setScrollFactor(1)
    this.placed = true
    this.scene.board[`${this._x},${this._y}`] = this

    DIRECTIONS.forEach(([x, y], index) => {
      const key = `${this._x + x},${this._y + y}`
      const item = this.scene.board[key]
      if (item) return copyAttributes(this, item, index)

      let temp = { attributes: [null, null, null, null] }
      copyAttributes(this, temp, index)
      this.scene.board[key] = new Slot(
        this.scene,
        this._x + x,
        this._y + y,
        temp.attributes,
      )
    })
  }
}

const copyAttributes = (source, target, direction) => {
  // direction is up, copy source top to target bottom
  if (direction === 0) target.attributes[2] = source.attributes[0]
  // direction is right, copy source right to target left
  if (direction === 1) target.attributes[3] = source.attributes[1]
  // direction is down, copy source bottom to target top
  if (direction === 2) target.attributes[0] = source.attributes[2]
  // direction is left, copy source left to target right
  if (direction === 3) target.attributes[1] = source.attributes[3]
}

const rotate = function (arr, n) {
  n = n % arr.length
  return arr.slice(n, arr.length).concat(arr.slice(0, n))
}
