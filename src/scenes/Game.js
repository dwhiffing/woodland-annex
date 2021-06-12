import { DIRECTIONS, doesTileFit, isConnected } from '../constants'
import { Tile } from '../objects/Tile'
import pick from 'lodash/pick'

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
    this.roads = []
    const tile = new Tile(this, 0, 0)
    this.add.existing(tile)
    tile.disable()

    this.drawCards()

    this.input.keyboard.on('keydown-SPACE', () => {
      this.draggingTile.angle += 90
      if (this.draggingTile.angle >= 360) this.draggingTile.angle = 0
      this.resetSlots()
      this.hoverSlots(this.draggingTile)
    })

    this.lineGraphics = this.add.graphics()
    this.lineGraphics.lineStyle(10, 0x00ff00, 1)
    this.lineGraphics.setDepth(20)

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
      // const frame = Phaser.Math.RND.between(0, 16)
      const frame = Phaser.Math.RND.pick([
        3, 3, 3, 3, 3, 2, 2, 2, 2, 2, 1, 4, 4,
      ])
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
    this.hoverSlots(tile)
  }

  drag = (_, tile, dragX, dragY) => {
    tile.x = dragX
    tile.y = dragY
  }

  drop = (_, tile, zone) => {
    if (!doesTileFit(zone, tile)) return

    tile.x = zone.sprite.x
    tile.y = zone.sprite.y
    tile._x = zone._x
    tile._y = zone._y

    this.cards = this.cards.filter((c) => c !== tile)
    if (this.cards.length === 0) this.drawCards()

    this.resetSlots()

    const connectedTiles = this.getOpenNeighbours(tile).filter(
      (t) =>
        tile.attributes[t.index] !== 0 &&
        tile.attributes[t.index] === t.attributes[OPPOSITE[t.index]],
    )
    const connectedRoads = connectedTiles
      .map((tile) => tile.road)
      .filter((r) => !!r)
    connectedRoads.forEach((road) => {
      const index = road.findIndex((t) => connectedTiles[0] === t)
      tile.road = road
      if (index === 0) {
        road.unshift(tile)
      } else {
        road.push(tile)
      }
    })
    if (connectedRoads.length === 0 && connectedTiles.length > 0) {
      this.roads.push([tile, connectedTiles[0]])
      tile.road = this.roads[this.roads.length - 1]
      connectedTiles[0].road = tile.road
    }
    this.roads.forEach((r) => this.logTiles(r))
    tile.disable()
    zone.destroy()

    this.lineGraphics.clear()
    this.roads.forEach((road, roadIndex) => {
      this.lineGraphics.lineStyle(10, LINE_COLORS[roadIndex], 1)

      road.forEach((t, i, arr) => {
        const next = arr[i + 1]
        if (next) this.lineGraphics.lineBetween(t.x, t.y, next.x, next.y)
      })
    })
  }

  get tiles() {
    return Object.values(this.board).filter((t) => t.type === 'Sprite')
  }

  logTiles = (tiles) =>
    console.log(tiles.map((t) => pick(t, ['_x', '_y', 'attributes'])))

  getOpenNeighbours = (tile, tiles = this.tiles) =>
    this.getAdjacentTiles(tile, tiles)
      .map((t, index) => {
        if (t) t.index = index
        return t
      })
      .filter((t, i) => {
        if (!t || !t.open) return false
        if (i === 0) return t.open[2]
        if (i === 1) return t.open[3]
        if (i === 2) return t.open[0]
        if (i === 3) return t.open[1]
      })

  getAdjacentTiles = (tile, tiles = this.tiles) =>
    DIRECTIONS.map(([x, y]) =>
      tiles.find((t) => t._x === tile._x + x && t._y === tile._y + y),
    )

  dragEnd = (_, tile) => {
    this.draggingTile = false

    this.resetSlots()
    if (tile.placed) return
    tile.unhover()
    tile.x = tile.startX
    tile.y = tile.startY
  }

  hoverSlots(tile) {
    Object.values(this.board)
      .filter((v) => doesTileFit(v, tile))
      .forEach((s) => s.hover())
  }

  resetSlots() {
    Object.values(this.board).forEach((s) => s.unhover())
  }
}

const LINE_COLORS = [
  0xe6194b, 0x3cb44b, 0xffe119, 0x4363d8, 0xf58231, 0x911eb4, 0x46f0f0,
  0xf032e6, 0xbcf60c, 0xfabebe, 0x008080, 0xe6beff, 0x9a6324, 0xfffac8,
  0x800000, 0xaaffc3, 0x808000, 0xffd8b1, 0x000075, 0x808080, 0xffffff,
  0x000000,
]

const OPPOSITE = [2, 3, 0, 1]
