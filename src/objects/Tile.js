import { TILE_SIZE } from '../constants'
import { Slot } from './Slot'

export class Tile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, index) {
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
  }

  disable() {
    this.scene.input.setDraggable(this, false)
    this.setDepth(1)
    this.addSlots()
  }

  addSlots() {
    this.setScrollFactor(1)
    this.placed = true
    this.scene.board[`${this._x},${this._y}`] = true

    DIRECTIONS.forEach(([x, y]) => {
      if (!this.scene.board[`${this._x + x},${this._y + y}`]) {
        new Slot(this.scene, this._x + x, this._y + y)
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
  [2, 1, 1, 2],
  [2, 0, 1, 1],
  [2, 1, 1, 1],
  [2, 2, 1, 2],
]
