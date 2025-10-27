/*
 * 🤖 Souza-BOT Base Limpa
 * Modo simples — conexão direta via Baileys
 * Use "npm run pair" para iniciar com o conection.js
 */

import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion } from "@whiskeysockets/baileys"
import pino from "pino"
import qrcode from "qrcode-terminal"

async function iniciarBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth')
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    auth: state,
    printQRInTerminal: true,
    browser: ['SouzaBot', 'Chrome', '10.0']
  })

  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', update => {
    const { connection, qr } = update
    if (qr) {
      console.log("\n📱 Escaneie o QR no WhatsApp > Aparelhos conectados\n")
      qrcode.generate(qr, { small: true })
    }
    if (connection === 'open') console.log('✅ Souza-BOT conectado com sucesso!')
    if (connection === 'close') console.log('🔌 Conexão encerrada. Reinicie o bot se necessário.')
  })
}

iniciarBot()

