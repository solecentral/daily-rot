#!/usr/bin/env npx ts-node --transpile-only
/**
 * Standalone script for sending Flips University drop alerts.
 * Can be called by a cron job:
 *   cd /Users/bryan/Projects/daily-rot && npx ts-node server/scripts/send-drop-alerts.ts
 */
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

import { getUpcomingDrops, formatDropAlert, sendToDiscord } from '../src/routes/flips-university'

async function main() {
  console.log('[send-drop-alerts] Starting...')

  const drops = getUpcomingDrops()
  console.log(`[send-drop-alerts] Found ${drops.length} upcoming drops`)

  const message = formatDropAlert(drops)
  console.log('\n' + message + '\n')

  const discordSent = await sendToDiscord(message)

  console.log(`[send-drop-alerts] Done. Discord: ${discordSent ? 'sent' : 'skipped (no webhook)'}`)
  process.exit(0)
}

main().catch(err => {
  console.error('[send-drop-alerts] Fatal error:', err)
  process.exit(1)
})
