import { app } from './app.js'
import env from './config/env.js'

const server = app.listen(env.port, () => {
  console.log(`[savorbite-api] listening on http://localhost:${env.port} (${env.nodeEnv})`)
  console.log(`[savorbite-api] allowed origins: ${env.clientUrls.join(', ')}`)
})

// Graceful shutdown for Render deploys
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    console.log(`[savorbite-api] ${signal} received, shutting down`)
    server.close(() => process.exit(0))
  })
}

process.on('unhandledRejection', (reason) => {
  console.error('[savorbite-api] unhandled rejection:', reason)
})
