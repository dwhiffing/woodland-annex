import { ATTRIBUTES, DIRECTIONS, doesTileFit, isConnected } from '../constants'
import { rotate, Tile } from '../objects/Tile'
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
    this.spinSound = this.sound.add('spin', { volume: 0.4 })
    this.villageSound = this.sound.add('village', { volume: 0.4 })
    this.forestSound = this.sound.add('forest', { volume: 0.4 })
    this.connectSound = this.sound.add('connect', { volume: 0.4 })

    this.cards = []
    this.mute = this.add.image(this.width - 130, this.height - 180, 'icon')
    this.mute.setOrigin(0)
    this.mute.setFrame(window.isMuted ? 2 : 1)
    this.mute.setInteractive().on('pointerdown', () => {
      window.isMuted = !window.isMuted
      this.sound.mute = window.isMuted
      localStorage.setItem('mute', window.isMuted ? 1 : 0)
      this.mute.setFrame(window.isMuted ? 2 : 1)
    })
    this.mute.setDepth(50).setScrollFactor(0)
  }

  create() {
    const background = this.add.image(0, 0, 'background2').setScale(2)
    background.setDepth(-3).setOrigin(0).setScrollFactor(0)
    const hud = this.add
      .rectangle(0, this.height - 400, this.width, 400, 0x000000)
      .setScrollFactor(0)
      .setOrigin(0)
      .setAlpha(0.6)
      .setDepth(20)

    this.cameras.main.setZoom(1)
    this.cameras.main.centerOn(250, 200)
    this.score = 0

    // Create initial tile
    this.board = {}
    this.cards = []
    this.roads = []
    this.levelIndex = 0
    this.level = this.getNewLevel()

    const tile = new Tile(this, 0, 0, 9, 0)
    this.add.existing(tile)
    tile.disable()

    this.addVillage()
    this.drawCards()

    this.input.keyboard.on('keydown-Z', () => {
      this.drawCards()
    })

    this.input.keyboard.on('keydown-X', () => {
      this.levelIndex++
      this.level = this.getNewLevel()
      this.addVillage()
    })

    this.input.keyboard.on('keydown-SPACE', () => {
      if (!this.draggingTile) return
      this.draggingTile.angle += 90
      if (this.draggingTile.angle >= 360) this.draggingTile.angle = 0
      this.resetSlots()
      this.hoverSlots(this.draggingTile)
      this.spinSound.play()
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
    this.villageSound.play()
    this.level.villages.forEach(([x, y, index, angle]) => {
      const tile = new Tile(this, x, y, index, angle)
      this.add.existing(tile)
      tile.disable()
      this.cameras.main.pan(tile.x, tile.y, 800, 'Quad.easeInOut')
    })
    this.villageTimer = this.level.timer
    this.timerText.text = this.villageTimer
    if (this.villageTimer > 0) this.timerText.setAlpha(1)
  }

  getDistance = (one, two) => {
    var a = one.x - two.x
    var b = one.y - two.y
    return Math.sqrt(a * a + b * b)
  }

  drawCards = (n = 3) => {
    // this.cards && this.cards.forEach((c) => c.destroy())
    this.cards = this.cards || []
    for (let i = 0; i < n; i++) {
      if (!this.cards[i]) {
        const frame = Phaser.Math.RND.pick(this.level.cards)
        this.cards[i] = new Tile(this, i + 3, 7, frame).setDepth(25)
      }
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

    if (_.y > 1550) return

    this.placeSound.play()
    tile.x = zone.sprite.x
    tile.y = zone.sprite.y
    tile._x = zone._x
    tile._y = zone._y

    this.cards = this.cards.map((c) => (c !== tile ? c : null))
    if (this.cards.length === 0) this.drawCards()

    this.resetSlots()
    this.updateRoads(tile)
    this.growForests(tile)
    const nextLevel = this.tiles
      .filter((t) => VILLAGES.includes(t.index))
      .every(
        (t) =>
          t.road &&
          t.road.filter((t) => VILLAGES.includes(t.index)).length >= 2,
      )
    if (nextLevel) {
      this.levelIndex++
      this.connectSound.play()
      this.level = this.getNewLevel()
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

  getNewLevel() {
    let current = LEVELS[this.levelIndex]
    if (!current) current = LEVELS[LEVELS.length - 1]
    if (typeof current !== 'string') return current

    let cards = [3, 2, 3, 2, 3, 2, 3, 2, 4, 5, 4, 5, 18]
    let timer = 15
    let villages = []
    let distance = 3
    let count = 1
    let range = Math.max(2, this.levelIndex)
    let indexes = [9, 10, 11]

    if (current === 'medium') {
      distance = 4
      timer = 10
      indexes = [7, 8, 9, 10, 11]
      cards = [
        3, 2, 4, 5, 3, 2, 4, 5, 4, 5, 3, 2, 4, 5, 3, 2, 4, 5, 4, 5, 18, 19, 20,
        21, 12, 13, 14, 15, 16, 17,
      ]
    }

    if (current === 'hard') {
      distance = 4
      count = 1
      timer = 8
      indexes = [7, 8, 9]
      cards = [3, 2, 4, 5, 3, 2, 4, 5, 18, 19, 20, 21, 12, 13, 14, 15, 16, 17]
    }

    villages = new Array(count)
      .fill('')
      .map(() => this.getNewVillage(indexes, range, distance))

    return {
      cards,
      timer,
      villages,
    }
  }

  getNewVillage = (indexes = [11], range, distance = 2) => {
    let village, distances, isValid
    const _getNewVillage = () => {
      const index = Phaser.Math.RND.pick(indexes)
      const angle = Phaser.Math.RND.pick([0, 90, 180, 270])
      const x = Phaser.Math.RND.pick([-1, 0, 1]) * range
      const y = Phaser.Math.RND.pick([-1, 0, 1]) * range
      return [x, y, index, angle]
    }
    do {
      village = _getNewVillage()
      let [x, y] = village
      distances = this.tiles
        .filter((t) => VILLAGES.includes(t.index))
        .map((v) => this.getDistance({ x, y }, { x: v._x, y: v._y }))

      isValid = true
      if (distances.some((d) => d < distance)) isValid = false
      if (Object.values(this.board).some((t) => t._x === x && t._y === y))
        isValid = false
    } while (!isValid)
    return village
  }

  get tiles() {
    return Object.values(this.board).filter((t) => t.type === 'Sprite')
  }

  get slots() {
    return Object.values(this.board).filter((t) => t.type !== 'Sprite')
  }

  growForests = (tile) => {
    const possibleTiles = this.tiles
      .filter((t) => t.attributes.includes(2))
      .map((t) => {
        const neighbours = this.getAdjacentTiles(t, [...this.tiles, tile])
        const spots = t.attributes
          .map((a, i) => ({ a, i }))
          .filter(({ a, i }) => a === 2 && !neighbours[i])

        const spot = Phaser.Math.RND.pick(spots)
        if (!spot) return false
        const [x, y] = DIRECTIONS[spot.i]
        const newX = t._x + x
        const newY = t._y + y
        const thing = Object.values(this.board).find(
          (s) => s._x === newX && s._y === newY,
        )
        if (typeof thing !== 'Sprite') {
          let fit,
            index,
            attempts = 0,
            angle,
            attributes
          // TODO: avoid looping somehow?
          do {
            index = Phaser.Math.RND.weightedPick([
              12, 18, 19, 21, 20, 13, 15, 16, 17,
            ])
            angle = Phaser.Math.RND.pick([0, 90, 180, 270])
            attributes = rotate(ATTRIBUTES[index], -(angle / 90))
            fit = doesTileFit(thing, { attributes })
            attempts++
          } while (!fit && attempts < 100)
          if (!fit) return false

          return {
            tile: t,
            slot: thing,
            newTile: { x: newX, y: newY, index, angle },
          }
        }
        return false
      })
      .filter((t) => !!t && t.newTile)
    const growth = Phaser.Math.RND.pick(possibleTiles)

    if (growth) {
      const { slot, newTile } = growth
      this.forestSound.play()

      slot.destroy()
      const tile = new Tile(
        this,
        newTile.x,
        newTile.y,
        newTile.index,
        newTile.angle,
      )
      this.add.existing(tile)
      tile.disable()
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
        tile.road = connectedTile.road
        if (index === 0) {
          connectedTile.road.unshift(tile)
        } else {
          connectedTile.road.push(tile)
        }
      } else if (connectedTile) {
        // create new road
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

    // this.roads.forEach((r) => this.logTiles(r))

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
      .filter((t) => !!t)

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

const END_TILES = []
// const END_TILES = [4, 5, 15]
const VILLAGES = [7, 8, 9, 10, 11]

const LEVELS = [
  // Intro to straight pieces and connecting villages
  {
    cards: [2],
    villages: [[2, 0, 8, 90]],
    timer: -1,
  },
  // Intro to curved pieces and blocking yourself
  {
    cards: [3],
    villages: [[-1, 2, 8, 0]],
    timer: -1,
  },
  // straight/curved
  {
    cards: [2, 3],
    villages: [[3, 3, 10, 0]],
    timer: -1,
  },
  // You can connect villages in different groups
  {
    cards: [2],
    timer: -1,
    villages: [
      [0, -3, 11, 0],
      [3, -3, 11, 0],
    ],
  },

  // TODO: make level to teach Forests
  'easy',
  'easy',
  'easy',
  'easy',
  'easy',
  'easy',
  'easy',
  'easy',
  'easy',
  'easy',
  'medium',
  'medium',
  'medium',
  'medium',
  'medium',
  'medium',
  'medium',
  'medium',
  'medium',
  'medium',
  'hard',
]
