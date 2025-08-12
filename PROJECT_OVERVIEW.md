# Discord Game Development Project

## Overview
This is a full-stack web application that combines a Discord bot with a graphical MUD (Multi-User Dungeon) game. The project includes dungeon generation, map editing, first-person 3D rendering, and Discord integration.

## Key Features

### 🎮 Game Client
- **First-Person 3D View**: Vector-based dungeon crawler with textured walls
- **Minimap**: Real-time player position and dungeon layout
- **Character Sheet**: Stats, inventory, equipment, and quest management
- **Chat System**: In-game messaging with command support
- **Movement**: WASD + Q/E controls with collision detection

### 🗺️ Map Editor (Dashboard)
- **Visual Editor**: Click-to-paint tile editor with multiple brushes
- **Tile System**: Floor, wall, water, tree, door, treasure tiles
- **Database Integration**: Save/load maps from PostgreSQL
- **Custom Textures**: Support for sprite-based tile rendering

### 🤖 Discord Bot
- **Slash Commands**: `/rps` and `/guess` interactive games
- **Button Interactions**: Rock-paper-scissors and number guessing
- **Webhook Integration**: Secure Discord interaction handling

### 🏰 Dungeon Generation
- **Procedural Generation**: Algorithm-based dungeon creation
- **Database Storage**: Generated dungeons stored with reference IDs
- **Multiple Formats**: Support for both tile arrays and 2D grids
- **Validation**: Ensures sufficient walkable areas

## Tech Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Radix UI**: Accessible component library
- **Canvas API**: 2D rendering for game view and minimap

### Backend
- **Next.js API Routes**: RESTful endpoints
- **Neon PostgreSQL**: Serverless database
- **Discord API**: Bot interactions and webhooks
- **Server Actions**: Form handling and mutations

### Database Schema
\`\`\`sql
-- Maps for the editor and game
CREATE TABLE maps (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  width INT NOT NULL,
  height INT NOT NULL,
  tiles JSONB NOT NULL,
  custom_textures JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated dungeons from Discord bot
CREATE TABLE generated_dungeons (
  id TEXT PRIMARY KEY,
  guild TEXT NOT NULL,
  dungeon_number INT NOT NULL,
  level INT DEFAULT 1,
  width INT NOT NULL,
  height INT NOT NULL,
  tiles JSONB NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Heroes (future expansion)
CREATE TABLE heroes (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  level INT DEFAULT 1,
  skills JSONB DEFAULT '[]'::JSONB,
  inventory JSONB DEFAULT '[]'::JSONB,
  map_id UUID REFERENCES maps(id),
  x INT DEFAULT 0,
  y INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
\`\`\`

## Environment Variables

### Required
\`\`\`env
# Database
DATABASE_URL=postgresql://user:pass@host/db

# Discord Bot
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_APPLICATION_ID=your_app_id
DISCORD_PUBLIC_KEY=your_public_key
DISCORD_GUILD_ID=your_test_guild_id (optional)

# Migration Security
MIGRATE_KEY=your_secret_migration_key
\`\`\`

### Optional
\`\`\`env
# Alternative database URLs (auto-detected)
POSTGRES_URL=...
POSTGRES_PRISMA_URL=...
POSTGRES_URL_NON_POOLING=...
\`\`\`

## Project Structure

\`\`\`
├── app/
│   ├── api/
│   │   ├── interactions/route.ts      # Discord webhook handler
│   │   ├── maps/                      # Map CRUD operations
│   │   ├── dungeons/                  # Dungeon generation API
│   │   └── admin/migrate/             # Database migration
│   ├── dashboard/page.tsx             # Map editor interface
│   ├── admin/migrate/                 # Migration UI
│   └── page.tsx                       # Main game client
├── lib/
│   ├── db.ts                          # Database connection
│   ├── schema.ts                      # Type definitions
│   ├── migrations.ts                  # Migration runner
│   └── sample-maps.ts                 # Default map generation
├── scripts/
│   ├── sql/                           # Migration files
│   ├── migrate.ts                     # CLI migration tool
│   └── register-commands.ts           # Discord command registration
├── components/ui/                     # Reusable UI components
└── public/                            # Static assets (sprites, textures)
\`\`\`

## Key Components

### Game Engine
- **Vector Rendering**: First-person view with trapezoidal perspective
- **Tile System**: Extensible tile properties (walkable, vision blocking, etc.)
- **Movement System**: Cardinal direction movement with collision
- **Asset Loading**: Sprite sheet support with fallback patterns

### Discord Integration
- **Webhook Verification**: Secure signature validation
- **Interactive Components**: Buttons and slash commands
- **User State**: Per-user game state tracking

### Database Layer
- **Auto-Migration**: Automatic schema updates on API calls
- **Fallback Storage**: In-memory storage when database unavailable
- **Connection Pooling**: Efficient database connection management

## Development Workflow

### Setup
1. Clone repository
2. Install dependencies: `npm install`
3. Set environment variables
4. Run migrations: `npm run migrate`
5. Register Discord commands: `npm run register-commands`
6. Start development: `npm run dev`

### Database Management
- **Migrations**: Add new `.sql` files to `scripts/sql/`
- **Schema Changes**: Update `lib/schema.ts` type definitions
- **Testing**: Use `/admin/migrate` for manual migration runs

### Discord Bot Development
- **Local Testing**: Use ngrok for webhook forwarding
- **Command Updates**: Modify `scripts/register-commands.ts`
- **Interaction Handling**: Update `app/api/interactions/route.ts`

## Current Status

### ✅ Completed Features
- Basic game client with movement and rendering
- Map editor with database persistence
- Discord bot with interactive commands
- Dungeon generation API
- Database schema and migrations
- Texture system with sprite support

### 🚧 In Progress
- Dungeon generation debugging (spawn point issues)
- Improved tile conversion from array to grid format
- Enhanced error handling and validation

### 📋 Future Enhancements
- Multiplayer support
- Combat system
- Quest system implementation
- Inventory management
- Party system
- Real-time Discord integration
- Mobile responsive design

## Troubleshooting

### Common Issues
1. **Database Connection**: Verify `DATABASE_URL` is set correctly
2. **Discord Webhook**: Ensure `DISCORD_PUBLIC_KEY` matches Discord app
3. **Migration Errors**: Check database permissions and connection
4. **Spawn Issues**: Use `/api/dungeons/debug` for generation analysis

### Debug Endpoints
- `/api/dungeons/test` - Database connectivity test
- `/api/dungeons/debug` - Dungeon generation analysis
- `/admin/migrate` - Manual migration interface

## Contributing
This project uses TypeScript with strict type checking. All database operations include fallback mechanisms for development without a database connection.

## License
Private development project.
