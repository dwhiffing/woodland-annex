import { Tile } from '../objects/Tile'

export default class extends Phaser.Scene {
  constructor() {
    super({ key: 'Game' })
  }

  init() {
    this.width = this.cameras.main.width
    this.height = this.cameras.main.height
  }

  create() {
    this.cameras.main.setZoom(1)
    this.cameras.main.centerOn(0, 0)

    // Create initial tile
    this.board = {}
    const tile = new Tile(this, 0, 0)
    this.add.existing(tile)
    tile.disable()

    this.drawCards()

    this.input.keyboard.on('keydown-SPACE', () => {
      this.draggingTile.angle += 90
    })

    // TODO: making zoom work will take a bunch of random adjustments
    // this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
    //   this.cameras.main.zoom -= deltaY * 0.001
    //   this.cameras.main.zoom = Phaser.Math.Clamp(this.cameras.main.zoom, 0.5, 2)
    // })

    this.input.on('pointermove', this.pointerMove)
    this.input.on('pointerdown', this.pointerDown)
    this.input.on('pointerup', this.pointerUp)
    this.input.on('dragstart', this.dragStart)
    this.input.on('drag', this.drag)
    this.input.on('drop', this.drop)
    this.input.on('dragend', this.dragEnd)
  }

  drawCards = () => {
    this.cards = []
    for (let i = 0; i < 6; i++) {
      const frame = Phaser.Math.RND.between(0, 16)
      this.cards.push(new Tile(this, i + 1.5, 7, frame))
    }
  }

  pointerMove = (pointer) => {
    if (this.draggingTile) return
    const zoomFactor = 1 / this.cameras.main.zoom
    if (this.draggingCamera) {
      this.cameras.main.scrollX =
        this._cameraX + (this._dragX - pointer.x) * zoomFactor
      this.cameras.main.scrollY =
        this._cameraY + (this._dragY - pointer.y) * zoomFactor
    }
  }

  pointerDown = (pointer) => {
    if (this.draggingTile) return
    this.draggingCamera = true
    this._dragX = pointer.x
    this._dragY = pointer.y
    this._cameraX = this.cameras.main.scrollX
    this._cameraY = this.cameras.main.scrollY
  }

  pointerUp = (_, tile) => {
    if (this.draggingTile) return
    this.draggingCamera = false
  }

  dragStart = (_, tile) => {
    this.draggingTile = tile
    tile.startX = tile.x
    tile.startY = tile.y
  }

  drag = (_, tile, dragX, dragY) => {
    tile.x = dragX
    tile.y = dragY
  }

  drop = (_, tile, zone) => {
    tile.x = zone.sprite.x
    tile.y = zone.sprite.y
    tile._x = zone._x
    tile._y = zone._y
    this.cards = this.cards.filter((c) => c !== tile)
    if (this.cards.length === 0) this.drawCards()

    tile.disable()
    zone.destroy()
  }

  dragEnd = (_, tile) => {
    this.draggingTile = false
    if (tile.placed) return
    tile.x = tile.startX
    tile.y = tile.startY
  }
}
