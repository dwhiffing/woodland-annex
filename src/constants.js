export const TILE_SIZE = 256
// top, right, bottom, left
export const DIRECTIONS = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
]

export const ATTRIBUTES = [
  [1, 1, 1, 1],
  [0, 0, 1, 0],
  [1, 0, 1, 0],
  [0, 1, 1, 0],
  [1, 1, 1, 0],
  [1, 1, 1, 1],
  [0, 0, 0, 0],
  [0, 0, 1, 0],
  [1, 0, 1, 0],
  [0, 1, 1, 0],
  [1, 1, 1, 0],
  [1, 1, 1, 1],
  [2, 0, 0, 0],
  [2, 0, 0, 2],
  [2, 0, 2, 0],
  [0, 2, 0, 2],
  [2, 2, 0, 2],
  [2, 2, 2, 2],
  [1, 0, 1, 2],
  [0, 1, 1, 2],
  [2, 1, 1, 2],
  [1, 1, 1, 2],
  [2, 2, 1, 2],
]

export const getDebugText = (scene, x, y) => {
  const text = scene.add.text(
    x * TILE_SIZE - TILE_SIZE / 2 + 5,
    y * TILE_SIZE - TILE_SIZE / 2 + 5,
    `${x}, ${y}`,
    { fontSize: 40 },
  )
  text.setDepth(10)
  return text
}
export const doesTileFit = (slot, tile) =>
  slot.attributes.some((t) => t == null) &&
  slot.attributes.every((a, i) => a == null || a === tile.attributes[i])

export const isConnected = (tileA, tileB, index) =>
  tileA.attributes.every((a, i) => a === index && tileB.attributes[i] === index)
