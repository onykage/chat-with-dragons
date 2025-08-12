const token = process.env.DISCORD_BOT_TOKEN
const appId = process.env.DISCORD_APPLICATION_ID
const guildId = process.env.DISCORD_GUILD_ID // optional: register to a test guild for instant availability

if (!token || !appId) {
  console.error("Missing DISCORD_BOT_TOKEN or DISCORD_APPLICATION_ID")
  process.exit(1)
}

// Define commands
const commands = [
  {
    name: "rps",
    description: "Play Rock–Paper–Scissors against the bot",
    type: 1, // CHAT_INPUT
  },
  {
    name: "guess",
    description: "Try to guess a number between 1 and 5",
    type: 1, // CHAT_INPUT
  },
]

async function main() {
  const endpoint = guildId
    ? `https://discord.com/api/v10/applications/${appId}/guilds/${guildId}/commands`
    : `https://discord.com/api/v10/applications/${appId}/commands`

  console.log(`Registering ${commands.length} command(s) to ${guildId ? "guild" : "global"} endpoint:`)
  console.log(endpoint)

  const res = await fetch(endpoint, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bot ${token}`,
    },
    body: JSON.stringify(commands),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error("Failed to register commands:", res.status, err)
    process.exit(1)
  }

  const data = await res.json()
  console.log("Commands registered:", data)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
