export const TILE_SIZE = 250
export const getDebugText = (scene, x, y) => {
  const text = scene.add.text(
    x * TILE_SIZE - TILE_SIZE / 2 + 5,
    y * TILE_SIZE - TILE_SIZE / 2 + 5,
    `${x}, ${y}`,
    { fontSize: 40 },
  )
  text.setDepth(10)
}
export const isMatch = (a, b) =>
  a.some((t) => t == null) && a.every((a, i) => a == null || a === b[i])
