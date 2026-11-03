# TEMPLATE

## Calling from a phone or another device

Create TURN credentials with a provider such as [Metered Open Relay](https://www.metered.ca/tools/openrelay/), then set them before starting the services in PowerShell. Use the ICE server hostname and credentials supplied by your provider:

```powershell
$env:TURN_URLS = 'turn:global.relay.metered.ca:80;turn:global.relay.metered.ca:80?transport=tcp;turn:global.relay.metered.ca:443;turns:global.relay.metered.ca:443?transport=tcp'
$env:TURN_USERNAME = 'your-turn-username'
$env:TURN_CREDENTIAL = 'your-turn-credential'
.\start.bat
```

For a phone on the same Wi-Fi, the server prints a LAN address such as `http://192.168.1.20:3000`; it can load the page, but phone browsers block microphone access over plain HTTP. Keep both services running and open an HTTPS tunnel in another terminal:

```cmd
npx cloudflared tunnel --url http://localhost:3000
```

Open the generated `https://...trycloudflare.com` address on both devices. The server now serves the ICE configuration at `/api/ice` and reads TURN credentials from those environment variables. Calls may fail across networks when TURN is missing or its credentials are invalid.
