// ============================================================================
// PUYAL — Modular Voice AI Assistant, Custom Command Plugins,
// Smart-Home/Hardware Module Engine & Python/Node.js Code Generator
// ============================================================================

export const VOICE_MODEL_SUITE = [
  {
    id: 'gemini-4-hydrogen',
    name: 'Gemini 4 Hydrogen',
    role: 'Core Reasoning, Intent Routing & Code Synthesis',
    latency: 'Fast',
    capabilities: ['chat', 'intent-routing', 'code-gen', 'maps-grounding']
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    role: 'Ultra-Low Latency Command Dispatch',
    latency: 'Ultra-Fast',
    capabilities: ['chat', 'intent-routing']
  },
  {
    id: 'gemini-3.5-transcribe',
    name: 'Gemini 3.5 Transcribe',
    role: 'Multilingual Speech-to-Text Audio Transcription',
    latency: 'Real-Time',
    capabilities: ['stt', 'audio-transcription']
  },
  {
    id: 'gemini-3.8-flash-lite-tts',
    name: 'Gemini 3.8 Flash Lite TTS',
    role: 'Neural Voice Synthesis (24kHz WAV)',
    latency: 'Low-Latency',
    capabilities: ['tts', 'voice-playback']
  },
  {
    id: 'gemini-3.8-live',
    name: 'Gemini 3.8 Live',
    role: 'Hands-Free Duplex Emergency Voice Link',
    latency: 'Real-Time',
    capabilities: ['live-voice', 'duplex']
  }
];

export const DEFAULT_VOICE_MODULES = [
  {
    id: 'mod_sos_dispatch',
    name: 'SOS Emergency Beacon',
    slug: 'sos_dispatch',
    category: 'Emergency',
    enabled: true,
    triggers: ['activate sos', 'start sos', 'emergency beacon', 'send help now'],
    actionType: 'puyal_sos',
    target: '/api/sos',
    responseTemplate: 'SOS beacon armed. Haptic pulse engaged and live GPS coordinates queued for Command Center.',
    description: 'Triggers an instant PUYAL emergency SOS alert and haptic feedback sequence by voice.',
    builtin: true
  },
  {
    id: 'mod_sector_status',
    name: 'Sector Readiness Briefing',
    slug: 'sector_status',
    category: 'Operations',
    enabled: true,
    triggers: ['sector status', 'command briefing', 'active incidents', 'fleet readiness'],
    actionType: 'puyal_status',
    target: '/api/health',
    responseTemplate: 'Sector briefing ready: {{incidentsCount}} active incidents, {{activeSosCount}} live SOS feeds, and {{devicesOnline}} hardware modules online.',
    description: 'Reads live incident counts, active SOS feeds, and connected hardware module telemetry.',
    builtin: true
  },
  {
    id: 'mod_perimeter_lights',
    name: 'Perimeter Floodlights',
    slug: 'perimeter_lights',
    category: 'Smart Home / Hardware',
    enabled: true,
    triggers: ['perimeter lights', 'floodlights', 'emergency lighting', 'beacon lights'],
    actionType: 'hardware_control',
    target: 'hw_perimeter_lights',
    responseTemplate: 'Perimeter floodlights relay set to {{state}}.',
    description: 'Controls emergency perimeter smart lights via MQTT/HTTP/Web Serial relay.',
    builtin: true
  },
  {
    id: 'mod_siren_alert',
    name: 'Tactical Siren & PA Horn',
    slug: 'siren_alert',
    category: 'Smart Home / Hardware',
    enabled: true,
    triggers: ['siren', 'alarm horn', 'evacuation siren', 'pa horn'],
    actionType: 'hardware_control',
    target: 'hw_siren_horn',
    responseTemplate: 'Tactical siren & PA horn switched {{state}}.',
    description: 'Activates or silences the facility evacuation siren module.',
    builtin: true
  },
  {
    id: 'mod_flood_pump',
    name: 'Flood Sump Pump Relay',
    slug: 'flood_pump',
    category: 'Smart Home / Hardware',
    enabled: true,
    triggers: ['sump pump', 'water pump', 'drainage pump', 'flood pump'],
    actionType: 'hardware_control',
    target: 'hw_sump_pump',
    responseTemplate: 'Flood sump pump relay switched {{state}}.',
    description: 'Engages ESP32/Home Assistant sump pump relay during flood alerts.',
    builtin: true
  }
];

