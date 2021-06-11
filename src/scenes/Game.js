export default class extends Phaser.Scene {
  constructor() {
    super({ key: 'Game' })
  }

  init() {
    this.width = this.cameras.main.width
    this.height = this.cameras.main.height
    this.behavior = this.plugins.get('BehaviorPlugin')

    // this.music = this.sound.add('gameMusic', { loop: true, volume: 0.35 })
  }

  create() {
    // this.music.play()
  }

  update() {
    this.behavior.preUpdate()
    this.behavior.update()
  }
}
