export type MapData = {
  id: string
  name: string
  width: number
  height: number
  tiles: string[][]
}

// Build a 20x20 “Wizardry-like” sample based on the provided floor-plan image.
// This is a hand-crafted approximation with central cross walls and winding corridors.
export function generateWizardryFloor1(): MapData {
  const W = 20
  const H = 20
  // Start with all floor then add walls
  const tiles: string[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => "floor"))

  const wall = (x: number, y: number) => {
    if (x >= 0 && x < W && y >= 0 && y < H) tiles[y][x] = "wall"
  }

  // Outer border
  for (let x = 0; x < W; x++) {
    wall(x, 0)
    wall(x, H - 1)
  }
  for (let y = 0; y < H; y++) {
    wall(0, y)
    wall(W - 1, y)
  }

  // Central cross (vertical at x=10, horizontal at y=10)
  for (let y = 0; y < H; y++) wall(10, y)
  for (let x = 0; x < W; x++) wall(x, 10)

  // Create “doors/openings” in the central cross to allow movement between quadrants
  tiles[10][3] = "floor"
  tiles[10][9] = "floor"
  tiles[10][11] = "floor"
  tiles[10][16] = "floor"
  tiles[3][10] = "floor"
  tiles[9][10] = "floor"
  tiles[11][10] = "floor"
  tiles[16][10] = "floor"

  // Upper-left quadrant winding corridors
  rectOutline(1, 1, 8, 8)
  rectOutline(2, 2, 6, 6)
  carvePath([
    [1, 7],
    [3, 7],
    [3, 5],
    [5, 5],
    [5, 3],
    [7, 3],
    [7, 1],
  ])

  // Upper-right quadrant labyrinth
  rectOutline(11, 1, 18, 8)
  verticalRun(12, 1, 8)
  verticalRun(14, 1, 8)
  verticalRun(16, 1, 8)
  horizontalRun(12, 4, 17)
  horizontalRun(12, 6, 15)

  // Lower-left quadrant “U” path
  rectOutline(1, 11, 8, 18)
  carvePath([
    [1, 18],
    [1, 12],
    [3, 12],
    [3, 16],
    [6, 16],
    [6, 13],
    [2, 13],
  ])

  // Lower-right quadrant large loop with inner box
  rectOutline(11, 11, 18, 18)
  rectOutline(13, 13, 16, 16)
  open(15, 13)
  open(13, 15)

  // Ensure central corridor paths look like the reference: long corridor left->right
  for (let x = 1; x <= 18; x++) tiles[9][x] = "floor" // just above the horizontal wall
  for (let x = 1; x <= 18; x++) tiles[11][x] = "floor" // just below

  // Helper functions
  function rectOutline(x1: number, y1: number, x2: number, y2: number) {
    for (let x = x1; x <= x2; x++) {
      wall(x, y1)
      wall(x, y2)
    }
    for (let y = y1; y <= y2; y++) {
      wall(x1, y)
      wall(x2, y)
    }
  }
  function horizontalRun(x1: number, y: number, x2: number) {
    for (let x = x1; x <= x2; x++) wall(x, y)
  }
  function verticalRun(x: number, y1: number, y2: number) {
    for (let y = y1; y <= y2; y++) wall(x, y)
  }
  function open(x: number, y: number) {
    if (x >= 0 && x < W && y >= 0 && y < H) tiles[y][x] = "floor"
  }
  function carvePath(points: Array<[number, number]>) {
    for (const [x, y] of points) open(x, y)
  }

  return { id: "", name: "Wizardry Floor 1 (sample)", width: W, height: H, tiles }
}
