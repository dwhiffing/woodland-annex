let music
export default class extends Phaser.Scene {
  constructor() {
    super({ key: 'Menu' })
  }

  init(opts) {
    this.width = this.cameras.main.width
    this.height = this.cameras.main.height
    const background = this.add.image(0, 0, 'background').setScale(2)
    background.setDepth(-3).setOrigin(0)
    this.add.image(this.width / 2, 500, 'title').setScale(3)
    if (!music) {
      music = this.sound.add('music', { loop: true, volume: 0.35 })
      music.play()
    }

    this.mute = this.add.image(this.width - 130, this.height - 180, 'icon')
    this.mute.setOrigin(0)
    this.mute.setFrame(window.isMuted ? 2 : 1)
    this.mute.setInteractive().on('pointerdown', () => {
      window.isMuted = !window.isMuted
      this.sound.mute = window.isMuted
      localStorage.setItem('mute', window.isMuted ? 1 : 0)
      this.mute.setFrame(window.isMuted ? 2 : 1)
    })
  }

  create() {
    this.add
      .image(this.width / 2, this.height / 1.25, 'playButton')
      .setScale(1.3)
      .setInteractive()
      .on('pointerdown', () => {
        this.scene.start('Game')
      })
  }
}