export const DEFAULT_HARDWARE_DEVICES = [
  {
    id: 'hw_perimeter_lights',
    name: 'Emergency Perimeter Floodlights',
    protocol: 'Home Assistant / HTTP',
    topicOrEndpoint: 'puyal/sector1/lights/perimeter',
    webhookUrl: '',
    serialCommandOn: 'RELAY1:ON',
    serialCommandOff: 'RELAY1:OFF',
    state: 'OFF',
    zone: 'Sector Perimeter',
    icon: '💡',
    voiceAliases: ['perimeter lights', 'floodlights', 'emergency lights', 'lights'],
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'hw_siren_horn',
    name: 'Evacuation Siren & PA Horn',
    protocol: 'MQTT / ESP32 Relay',
    topicOrEndpoint: 'puyal/sector1/alarm/siren',
    webhookUrl: '',
    serialCommandOn: 'SIREN:ON',
    serialCommandOff: 'SIREN:OFF',
    state: 'OFF',
    zone: 'Command Roof',
    icon: '📢',
    voiceAliases: ['siren', 'alarm', 'evacuation siren', 'pa horn'],
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'hw_sump_pump',
    name: 'Flood Sump Pump Controller',
    protocol: 'ESP32 GPIO / Web Serial',
    topicOrEndpoint: 'puyal/basement/pump/main',
    webhookUrl: '',
    serialCommandOn: 'PUMP:ON',
    serialCommandOff: 'PUMP:OFF',
    state: 'OFF',
    zone: 'Lower Utility Deck',
    icon: '🌊',
    voiceAliases: ['sump pump', 'water pump', 'flood pump', 'pump'],
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'hw_backup_gen',
    name: 'Backup Generator Transfer Switch',
    protocol: 'Modbus / HTTP Webhook',
    topicOrEndpoint: 'puyal/power/generator/ats',
    webhookUrl: '',
    serialCommandOn: 'GEN_ATS:ON',
    serialCommandOff: 'GEN_ATS:OFF',
    state: 'STANDBY',
    zone: 'Power Substation',
    icon: '⚡',
    voiceAliases: ['generator', 'backup power', 'transfer switch'],
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'hw_ble_beacon',
    name: 'BLE Rescue Strobe Beacon',
    protocol: 'Web Bluetooth (BLE)',
    topicOrEndpoint: 'ble://puyal-rescue-beacon-01',
    webhookUrl: '',
    serialCommandOn: 'BEACON:STROBE',
    serialCommandOff: 'BEACON:OFF',
    state: 'OFF',
    zone: 'Mobile Field Kit',
    icon: '📡',
    voiceAliases: ['rescue beacon', 'strobe', 'bluetooth beacon'],
    lastUpdated: new Date().toISOString()
  }
];

export function detectDesiredPowerState(text) {
  const lower = String(text || '').toLowerCase();
  if (/\b(turn off|switch off|shut off|stop|disable|silence|deactivate|off|standby)\b/.test(lower)) {
    return 'OFF';
  }
  if (/\b(turn on|switch on|start|enable|activate|engage|trigger|sound|on)\b/.test(lower)) {
    return 'ON';
  }
  if (/\b(toggle)\b/.test(lower)) {
    return 'TOGGLE';
  }
  return 'ON';
}

/**
 * Deterministic local matcher for custom command modules and smart-home/hardware devices.
 * Works both online and offline with zero latency.
 */
