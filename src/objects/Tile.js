import { getDebugText, TILE_SIZE } from '../constants'
import { Slot } from './Slot'

export class Tile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, index = 0) {
    super(scene, x * TILE_SIZE, y * TILE_SIZE, 'tiles', index)
    this._x = x
    this._y = y
    this.scene = scene
    this.setOrigin(0.5)
    this.setDepth(10)
    this.setInteractive()
    this.scene.input.setDraggable(this)
    this.scene.add.existing(this)
    this.setScrollFactor(0)
    this.attributes = ATTRIBUTES[index]
    this.unhover()
    this.on('pointerover', this.hover)
    this.on('pointerout', this.unhover)

    getDebugText(this.scene, x, y)
  }

  getAttributes = () => {
    const tileAngle = (this.angle < 0 ? this.angle + 360 : this.angle) / 90
    const result = rotate(this.attributes, -tileAngle)
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
    const _attributes = this.getAttributes()
    this.scene.board[`${this._x},${this._y}`] = _attributes

    DIRECTIONS.forEach(([x, y], index) => {
      let attributes = [null, null, null, null]
      if (index === 0) attributes[2] = _attributes[0]
      if (index === 1) attributes[3] = _attributes[1]
      if (index === 2) attributes[0] = _attributes[2]
      if (index === 3) attributes[1] = _attributes[3]
      const key = `${this._x + x},${this._y + y}`
      const data = this.scene.board[key]
      if (!data) {
        new Slot(this.scene, this._x + x, this._y + y, attributes)
        this.scene.board[key] = attributes
      } else {
        if (index === 0) this.scene.board[key][2] = _attributes[0]
        if (index === 1) this.scene.board[key][3] = _attributes[1]
        if (index === 2) this.scene.board[key][0] = _attributes[2]
        if (index === 3) this.scene.board[key][1] = _attributes[3]
      }
    })
  }
}

const DIRECTIONS = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
]

const ATTRIBUTES = [
  [0, 0, 0, 0],
  [0, 0, 1, 0],
  [1, 0, 1, 0],
  [0, 1, 1, 0],
  [1, 1, 1, 0],
  [1, 1, 1, 1],
  [2, 0, 0, 0],
  [2, 0, 0, 2],
  [2, 0, 2, 0],
  [0, 2, 0, 2],
  [2, 2, 0, 2],
  [2, 2, 2, 2],
  [2, 1, 0, 1],
  [2, 0, 1, 1],
  [2, 1, 1, 2],
  [2, 1, 1, 1],
  [2, 2, 1, 2],
]

const rotate = function (arr, n) {
  n = n % arr.length
  return arr.slice(n, arr.length).concat(arr.slice(0, n))
}
