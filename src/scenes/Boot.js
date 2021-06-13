export default class extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' })
  }

  preload() {
    const progress = this.add.graphics()

    window.isMuted = !!Number(localStorage.getItem('mute'))
    this.sound.mute = window.isMuted

    this.load.on('progress', (value) => {
      progress.clear()
      progress.fillStyle(0xffffff, 1)
      progress.fillRect(
        0,
        this.sys.game.config.height / 2,
        this.sys.game.config.width * value,
        60,
      )
    })
    this.load.spritesheet('tiles', 'assets/images/tiles.png', {
      frameWidth: 256,
      frameHeight: 256,
    })
    this.load.audio('music', 'assets/audio/music.mp3')
    this.load.audio('pickup', 'assets/audio/cash1.mp3')
    this.load.audio('drop', 'assets/audio/cash2.mp3')
    this.load.audio('place', 'assets/audio/cash-breakdown.mp3')
    this.load.image('background', 'assets/images/background.png')
    this.load.image('title', 'assets/images/title.png')
    this.load.image('playButton', 'assets/images/playButton.png')
    this.load.spritesheet('icon', 'assets/images/icons.png', {
      frameWidth: 100,
      frameHeight: 100,
    })
    this.load.script(
      'webfont',
      'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js',
    )

    this.load.on('complete', () => {
      WebFont.load({
        custom: {
          families: ['AnotherHand'],
        },
        active: () => {
          progress.destroy()
          this.scene.start('Menu')
          // this.scene.start('Game')
        },
      })
    })
  }
}
