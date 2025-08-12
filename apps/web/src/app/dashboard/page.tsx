"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Save, Plus, MapIcon, RefreshCw, Eye } from "lucide-react"
import Link from "next/link"

// Enhanced tile system with properties
type TileType = "floor" | "wall" | "water" | "tree" | string
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

// Update TILE_COLORS to include new brushes
const TILE_COLORS: Record<string, string> = {
  floor: "#cdc6b3",
  wall: "#6b7280",
  water: "#60a5fa",
  tree: "#15803d",
  door: "#8b4513", // Brown for door
  treasure: "#ffd700", // Gold for treasure
}

// Update DEFAULT_TILE_PROPERTIES to include new brushes
const DEFAULT_TILE_PROPERTIES: Record<string, TileProperties> = {
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
}

// Update MapData type to remove customTextures
type MapData = {
  id: string
  name: string
  width: number
  height: number
  tiles: string[][]
}

export default function DashboardPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-2 h-4" />
          <div className="font-medium">Map Editor</div>
        </header>
        <div className="p-4">
          <MapEditor />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/">
                    <MapIcon className="mr-1" />
                    <span>Back to Game</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive>
                  <a href="/dashboard">
                    <MapIcon className="mr-1" />
                    <span>Map Editor</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

function MapEditor() {
  const [maps, setMaps] = React.useState<MapData[]>([])
  const [selectedId, setSelectedId] = React.useState<string>("")
  const [current, setCurrent] = React.useState<MapData | null>(null)
  const [brush, setBrush] = React.useState<string>("floor")
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const scale = 18

  React.useEffect(() => {
    loadMaps()
  }, [])

  React.useEffect(() => {
    draw()
  }, [current])

  async function loadMaps() {
    try {
      const res = await fetch("/api/maps", { cache: "no-store" })
      if (!res.ok) {
        const errorText = await res.text()
        console.error("Failed to load maps - API error:", res.status, errorText)
        // Create sample map as fallback
        await createSampleMapFallback()
        return
      }

      let data: MapData[]
      try {
        data = (await res.json()) as MapData[]
      } catch (jsonError) {
        console.error("Failed to parse maps JSON:", jsonError)
        await createSampleMapFallback()
        return
      }

      if (data.length === 0) {
        // Create sample map if no maps exist
        await createSampleMapFallback()
        return
      }

      setMaps(data)
      if (data[0] && !selectedId) {
        setSelectedId(data[0].id)
        setCurrent(data[0])
      }
    } catch (error) {
      console.error("Failed to load maps:", error)
      await createSampleMapFallback()
    }
  }

  async function createSampleMapFallback() {
    try {
      // Only create if we have no maps at all
      if (maps.length > 0) return

      // Generate sample map
      const sample = generateWizardryFloor1()
      sample.id = crypto.randomUUID()

      // Try to save it
      const createRes = await fetch("/api/maps", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(sample),
      })

      let created: MapData
      if (createRes.ok) {
        created = (await createRes.json()) as MapData
      } else {
        // Use local sample if API fails
        created = sample
      }

      setMaps([created])
      setSelectedId(created.id)
      setCurrent(created)

      console.log("Created sample map as fallback")
    } catch (fallbackError) {
      console.error("Failed to create sample map:", fallbackError)
      // Set empty state
      setMaps([])
      setCurrent(null)
    }
  }

  function draw() {
    const canvas = canvasRef.current
    if (!canvas || !current) return

    canvas.width = current.width * scale
    canvas.height = current.height * scale
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw tiles
    for (let y = 0; y < current.height; y++) {
      for (let x = 0; x < current.width; x++) {
        const tileType = current.tiles[y][x]

        ctx.fillStyle = TILE_COLORS[tileType] || TILE_COLORS.floor
        ctx.fillRect(x * scale, y * scale, scale, scale)
      }
    }

    // Draw grid
    ctx.strokeStyle = "rgba(0,0,0,0.2)"
    ctx.lineWidth = 1
    for (let x = 0; x <= current.width; x++) {
      ctx.beginPath()
      ctx.moveTo(x * scale + 0.5, 0)
      ctx.lineTo(x * scale + 0.5, current.height * scale)
      ctx.stroke()
    }
    for (let y = 0; y <= current.height; y++) {
      ctx.beginPath()
      ctx.moveTo(0, y * scale + 0.5)
      ctx.lineTo(current.width * scale, y * scale + 0.5)
      ctx.stroke()
    }
  }

  function onCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.floor((e.clientX - rect.left) / scale)
    const y = Math.floor((e.clientY - rect.top) / scale)
    if (x < 0 || y < 0 || x >= current.width || y >= current.height) return
    const next = structuredClone(current)
    next.tiles[y][x] = brush
    setCurrent(next)
  }

  async function save() {
    if (!current) return

    try {
      const payload = {
        name: current.name,
        width: current.width,
        height: current.height,
        tiles: current.tiles,
      }

      console.log("Saving map with payload:", payload) // Debug log

      const res = await fetch(`/api/maps/${current.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error("Save failed:", errorText)
        alert("Save failed: " + errorText)
        return
      }

      const saved = (await res.json()) as MapData
      console.log("Map saved successfully:", saved) // Debug log

      // Update local state with saved data
      setCurrent(saved)
      setMaps((ms) => ms.map((m) => (m.id === saved.id ? saved : m)))
      alert("Map saved successfully!")
    } catch (error) {
      console.error("Save error:", error)
      alert("Save failed: " + error)
    }
  }

  async function refresh() {
    if (!selectedId) return
    try {
      const res = await fetch(`/api/maps/${selectedId}`, { cache: "no-store" })
      if (!res.ok) {
        alert("Failed to refresh map")
        return
      }
      const refreshed = (await res.json()) as MapData
      setCurrent(refreshed)
      await loadMaps()
    } catch (error) {
      console.error("Refresh error:", error)
      alert("Refresh failed: " + error)
    }
  }

  async function create() {
    const name = prompt("New map name?", "New Map")
    if (!name) return
    const width = Number(prompt("Width (10-100)", "24")) || 24
    const height = Number(prompt("Height (10-100)", "16")) || 16
    const tiles: string[][] = Array.from({ length: height }, (_, y) =>
      Array.from({ length: width }, (_, x) =>
        x === 0 || y === 0 || x === width - 1 || y === height - 1 ? "wall" : "floor",
      ),
    )

    try {
      const res = await fetch("/api/maps", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: "", name, width, height, tiles }),
      })

      if (!res.ok) {
        alert("Create failed: " + (await res.text()))
        return
      }

      const created = (await res.json()) as MapData
      setMaps((ms) => [created, ...ms])
      setSelectedId(created.id)
      setCurrent(created)
    } catch (error) {
      console.error("Create error:", error)
      alert("Create failed: " + error)
    }
  }

  function select(id: string) {
    setSelectedId(id)
    const found = maps.find((m) => m.id === id)
    if (found) {
      setCurrent(found)
    }
  }

  async function previewInGame() {
    if (!current) return
    window.open(`/?mapId=${current.id}`, "_blank")
  }

  function getTileProperties(tileId: string): TileProperties {
    return DEFAULT_TILE_PROPERTIES[tileId] || DEFAULT_TILE_PROPERTIES.floor
  }

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Left controls */}
      <div className="col-span-12 lg:col-span-3 space-y-3">
        <Card className="p-3">
          <div className="text-sm font-medium mb-2">Maps</div>
          <div className="flex gap-2 mb-2">
            <Button size="sm" onClick={create}>
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
            <Button size="sm" variant="secondary" onClick={save}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={refresh}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
          <Select value={selectedId} onValueChange={select}>
            <SelectTrigger>
              <SelectValue placeholder="Select a map" />
            </SelectTrigger>
            <SelectContent>
              {maps.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name} ({m.width}×{m.height})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {current && (
            <Button size="sm" variant="outline" onClick={previewInGame} className="w-full mt-2 bg-transparent">
              <Eye className="h-4 w-4 mr-1" />
              Preview in Game
            </Button>
          )}
        </Card>

        <Card className="p-3">
          <div className="text-sm font-medium mb-2">Brushes</div>
          <div className="grid grid-cols-2 gap-2">
            {(["floor", "wall", "water", "tree", "door", "treasure"] as string[]).map((t) => (
              <button
                key={t}
                className={`h-9 rounded border text-sm ${brush === t ? "ring-2 ring-ring" : ""}`}
                style={{ background: TILE_COLORS[t] }}
                onClick={() => setBrush(t)}
                aria-pressed={brush === t}
                title={DEFAULT_TILE_PROPERTIES[t]?.name || t}
              >
                {t}
              </button>
            ))}
          </div>
        </Card>

        {current && (
          <Card className="p-3">
            <div className="text-sm font-medium mb-2">Details</div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Name</Label>
              <Input value={current.name} onChange={(e) => setCurrent({ ...current, name: e.target.value })} />
              <div className="text-xs text-muted-foreground">
                Size: {current.width} × {current.height} ({current.width * current.height} tiles)
              </div>
            </div>
          </Card>
        )}

        {brush && (
          <Card className="p-3">
            <div className="text-sm font-medium mb-2">Current Brush</div>
            <div className="space-y-1">
              {(() => {
                const props = getTileProperties(brush)
                return (
                  <>
                    <div className="text-sm font-medium">{props.name}</div>
                    <div className="text-xs text-muted-foreground">{props.description}</div>
                    <div className="flex gap-2 text-xs">
                      <span
                        className={`px-1 rounded ${props.walkable ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                      >
                        {props.walkable ? "Walkable" : "Blocked"}
                      </span>
                      <span className="px-1 rounded bg-blue-100 text-blue-800">{props.category}</span>
                      {props.movementRequirement !== "none" && (
                        <span className="px-1 rounded bg-purple-100 text-purple-800">
                          Needs: {props.movementRequirement}
                        </span>
                      )}
                    </div>
                  </>
                )
              })()}
            </div>
          </Card>
        )}
      </div>

      {/* Canvas editor */}
      <div className="col-span-12 lg:col-span-9">
        <Card className="p-3 overflow-auto">
          {!current ? (
            <div className="text-sm text-muted-foreground">Select or create a map.</div>
          ) : (
            <div className="w-full overflow-auto">
              <canvas
                ref={canvasRef}
                onClick={onCanvasClick}
                width={current.width * scale}
                height={current.height * scale}
                className="border rounded cursor-crosshair"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function TilePropertiesEditor({
  texture,
  onSave,
}: {
  texture: { id: string; name: string; originalMap?: string }
  onSave: (properties: TileProperties) => void
}) {
  const [properties, setProperties] = React.useState<TileProperties>(
    DEFAULT_TILE_PROPERTIES[texture.id] || {
      id: texture.id,
      name: texture.name,
      description: `A sprite from ${texture.originalMap}`,
      category: "floor",
      walkable: true,
      movementRequirement: "none",
      blocksVision: false,
    },
  )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={properties.name}
            onChange={(e) => setProperties({ ...properties, name: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            value={properties.category}
            onValueChange={(value: TileCategory) => setProperties({ ...properties, category: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="floor">Floor</SelectItem>
              <SelectItem value="wall">Wall</SelectItem>
              <SelectItem value="object">Object</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={properties.description}
          onChange={(e) => setProperties({ ...properties, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="walkable"
            checked={properties.walkable}
            onCheckedChange={(checked) => setProperties({ ...properties, walkable: !!checked })}
          />
          <Label htmlFor="walkable">Walkable</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="blocksVision"
            checked={properties.blocksVision}
            onCheckedChange={(checked) => setProperties({ ...properties, blocksVision: !!checked })}
          />
          <Label htmlFor="blocksVision">Blocks Vision</Label>
        </div>
      </div>

      <div>
        <Label htmlFor="movement">Movement Requirement</Label>
        <Select
          value={properties.movementRequirement}
          onValueChange={(value: MovementRequirement) => setProperties({ ...properties, movementRequirement: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="fly">Fly</SelectItem>
            <SelectItem value="swim">Swim</SelectItem>
            <SelectItem value="climb">Climb</SelectItem>
            <SelectItem value="teleport">Teleport</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button onClick={() => onSave(properties)} className="w-full">
        Save Properties
      </Button>
    </div>
  )
}

function generateWizardryFloor1(): MapData {
  const width = 24
  const height = 16
  const tiles: string[][] = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => {
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
        return "wall"
      }
      if (x === 1 && y === 1) return "treasure" // Add treasure chest
      if (x === width - 2 && y === height - 2) return "door" // Add door
      if (x === 3 && y === 3) return "tree" // Add tree/torch
      return "floor"
    }),
  )

  return {
    id: "",
    name: "Dungeon Floor 1 (Textured)",
    width,
    height,
    tiles,
  }
}
