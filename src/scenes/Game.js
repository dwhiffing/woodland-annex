const TILE_SIZE = 250
export default class extends Phaser.Scene {
  constructor() {
    super({ key: 'Game' })
  }

  init() {
    this.width = this.cameras.main.width
    this.height = this.cameras.main.height
  }

  create() {
    const tile = new Tile(this, 0, 0)
    const cx = this.width / 2
    const cy = this.height / 2
    var container = this.add.container(cx, cy, [tile])
    container.setSize(500, 500)
    new Slot(this, container, TILE_SIZE, 0)
    new Slot(this, container, -TILE_SIZE, 0)
    new Slot(this, container, 0, TILE_SIZE)
    new Slot(this, container, 0, -TILE_SIZE)

    for (let i = 0; i < 4; i++) {
      const tile = new Tile(
        this,
        TILE_SIZE + TILE_SIZE * i,
        this.height - TILE_SIZE,
      )

      this.add.existing(tile)
      tile.setInteractive()
      this.input.setDraggable(tile)
    }

    this.input.on('dragstart', (pointer, tile, dragX, dragY) => {
      tile.startX = tile.x
      tile.startY = tile.y
    })

    this.input.on('drag', (pointer, tile, dragX, dragY) => {
      tile.x = dragX
      tile.y = dragY
    })

    this.input.on('drop', (pointer, tile, zone) => {
      container.add([tile])
      tile.x = zone.sprite.x
      tile.y = zone.sprite.y
      this.input.setDraggable(tile, false)
      zone.destroy()
    })

    this.input.on('dragend', (pointer, tile) => {
      // tile.x = tile.startX
      // tile.y = tile.startY
    })
  }

  update() {}
}

class Tile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'cash')

    this.scene = scene
    this.setOrigin(0.5)
    // this.setCollideWorldBounds(true, 0.2, 0.2)
  }
}

class Slot extends Phaser.GameObjects.Zone {
  constructor(scene, container, x, y) {
    super(scene, x + container.x, y + container.y, TILE_SIZE, TILE_SIZE)

    this.scene = scene
    this.setDropZone()
    // this.setCollideWorldBounds(true, 0.2, 0.2)
    this.sprite = new Tile(scene, x, y)
    this.sprite.setTintFill(0x00ff00)
    container.add([this.sprite])
  }
  destroy() {
    this.sprite.destroy()
    super.destroy()
  }
}
