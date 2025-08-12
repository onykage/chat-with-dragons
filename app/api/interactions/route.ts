import nacl from "tweetnacl"
import type { NextFetchEvent } from "next/server"

type Snowflake = string

// Discord Interaction constants
const InteractionType = {
  PING: 1,
  APPLICATION_COMMAND: 2,
  MESSAGE_COMPONENT: 3,
} as const

const InteractionResponseType = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
  UPDATE_MESSAGE: 7,
} as const

const MessageFlags = {
  EPHEMERAL: 1 << 6, // 64
} as const

// Utilities
function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...(init ?? {}),
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  })
}

async function verifyDiscordRequest(request: Request) {
  const signature = request.headers.get("x-signature-ed25519") || ""
  const timestamp = request.headers.get("x-signature-timestamp") || ""
  const publicKey = process.env.DISCORD_PUBLIC_KEY

  const bodyText = await request.text()

  if (!publicKey) {
    return { isValid: false, bodyText, reason: "Missing DISCORD_PUBLIC_KEY" }
  }

  const isValid = nacl.sign.detached.verify(
    new TextEncoder().encode(timestamp + bodyText),
    hexToUint8Array(signature),
    hexToUint8Array(publicKey),
  )

  return { isValid, bodyText, reason: isValid ? "ok" : "bad signature" }
}

function hexToUint8Array(hex: string) {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(hex.substr(i * 2, 2), 16)
  }
  return bytes
}

// Types for the parts we use
type CommandInteraction = {
  id: Snowflake
  application_id: Snowflake
  type: typeof InteractionType.APPLICATION_COMMAND
  token: string
  version: number
  data: {
    id: Snowflake
    name: string
    type: number
    options?: Array<{ name: string; type: number; value: string | number }>
  }
  guild_id?: Snowflake
  channel_id?: Snowflake
  member?: {
    user?: { id: Snowflake; username: string }
  }
  user?: { id: Snowflake; username: string } // for DMs
}

type ComponentInteraction = {
  id: Snowflake
  application_id: Snowflake
  type: typeof InteractionType.MESSAGE_COMPONENT
  token: string
  version: number
  data: {
    component_type: number
    custom_id: string
  }
  message: {
    id: Snowflake
    content: string
  }
  guild_id?: Snowflake
  channel_id?: Snowflake
  member?: {
    user?: { id: Snowflake; username: string }
  }
  user?: { id: Snowflake; username: string }
}

type PingInteraction = { type: typeof InteractionType.PING }

type Interaction = CommandInteraction | ComponentInteraction | PingInteraction

