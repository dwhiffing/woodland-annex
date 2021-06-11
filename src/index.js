import Phaser from 'phaser'
import * as scenes from './scenes'
import BehaviorPlugin from './behavior'

var config = {
  type: Phaser.AUTO,
  width: 1920,
  height: 1920,
  backgroundColor: '#1d332f',
  parent: 'phaser-example',
  plugins: {
    global: [{ key: 'BehaviorPlugin', plugin: BehaviorPlugin, start: true }],
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: Object.values(scenes),
}

window.game = new Phaser.Game(config)
