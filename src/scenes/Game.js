import { DIRECTIONS, doesTileFit } from '../constants'
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
        // 3, 3, 3, 3, 3, 2, 2, 2, 2, 2, 1, 4, 4,
        4, 4,
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
    tile.disable()
    zone.destroy()

    const groups = this.getLineGroup()
    console.log(groups.length)
    this.lineGraphics.clear()
    groups.forEach((g, groupIndex) => {
      this.logTiles(g, LINE_COLORS[groupIndex])
      this.lineGraphics.lineStyle(10, LINE_COLORS[groupIndex], 1)

      g.forEach((t, i) => {
        const next = g[i + 1]
        if (next) this.lineGraphics.lineBetween(t.x, t.y, next.x, next.y)
      })
    })
  }

  logTiles = (tiles, ...rest) =>
    console.log(
      tiles.map((t) => pick(t, ['_x', '_y', 'attributes'])),
      ...rest,
    )

  getNeighboursForTile = (tile, tiles) =>
    tile.attributes
      .map((a, i) => (a === 1 ? i : null))
      .filter((i) => typeof i === 'number')
      .map((dir) => {
        const [x, y] = DIRECTIONS[dir]
        return tiles.find((t) => t._x === tile._x + x && t._y === tile._y + y)
      })
      .filter((t) => !!t)

  getLineGroup = () => {
    const tiles = Object.values(this.board).filter((t) => t.type === 'Sprite')
    let lineTiles = tiles
      .filter((t) => t.attributes.includes(1))
      .sort((a, b) => {
        const aNeighbourCount = this.getNeighboursForTile(a, tiles).length
        const bNeighbourCount = this.getNeighboursForTile(b, tiles).length
        return aNeighbourCount - bNeighbourCount
      })
      .sort((a, b) => {
        if (
          (a.index === 4 && b.index === 4) ||
          (a.index !== 4 && b.index !== 4)
        )
          return 0
        return a.index === 4 ? 1 : -1
      })

    let groupIndex = 0
    let groups = [[]]
    while (lineTiles.length > 0) {
      let currentGroup = groups[groupIndex]
      let current = lineTiles.shift()
      while (current) {
        currentGroup.push(current)

        // look through remaining tiles in lineTiles to find one that connects to current
        const availableNeighbours = this.getNeighboursForTile(
          current,
          lineTiles,
        )
        current = availableNeighbours[0]
        if (current && current.index === 4) {
          currentGroup.push(current)
          current = null
        }
        lineTiles = lineTiles.filter(
          (t) => this.getNeighboursForTile(t, lineTiles).length > 0,
        )
      }

      groupIndex++
      groups.push([])
    }
    return groups.filter((g) => g.length > 1)
  }

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
  0x00ff00, 0xff0000, 0x0000ff, 0xff00ff, 0x00ffff, 0xffff00, 0xffffff,
  0x000000, 0x111, 0x222, 0x333, 0x444, 0x555, 0x666, 0x777, 0x888, 0x999,
]