export function matchVoiceCommand(transcript, modules = [], devices = []) {
  const clean = String(transcript || '').trim();
  const lower = clean.toLowerCase();
  if (!lower) return null;

  // 1. Check enabled custom command modules
  for (const mod of modules) {
    if (!mod || mod.enabled === false) continue;
    const triggers = Array.isArray(mod.triggers) ? mod.triggers : [];
    for (const trig of triggers) {
      const t = String(trig || '').trim().toLowerCase();
      if (t && lower.includes(t)) {
        return {
          kind: 'module',
          module: mod,
          matchedTrigger: trig,
          desiredState: detectDesiredPowerState(lower)
        };
      }
    }
  }

  // 2. Check smart-home/hardware devices directly by name or alias
  for (const dev of devices) {
    if (!dev) continue;
    const aliases = [
      String(dev.name || '').toLowerCase(),
      ...(Array.isArray(dev.voiceAliases) ? dev.voiceAliases.map(a => String(a).toLowerCase()) : [])
    ].filter(Boolean);

    for (const alias of aliases) {
      if (lower.includes(alias)) {
        return {
          kind: 'hardware',
          device: dev,
          matchedTrigger: alias,
          desiredState: detectDesiredPowerState(lower)
        };
      }
    }
  }

  return null;
}

