"use client"

import { useEffect, useRef, useState } from "react"
import type * as React from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Shield,
  Sword,
  Shirt,
  FlaskRound,
  Crown,
  Gem,
  BellRingIcon as Ring,
  Footprints,
  User,
  Coins,
  RefreshCw,
  Heart,
  Sparkles,
  Battery,
  Star,
  Target,
  Flame,
  Loader2,
  Search,
  Scroll,
  Hand,
  Zap,
  Download,
} from "lucide-react"
import { generateWizardryFloor1 } from "@/lib/sample-maps"

type TileCategory = "floor" | "wall" | "object"
type MovementRequirement = "none" | "fly" | "swim" | "climb" | "teleport"

type TileProperties = {
  id: string
  name: string
  description: string
  category: TileCategory
  walkable: boolean
  movementRequirement: MovementRequirement
  blocksVision: boolean
}

type MapData = {
  id: string
  name: string
  width: number
  height: number
  tiles: string[][]
}

type PartyMember = {
  id: string
  name: string
  level: number
  hp: number
  maxHp: number
  class: string
}

type ChatMessage = {
  id: string
  author: string
  content: string
  ts: number
}

type Quest = {
  id: string
  title: string
  description: string
  status: "active" | "completed" | "available"
  progress?: string
  reward?: string
}

type InventoryItem = {
  id: string
  name: string
  type: string
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary"
  quantity?: number
}

// Generated dungeon data structure from the other tab
type GeneratedDungeonData = {
  refId: string
  guild: string
  dungeonNumber: number
  level?: number
  width: number
  height: number
  tiles: Array<{
    x: number
    y: number
    type: string
    walkable?: boolean
    description?: string
  }>
  rooms?: Array<{
    x: number
    y: number
    width: number
    height: number
    type: string
  }>
  metadata?: {
    difficulty: number
    theme: string
    generatedAt: string
  }
}

const TILE_COLORS: Record<string, string> = {
  floor: "#cdc6b3",
  wall: "#6b7280",
  water: "#60a5fa",
  tree: "#15803d",
  door: "#8b4513", // Brown for door
  treasure: "#ffd700", // Gold for treasure
  // Additional mappings for generated dungeon types
  corridor: "#cdc6b3", // Same as floor
  room: "#e5dcc3", // Slightly lighter floor
  entrance: "#90EE90", // Light green
  exit: "#FFB6C1", // Light pink
  trap: "#FF6347", // Tomato red
  secret: "#DDA0DD", // Plum
}

const DEFAULT_TILE_PROPERTIES = {
  floor: {
    id: "floor",
    name: "Stone Floor",
    description: "A solid stone floor worn smooth by countless footsteps.",
    category: "floor",
    walkable: true,
    movementRequirement: "none",
    blocksVision: false,
  },
  wall: {
    id: "wall",
    name: "Stone Wall",
    description: "A sturdy stone wall that blocks your path.",
    category: "wall",
    walkable: false,
    movementRequirement: "none",
    blocksVision: true,
  },
  water: {
    id: "water",
    name: "Deep Water",
    description: "Deep, clear water that requires special abilities to cross safely.",
    category: "floor",
    walkable: false,
    movementRequirement: "fly",
    blocksVision: false,
  },
  tree: {
    id: "tree",
    name: "Ancient Tree",
    description: "A massive ancient tree with thick bark and sprawling branches.",
    category: "object",
    walkable: false,
    movementRequirement: "none",
    blocksVision: true,
  },
  door: {
    id: "door",
    name: "Wooden Door",
    description: "A sturdy wooden door that can be opened or closed.",
    category: "wall",
    walkable: true,
    movementRequirement: "none",
    blocksVision: false,
  },
  treasure: {
    id: "treasure",
    name: "Treasure Chest",
    description: "A gleaming treasure chest filled with gold and precious items.",
    category: "object",
    walkable: false,
    movementRequirement: "none",
    blocksVision: false,
  },
  // Additional properties for generated dungeon types
  corridor: {
    id: "corridor",
    name: "Dungeon Corridor",
    description: "A narrow stone corridor connecting different areas of the dungeon.",
    category: "floor",
    walkable: true,
    movementRequirement: "none",
    blocksVision: false,
  },
  room: {
    id: "room",
    name: "Dungeon Room",
    description: "A spacious room within the dungeon, possibly containing secrets.",
    category: "floor",
    walkable: true,
    movementRequirement: "none",
    blocksVision: false,
  },
  entrance: {
    id: "entrance",
    name: "Dungeon Entrance",
    description: "The entrance to this level of the dungeon.",
    category: "floor",
    walkable: true,
    movementRequirement: "none",
    blocksVision: false,
  },
  exit: {
    id: "exit",
    name: "Dungeon Exit",
    description: "The exit leading to the next level or out of the dungeon.",
    category: "floor",
    walkable: true,
    movementRequirement: "none",
    blocksVision: false,
  },
  trap: {
    id: "trap",
    name: "Hidden Trap",
    description: "A dangerous trap hidden in the floor. Proceed with caution!",
    category: "floor",
    walkable: true,
    movementRequirement: "none",
    blocksVision: false,
  },
  secret: {
    id: "secret",
    name: "Secret Area",
    description: "A hidden area containing valuable treasures or important items.",
    category: "floor",
    walkable: true,
    movementRequirement: "none",
    blocksVision: false,
  },
} as const

// Sample quests data
const SAMPLE_QUESTS: Quest[] = [
  {
    id: "q1",
    title: "The Lost Artifact",
    description: "Retrieve the ancient crystal from the depths of the dungeon.",
    status: "active",
    progress: "2/3 crystals found",
    reward: "500 XP, Mystic Ring",
  },
  {
    id: "q2",
    title: "Goblin Extermination",
    description: "Clear the goblin camp threatening the village.",
    status: "active",
    progress: "8/12 goblins defeated",
    reward: "300 XP, 150 Gold",
  },
  {
    id: "q3",
    title: "Merchant's Delivery",
    description: "Deliver a package to the merchant in the eastern town.",
    status: "completed",
    reward: "200 XP, 75 Gold",
  },
  {
    id: "q4",
    title: "Dragon's Lair",
    description: "Investigate the dragon sightings near the mountain pass.",
    status: "available",
    reward: "1000 XP, Dragon Scale Armor",
  },
  {
    id: "q5",
    title: "Herb Collection",
    description: "Gather rare healing herbs for the village alchemist.",
    status: "active",
    progress: "4/7 herbs collected",
    reward: "150 XP, Health Potions",
  },
  {
    id: "q6",
    title: "The Cursed Tome",
    description: "Find and destroy the cursed spellbook hidden in the library ruins.",
    status: "available",
    reward: "750 XP, Spell Scroll",
  },
]

// Sample inventory items
const SAMPLE_INVENTORY: InventoryItem[] = [
  { id: "i1", name: "Health Potion", type: "consumable", rarity: "common", quantity: 5 },
  { id: "i2", name: "Iron Sword", type: "weapon", rarity: "uncommon" },
  { id: "i3", name: "Mystic Gem", type: "material", rarity: "rare", quantity: 2 },
  { id: "i4", name: "Leather Boots", type: "armor", rarity: "common" },
  { id: "i5", name: "Dragon Scale", type: "material", rarity: "epic" },
  { id: "i6", name: "Mana Crystal", type: "consumable", rarity: "uncommon", quantity: 3 },
]

