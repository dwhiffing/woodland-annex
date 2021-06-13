import { DIRECTIONS, doesTileFit, isConnected } from '../constants'
import { Tile } from '../objects/Tile'
import pick from 'lodash/pick'
import { uniqBy } from 'lodash'

export default class extends Phaser.Scene {
  constructor() {
    super({ key: 'Game' })
  }

  init() {
    this.width = this.cameras.main.width
    this.height = this.cameras.main.height
    this.timerText = this.add.text(this.width / 2, 20, '0', { fontSize: 100 })
    this.timerText.setScrollFactor(0)
    this.timerText.setDepth(30)
    this.timerText.setAlpha(0)
    this.pickupSound = this.sound.add('pickup', { volume: 0.3 })
    this.dropSound = this.sound.add('drop', { volume: 0.4 })
    this.placeSound = this.sound.add('place', { volume: 0.4 })
  }

  create() {
    this.cameras.main.setZoom(1)
    this.cameras.main.centerOn(250, 200)

    // Create initial tile
    this.board = {}
    this.roads = []
    this.levelIndex = 0
    const tile = new Tile(this, 0, 0, 9, 0)
    this.add.existing(tile)
    tile.disable()

    this.addVillage()
    this.drawCards()

    this.input.keyboard.on('keydown-Z', () => {
      this.drawCards()
    })

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

  addVillage = () => {
    // const index = Phaser.Math.RND.pick(VILLAGES)
    LEVELS[this.levelIndex].villages.forEach(([x, y, index, angle]) => {
      const tile = new Tile(this, x, y, index, angle)
      this.add.existing(tile)
      tile.disable()
    })
    this.villageTimer = LEVELS[this.levelIndex].timer
    this.timerText.text = this.villageTimer
    if (this.villageTimer > 0) this.timerText.setAlpha(1)
  }

  drawCards = () => {
    this.cards && this.cards.forEach((c) => c.destroy())
    this.cards = []
    for (let i = 0; i < 1; i++) {
      const frame = Phaser.Math.RND.pick(LEVELS[this.levelIndex].cards)

      // const frame = Phaser.Math.RND.pick([2])
      // const frame = Phaser.Math.RND.pick([3, 2])
      // const frame = Phaser.Math.RND.pick([3, 2, 4, 5, 18, 19, 20, 21])
      // const frame = Phaser.Math.RND.pick([3, 2, 4, 5, 18, 19, 20, 21])
      this.cards.push(new Tile(this, i + 4, 7, frame))
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
    this.pickupSound.play()
    this.hoverSlots(tile)
  }

  drag = (_, tile, dragX, dragY) => {
    tile.x = dragX
    tile.y = dragY
  }

  drop = (_, tile, zone) => {
    if (!doesTileFit(zone, tile)) return

    this.placeSound.play()
    tile.x = zone.sprite.x
    tile.y = zone.sprite.y
    tile._x = zone._x
    tile._y = zone._y

    this.cards = this.cards.filter((c) => c !== tile)
    if (this.cards.length === 0) this.drawCards()

    this.resetSlots()
    this.updateRoads(tile)
    // this.growForests()
    const nextLevel = this.tiles
      .filter((t) => VILLAGES.includes(t.index))
      .every(
        (t) =>
          t.road &&
          t.road.filter((t) => VILLAGES.includes(t.index)).length >= 2,
      )
    if (nextLevel) {
      this.levelIndex++
    }
    if (nextLevel) {
      this.addVillage()
    } else if (this.villageTimer > 0) {
      this.villageTimer--
      this.timerText.text = this.villageTimer
    } else if (this.villageTimer === 0) {
      this.scene.start('Menu')
    }

    tile.disable()
    zone.destroy()

    this.drawCards()
  }

  get tiles() {
    return Object.values(this.board).filter((t) => t.type === 'Sprite')
  }

  get slots() {
    return Object.values(this.board).filter((t) => t.type !== 'Sprite')
  }

  growForests = () => {
    // should add city tiles, but make them tree tiles instead
    // every n turns, forest tiles will grow outward with a random forest tile connecting
    const tileToGrow = Phaser.Math.RND.pick(
      this.tiles.filter((t) => t.attributes.some((a) => a === 2)),
    )
    if (tileToGrow) {
      const sideToGrow = tileToGrow.attributes.findIndex((a) => a === 2)
      const [x, y] = DIRECTIONS[sideToGrow]

      const newX = tileToGrow._x + x
      const newY = tileToGrow._y + y
      const thing = Object.values(this.board).find(
        (s) => s._x === newX && s._y === newY,
      )
      if (typeof thing !== 'Sprite') {
        thing.destroy()
        const tile = new Tile(this, newX, newY, 17)
        this.add.existing(tile)
        tile.disable()
      }
    }
  }

  updateRoads = (tile) => {
    const connectedTiles = this.getOpenNeighbours(tile).filter(
      (t) =>
        tile.attributes[t._facing] !== 0 &&
        tile.attributes[t._facing] === t.attributes[OPPOSITE[t._facing]],
    )

    // if only one connected
    if (connectedTiles.length === 1) {
      const connectedTile = connectedTiles[0]
      if (connectedTile.road && !END_TILES.includes(connectedTile.index)) {
        // add on to existing road
        const index = connectedTile.road.findIndex((t) => connectedTile === t)
        console.log('ADD_TO_ROAD', index, connectedTile.road)
        tile.road = connectedTile.road
        if (index === 0) {
          console.log('unshift')
          connectedTile.road.unshift(tile)
        } else {
          console.log('push')
          connectedTile.road.push(tile)
        }
      } else if (connectedTile) {
        // create new road
        console.log('NEW_ROAD')
        const newRoad = [tile, connectedTile]
        this.roads.push(newRoad)
        tile.road = newRoad
        connectedTile.road = newRoad
      }
      // if many connected
    } else if (connectedTiles.length >= 2) {
      // TODO: need better way to detect loop (should store road index so we can consistently identitify roads?)
      if (
        connectedTiles.every(
          (t) =>
            t.road &&
            connectedTiles[0].road &&
            t.road.some((t) => connectedTiles[0].road.includes(t)),
        )
      ) {
        console.log('LOOP')
        const connectedTile = connectedTiles[0]
        const index = connectedTile.road.findIndex((t) => connectedTile === t)
        tile.road = connectedTile.road
        if (index === 0) {
          connectedTile.road.unshift(tile)
        } else {
          connectedTile.road.push(tile)
        }
        tile.road.closed = true
      } else {
        // handle merge
        console.log('MERGE')
        const roads = connectedTiles.map((t) => (t.road ? t.road : [t]))
        this.roads = this.roads.filter((r) => !roads.includes(r))
        const [start, end] = roads
        const adjacent = this.getAdjacentTiles(tile)
        if (adjacent.includes(start[0])) start.reverse()
        if (!adjacent.includes(end[0])) end.reverse()

        const mergedRoad = [...start, tile, ...end]
        this.roads.push(mergedRoad)
        tile.road = mergedRoad
        mergedRoad.forEach((t) => {
          t.road = mergedRoad
        })
      }
    }

    this.roads = uniqBy(this.roads, (r) => [r._x, r._y])

    this.roads.forEach((r) => this.logTiles(r))

    this.lineGraphics.clear()
    // TODO: Fix road drawing?
    // this.roads.forEach((road, roadIndex) => {
    //   this.lineGraphics.lineStyle(10, LINE_COLORS[roadIndex], 1)

    //   road.forEach((t, i, arr) => {
    //     const next = arr[i + 1]
    //     if (next) this.lineGraphics.lineBetween(t.x, t.y, next.x, next.y)
    //   })
    //   if (road.closed)
    //     this.lineGraphics.lineBetween(
    //       road[0].x,
    //       road[0].y,
    //       road[road.length - 1].x,
    //       road[road.length - 1].y,
    //     )
    // })
  }

  logTiles = (tiles) => {
    console.log('LOG TILES')
    console.log(tiles.map((t) => pick(t, ['_x', '_y', 'attributes', 'road'])))
  }

  getOpenNeighbours = (tile, tiles = this.tiles) =>
    this.getAdjacentTiles(tile, tiles)
      .map((t, index) => {
        if (t) t._facing = index
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

    this.dropSound.play()
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

// const END_TILES = []
const END_TILES = [4, 5, 15]
const VILLAGES = [7, 8, 9, 10, 11]

const LEVELS = [
  {
    cards: [2],
    villages: [[2, 0, 8, 90]],
    timer: -1,
  },
  {
    cards: [3],
    villages: [[-1, 2, 8, 0]],
    timer: -1,
  },
  {
    cards: [2, 3],
    villages: [[3, 3, 10, 0]],
    timer: -1,
  },
  {
    cards: [2],
    timer: -1,
    villages: [
      [0, -3, 11, 0],
      [3, -3, 11, 0],
    ],
  },
  {
    cards: [2, 3],
    timer: 10,
    villages: [
      [0, -6, 11, 90],
      [3, -6, 11, 90],
    ],
  },
]
