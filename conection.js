/*
 * 🤖 Souza-BOT - conection.js
 * Modo de pareamento por código e QR (versão limpa)
 */

import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } from "@whiskeysockets/baileys"
import Pino from "pino"
import qrcode from "qrcode-terminal"
import readline from "readline"

async function perguntarNumero() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => {
    rl.question("📱 Digite seu número (ex: 559999999999): ", numero => {
      rl.close()
      resolve(numero.trim())
    })
  })
}

async function startConnection() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth")
  const { version } = await fetchLatestBaileysVersion()

  let sock = makeWASocket({
    version,
    logger: Pino({ level: "silent" }),
    auth: state,
    printQRInTerminal: false,
    browser: ["Souza-BOT", "Chrome", "10.0"]
  })

  sock.ev.on("creds.update", saveCreds)

  // Gera código de pareamento
  if (!sock.authState.creds.registered) {
    const numero = await perguntarNumero()
    console.log("⏳ Tentando gerar código de pareamento...")

    try {
      const code = await sock.requestPairingCode(numero)
      console.log("\n✅ Seu código de pareamento é:\n")
      console.log("═══════════════════════════════")
      console.log(`   ${code}`)
      console.log("═══════════════════════════════\n")
      console.log("➡️ Vá no WhatsApp > Aparelhos conectados > Conectar com código\n")
    } catch (err) {
      console.log("⚠️ Falha no pareamento por código. Gerando QR Code...\n")
      sock = makeWASocket({
        version,
        logger: Pino({ level: "silent" }),
        auth: state,
        printQRInTerminal: true,
        browser: ["Souza-BOT", "Chrome", "10.0"]
      })
    }
  } else {
    console.log("✅ Sessão já pareada. Iniciando Souza-BOT...\n")
  }

  // Eventos de conexão
  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log("\n📷 Escaneie o QR no WhatsApp > Aparelhos conectados:\n")
      qrcode.generate(qr, { small: true })
    }

    if (connection === "open") console.log("🤖 Souza-BOT conectado com sucesso!")
    else if (connection === "close") {
      const shouldReconnect = (lastDisconnect?.error?.output?.statusCode) !== DisconnectReason.loggedOut
      console.log("🔌 Conexão encerrada.", shouldReconnect ? "Tentando reconectar..." : "Sessão encerrada.")
      if (shouldReconnect) startConnection()
    }
  })
}

startConnection().catch(err => console.error("Erro fatal ao iniciar Souza-BOT:", err))