// Player abilities
const PLAYER_ABILITIES = new Set(["fly"]) // For demo, player can fly

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))

export default function Page() {
  const [isLoading, setIsLoading] = useState(true)
  const [loadingStatus, setLoadingStatus] = useState("Initializing...")
  const [map, setMap] = useState<MapData | null>(null)
  const [party] = useState<PartyMember[]>([
    { id: "p1", name: "Hero", level: 3, hp: 44, maxHp: 50, class: "Warrior" },
    { id: "p2", name: "Mage", level: 2, hp: 28, maxHp: 30, class: "Wizard" },
  ])
  const [chat, setChat] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [player, setPlayer] = useState<{ x: number; y: number; dir: number }>({ x: 1, y: 1, dir: 0 })
  const [currentTile, setCurrentTile] = useState<string>("")
  const [heroVitals, setHeroVitals] = useState({
    hp: 44,
    hpMax: 50,
    mana: 30,
    manaMax: 40,
    stamina: 65,
    staminaMax: 80,
  })
  const [questSearch, setQuestSearch] = useState("")
  const [showDungeonDialog, setShowDungeonDialog] = useState(false)
  const [dungeonRefIdInput, setDungeonRefIdInput] = useState("")
  const pressed = useRef<Set<string>>(new Set())
  const lastMoveTime = useRef<number>(0)

  useEffect(() => {
    console.log("Map state:", map)
    console.log("Player state:", player)
  }, [map, player])

  // Initialize game with loading sequence
  useEffect(() => {
    initializeGame()
  }, [])

  async function initializeGame() {
    try {
      setLoadingStatus("Connecting to database...")
      await new Promise((resolve) => setTimeout(resolve, 500)) // Brief delay for UX

      setLoadingStatus("Loading maps...")
      const urlParams = new URLSearchParams(window.location.search)
      const mapId = urlParams.get("mapId")
      const dungeonRefId = urlParams.get("dungeonRefId")

      // Legacy support for old URL format
      const guild = urlParams.get("guild")
      const dungeonNumber = urlParams.get("dungeonNumber")

      if (dungeonRefId) {
        await loadGeneratedDungeonByRefId(dungeonRefId)
      } else if (guild && dungeonNumber) {
        // Legacy support - convert to refId format
        const legacyRefId = `${guild}-${dungeonNumber}-1-${Date.now()}-legacy`
        await loadGeneratedDungeonByRefId(legacyRefId)
      } else if (mapId) {
        await loadSpecificMap(mapId)
      } else {
        await loadDefaultMap()
      }

      setLoadingStatus("Preparing game world...")
      await new Promise((resolve) => setTimeout(resolve, 300))

      setIsLoading(false)
    } catch (error) {
      console.error("Failed to initialize game:", error)
      setLoadingStatus("Failed to load game. Retrying...")
      // Retry after a delay
      setTimeout(initializeGame, 2000)
    }
  }

  async function loadGeneratedDungeonByRefId(refId: string) {
    try {
      setLoadingStatus(`Loading dungeon ${refId}...`)
      console.log("Attempting to load dungeon with refId:", refId)

      const res = await fetch(`/api/dungeons/${refId}`, {
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("API response status:", res.status)

      if (!res.ok) {
        const errorText = await res.text()
        console.error("API error response:", errorText)
        setMap(null)
        addChatMessage("System", `Failed to load dungeon: ${res.status} - ${errorText}`)
        return
      }

      const dungeonData = await res.json()
      console.log("Received dungeon data:", dungeonData)

      // Check if we got the expected format
      if (!dungeonData || typeof dungeonData !== "object") {
        console.error("Invalid dungeon data format:", dungeonData)
        setMap(null)
        addChatMessage("System", `Invalid dungeon data format`)
        return
      }

      console.log("Converting dungeon data to map format")
      const convertedMap = convertGeneratedDungeonToMap(dungeonData)
      console.log("Converted map:", convertedMap)

      // Validate the map has enough walkable areas
      const walkableCount = countWalkableTiles(convertedMap)
      console.log("Walkable tile count:", walkableCount)

      if (walkableCount < 20) {
        // Minimum 20 walkable tiles
        setMap(null)
        addChatMessage(
          "System",
          `ERROR: Generated dungeon has insufficient walkable areas (${walkableCount} tiles). Map rejected.`,
        )
        addChatMessage("System", `A valid dungeon needs at least 20 walkable tiles to be playable.`)
        return
      }

      console.log("Setting map and player position")
      setMap(convertedMap)
      const start = findFirstWalkable(convertedMap) ?? { x: 1, y: 1 }
      setPlayer({ x: start.x, y: start.y, dir: 0 })
      addChatMessage(
        "System",
        `Loaded dungeon: ${dungeonData.guild} #${dungeonData.dungeonNumber} L${dungeonData.level || 1} (${walkableCount} walkable tiles)`,
      )
      console.log("Successfully loaded dungeon")
    } catch (error) {
      console.error("Failed to load generated dungeon:", error)
      setMap(null)
      addChatMessage("System", `Error loading dungeon: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  function convertGeneratedDungeonToMap(dungeonData: any): MapData {
    let width = dungeonData.width || 20
    let height = dungeonData.height || 15
    let tiles: string[][]

    // Handle array of tile objects format (from database)
    if (Array.isArray(dungeonData.tiles) && dungeonData.tiles.length > 0 && typeof dungeonData.tiles[0] === "object") {
      // Initialize with walls
      tiles = Array.from({ length: height }, () => Array.from({ length: width }, () => "wall"))

      // Place tiles from the array
      dungeonData.tiles.forEach((tile: any) => {
        if (tile.x >= 0 && tile.x < width && tile.y >= 0 && tile.y < height) {
          tiles[tile.y][tile.x] = mapTileType(tile.type)
        }
      })
    }
    // Handle string map format (legacy)
    else if (typeof dungeonData === "string") {
      const lines = dungeonData.trim().split("\n")
      height = lines.length
      width = Math.max(...lines.map((line) => line.length))
      tiles = lines.map((line) => Array.from(line.padEnd(width, " ")).map((char) => mapLegendChar(char)))
    } else if (dungeonData.map && typeof dungeonData.map === "string") {
      const lines = dungeonData.map.trim().split("\n")
      height = lines.length
      width = Math.max(...lines.map((line) => line.length))
      tiles = lines.map((line) => Array.from(line.padEnd(width, " ")).map((char) => mapLegendChar(char)))
    } else {
      // Fallback: create a basic map with walls
      tiles = Array.from({ length: height }, () => Array.from({ length: width }, () => "wall"))
    }

    return {
      id: dungeonData.refId || `generated-${Date.now()}`,
      name: `Generated Dungeon - ${dungeonData.guild || "Unknown"} #${dungeonData.dungeonNumber || 1} L${dungeonData.level || 1}`,
      width,
      height,
      tiles,
    }
  }

  function mapTileType(type: string): string {
    // Map database tile types to our internal types
    const typeMap: Record<string, string> = {
      wall: "wall",
      room: "floor",
      corridor: "floor",
      entrance: "entrance",
      exit: "exit",
      treasure: "treasure",
      trap: "trap",
      secret: "secret",
      door: "door",
      water: "water",
      tree: "tree",
    }
    return typeMap[type] || "wall"
  }

  function mapLegendChar(char: string): string {
    switch (char) {
      case " ":
        return "wall" // void space = stone/wall
      case "#":
        return "wall" // wall
      case ",":
        return "floor" // floor/room
      case "^":
        return "entrance" // ladder up/stairwell up
      case "V":
        return "exit" // ladder down/stairwell down
      default:
        return "wall" // unknown = wall
    }
  }

  function countWalkableTiles(map: MapData): number {
    let count = 0
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tileId = map.tiles[y][x]
        const props = getTileProperties(tileId)
        if (props.walkable) {
          count++
        }
      }
    }
    return count
  }

  async function loadSpecificMap(mapId: string) {
    try {
      const res = await fetch(`/api/maps/${mapId}`, { cache: "no-store" })
      if (res.ok) {
        const mapData = (await res.json()) as MapData
        setMap(mapData)
        const start = findFirstWalkable(mapData) ?? { x: 1, y: 1 }
        setPlayer({ x: start.x, y: start.y, dir: 0 }) // Start facing north
      } else {
        await loadDefaultMap()
      }
    } catch (error) {
      console.error("Failed to load specific map:", error)
      await loadDefaultMap()
    }
  }

  async function loadDefaultMap() {
    try {
      let maps: MapData[] = []
      try {
        const res = await fetch("/api/maps", { cache: "no-store" })
        if (res.ok) {
          maps = (await res.json()) as MapData[]
          console.log("Loaded maps from database:", maps.length)
        }
      } catch (e) {
        console.warn("Failed to fetch maps from API:", e)
      }

      let selected = maps.find((m) => m.name.includes("Wizardry") || m.name.includes("Dungeon")) || maps[0]

      if (!selected) {
        console.log("No maps found in database, creating default map")
        // Only create sample if no maps exist at all
        const defaultMap = generateWizardryFloor1()
        defaultMap.id = crypto.randomUUID()
        try {
          const createRes = await fetch("/api/maps", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(defaultMap),
          })
          if (createRes.ok) {
            selected = (await createRes.json()) as MapData
            console.log("Created and saved default map:", selected.name)
          } else {
            selected = { ...defaultMap, id: "local-default" }
            console.log("Using local default map")
          }
        } catch {
          selected = { ...defaultMap, id: "local-default" }
          console.log("Using local default map (API failed)")
        }
      } else {
        console.log("Using existing map from database:", selected.name)
      }

      if (selected) {
        setMap(selected)
        const start = findFirstWalkable(selected) ?? { x: 1, y: 1 }
        setPlayer({ x: start.x, y: start.y, dir: 0 }) // Start facing north
        console.log("Player starting position:", start)
      }
    } catch (e) {
      console.error("Error in loadDefaultMap:", e)
    }
  }

  async function refreshMap() {
    if (!map) return
    try {
      const res = await fetch(`/api/maps/${map.id}`, { cache: "no-store" })
      if (res.ok) {
        const refreshed = (await res.json()) as MapData
        setMap(refreshed)
        addChatMessage("System", "Map refreshed!")
      }
    } catch (error) {
      console.error("Failed to refresh map:", error)
      addChatMessage("System", "Failed to refresh map")
    }
  }

  async function loadDungeonFromGenerator() {
    if (!dungeonRefIdInput.trim()) {
      alert("Please enter a dungeon reference ID")
      return
    }

    const refId = dungeonRefIdInput.trim()

    setShowDungeonDialog(false)
    setIsLoading(true)
    setLoadingStatus(`Loading generated dungeon...`)

    try {
      await loadGeneratedDungeonByRefId(refId)
    } catch (error) {
      console.error("Failed to load generated dungeon:", error)
      addChatMessage("System", "Failed to load generated dungeon")
    } finally {
      setIsLoading(false)
    }
  }

  function getTileProperties(tileId: string): TileProperties {
    return DEFAULT_TILE_PROPERTIES[tileId] || DEFAULT_TILE_PROPERTIES.floor
  }

  function canMoveTo(tileId: string): boolean {
    const props = getTileProperties(tileId)
    if (!props.walkable) return false
    if (props.movementRequirement === "none") return true
    return PLAYER_ABILITIES.has(props.movementRequirement)
  }

  // Input listeners
  useEffect(() => {
    if (isLoading) return // Don't handle input while loading

    const down = (e: KeyboardEvent) => {
      if (e.key) {
        pressed.current.add(e.key.toLowerCase())
      }
    }
    const up = (e: KeyboardEvent) => {
      if (e.key) {
        pressed.current.delete(e.key.toLowerCase())
      }
    }
    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)
    return () => {
      window.removeEventListener("keydown", down)
      window.removeEventListener("keyup", up)
    }
  }, [isLoading])

  // Relative direction movement system (based on facing direction)
  useEffect(() => {
    if (!map || isLoading) return
    let raf = 0
    const step = (now: number) => {
      const keys = pressed.current
      const moveDelay = 200 // milliseconds between moves

      if (now - lastMoveTime.current > moveDelay) {
        let { x, y, dir } = player
        let moved = false

        // Rotation (Q/E and Arrow keys) - FIX: swap the directions
        if (keys.has("q") || keys.has("arrowleft")) {
          dir += Math.PI / 2 // Turn left (clockwise when facing south)
          moved = true
        }
        if (keys.has("e") || keys.has("arrowright")) {
          dir -= Math.PI / 2 // Turn right (counter-clockwise when facing south)
          moved = true
        }

        // Relative movement based on facing direction
        let newX = x
        let newY = y

        // Forward (W or Up Arrow) - move in facing direction
        if (keys.has("w") || keys.has("arrowup")) {
          newX = Math.round(x + Math.cos(dir))
          newY = Math.round(y + Math.sin(dir))
          moved = true
        }
        // Backward (S or Down Arrow) - move opposite to facing direction
        if (keys.has("s") || keys.has("arrowdown")) {
          newX = Math.round(x - Math.cos(dir))
          newY = Math.round(y - Math.sin(dir))
          moved = true
        }
        // Strafe Left (A) - move perpendicular left to facing direction
        if (keys.has("a")) {
          newX = Math.round(x + Math.cos(dir - Math.PI / 2))
          newY = Math.round(y + Math.sin(dir - Math.PI / 2))
          moved = true
        }
        // Strafe Right (D) - move perpendicular right to facing direction
        if (keys.has("d")) {
          newX = Math.round(x + Math.cos(dir + Math.PI / 2))
          newY = Math.round(y + Math.sin(dir + Math.PI / 2))
          moved = true
        }

        // Check bounds and collision for movement
        if (newX !== x || newY !== y) {
          if (newX >= 0 && newX < map.width && newY >= 0 && newY < map.height) {
            const tileId = map.tiles[newY]?.[newX]
            if (canMoveTo(tileId)) {
              x = newX
              y = newY
              // Check if we entered a new tile
              if (tileId && tileId !== currentTile) {
                setCurrentTile(tileId)
                const props = getTileProperties(tileId)
                addChatMessage("System", `You enter ${props.name}`)
              }
            }
          }
        }

        // Normalize direction
        while (dir < 0) dir += Math.PI * 2
        while (dir >= Math.PI * 2) dir -= Math.PI * 2

        if (moved) {
          setPlayer({ x, y, dir })
          lastMoveTime.current = now
        }
      }

      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [map, player, currentTile, isLoading])

  function addChatMessage(author: string, content: string) {
    setChat((c) => [...c, { id: crypto.randomUUID(), author, content, ts: Date.now() }])
  }

  function sendChat() {
    const trimmed = input.trim()
    if (!trimmed) return

    // Handle special commands
    if (trimmed.toLowerCase() === "search room" || trimmed.toLowerCase() === "look") {
      const tileId = map?.tiles[player.y]?.[player.x]
      if (tileId) {
        const props = getTileProperties(tileId)
        addChatMessage("System", props.description)
      }
      setInput("")
      return
    }

    addChatMessage("You", trimmed)
    setInput("")
  }

  // Filter quests based on search
  const filteredQuests = SAMPLE_QUESTS.filter(
    (quest) =>
      quest.title.toLowerCase().includes(questSearch.toLowerCase()) ||
      quest.description.toLowerCase().includes(questSearch.toLowerCase()),
  )

  // Show loading screen
  if (isLoading) {
    return (
      <div className="min-h-[100svh] bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-orange-500/20 rounded-full"></div>
            <div className="absolute inset-0 w-24 h-24 border-4 border-orange-500 rounded-full border-t-transparent animate-spin"></div>
            <Loader2 className="absolute inset-0 m-auto w-8 h-8 text-orange-500 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Graphical MUD</h1>
            <p className="text-orange-400 font-medium">{loadingStatus}</p>
            <div className="w-64 h-1 bg-gray-700 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="text-gray-400 text-sm">Preparing your adventure...</p>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <main className="min-h-[100svh] bg-background relative overflow-hidden">
        <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-sm border-b">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Graphical MUD</span>
            <span className="text-sm text-muted-foreground">W/S: Forward/Back, A/D: Strafe, Q/E: Turn</span>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={showDungeonDialog} onOpenChange={setShowDungeonDialog}>
              <DialogTrigger asChild>
                <Button variant="secondary" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Load Generated Dungeon
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Load Generated Dungeon</DialogTitle>
                  <DialogDescription>
                    Enter the dungeon reference ID to load a generated dungeon from the database.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="dungeonRefId">Dungeon Reference ID</Label>
                    <Input
                      id="dungeonRefId"
                      placeholder="e.g., test-guild-123-L1-1754870826264-de0j18"
                      value={dungeonRefIdInput}
                      onChange={(e) => setDungeonRefIdInput(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Format: guild-number-level-timestamp-id</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={loadDungeonFromGenerator} className="flex-1">
                      Load Dungeon
                    </Button>
                    <Button variant="outline" onClick={() => setShowDungeonDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="secondary" size="sm" onClick={refreshMap}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh Map
            </Button>
            <Link href="/dashboard">
              <Button variant="secondary" size="sm">
                Dashboard
              </Button>
            </Link>
            <Link href="/admin/migrate" className="text-xs text-muted-foreground underline underline-offset-2">
              Migrate
            </Link>
          </div>
        </header>

        {/* Main Layout - Three Column */}
        <div className="absolute inset-0 pt-16 flex">
          {/* Character Sheet - Left Column */}
          <div className="w-80 flex-shrink-0 bg-background border-r overflow-auto">
            <CharacterSheet
              vitals={heroVitals}
              questSearch={questSearch}
              setQuestSearch={setQuestSearch}
              filteredQuests={filteredQuests}
              onTick={() =>
                setHeroVitals((v) => ({
                  ...v,
                  hp: clamp(v.hp - 1, 0, v.hpMax),
                  mana: clamp(v.mana + 1, 0, v.manaMax),
                  stamina: clamp(v.stamina - 1, 0, v.staminaMax),
                }))
              }
            />
          </div>

          {/* FPS View - Center Column */}
          <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 relative">
            {/* Party Member Badges - Top of FPS View */}
            <div className="absolute top-4 flex gap-2 z-40">
              {party.map((member) => {
                const healthPercent = (member.hp / member.maxHp) * 100
                return (
                  <Tooltip key={member.id}>
                    <TooltipTrigger asChild>
                      <div className="relative h-12 w-12 rounded-full border-2 border-primary/20 flex items-center justify-center text-sm font-bold shadow-lg cursor-pointer hover:border-primary/40 transition-colors overflow-hidden">
                        <div
                          className="absolute inset-0 bg-red-500/80 transition-all duration-300"
                          style={{
                            clipPath: `circle(${healthPercent}% at 50% 50%)`,
                          }}
                        />
                        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm rounded-full" />
                        <div
                          className="absolute inset-0 bg-red-500/80 rounded-full transition-all duration-300"
                          style={{
                            clipPath: `circle(${healthPercent}% at 50% 50%)`,
                          }}
                        />
                        <span className="relative z-10 text-white font-bold drop-shadow-sm">
                          {member.name.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 p-0 rounded-lg overflow-hidden"
                    >
                      <div className="relative">
                        {/* Badge icon placeholder */}
                        <div className="absolute top-2 left-2 w-4 h-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full border border-white/20"></div>

                        <div className="p-3 pl-8 space-y-2">
                          <div className="space-y-1">
                            <div className="font-semibold text-white text-sm">PlayerName123</div>
                            <div className="text-xs text-gray-400">Playing as: {member.name}</div>
                            <div className="text-xs text-gray-300">
                              Level {member.level} {member.class}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="text-xs text-gray-400">
                              HP: {member.hp}/{member.maxHp}
                            </div>
                            <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all duration-300"
                                style={{ width: `${healthPercent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>

            <VectorFirstPersonView map={map} player={player} />
          </div>

          {/* Right Column - Split into Minimap (top) and Chat (bottom) */}
          <div className="w-80 flex-shrink-0 bg-gray-900 border-l flex flex-col">
            {/* Minimap Section - Top */}
            <div className="bg-gray-900 border-b border-gray-700 p-4 flex flex-col items-center">
              <h3 className="font-semibold text-white text-sm mb-3">Minimap</h3>
              <StaticMinimap map={map} player={player} />
            </div>

            {/* Chat Section - Bottom */}
            <div className="flex-1 flex flex-col">
              <ChatPanel
                chat={chat}
                input={input}
                setInput={setInput}
                sendChat={sendChat}
                onTick={() =>
                  setHeroVitals((v) => ({
                    ...v,
                    hp: clamp(v.hp - 3, 0, v.hpMax),
                    mana: clamp(v.mana + 2, 0, v.manaMax),
                    stamina: clamp(v.stamina - 1, 0, v.staminaMax),
                  }))
                }
              />
            </div>
          </div>
        </div>
      </main>
    </TooltipProvider>
  )
}

// ... (rest of the component functions remain the same)
function CharacterSheet({
  vitals,
  questSearch,
  setQuestSearch,
  filteredQuests,
  onTick,
}: {
  vitals: { hp: number; hpMax: number; mana: number; manaMax: number; stamina: number; staminaMax: number }
  questSearch: string
  setQuestSearch: (value: string) => void
  filteredQuests: Quest[]
  onTick?: () => void
}) {
  return (
    <div className="h-full bg-gradient-to-br from-gray-800 via-gray-900 to-black text-white p-4">
      <Tabs defaultValue="character" className="h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700">
          <TabsTrigger
            value="character"
            className="data-[state=active]:bg-gray-700 text-gray-300 data-[state=active]:text-white"
          >
            Hero
          </TabsTrigger>
          <TabsTrigger
            value="stats"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-orange-600 text-gray-300 data-[state=active]:text-white data-[state=active]:shadow-lg"
          >
            Stats
          </TabsTrigger>
          <TabsTrigger
            value="inventory"
            className="data-[state=active]:bg-gray-700 text-gray-300 data-[state=active]:text-white"
          >
            Items
          </TabsTrigger>
          <TabsTrigger
            value="quests"
            className="data-[state=active]:bg-gray-700 text-gray-300 data-[state=active]:text-white"
          >
            Quests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="character" className="flex-1 mt-4 space-y-4">
          {/* Player Name */}
          <div className="text-center">
            <div className="text-lg font-bold">AdventurerX</div>
            <div className="text-sm text-gray-400">Level 7 Warrior</div>
          </div>

          {/* Vitals */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Heart className="w-4 h-4 text-red-400" />
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span>Health</span>
                  <span>
                    {vitals.hp}/{vitals.hpMax}
                  </span>
                </div>
                <Progress value={(vitals.hp / vitals.hpMax) * 100} className="h-2 bg-gray-700" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span>Mana</span>
                  <span>
                    {vitals.mana}/{vitals.manaMax}
                  </span>
                </div>
                <Progress value={(vitals.mana / vitals.manaMax) * 100} className="h-2 bg-gray-700" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Battery className="w-4 h-4 text-green-400" />
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span>Stamina</span>
                  <span>
                    {vitals.stamina}/{vitals.staminaMax}
                  </span>
                </div>
                <Progress value={(vitals.stamina / vitals.staminaMax) * 100} className="h-2 bg-gray-700" />
              </div>
            </div>
          </div>

          {/* Equipment Slots - 3x3 Grid */}
          <div className="space-y-3">
            <div className="text-sm font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Equipment
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <EquipmentSlot icon={<Zap className="w-4 h-4" />} label="Floater" />
              <EquipmentSlot icon={<Crown className="w-4 h-4" />} label="Head" level="Lv2" />
              <EquipmentSlot icon={<Shirt className="w-4 h-4" />} label="Shoulders" />
              <EquipmentSlot icon={<Sword className="w-4 h-4" />} label="Main" level="Lv5" />
              <EquipmentSlot icon={<Shirt className="w-4 h-4" />} label="Body" />
              <EquipmentSlot icon={<Shield className="w-4 h-4" />} label="Off" level="Lv3" />
              <EquipmentSlot icon={<Hand className="w-4 h-4" />} label="Hand" />
              <EquipmentSlot icon={<Footprints className="w-4 h-4" />} label="Feet" />
              <EquipmentSlot icon={<Ring className="w-4 h-4" />} label="Ring" />
            </div>
          </div>

          {/* Currency & Resources */}
          <div className="bg-gray-800/50 rounded-lg p-3 space-y-2 border border-gray-700">
            <div className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Coins className="w-4 h-4" />
              Resources
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-1">
                <Coins className="w-3 h-3 text-yellow-400" />
                <span>Gold</span>
              </div>
              <span className="font-semibold">2,547</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-1">
                <Gem className="w-3 h-3 text-purple-400" />
                <span>Gems</span>
              </div>
              <span className="font-semibold">23</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-blue-400" />
                <span>Experience</span>
              </div>
              <span className="font-semibold">1,250 / 2,500</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 bg-gray-800/50 border-gray-600 text-white hover:bg-gray-700"
            >
              Rest
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 bg-gray-800/50 border-gray-600 text-white hover:bg-gray-700"
              onClick={onTick}
            >
              <FlaskRound className="w-4 h-4 mr-1" />
              Potion
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="stats" className="flex-1 mt-4">
          {/* Ostentatious Stats Panel with Flair */}
          <div className="relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-orange-900/20 to-red-900/20 animate-pulse"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-500/5 to-transparent"></div>

            {/* Floating Particles Effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-amber-400 rounded-full animate-ping"></div>
              <div className="absolute top-3/4 right-1/3 w-1 h-1 bg-orange-400 rounded-full animate-ping animation-delay-1000"></div>
              <div className="absolute bottom-1/4 left-1/2 w-1 h-1 bg-yellow-400 rounded-full animate-ping animation-delay-2000"></div>
            </div>

            <div className="relative space-y-4 p-4 border border-amber-500/30 rounded-lg bg-gradient-to-br from-amber-950/30 to-orange-950/30 backdrop-blur-sm">
              {/* Header with Player Info */}
              <div className="text-center space-y-3 border-b border-amber-500/20 pb-4">
                <div className="relative inline-block">
                  <div className="w-24 h-24 bg-gradient-to-br from-amber-600 to-orange-600 rounded-full mx-auto flex items-center justify-center border-2 border-amber-400 shadow-lg shadow-amber-500/25">
                    <User className="w-12 h-12 text-white drop-shadow-lg" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center border border-white shadow-lg">
                    <Star className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <div className="text-xl font-bold bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">
                    AdventurerX
                  </div>
                  <div className="text-sm text-amber-200">Level 7 Warrior</div>
                </div>
              </div>

              {/* Core Stats with Fancy Styling */}
              <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-lg p-4 border border-amber-500/20 shadow-inner">
                <div className="text-sm font-semibold mb-3 flex items-center gap-2 text-amber-300">
                  <Target className="w-4 h-4" />
                  Core Attributes
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between items-center p-2 bg-gradient-to-r from-red-900/20 to-red-800/20 rounded border border-red-500/20">
                    <span className="text-red-300">Strength</span>
                    <span className="font-bold text-red-200">18</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gradient-to-r from-green-900/20 to-green-800/20 rounded border border-green-500/20">
                    <span className="text-green-300">Dexterity</span>
                    <span className="font-bold text-green-200">12</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gradient-to-r from-blue-900/20 to-blue-800/20 rounded border border-blue-500/20">
                    <span className="text-blue-300">Constitution</span>
                    <span className="font-bold text-blue-200">16</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gradient-to-r from-purple-900/20 to-purple-800/20 rounded border border-purple-500/20">
                    <span className="text-purple-300">Intelligence</span>
                    <span className="font-bold text-purple-200">8</span>
                  </div>
                </div>
              </div>

              {/* Special Stats */}
              <div className="bg-gradient-to-br from-amber-950/50 to-orange-950/50 rounded-lg p-4 border border-amber-400/30 shadow-lg">
                <div className="text-sm font-semibold mb-3 flex items-center gap-2 text-amber-300">
                  <Sparkles className="w-4 h-4" />
                  Special Attributes
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Coins className="w-3 h-3 text-yellow-400" />
                      <span className="text-amber-200">Gold Find Rate</span>
                    </div>
                    <span className="font-bold text-yellow-300">+125%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Target className="w-3 h-3 text-orange-400" />
                      <span className="text-amber-200">Critical Hit Chance</span>
                    </div>
                    <span className="font-bold text-orange-300">15.7%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Flame className="w-3 h-3 text-red-400" />
                      <span className="text-amber-200">Magic Find</span>
                    </div>
                    <span className="font-bold text-red-300">+89%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Shield className="w-3 h-3 text-blue-400" />
                      <span className="text-amber-200">Damage Reduction</span>
                    </div>
                    <span className="font-bold text-blue-300">23.4%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Battery className="w-3 h-3 text-green-400" />
                      <span className="text-amber-200">Experience Bonus</span>
                    </div>
                    <span className="font-bold text-green-300">+45%</span>
                  </div>
                </div>
              </div>

              {/* Legendary Border Effect */}
              <div className="absolute inset-0 rounded-lg border border-amber-400/20 pointer-events-none"></div>
              <div className="absolute inset-0 rounded-lg border border-amber-300/10 pointer-events-none animate-pulse"></div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="flex-1 mt-4">
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 h-full">
            <div className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Gem className="w-4 h-4" />
              Inventory
            </div>
            <div className="grid grid-cols-6 gap-2 h-full">
              {/* Sample inventory items */}
              {SAMPLE_INVENTORY.map((item) => (
                <InventorySlot key={item.id} item={item} />
              ))}
              {/* Empty slots */}
              {Array.from({ length: 30 - SAMPLE_INVENTORY.length }, (_, i) => (
                <InventorySlot key={`empty-${i}`} />
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="quests" className="flex-1 mt-4">
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 h-full flex flex-col">
            <div className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Scroll className="w-4 h-4" />
              Quest Log
            </div>

            {/* Search bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search quests..."
                value={questSearch}
                onChange={(e) => setQuestSearch(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-gray-500"
              />
            </div>

            {/* Quest list */}
            <div className="flex-1 overflow-auto space-y-3">
              {filteredQuests.map((quest) => (
                <QuestItem key={quest.id} quest={quest} />
              ))}
              {filteredQuests.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  {questSearch ? "No quests match your search." : "No quests available."}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EquipmentSlot({ icon, label, level }: { icon: React.ReactNode; label: string; level?: string }) {
  return (
    <div className="relative bg-gray-800/50 rounded border border-gray-600 p-1.5 aspect-square flex flex-col items-center justify-center hover:bg-gray-700/50 transition-colors cursor-pointer">
      <div className="text-center">
        {icon}
        <div className="text-xs mt-0.5 text-gray-400">{label}</div>
      </div>
      {level && (
        <div className="absolute -top-1 -right-1 text-xs bg-blue-600 px-1 rounded text-white font-bold">{level}</div>
      )}
    </div>
  )
}

function InventorySlot({ item }: { item?: InventoryItem }) {
  const rarityColors = {
    common: "border-gray-500",
    uncommon: "border-green-500",
    rare: "border-blue-500",
    epic: "border-purple-500",
    legendary: "border-orange-500",
  }

  if (!item) {
    return (
      <div className="aspect-square bg-gray-800/30 rounded border border-gray-600 hover:bg-gray-700/30 transition-colors cursor-pointer"></div>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`aspect-square bg-gray-800/50 rounded border-2 ${
            rarityColors[item.rarity]
          } hover:bg-gray-700/50 transition-colors cursor-pointer p-1 flex flex-col items-center justify-center relative`}
        >
          <div className="text-center">
            <Gem className="w-4 h-4 mx-auto mb-1" />
            <div className="text-xs text-gray-300 truncate w-full">{item.name.split(" ")[0]}</div>
          </div>
          {item.quantity && item.quantity > 1 && (
            <div className="absolute -top-1 -right-1 text-xs bg-blue-600 px-1 rounded text-white font-bold">
              {item.quantity}
            </div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="right" className="bg-gray-900/95 backdrop-blur-sm border border-gray-700">
        <div className="space-y-1">
          <div className={`font-semibold text-sm ${item.rarity === "legendary" ? "text-orange-400" : "text-white"}`}>
            {item.name}
          </div>
          <div className="text-xs text-gray-400 capitalize">{item.type}</div>
          <div className={`text-xs capitalize ${rarityColors[item.rarity].replace("border-", "text-")}`}>
            {item.rarity}
          </div>
          {item.quantity && <div className="text-xs text-gray-300">Quantity: {item.quantity}</div>}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

function QuestItem({ quest }: { quest: Quest }) {
  const statusColors = {
    active: "border-blue-500 bg-blue-900/20",
    completed: "border-green-500 bg-green-900/20",
    available: "border-gray-500 bg-gray-800/20",
  }

  const statusText = {
    active: "Active",
    completed: "Completed",
    available: "Available",
  }

  return (
    <div className={`p-3 rounded-lg border ${statusColors[quest.status]} hover:bg-opacity-30 transition-colors`}>
      <div className="flex items-start justify-between mb-2">
        <div className="font-semibold text-sm text-white">{quest.title}</div>
        <div
          className={`text-xs px-2 py-1 rounded ${
            quest.status === "active"
              ? "bg-blue-600 text-white"
              : quest.status === "completed"
                ? "bg-green-600 text-white"
                : "bg-gray-600 text-gray-200"
          }`}
        >
          {statusText[quest.status]}
        </div>
      </div>
      <div className="text-xs text-gray-300 mb-2">{quest.description}</div>
      {quest.progress && <div className="text-xs text-blue-400 mb-1">Progress: {quest.progress}</div>}
      {quest.reward && <div className="text-xs text-yellow-400">Reward: {quest.reward}</div>}
    </div>
  )
}

function ChatPanel({
  chat,
  input,
  setInput,
  sendChat,
  onTick,
}: {
  chat: ChatMessage[]
  input: string
  setInput: (value: string) => void
  sendChat: () => void
  onTick: () => void
}) {
  return (
    <>
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-white text-lg">Game Chat</h2>
          <p className="text-gray-400 text-sm">Commands: "look", "search room"</p>
        </div>
        <Button
          variant="outline"
          onClick={onTick}
          className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 rounded-lg w-10 h-10 p-0"
        >
          <FlaskRound className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {chat.map((m) => (
          <div key={m.id} className="text-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-gray-400 text-xs">{new Date(m.ts).toLocaleTimeString()}</span>
              <span className="font-medium text-white">{m.author}:</span>
            </div>
            <div className="text-gray-200 ml-2">{m.content}</div>
          </div>
        ))}
        {chat.length === 0 && (
          <div className="text-gray-500 text-sm text-center py-8">No messages yet. Try "look" or "search room"!</div>
        )}
      </div>

      <div className="p-3 border-t border-gray-700">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message or command..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendChat()}
            className="flex-1 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:border-gray-500 h-9"
          />
          <Button onClick={sendChat} className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 h-9">
            Send
          </Button>
        </div>
      </div>
    </>
  )
}

function StaticMinimap({
  map,
  player,
}: {
  map: MapData | null
  player: { x: number; y: number; dir: number }
}) {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const size = 120

  // Key that changes when any tile changes
  const tilesKey = map ? map.tiles.map((r) => r.join(",")).join(";") : ""

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !map) return

    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const sx = size / map.width
    const sy = size / map.height

    // Draw tiles
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tileType = map.tiles[y][x]
        ctx.fillStyle = TILE_COLORS[tileType] || TILE_COLORS.floor
        ctx.fillRect(Math.floor(x * sx), Math.floor(y * sy), Math.ceil(sx), Math.ceil(sy))
      }
    }

    // Player
    const px = (player.x + 0.5) * sx
    const py = (player.y + 0.5) * sy
    ctx.fillStyle = "#ef4444"
    ctx.beginPath()
    ctx.arc(px, py, Math.max(2, Math.min(sx, sy) / 2), 0, Math.PI * 2)
    ctx.fill()

    // Facing line
    ctx.strokeStyle = "#ef4444"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(px, py)
    ctx.lineTo(px + Math.cos(player.dir) * 12, py + Math.sin(player.dir) * 12)
    ctx.stroke()

    // Border
    ctx.strokeStyle = "rgba(255,255,255,0.5)"
    ctx.lineWidth = 2
    ctx.strokeRect(1, 1, size - 2, size - 2)
  }, [tilesKey, player, size])

  return (
    <div className="bg-gray-800/50 rounded border border-gray-600 p-2">
      <canvas ref={ref} className="border rounded bg-muted" style={{ width: size, height: size }} />
    </div>
  )
}

function VectorFirstPersonView({
  map,
  player,
}: {
  map: MapData | null
  player: { x: number; y: number; dir: number }
}) {
  const ref = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return

    const size = Math.min(window.innerHeight - 120, 600)
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = "#000000"
    ctx.fillRect(0, 0, size, size)

    // Show error if no map
    if (!map) {
      ctx.fillStyle = "#ff4444"
      ctx.font = "24px monospace"
      ctx.textAlign = "center"
      ctx.fillText("MAP FAILED TO LOAD", size / 2, size / 2 - 40)
      ctx.fillStyle = "#ffaa44"
      ctx.font = "16px monospace"
      ctx.fillText("Check chat for error details", size / 2, size / 2)
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 3
      ctx.strokeRect(8.5, 8.5, size - 17, size - 17)
      return
    }

    // Helpers
    function getTileInfo(tileId: string) {
      return {
        color: TILE_COLORS[tileId] || "#d97706",
        properties: DEFAULT_TILE_PROPERTIES[tileId] || DEFAULT_TILE_PROPERTIES.floor,
      }
    }

    function isWall(tileId: string): boolean {
      const info = getTileInfo(tileId)
      return !info.properties.walkable || info.properties.blocksVision || info.properties.category === "wall"
    }

    function getTileAt(x: number, y: number): string {
      if (!map || x < 0 || x >= map.width || y < 0 || y >= map.height) return "wall"
      return map.tiles[y][x]
    }

    // Snap to cardinal (90°) for classic dungeon view
    function roundToCardinal(rad: number) {
      const twoPi = Math.PI * 2
      let a = rad % twoPi
      if (a < 0) a += twoPi
      const quarter = Math.PI / 2
      const idx = Math.round(a / quarter) % 4
      return idx * quarter
    }

    function dirToStep(a: number) {
      // 0 => +x, PI/2 => +y, PI => -x, 3PI/2 => -y
      const quarter = Math.PI / 2
      const idx = Math.round(a / quarter) % 4
      if (idx === 0) return { dx: 1, dy: 0 }
      if (idx === 1) return { dx: 0, dy: 1 }
      if (idx === 2) return { dx: -1, dy: 0 }
      return { dx: 0, dy: -1 }
    }

    function createHatchPattern(ctx: CanvasRenderingContext2D, color = "#d97706") {
      const c = document.createElement("canvas")
      c.width = 8
      c.height = 8
      const p = c.getContext("2d")!
      p.clearRect(0, 0, 8, 8)
      p.strokeStyle = color
      p.lineWidth = 1
      p.beginPath()
      p.moveTo(0, 8)
      p.lineTo(8, 0)
      p.stroke()
      p.beginPath()
      p.moveTo(-4, 8)
      p.lineTo(4, 0)
      p.stroke()
      return ctx.createPattern(c, "repeat")!
    }

    function fillPolygon(
      ctx: CanvasRenderingContext2D,
      points: Array<{ x: number; y: number }>,
      fillStyle?: string | CanvasPattern,
      strokeStyle = "#000",
    ) {
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(points[0].x, points[0].y)
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y)
      }
      ctx.closePath()
      if (fillStyle) ctx.fillStyle = fillStyle as any
      ctx.fill()
      ctx.strokeStyle = strokeStyle
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.restore()
    }

    const W = canvas.width
    const H = canvas.height
    const centerX = W / 2

    // Load tileset
    const tileset = new Image()
    tileset.crossOrigin = "anonymous"
    tileset.src = "/dungeon-tileset.png"

    tileset.onload = () => {
      // Tileset is 16x16 tiles, each tile is 64x64 pixels
      const TILE_SIZE = 64

      // Tile mapping (row, col) in the tileset
      const TILE_MAP = {
        wall: { row: 0, col: 0 }, // Gray stone wall
        door: { row: 1, col: 6 }, // Wooden door
        treasure: { row: 2, col: 9 }, // Treasure chest
        torch: { row: 1, col: 8 }, // Torch
        floor: { row: 3, col: 0 }, // Floor tile
        stairs: { row: 3, col: 1 }, // Stairs
        water: { row: 3, col: 2 }, // Dark water/pit
        tree: { row: 1, col: 8 }, // Use torch sprite for tree
        // Additional mappings for generated dungeon types
        corridor: { row: 3, col: 0 }, // Same as floor
        room: { row: 3, col: 0 }, // Same as floor
        entrance: { row: 3, col: 1 }, // Use stairs sprite
        exit: { row: 3, col: 1 }, // Use stairs sprite
        trap: { row: 3, col: 2 }, // Use water/pit sprite
        secret: { row: 2, col: 9 }, // Use treasure sprite
      }

      function getSpriteBounds(tileType: string) {
        const tileInfo = TILE_MAP[tileType as keyof typeof TILE_MAP] || TILE_MAP.wall
        const srcX = tileInfo.col * TILE_SIZE
        const srcY = tileInfo.row * TILE_SIZE
        return { srcX, srcY, srcWidth: TILE_SIZE, srcHeight: TILE_SIZE }
      }

      function drawTexturedPolygon(
        ctx: CanvasRenderingContext2D,
        points: Array<{ x: number; y: number }>,
        tileType: string,
      ) {
        const sprite = getSpriteBounds(tileType)

        // Create a temporary canvas for the texture
        const tempCanvas = document.createElement("canvas")
        const tempCtx = tempCanvas.getContext("2d")!

        // Calculate bounding box of the polygon
        const minX = Math.min(...points.map((p) => p.x))
        const maxX = Math.max(...points.map((p) => p.x))
        const minY = Math.min(...points.map((p) => p.y))
        const maxY = Math.max(...points.map((p) => p.y))

        const width = maxX - minX
        const height = maxY - minY

        tempCanvas.width = width
        tempCanvas.height = height

        // Draw the sprite tile to fill the area
        const tilesX = Math.ceil(width / 64)
        const tilesY = Math.ceil(height / 64)

        for (let ty = 0; ty < tilesY; ty++) {
          for (let tx = 0; tx < tilesX; tx++) {
            tempCtx.drawImage(
              tileset,
              sprite.srcX,
              sprite.srcY,
              sprite.srcWidth,
              sprite.srcHeight,
              tx * 64,
              ty * 64,
              64,
              64,
            )
          }
        }

        // Apply the polygon clipping
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(points[0].x, points[0].y)
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y)
        }
        ctx.closePath()
        ctx.clip()

        // Draw the textured area
        ctx.drawImage(tempCanvas, minX, minY)

        // Draw border
        ctx.restore()
        ctx.beginPath()
        ctx.moveTo(points[0].x, points[0].y)
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y)
        }
        ctx.closePath()
        ctx.strokeStyle = "#444"
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // Classic corridor parameters - restore original trapezoidal approach
      const maxDepth = 5 // visible steps ahead

      // Perspective helpers: boundary at level k (0..maxDepth)
      function boundsAt(level: number) {
        const t = level / maxDepth
        const halfNear = W * 0.47
        const halfFar = W * 0.08
        const half = halfNear + (halfFar - halfNear) * t // lerp
        const topNear = H * 0.22
        const topFar = H * 0.45
        const top = topNear + (topFar - topNear) * t
        const bottom = H - top
        return {
          leftX: centerX - half,
          rightX: centerX + half,
          topY: top,
          bottomY: bottom,
        }
      }

      // Facing and step vectors
      const facing = roundToCardinal(player.dir)
      const { dx, dy } = dirToStep(facing)
      const leftVec = { lx: -dy, ly: dx }
      const rightVec = { rx: dy, ry: -dx }

      // Starting cell
      const sx = player.x
      const sy = player.y

      // Draw depth bands from near (band 1) to far (band maxDepth) with proper trapezoids
      for (let band = 1; band <= maxDepth; band++) {
        const prev = boundsAt(band - 1)
        const next = boundsAt(band)

        // Cell we're standing "in front of" for this band
        const cx = sx + dx * (band - 1)
        const cy = sy + dy * (band - 1)

        // Side walls check
        const leftTileId = getTileAt(cx + leftVec.lx, cy + leftVec.ly)
        const rightTileId = getTileAt(cx + rightVec.rx, cy + rightVec.ry)
        const hasLeft = isWall(leftTileId)
        const hasRight = isWall(rightTileId)

        // Left wall - trapezoidal
        if (hasLeft) {
          const leftWall = [
            { x: prev.leftX, y: prev.topY },
            { x: next.leftX, y: next.topY },
            { x: next.leftX, y: next.bottomY },
            { x: prev.leftX, y: prev.bottomY },
          ]
          drawTexturedPolygon(ctx, leftWall, leftTileId)
        }

        // Right wall - trapezoidal
        if (hasRight) {
          const rightWall = [
            { x: prev.rightX, y: prev.topY },
            { x: next.rightX, y: next.topY },
            { x: next.rightX, y: next.bottomY },
            { x: prev.rightX, y: prev.bottomY },
          ]
          drawTexturedPolygon(ctx, rightWall, rightTileId)
        }

        // Front wall: one step ahead of the band
        const fx = sx + dx * band
        const fy = sy + dy * band
        const frontId = getTileAt(fx, fy)
        if (isWall(frontId)) {
          // Draw front wall as a proper rectangle at the far boundary
          const frontWall = [
            { x: next.leftX, y: next.topY },
            { x: next.rightX, y: next.topY },
            { x: next.rightX, y: next.bottomY },
            { x: next.leftX, y: next.bottomY },
          ]
          drawTexturedPolygon(ctx, frontWall, frontId)
          // Stop drawing further bands; the corridor is blocked
          break
        }
      }

      // Optional white frame like references
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 3
      ctx.strokeRect(8.5, 8.5, W - 17, H - 17)
    }

    // If tileset fails to load, fall back to hatch pattern rendering
    tileset.onerror = () => {
      console.warn("Failed to load tileset, using fallback rendering")

      // Fallback rendering with hatch patterns
      const maxDepth = 5

      function boundsAt(level: number) {
        const t = level / maxDepth
        const halfNear = W * 0.47
        const halfFar = W * 0.08
        const half = halfNear + (halfFar - halfNear) * t
        const topNear = H * 0.22
        const topFar = H * 0.45
        const top = topNear + (topFar - topNear) * t
        const bottom = H - top
        return {
          leftX: centerX - half,
          rightX: centerX + half,
          topY: top,
          bottomY: bottom,
        }
      }

      const facing = roundToCardinal(player.dir)
      const { dx, dy } = dirToStep(facing)
      const leftVec = { lx: -dy, ly: dx }
      const rightVec = { rx: dy, ry: -dx }
      const sx = player.x
      const sy = player.y

      for (let band = 1; band <= maxDepth; band++) {
        const prev = boundsAt(band - 1)
        const next = boundsAt(band)

        const cx = sx + dx * (band - 1)
        const cy = sy + dy * (band - 1)

        const leftTileId = getTileAt(cx + leftVec.lx, cy + leftVec.ly)
        const rightTileId = getTileAt(cx + rightVec.rx, cy + rightVec.ry)
        const hasLeft = isWall(leftTileId)
        const hasRight = isWall(rightTileId)

        if (hasLeft) {
          const leftWall = [
            { x: prev.leftX, y: prev.topY },
            { x: next.leftX, y: next.topY },
            { x: next.leftX, y: next.bottomY },
            { x: prev.leftX, y: prev.bottomY },
          ]
          const leftInfo = getTileInfo(leftTileId)
          fillPolygon(ctx, leftWall, createHatchPattern(ctx, leftInfo.color))
        }

        if (hasRight) {
          const rightWall = [
            { x: prev.rightX, y: prev.topY },
            { x: next.rightX, y: next.topY },
            { x: next.rightX, y: next.bottomY },
            { x: prev.rightX, y: prev.bottomY },
          ]
          const rightInfo = getTileInfo(rightTileId)
          fillPolygon(ctx, rightWall, createHatchPattern(ctx, rightInfo.color))
        }

        const fx = sx + dx * band
        const fy = sy + dy * band
        const frontId = getTileAt(fx, fy)
        if (isWall(frontId)) {
          const frontWall = [
            { x: next.leftX, y: next.topY },
            { x: next.rightX, y: next.topY },
            { x: next.rightX, y: next.bottomY },
            { x: next.leftX, y: next.bottomY },
          ]
          const frontInfo = getTileInfo(frontId)
          fillPolygon(ctx, frontWall, createHatchPattern(ctx, frontInfo.color))
          break
        }
      }

      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 3
      ctx.strokeRect(8.5, 8.5, W - 17, H - 17)
    }
  }, [map, player])

  return <canvas ref={ref} className="border-4 border-gray-600 shadow-2xl" />
}

function findFirstWalkable(map: MapData): { x: number; y: number } | null {
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const tileId = map.tiles[y][x]
      const props = DEFAULT_TILE_PROPERTIES[tileId]
      if (props?.walkable) return { x, y }
    }
  }
  return null
}