export async function POST(req: Request, _ctx?: { event: NextFetchEvent }) {
  // 1) Verify signature
  const verification = await verifyDiscordRequest(req)
  if (!verification.isValid) {
    return new Response("Bad request signature", { status: 401 })
  }

  // 2) Parse the JSON after verifying signature
  const body = JSON.parse(verification.bodyText) as Interaction

  // 3) Handle PING
  if (body.type === InteractionType.PING) {
    return json({ type: InteractionResponseType.PONG })
  }

  // 4) Handle Slash Commands
  if (body.type === InteractionType.APPLICATION_COMMAND) {
    const name = body.data.name.toLowerCase()
    const userId = getUserId(body)

    if (name === "rps") {
      return json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: rpsPrompt(userId),
      })
    }

    if (name === "guess") {
      const correct = 1 + Math.floor(Math.random() * 5)
      return json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: guessPrompt(correct, userId),
      })
    }

    // Unknown command
    return json({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "Unknown command.",
        flags: MessageFlags.EPHEMERAL,
      },
    })
  }

  // 5) Handle Button Interactions
  if (body.type === InteractionType.MESSAGE_COMPONENT) {
    const userId = getUserId(body)
    const { custom_id } = body.data

    // rps:<move>:<ownerId>
    if (custom_id.startsWith("rps:")) {
      const [, move, ownerId] = custom_id.split(":")
      if (ownerId && userId !== ownerId) {
        return json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: "This RPS prompt was started by someone else.",
            flags: MessageFlags.EPHEMERAL,
          },
        })
      }
      const botMove = pickRandom(["rock", "paper", "scissors"])
      const outcome = rpsOutcome(move as any, botMove)
      const pretty = {
        rock: "🪨 Rock",
        paper: "📄 Paper",
        scissors: "✂️ Scissors",
      } as const
      const resultText = outcome === "win" ? "You win! 🎉" : outcome === "lose" ? "You lose! 😵" : "It’s a draw. 🤝"
      return json({
        type: InteractionResponseType.UPDATE_MESSAGE,
        data: {
          content: `You chose ${pretty[move as keyof typeof pretty]}, I chose ${pretty[botMove]}. ${resultText}`,
          components: [],
        },
      })
    }

    // guess:pick:<chosen>:<correct>:<ownerId>
    if (custom_id.startsWith("guess:pick:")) {
      const [, , chosenStr, correctStr, ownerId] = custom_id.split(":")
      if (ownerId && userId !== ownerId) {
        return json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: "This Guess prompt was started by someone else.",
            flags: MessageFlags.EPHEMERAL,
          },
        })
      }
      const chosen = Number(chosenStr)
      const correct = Number(correctStr)
      const success = chosen === correct
      return json({
        type: InteractionResponseType.UPDATE_MESSAGE,
        data: {
          content: success
            ? `You picked ${chosen}. Correct! 🎯`
            : `You picked ${chosen}. Nope! The correct number was ${correct}.`,
          components: [
            {
              type: 1,
              components: [
                {
                  type: 2,
                  style: 1,
                  label: "Play again",
                  custom_id: `guess:again:${ownerId}`,
                },
              ],
            },
          ],
        },
      })
    }

    // guess:again:<ownerId>
    if (custom_id.startsWith("guess:again:")) {
      const [, , ownerId] = custom_id.split(":")
      if (ownerId && userId !== ownerId) {
        return json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: "This Guess prompt was started by someone else.",
            flags: MessageFlags.EPHEMERAL,
          },
        })
      }
      const correct = 1 + Math.floor(Math.random() * 5)
      return json({
        type: InteractionResponseType.UPDATE_MESSAGE,
        data: guessPrompt(correct, ownerId),
      })
    }

    // Fallback
    return json({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "Unsupported interaction.",
        flags: MessageFlags.EPHEMERAL,
      },
    })
  }

  // 6) Fallback
  return new Response("Not implemented", { status: 501 })
}

function getUserId(i: any): Snowflake {
  return i.member?.user?.id ?? i.user?.id ?? "0"
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

type RPS = "rock" | "paper" | "scissors"
function rpsOutcome(a: RPS, b: RPS): "win" | "lose" | "draw" {
  if (a === b) return "draw"
  if ((a === "rock" && b === "scissors") || (a === "paper" && b === "rock") || (a === "scissors" && b === "paper")) {
    return "win"
  }
  return "lose"
}

function rpsPrompt(ownerId: Snowflake) {
  return {
    content: "Choose your move:",
    flags: MessageFlags.EPHEMERAL,
    components: [
      {
        type: 1,
        components: [
          { type: 2, style: 1, label: "🪨 Rock", custom_id: `rps:rock:${ownerId}` },
          { type: 2, style: 1, label: "📄 Paper", custom_id: `rps:paper:${ownerId}` },
          { type: 2, style: 1, label: "✂️ Scissors", custom_id: `rps:scissors:${ownerId}` },
        ],
      },
    ],
    allowed_mentions: { parse: [] as string[] },
  }
}

function guessPrompt(correct: number, ownerId: Snowflake) {
  const row = {
    type: 1,
    components: Array.from({ length: 5 }, (_, i) => {
      const n = i + 1
      return {
        type: 2,
        style: 2,
        label: `${n}`,
        custom_id: `guess:pick:${n}:${correct}:${ownerId}`,
      }
    }),
  }
  return {
    content: "Guess the number I'm thinking of (1–5):",
    flags: MessageFlags.EPHEMERAL,
    components: [row],
    allowed_mentions: { parse: [] as string[] },
  }
}