function toSafeIdentifier(str, fallback = 'custom_module') {
  const s = String(str || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return s && /^[a-z]/.test(s) ? s : `mod_${s || 'skill'}`;
}

/**
 * Generates a complete, runnable modular Voice AI Assistant codebase in Python or Node.js
 * wired with PUYAL custom command modules and smart-home/hardware bridges.
 */
export function buildModularAssistantFiles({
  runtime = 'python',
  projectName = 'puyal-voice-assistant',
  wakeWord = 'hey puyal',
  model = 'gemini-4-hydrogen',
  puyalServerUrl = 'http://localhost:3000',
  modules = DEFAULT_VOICE_MODULES,
  devices = DEFAULT_HARDWARE_DEVICES,
  includeHardware = true
} = {}) {
  const safeProj = String(projectName || 'puyal-voice-assistant').toLowerCase().replace(/[^a-z0-9-_]/g, '-') || 'puyal-voice-assistant';
  const activeModules = (Array.isArray(modules) && modules.length > 0 ? modules : DEFAULT_VOICE_MODULES).filter(m => m.enabled !== false);
  const activeDevices = Array.isArray(devices) && devices.length > 0 ? devices : DEFAULT_HARDWARE_DEVICES;
  const safeModel = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'].includes(model) ? model : 'gemini-4-hydrogen';

  if (runtime === 'nodejs' || runtime === 'node') {
    return buildNodeModularFiles({ safeProj, wakeWord, safeModel, puyalServerUrl, activeModules, activeDevices, includeHardware });
  }
  return buildPythonModularFiles({ safeProj, wakeWord, safeModel, puyalServerUrl, activeModules, activeDevices, includeHardware });
}

function buildPythonModularFiles({ safeProj, wakeWord, safeModel, puyalServerUrl, activeModules, activeDevices, includeHardware }) {
  const files = [];

  files.push({
    path: 'requirements.txt',
    content: `google-genai>=1.0.0
requests>=2.32.0
${includeHardware ? 'paho-mqtt>=2.1.0\npyserial>=3.5\n' : ''}SpeechRecognition>=3.10.4
pyttsx3>=2.90
`
  });

  files.push({
    path: 'config.py',
    content: `import os

WAKE_WORD = ${JSON.stringify(wakeWord.toLowerCase())}
GEMINI_MODEL = os.getenv("GEMINI_MODEL", ${JSON.stringify(safeModel)})
PUYAL_SERVER_URL = os.getenv("PUYAL_SERVER_URL", ${JSON.stringify(puyalServerUrl)})
MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
SERIAL_PORT = os.getenv("SERIAL_PORT", "")  # e.g. /dev/ttyUSB0 or COM3
`
  });

  files.push({
    path: 'core/registry.py',
    content: `from dataclasses import dataclass, field
from typing import Callable, Dict, List, Optional


@dataclass
class CommandModule:
    slug: str
    name: str
    triggers: List[str]
    handler: Callable[[str, dict], str]
    description: str = ""
    category: str = "Custom"


class ModuleRegistry:
    """Modular plugin registry for PUYAL-style voice commands."""

    def __init__(self) -> None:
        self._modules: Dict[str, CommandModule] = {}

    def register(self, module: CommandModule) -> None:
        self._modules[module.slug] = module

    def list_modules(self) -> List[CommandModule]:
        return list(self._modules.values())

    def match(self, utterance: str) -> Optional[CommandModule]:
        lower = utterance.lower().strip()
        for mod in self._modules.values():
            if any(t.lower() in lower for t in mod.triggers):
                return mod
        return None
`
  });

  if (includeHardware) {
    files.push({
      path: 'hardware/bridge.py',
      content: `import json
import os
import requests
from typing import Dict

try:
    import paho.mqtt.publish as mqtt_publish
except ImportError:
    mqtt_publish = None

try:
    import serial
except ImportError:
    serial = None

import config

DEVICES: Dict[str, dict] = ${JSON.stringify(
        Object.fromEntries(activeDevices.map(d => [d.id, {
          name: d.name,
          protocol: d.protocol,
          topic: d.topicOrEndpoint,
          webhookUrl: d.webhookUrl || '',
          serialOn: d.serialCommandOn || 'RELAY:ON',
          serialOff: d.serialCommandOff || 'RELAY:OFF',
          aliases: d.voiceAliases || []
        }])),
        null,
        2
      )}


def dispatch_hardware(device_id: str, desired_state: str = "ON") -> str:
    device = DEVICES.get(device_id)
    if not device:
        return f"Unknown hardware module: {device_id}"

    state = desired_state.upper()
    results = []

    # 1. Sync state to PUYAL Command Server
    try:
        r = requests.post(
            f"{config.PUYAL_SERVER_URL}/api/hardware/devices/{device_id}/command",
            json={"state": state, "source": "python-voice-assistant"},
            timeout=4,
        )
        if r.ok:
            results.append("PUYAL synced")
    except Exception as exc:
        results.append(f"PUYAL offline ({exc})")

    # 2. Optional MQTT publish for ESP32 / Home Assistant
    if mqtt_publish and device.get("topic"):
        try:
            mqtt_publish.single(
                device["topic"],
                payload=json.dumps({"state": state, "deviceId": device_id}),
                hostname=config.MQTT_BROKER,
                port=config.MQTT_PORT,
            )
            results.append(f"MQTT->{device['topic']}")
        except Exception:
            pass

    # 3. Optional USB Serial relay command (Arduino/ESP32)
    if serial and config.SERIAL_PORT:
        try:
            cmd = device["serialOn"] if state == "ON" else device["serialOff"]
            with serial.Serial(config.SERIAL_PORT, 115200, timeout=1) as ser:
                ser.write((cmd + "\\n").encode("utf-8"))
            results.append(f"Serial->{cmd}")
        except Exception:
            pass

    # 4. Optional HTTP Webhook / Home Assistant REST endpoint
    if device.get("webhookUrl"):
        try:
            requests.post(device["webhookUrl"], json={"deviceId": device_id, "state": state}, timeout=4)
            results.append("Webhook OK")
        except Exception:
            pass

    return f"{device['name']} set to {state} ({', '.join(results) or 'local'})."
`
    });
  }

  const modImports = [];
  const modRegistrations = [];

  for (const mod of activeModules) {
    const fnSlug = toSafeIdentifier(mod.slug || mod.name);
    modImports.push(`from modules.${fnSlug} import MODULE as ${fnSlug}_module`);
    modRegistrations.push(`    registry.register(${fnSlug}_module)`);

    let body = `    return ${JSON.stringify(mod.responseTemplate || `Executed ${mod.name}.`)}`;
    if (mod.actionType === 'hardware_control' && includeHardware) {
      body = `    lower = utterance.lower()
    desired = "OFF" if any(k in lower for k in ("off", "stop", "silence", "disable")) else "ON"
    return dispatch_hardware(${JSON.stringify(mod.target || 'hw_perimeter_lights')}, desired)`;
    } else if (mod.actionType === 'puyal_sos') {
      body = `    try:
        requests.post(
            f"{config.PUYAL_SERVER_URL}/api/sos",
            json={"email": "voice.assistant@puyal.local", "reportedRole": "civilian", "active": True},
            timeout=5,
        )
    except Exception:
        pass
    return ${JSON.stringify(mod.responseTemplate || 'SOS beacon activated.')}`;
    } else if (mod.actionType === 'puyal_status') {
      body = `    try:
        data = requests.get(f"{config.PUYAL_SERVER_URL}/api/health", timeout=4).json()
        return f"PUYAL Command status: {data.get('incidentsCount', 0)} incidents and {data.get('activeSosCount', 0)} active SOS alerts."
    except Exception:
        return "PUYAL Command server unreachable; operating in local offline mode."`;
    } else if (mod.actionType === 'webhook' && mod.target) {
      body = `    try:
        requests.post(${JSON.stringify(mod.target)}, json={"utterance": utterance, "module": ${JSON.stringify(fnSlug)}}, timeout=5)
    except Exception as exc:
        return f"Webhook error: {exc}"
    return ${JSON.stringify(mod.responseTemplate || `Dispatched ${mod.name}.`)}`;
    }

    files.push({
      path: `modules/${fnSlug}.py`,
      content: `import requests
import config
from core.registry import CommandModule
${mod.actionType === 'hardware_control' && includeHardware ? 'from hardware.bridge import dispatch_hardware\n' : ''}

def handle(utterance: str, context: dict) -> str:
${body}


MODULE = CommandModule(
    slug=${JSON.stringify(fnSlug)},
    name=${JSON.stringify(mod.name)},
    triggers=${JSON.stringify(mod.triggers || [fnSlug])},
    handler=handle,
    description=${JSON.stringify(mod.description || '')},
    category=${JSON.stringify(mod.category || 'Custom')},
)
`
    });
  }

  files.push({
    path: 'modules/__init__.py',
    content: `${modImports.join('\n')}


def register_all_modules(registry) -> None:
${modRegistrations.join('\n') || '    pass'}
`
  });

  files.push({
    path: 'assistant.py',
    content: `"""
${safeProj} — Modular PUYAL Voice AI Assistant (Python)
Powered by @google/genai (google-genai) + pluggable command & hardware modules.
"""
import os
from google import genai
import config
from core.registry import ModuleRegistry
from modules import register_all_modules


def build_client():
    api_key = os.getenv("GEMINI_API_KEY")
    return genai.Client(api_key=api_key) if api_key else None


def run_command(utterance: str, registry: ModuleRegistry, client) -> str:
    text = utterance.strip()
    if text.lower().startswith(config.WAKE_WORD):
        text = text[len(config.WAKE_WORD):].strip(" ,:")

    matched = registry.match(text)
    if matched:
        return matched.handler(text, {"source": "voice"})

    if client:
        resp = client.models.generate_content(
            model=config.GEMINI_MODEL,
            contents=text,
        )
        return (resp.text or "").strip()

    return f"No local module matched '{text}'. Set GEMINI_API_KEY to enable Gemini fallback."


def main():
    registry = ModuleRegistry()
    register_all_modules(registry)
    client = build_client()
    print(f"PUYAL Modular Voice Assistant ready ({len(registry.list_modules())} modules loaded).")
    print(f"Wake word: '{config.WAKE_WORD}' | Model: {config.GEMINI_MODEL}")
    print("Type a voice command (or 'quit' to exit):")
    while True:
        try:
            utterance = input("> ").strip()
        except (EOFError, KeyboardInterrupt):
            break
        if not utterance or utterance.lower() in ("quit", "exit"):
            break
        print("Assistant:", run_command(utterance, registry, client))


if __name__ == "__main__":
    main()
`
  });

  files.push({
    path: 'README.md',
    content: `# ${safeProj} (Python Modular Voice Assistant)

## Quick Start
\`\`\`bash
pip install -r requirements.txt
export GEMINI_API_KEY="your-key"
export PUYAL_SERVER_URL="${puyalServerUrl}"
python3 assistant.py
\`\`\`

## Adding New PUYAL Command Modules
1. Create a new file under \`modules/my_skill.py\` exporting a \`CommandModule\`.
2. Register it inside \`modules/__init__.py\`.
`
  });

  return { runtime: 'python', projectName: safeProj, files };
}

function buildNodeModularFiles({ safeProj, wakeWord, safeModel, puyalServerUrl, activeModules, activeDevices, includeHardware }) {
  const files = [];

  files.push({
    path: 'package.json',
    content: JSON.stringify({
      name: safeProj,
      version: '1.0.0',
      type: 'module',
      scripts: {
        start: 'node src/assistant.mjs'
      },
      dependencies: {
        '@google/genai': '^3.0.0',
        ...(includeHardware ? { mqtt: '^5.10.1' } : {})
      }
    }, null, 2) + '\n'
  });

  files.push({
    path: 'src/registry.mjs',
    content: `export class ModuleRegistry {
  constructor() {
    this.modules = new Map();
  }

  register(mod) {
    this.modules.set(mod.slug, mod);
  }

  list() {
    return Array.from(this.modules.values());
  }

  match(utterance) {
    const lower = String(utterance || '').toLowerCase();
    for (const mod of this.modules.values()) {
      if ((mod.triggers || []).some(t => lower.includes(String(t).toLowerCase()))) {
        return mod;
      }
    }
    return null;
  }
}
`
  });

  if (includeHardware) {
    files.push({
      path: 'src/hardware-bridge.mjs',
      content: `const PUYAL_SERVER_URL = process.env.PUYAL_SERVER_URL || ${JSON.stringify(puyalServerUrl)};

export const HARDWARE_DEVICES = ${JSON.stringify(
        Object.fromEntries(activeDevices.map(d => [d.id, {
          name: d.name,
          protocol: d.protocol,
          topicOrEndpoint: d.topicOrEndpoint,
          webhookUrl: d.webhookUrl || '',
          serialCommandOn: d.serialCommandOn || 'RELAY:ON',
          serialCommandOff: d.serialCommandOff || 'RELAY:OFF'
        }])),
        null,
        2
      )};

export async function dispatchHardware(deviceId, state = 'ON') {
  const device = HARDWARE_DEVICES[deviceId];
  if (!device) return \`Unknown hardware device: \${deviceId}\`;
  const normalized = String(state).toUpperCase();
  const notes = [];

  try {
    const res = await fetch(\`\${PUYAL_SERVER_URL}/api/hardware/devices/\${deviceId}/command\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: normalized, source: 'node-voice-assistant' })
    });
    if (res.ok) notes.push('PUYAL synced');
  } catch (err) {
    notes.push('PUYAL offline');
  }

  if (device.webhookUrl) {
    try {
      await fetch(device.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, state: normalized })
      });
      notes.push('Webhook OK');
    } catch (err) {
      notes.push('Webhook failed');
    }
  }

  return \`\${device.name} switched to \${normalized} (\${notes.join(', ') || 'local'}).\`;
}
`
    });
  }

  const imports = [];
  const registerLines = [];

  for (const mod of activeModules) {
    const slug = toSafeIdentifier(mod.slug || mod.name);
    imports.push(`import ${slug} from './${slug}.mjs';`);
    registerLines.push(`  registry.register(${slug});`);

    let handlerBody = `    return ${JSON.stringify(mod.responseTemplate || `Executed ${mod.name}.`)};`;
    if (mod.actionType === 'hardware_control' && includeHardware) {
      handlerBody = `    const lower = String(utterance || '').toLowerCase();
    const state = /\\b(off|stop|silence|disable)\\b/.test(lower) ? 'OFF' : 'ON';
    return await dispatchHardware(${JSON.stringify(mod.target || 'hw_perimeter_lights')}, state);`;
    } else if (mod.actionType === 'puyal_sos') {
      handlerBody = `    const baseUrl = process.env.PUYAL_SERVER_URL || ${JSON.stringify(puyalServerUrl)};
    try {
      await fetch(\`\${baseUrl}/api/sos\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'voice.node@puyal.local', reportedRole: 'civilian', active: true })
      });
    } catch (e) {}
    return ${JSON.stringify(mod.responseTemplate || 'SOS beacon activated.')};`;
    } else if (mod.actionType === 'puyal_status') {
      handlerBody = `    const baseUrl = process.env.PUYAL_SERVER_URL || ${JSON.stringify(puyalServerUrl)};
    try {
      const data = await fetch(\`\${baseUrl}/api/health\`).then(r => r.json());
      return \`PUYAL Status: \${data.incidentsCount || 0} incidents, \${data.activeSosCount || 0} active SOS feeds.\`;
    } catch (e) {
      return 'PUYAL Command server unreachable; local offline mode active.';
    }`;
    } else if (mod.actionType === 'webhook' && mod.target) {
      handlerBody = `    await fetch(${JSON.stringify(mod.target)}, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ utterance, module: ${JSON.stringify(slug)} })
    });
    return ${JSON.stringify(mod.responseTemplate || `Dispatched ${mod.name}.`)};`;
    }

    files.push({
      path: `src/modules/${slug}.mjs`,
      content: `${mod.actionType === 'hardware_control' && includeHardware ? "import { dispatchHardware } from '../hardware-bridge.mjs';\n\n" : ''}export default {
  slug: ${JSON.stringify(slug)},
  name: ${JSON.stringify(mod.name)},
  category: ${JSON.stringify(mod.category || 'Custom')},
  triggers: ${JSON.stringify(mod.triggers || [slug])},
  async execute(utterance) {
${handlerBody}
  }
};
`
    });
  }

  files.push({
    path: 'src/modules/index.mjs',
    content: `${imports.join('\n')}

export function registerAllModules(registry) {
${registerLines.join('\n')}
}
`
  });

  files.push({
    path: 'src/assistant.mjs',
    content: `import readline from 'readline';
import { GoogleGenAI } from '@google/genai';
import { ModuleRegistry } from './registry.mjs';
import { registerAllModules } from './modules/index.mjs';

const WAKE_WORD = ${JSON.stringify(wakeWord.toLowerCase())};
const GEMINI_MODEL = process.env.GEMINI_MODEL || ${JSON.stringify(safeModel)};

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

const registry = new ModuleRegistry();
registerAllModules(registry);

export async function handleUtterance(rawInput) {
  let text = String(rawInput || '').trim();
  if (text.toLowerCase().startsWith(WAKE_WORD)) {
    text = text.slice(WAKE_WORD.length).replace(/^[,:\\s]+/, '');
  }

  const mod = registry.match(text);
  if (mod) {
    return await mod.execute(text);
  }

  if (ai) {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: text,
      config: {
        systemInstruction: 'You are PUYAL Modular Voice Assistant. Respond concisely in 1-2 spoken sentences.'
      }
    });
    return (response.text || '').trim();
  }

  return \`No local module matched "\${text}". Set GEMINI_API_KEY for Gemini AI routing.\`;
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
console.log(\`PUYAL Node.js Modular Voice Assistant ready (\${registry.list().length} modules loaded).\`);
console.log(\`Wake word: "\${WAKE_WORD}" | Model: \${GEMINI_MODEL}\`);
rl.setPrompt('> ');
rl.prompt();

rl.on('line', async (line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed === 'exit' || trimmed === 'quit') {
    rl.close();
    return;
  }
  try {
    console.log('Assistant:', await handleUtterance(trimmed));
  } catch (err) {
    console.error('Error:', err.message);
  }
  rl.prompt();
});
`
  });

  files.push({
    path: 'README.md',
    content: `# ${safeProj} (Node.js Modular Voice Assistant)

## Quick Start
\`\`\`bash
npm install
export GEMINI_API_KEY="your-key"
export PUYAL_SERVER_URL="${puyalServerUrl}"
npm start
\`\`\`
`
  });

  return { runtime: 'nodejs', projectName: safeProj, files };
}
