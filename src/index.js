import Phaser from 'phaser'
import * as scenes from './scenes'

var config = {
  type: Phaser.AUTO,
  width: 2000,
  height: 2000,
  backgroundColor: '#122016',
  parent: 'phaser-example',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: Object.values(scenes),
}

window.game = new Phaser.Game(config)
