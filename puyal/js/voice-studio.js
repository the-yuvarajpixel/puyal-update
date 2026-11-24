// ============================================================================
// PUYAL — Voice AI Assistant, Model Suite, Custom Command Modules,
// Smart-Home/Hardware Bridge (Web Serial & BLE), Code Builder & Android APK
// ============================================================================
(function () {
  'use strict';

  const state = {
    models: [],
    modules: [],
    devices: [],
    apkConfig: null,
    generatedFiles: [],
    activeFileIndex: 0,
    wakeWordActive: false,
    wakeRecognition: null,
    pttRecorder: null,
    pttChunks: [],
    isRecordingPtt: false,
    serialPort: null,
    serialWriter: null,
    bleDevice: null,
    bleCharacteristic: null,
    currentAudio: null
  };

  function showToast(msg, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = `toast show ${type}`;
    clearTimeout(window._studioToastTimer);
    window._studioToastTimer = setTimeout(() => {
      toast.className = 'toast';
    }, 3600);
  }
  window.showToast = showToast;

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function appendSerialLog(line) {
    const box = document.getElementById('hardware-serial-log');
    if (!box) return;
    const stamp = new Date().toLocaleTimeString([], { hour12: false });
    box.textContent += `\n[${stamp}] ${line}`;
    box.scrollTop = box.scrollHeight;
  }

  // --------------------------------------------------------------------------
  // Tab Navigation
  // --------------------------------------------------------------------------
  function initTabs() {
    const tabs = Array.from(document.querySelectorAll('.studio-tab'));
    const panels = {
      voice: document.getElementById('panel-voice'),
      modules: document.getElementById('panel-modules'),
      hardware: document.getElementById('panel-hardware'),
      builder: document.getElementById('panel-builder')
    };

    function activateTab(key) {
      tabs.forEach((btn) => {
        const isMatch = btn.getAttribute('data-tab') === key;
        btn.classList.toggle('active', isMatch);
        btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
      });
      Object.entries(panels).forEach(([k, el]) => {
        if (el) el.classList.toggle('active', k === key);
      });
    }

    tabs.forEach((btn) => {
      btn.addEventListener('click', () => {
        activateTab(btn.getAttribute('data-tab'));
      });
    });

    const params = new URLSearchParams(window.location.search);
    const initialTab = params.get('tab');
    if (initialTab && panels[initialTab]) {
      activateTab(initialTab);
    }
  }

  // --------------------------------------------------------------------------
  // Data Loading (Models, Command Modules, Hardware Devices, APK Config)
  // --------------------------------------------------------------------------
  async function loadModels() {
    try {
      const res = await fetch('/api/voice-suite/models');
      const data = await res.json();
      state.models = Array.isArray(data.models) ? data.models : [];
      document.getElementById('kpi-models-count').textContent = String(state.models.length);

      const badge = document.getElementById('model-api-badge');
      if (badge) {
        badge.textContent = data.apiKeyConfigured ? 'GEMINI API READY' : 'LOCAL MODULES ONLY';
        badge.className = data.apiKeyConfigured ? 'route-tag hw' : 'route-tag mod';
      }

      const list = document.getElementById('model-suite-list');
      if (list) {
        list.innerHTML = state.models
          .map(
            (m) => `
          <div class="model-card">
            <div class="model-card-head">
              <strong style="font-size:13.5px; color:#f8fafc;">${escapeHtml(m.label)}</strong>
              <span class="model-role-tag">${escapeHtml(m.role)}</span>
            </div>
            <div style="margin-bottom:6px;">
              <span class="model-id-code">${escapeHtml(m.id)}</span>
              <span style="font-size:11px; color:#94a3b8; margin-left:6px;">${escapeHtml(m.latency || '')}</span>
            </div>
            <div style="font-size:12px; color:#cbd5e1; line-height:1.45;">${escapeHtml(m.description)}</div>
          </div>
        `
          )
          .join('');
      }
    } catch (err) {
      console.warn('Could not load model suite:', err);
    }
  }

  async function loadModules() {
    try {
      const res = await fetch('/api/voice-suite/modules');
      const data = await res.json();
      state.modules = Array.isArray(data.modules) ? data.modules : [];
      document.getElementById('kpi-modules-count').textContent = String(state.modules.length);
      renderModules();
    } catch (err) {
      console.warn('Could not load voice modules:', err);
    }
  }

  function renderModules() {
    const container = document.getElementById('modules-list');
    if (!container) return;
    if (state.modules.length === 0) {
      container.innerHTML = '<div class="module-row">No custom command modules registered yet. Add one on the right.</div>';
      return;
    }

    container.innerHTML = state.modules
      .map((mod) => {
        const enabled = mod.enabled !== false;
        const triggers = Array.isArray(mod.triggers) ? mod.triggers : [];
        const firstTrigger = triggers[0] || mod.name;
        return `
          <div class="module-row ${enabled ? '' : 'disabled'}" data-mod-id="${escapeHtml(mod.id)}">
            <div style="flex:1; min-width: 220px;">
              <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:4px;">
                <strong style="font-size:14px; color:#f8fafc;">${escapeHtml(mod.name)}</strong>
                <span class="route-tag mod">${escapeHtml(mod.category || 'Custom')}</span>
                <span class="model-id-code">${escapeHtml(mod.actionType)}</span>
              </div>
              <div style="font-size:12px; color:#94a3b8; margin-bottom:6px;">${escapeHtml(mod.description || '')}</div>
              <div style="font-size:11.5px; color:#bae6fd;">
                <strong>Triggers:</strong> ${triggers.map((t) => `"${escapeHtml(t)}"`).join(', ')}
              </div>
              ${mod.target ? `<div style="font-size:11px; color:#94a3b8; margin-top:3px;"><strong>Target:</strong> <span class="mono-inline">${escapeHtml(mod.target)}</span></div>` : ''}
            </div>
            <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
              <button type="button" class="st-btn st-btn-primary btn-test-mod" data-trigger="${escapeHtml(firstTrigger)}">▶ Test</button>
              <button type="button" class="st-btn st-btn-ghost btn-toggle-mod" data-id="${escapeHtml(mod.id)}" data-enabled="${enabled ? '1' : '0'}">${enabled ? 'Disable' : 'Enable'}</button>
              <button type="button" class="st-btn st-btn-danger btn-delete-mod" data-id="${escapeHtml(mod.id)}">✕</button>
            </div>
          </div>
        `;
      })
      .join('');

    container.querySelectorAll('.btn-test-mod').forEach((btn) => {
      btn.addEventListener('click', () => {
        const trigger = btn.getAttribute('data-trigger');
        document.querySelector('.studio-tab[data-tab="voice"]')?.click();
        executeVoiceUtterance(trigger);
      });
    });

    container.querySelectorAll('.btn-toggle-mod').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const nextEnabled = btn.getAttribute('data-enabled') !== '1';
        try {
          const res = await fetch(`/api/voice-suite/modules/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: nextEnabled })
          });
          if (res.ok) {
            await loadModules();
            showToast(`Command module ${nextEnabled ? 'enabled' : 'disabled'}.`, 'success');
          }
        } catch (err) {
          showToast('Failed to update command module.', 'error');
        }
      });
    });

    container.querySelectorAll('.btn-delete-mod').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        try {
          const res = await fetch(`/api/voice-suite/modules/${encodeURIComponent(id)}`, { method: 'DELETE' });
          if (res.ok) {
            await loadModules();
            showToast('Command module removed.', 'info');
          }
        } catch (err) {
          showToast('Failed to remove command module.', 'error');
        }
      });
    });
  }

  async function loadHardwareDevices() {
    try {
      const res = await fetch('/api/hardware/devices');
      const data = await res.json();
      state.devices = Array.isArray(data.devices) ? data.devices : [];
      document.getElementById('kpi-hardware-count').textContent = String(state.devices.length);
      renderHardwareDevices();
      syncDeviceDropdown();
    } catch (err) {
      console.warn('Could not load hardware devices:', err);
    }
  }

  function syncDeviceDropdown() {
    const sel = document.getElementById('mod-target-device');
    if (!sel) return;
    sel.innerHTML = state.devices
      .map((d) => `<option value="${escapeHtml(d.id)}">${escapeHtml(d.icon || '🔌')} ${escapeHtml(d.name)} (${escapeHtml(d.zone || 'Sector')})</option>`)
      .join('');
  }

  function renderHardwareDevices() {
    const grid = document.getElementById('hardware-devices-grid');
    if (!grid) return;
    if (state.devices.length === 0) {
      grid.innerHTML = '<div class="hw-card">No hardware modules registered yet.</div>';
      return;
    }

    grid.innerHTML = state.devices
      .map((dev) => {
        const isOn = String(dev.state).toUpperCase() === 'ON';
        const aliases = Array.isArray(dev.voiceAliases) ? dev.voiceAliases.slice(0, 3).join(', ') : '';
        return `
          <div class="hw-card" data-hw-id="${escapeHtml(dev.id)}">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
              <div>
                <div style="font-size:14.5px; font-weight:800; color:#f8fafc;">${escapeHtml(dev.icon || '🔌')} ${escapeHtml(dev.name)}</div>
                <div style="font-size:11.5px; color:#94a3b8; margin-top:2px;">${escapeHtml(dev.protocol)} &bull; ${escapeHtml(dev.zone || 'Sector')}</div>
              </div>
              <span class="hw-state-badge ${isOn ? 'on' : 'off'}">${isOn ? '● ON' : '○ OFF'}</span>
            </div>
            <div style="font-size:11px; color:#7dd3fc; font-family:'JetBrains Mono',monospace; margin:8px 0 4px;">
              ${escapeHtml(dev.topicOrEndpoint || dev.id)}
            </div>
            <div style="font-size:11px; color:#94a3b8; margin-bottom:10px;">
              Voice aliases: ${escapeHtml(aliases || dev.name)}
            </div>
            <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:auto;">
              <button type="button" class="st-btn st-btn-emerald btn-hw-cmd" data-id="${escapeHtml(dev.id)}" data-state="ON" style="flex:1; padding:7px 10px;">ON</button>
              <button type="button" class="st-btn st-btn-ghost btn-hw-cmd" data-id="${escapeHtml(dev.id)}" data-state="OFF" style="flex:1; padding:7px 10px;">OFF</button>
              <button type="button" class="st-btn st-btn-primary btn-hw-voice" data-name="${escapeHtml(dev.name)}" data-next="${isOn ? 'off' : 'on'}" style="padding:7px 10px;" title="Trigger via Voice Engine">🎙️</button>
              <button type="button" class="st-btn st-btn-danger btn-hw-del" data-id="${escapeHtml(dev.id)}" style="padding:7px 9px;" title="Remove Hardware Module">✕</button>
            </div>
          </div>
        `;
      })
      .join('');

    grid.querySelectorAll('.btn-hw-cmd').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const desiredState = btn.getAttribute('data-state');
        await dispatchHardwareCommand(id, desiredState);
      });
    });

    grid.querySelectorAll('.btn-hw-voice').forEach((btn) => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-name');
        const next = btn.getAttribute('data-next');
        document.querySelector('.studio-tab[data-tab="voice"]')?.click();
        executeVoiceUtterance(`Hey Puyal, turn ${next} ${name}`);
      });
    });

    grid.querySelectorAll('.btn-hw-del').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        try {
          const res = await fetch(`/api/hardware/devices/${encodeURIComponent(id)}`, { method: 'DELETE' });
          if (res.ok) {
            await loadHardwareDevices();
            showToast('Hardware module deleted.', 'info');
          }
        } catch (err) {
          showToast('Failed to delete hardware module.', 'error');
        }
      });
    });
  }

  async function dispatchHardwareCommand(deviceId, desiredState) {
    try {
      const res = await fetch(`/api/hardware/devices/${encodeURIComponent(deviceId)}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: desiredState, source: 'voice-studio' })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Hardware command failed');
      }
      await loadHardwareDevices();
      if (data.serialPayload) {
        await writeToConnectedHardwareBridges(data.serialPayload);
      }
      const whNote = data.webhookResult
        ? ` | Webhook: ${data.webhookResult.ok ? 'HTTP ' + data.webhookResult.status : data.webhookResult.error}`
        : '';
      appendSerialLog(`${data.device.name} -> ${data.device.state} [payload: ${data.serialPayload}]${whNote}`);
      showToast(`${data.device.name} switched ${data.device.state}.`, 'success');
    } catch (err) {
      showToast(err.message || 'Hardware command failed.', 'error');
    }
  }

  // --------------------------------------------------------------------------
  // Web Serial (USB / ESP32 / Arduino) & Web Bluetooth (BLE) Bridges
  // --------------------------------------------------------------------------
  async function writeToConnectedHardwareBridges(payloadText) {
    const line = `${String(payloadText || '').trim()}\n`;
    if (state.serialWriter) {
      try {
        const data = new TextEncoder().encode(line);
        await state.serialWriter.write(data);
        appendSerialLog(`USB Serial TX >> ${payloadText}`);
      } catch (err) {
        appendSerialLog(`USB Serial TX error: ${err.message}`);
      }
    }
    if (state.bleCharacteristic) {
      try {
        const data = new TextEncoder().encode(line);
        await state.bleCharacteristic.writeValue(data);
        appendSerialLog(`BLE TX >> ${payloadText}`);
      } catch (err) {
        appendSerialLog(`BLE TX error: ${err.message}`);
      }
    }
  }

  function initHardwareBridges() {
    const serialBtn = document.getElementById('btn-connect-serial');
    const bleBtn = document.getElementById('btn-connect-ble');
    const pill = document.getElementById('bridge-status-pill');

    if (serialBtn) {
      serialBtn.addEventListener('click', async () => {
        if (!('serial' in navigator)) {
          showToast('Web Serial API requires Chrome/Edge on desktop or Android USB OTG.', 'error');
          appendSerialLog('Web Serial API unavailable in this browser. Using HTTP/MQTT bridge.');
          return;
        }
        try {
          const port = await navigator.serial.requestPort();
          await port.open({ baudRate: 115200 });
          state.serialPort = port;
          state.serialWriter = port.writable.getWriter();
          serialBtn.textContent = '✅ USB Serial Connected';
          if (pill) {
            pill.textContent = 'USB SERIAL 115200 ACTIVE';
            pill.className = 'route-tag hw';
          }
          appendSerialLog('Connected USB Serial microcontroller at 115200 baud.');
          showToast('USB Serial hardware bridge connected.', 'success');
        } catch (err) {
          if (err && err.name !== 'NotFoundError') {
            showToast(`Serial error: ${err.message}`, 'error');
          }
        }
      });
    }

    if (bleBtn) {
      bleBtn.addEventListener('click', async () => {
        if (!('bluetooth' in navigator)) {
          showToast('Web Bluetooth API is not available in this browser.', 'error');
          appendSerialLog('Web Bluetooth unavailable in this browser.');
          return;
        }
        try {
          const device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: ['0000ffe0-0000-1000-8000-00805f9b34fb', '6e400001-b5a3-f393-e0a9-e50e24dcca9e']
          });
          state.bleDevice = device;
          const server = await device.gatt.connect();
          const services = await server.getPrimaryServices();
          for (const svc of services) {
            const chars = await svc.getCharacteristics();
            const writable = chars.find((c) => c.properties.write || c.properties.writeWithoutResponse);
            if (writable) {
              state.bleCharacteristic = writable;
              break;
            }
          }
          bleBtn.textContent = `✅ BLE: ${device.name || 'Paired'}`;
          if (pill) {
            pill.textContent = `BLE CONNECTED: ${device.name || 'DEVICE'}`;
            pill.className = 'route-tag hw';
          }
          appendSerialLog(`Paired BLE hardware device: ${device.name || device.id}`);
          showToast(`BLE paired with ${device.name || 'device'}.`, 'success');
        } catch (err) {
          if (err && err.name !== 'NotFoundError') {
            showToast(`BLE error: ${err.message}`, 'error');
          }
        }
      });
    }
  }

  // --------------------------------------------------------------------------
  // Voice Command Execution, Neural TTS & Wake-Word / Push-to-Talk
  // --------------------------------------------------------------------------
  function appendVoiceConsole(role, text, meta = {}) {
    const log = document.getElementById('voice-console-log');
    if (!log) return;
    const div = document.createElement('div');
    div.className = `voice-entry ${role}`;

    const badgeClass = meta.route === 'hardware_module' ? 'route-tag hw' : meta.route === 'custom_module' ? 'route-tag mod' : 'route-tag';
    const routeLabel = meta.route ? meta.route.replace(/_/g, ' ') : role === 'user' ? 'YOU' : 'PUYAL AI';
    const extras = [];
    if (meta.model) extras.push(`Model: ${meta.model}`);
    if (meta.matchedTrigger) extras.push(`Trigger: "${meta.matchedTrigger}"`);
    if (meta.serialPayload) extras.push(`TX: ${meta.serialPayload}`);

    div.innerHTML = `
      <div class="voice-entry-meta">
        <span class="${badgeClass}">${escapeHtml(routeLabel)}</span>
        ${extras.map((e) => `<span>${escapeHtml(e)}</span>`).join('')}
        <span style="margin-left:auto;">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <div>${escapeHtml(text)}</div>
    `;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }

  async function speakReply(text) {
    if (!text) return;
    const autoSpeak = document.getElementById('chk-neural-tts');
    if (autoSpeak && !autoSpeak.checked) return;

    const voiceName = document.getElementById('voice-tts-voice')?.value || 'Kore';
    try {
      if (state.currentAudio) {
        state.currentAudio.pause();
        state.currentAudio = null;
      }
      const res = await fetch('/api/voice-suite/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceName })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.audioBase64) {
          const mime = data.mimeType || 'audio/wav';
          const audio = new Audio(`data:${mime};base64,${data.audioBase64}`);
          state.currentAudio = audio;
          await audio.play().catch(() => {});
          return;
        }
      }
    } catch (err) {
      console.warn('Neural TTS fallback to Web Speech:', err);
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 1.03;
      window.speechSynthesis.speak(utt);
    }
  }

  async function executeVoiceUtterance(rawText) {
    const utterance = String(rawText || '').trim();
    if (!utterance) return;

    appendVoiceConsole('user', utterance);
    const model = document.getElementById('voice-model-select')?.value || 'gemini-4-hydrogen';
    const wakeWord = document.getElementById('cb-wake')?.value || 'hey puyal';

    try {
      const res = await fetch('/api/voice-suite/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ utterance, model, wakeWord })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        appendVoiceConsole('error', data.error || 'Voice command failed.', { route: 'ERROR' });
        return;
      }

      appendVoiceConsole('assistant', data.reply, {
        route: data.route,
        model: data.model,
        matchedTrigger: data.matchedTrigger,
        serialPayload: data.serialPayload
      });

      if (data.device) {
        await loadHardwareDevices();
      }
      if (data.serialPayload) {
        await writeToConnectedHardwareBridges(data.serialPayload);
        appendSerialLog(`Voice Command TX -> ${data.serialPayload}`);
      }
      if (data.clientAction === 'TRIGGER_SOS') {
        if (window.PuyalHaptics && typeof window.PuyalHaptics.triggerSOS === 'function') {
          window.PuyalHaptics.triggerSOS('voice-studio-sos');
        }
        showToast('Emergency SOS voice trigger confirmed! Opening SOS channel...', 'error');
      }

      await speakReply(data.reply);
    } catch (err) {
      appendVoiceConsole('error', `Network or execution error: ${err.message}`, { route: 'OFFLINE' });
    }
  }

  function initVoiceInputs() {
    const form = document.getElementById('voice-command-form');
    const input = document.getElementById('voice-utterance-input');
    if (form && input) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        input.value = '';
        await executeVoiceUtterance(text);
      });
    }

    document.querySelectorAll('.voice-quick-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const utt = btn.getAttribute('data-utterance');
        if (utt) executeVoiceUtterance(utt);
      });
    });

    const testTtsBtn = document.getElementById('btn-test-tts');
    if (testTtsBtn) {
      testTtsBtn.addEventListener('click', async () => {
        const prevChecked = document.getElementById('chk-neural-tts').checked;
        document.getElementById('chk-neural-tts').checked = true;
        await speakReply('PUYAL Voice AI Model Suite online. All custom command modules and hardware relays are standing by.');
        document.getElementById('chk-neural-tts').checked = prevChecked;
      });
    }

    // Push-to-Talk microphone (gemini-3.5-transcribe)
    const pttBtn = document.getElementById('btn-ptt-mic');
    if (pttBtn) {
      pttBtn.addEventListener('click', async () => {
        if (state.isRecordingPtt && state.pttRecorder) {
          state.pttRecorder.stop();
          return;
        }
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          showToast('Microphone capture is not supported in this browser.', 'error');
          return;
        }
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          state.pttChunks = [];
          const rec = new MediaRecorder(stream);
          state.pttRecorder = rec;
          state.isRecordingPtt = true;
          pttBtn.classList.add('listening');
          pttBtn.textContent = '⏹ Stop & Transcribe';

          rec.ondataavailable = (ev) => {
            if (ev.data && ev.data.size > 0) state.pttChunks.push(ev.data);
          };
          rec.onstop = async () => {
            state.isRecordingPtt = false;
            pttBtn.classList.remove('listening');
            pttBtn.textContent = '🎙️ Push to Talk';
            stream.getTracks().forEach((t) => t.stop());

            const blob = new Blob(state.pttChunks, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.onloadend = async () => {
              try {
                const res = await fetch('/api/gemini/transcribe', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ audioBase64: reader.result, mimeType: blob.type || 'audio/webm' })
                });
                const data = await res.json();
                if (data && data.success && data.text) {
                  await executeVoiceUtterance(data.text);
                } else {
                  showToast('Could not transcribe audio. Try typing or speaking louder.', 'error');
                }
              } catch (err) {
                showToast('Voice transcription failed.', 'error');
              }
            };
            reader.readAsDataURL(blob);
          };

          rec.start();
        } catch (err) {
          showToast('Microphone access was denied.', 'error');
        }
      });
    }

    // Wake-Word Continuous Listener ("Hey Puyal") via Web Speech API
    const wakeBtn = document.getElementById('btn-wake-word');
    if (wakeBtn) {
      wakeBtn.addEventListener('click', () => {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRec) {
          showToast('Continuous wake-word listening requires Chrome/Edge SpeechRecognition. Use Push-to-Talk instead.', 'info');
          return;
        }

        if (state.wakeWordActive) {
          state.wakeWordActive = false;
          if (state.wakeRecognition) {
            try { state.wakeRecognition.stop(); } catch (e) {}
          }
          wakeBtn.textContent = '👂 Wake Word: OFF';
          wakeBtn.classList.remove('st-btn-emerald');
          wakeBtn.classList.add('st-btn-ghost');
          return;
        }

        const recognition = new SpeechRec();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        state.wakeRecognition = recognition;
        state.wakeWordActive = true;
        wakeBtn.textContent = '🟢 Listening: "Hey Puyal"';
        wakeBtn.classList.remove('st-btn-ghost');
        wakeBtn.classList.add('st-btn-emerald');

        recognition.onresult = (event) => {
          const last = event.results[event.results.length - 1];
          if (!last || !last.isFinal) return;
          const spoken = String(last[0].transcript || '').trim();
          const wake = (document.getElementById('cb-wake')?.value || 'hey puyal').toLowerCase();
          if (spoken.toLowerCase().includes(wake) || spoken.toLowerCase().includes('puyal')) {
            executeVoiceUtterance(spoken);
          }
        };
        recognition.onend = () => {
          if (state.wakeWordActive) {
            try { recognition.start(); } catch (e) {}
          }
        };
        recognition.onerror = () => {};
        try {
          recognition.start();
          showToast('Wake-word listener active — say "Hey Puyal, ..."', 'success');
        } catch (err) {
          state.wakeWordActive = false;
          wakeBtn.textContent = '👂 Wake Word: OFF';
        }
      });
    }
  }

  // --------------------------------------------------------------------------
  // Forms: Add Command Module & Add Hardware Device
  // --------------------------------------------------------------------------
  function initForms() {
    const actionTypeSelect = document.getElementById('mod-action-type');
    const devWrap = document.getElementById('mod-target-device-wrap');
    const textWrap = document.getElementById('mod-target-text-wrap');
    const textLabel = document.getElementById('mod-target-text-label');

    function syncActionTargetFields() {
      const val = actionTypeSelect?.value || 'hardware_control';
      if (val === 'hardware_control') {
        devWrap.style.display = 'block';
        textWrap.style.display = 'none';
      } else if (val === 'webhook') {
        devWrap.style.display = 'none';
        textWrap.style.display = 'block';
        textLabel.textContent = 'Webhook Endpoint URL (POST)';
      } else if (val === 'ai_prompt') {
        devWrap.style.display = 'none';
        textWrap.style.display = 'block';
        textLabel.textContent = 'Gemini System Prompt / Skill Instruction';
      } else {
        devWrap.style.display = 'none';
        textWrap.style.display = 'none';
      }
    }

    if (actionTypeSelect) {
      actionTypeSelect.addEventListener('change', syncActionTargetFields);
      syncActionTargetFields();
    }

    const modForm = document.getElementById('module-create-form');
    if (modForm) {
      modForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const actionType = actionTypeSelect.value;
        const target =
          actionType === 'hardware_control'
            ? document.getElementById('mod-target-device').value
            : document.getElementById('mod-target-text').value;

        try {
          const res = await fetch('/api/voice-suite/modules', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: document.getElementById('mod-name').value.trim(),
              category: document.getElementById('mod-category').value,
              triggers: document.getElementById('mod-triggers').value,
              actionType,
              target,
              responseTemplate: document.getElementById('mod-response').value.trim(),
              description: document.getElementById('mod-desc').value.trim()
            })
          });
          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.error || 'Failed to register module');
          }
          modForm.reset();
          syncActionTargetFields();
          await loadModules();
          showToast(`Custom command module "${data.module.name}" added!`, 'success');
        } catch (err) {
          showToast(err.message || 'Could not create command module.', 'error');
        }
      });
    }

    const refreshModBtn = document.getElementById('btn-refresh-modules');
    if (refreshModBtn) {
      refreshModBtn.addEventListener('click', loadModules);
    }

    const hwForm = document.getElementById('hardware-create-form');
    if (hwForm) {
      hwForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          const res = await fetch('/api/hardware/devices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: document.getElementById('hw-name').value.trim(),
              protocol: document.getElementById('hw-protocol').value,
              zone: document.getElementById('hw-zone').value.trim(),
              topicOrEndpoint: document.getElementById('hw-topic').value.trim(),
              webhookUrl: document.getElementById('hw-webhook').value.trim(),
              serialCommandOn: document.getElementById('hw-serial-on').value.trim(),
              serialCommandOff: document.getElementById('hw-serial-off').value.trim(),
              voiceAliases: document.getElementById('hw-aliases').value
            })
          });
          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.error || 'Failed to register hardware device');
          }
          hwForm.reset();
          document.getElementById('hw-zone').value = 'Command Sector';
          document.getElementById('hw-serial-on').value = 'RELAY:ON';
          document.getElementById('hw-serial-off').value = 'RELAY:OFF';
          await loadHardwareDevices();
          showToast(`Hardware module "${data.device.name}" connected!`, 'success');
        } catch (err) {
          showToast(err.message || 'Could not register hardware module.', 'error');
        }
      });
    }
  }

  // --------------------------------------------------------------------------
  // Modular Voice Assistant Code Builder (Python & Node.js)
  // --------------------------------------------------------------------------
  function renderGeneratedFiles() {
    const tabsEl = document.getElementById('code-file-tabs');
    const viewer = document.getElementById('code-viewer');
    if (!tabsEl || !viewer) return;

    if (!state.generatedFiles.length) {
      tabsEl.innerHTML = '';
      viewer.textContent = '// No files generated yet.';
      return;
    }

    tabsEl.innerHTML = state.generatedFiles
      .map(
        (f, idx) =>
          `<button type="button" class="code-file-tab ${idx === state.activeFileIndex ? 'active' : ''}" data-idx="${idx}">${escapeHtml(f.path)}</button>`
      )
      .join('');

    tabsEl.querySelectorAll('.code-file-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.activeFileIndex = Number(btn.getAttribute('data-idx')) || 0;
        renderGeneratedFiles();
      });
    });

    const activeFile = state.generatedFiles[state.activeFileIndex] || state.generatedFiles[0];
    viewer.textContent = activeFile ? activeFile.content : '';
  }

  async function generateModularCode() {
    const btn = document.getElementById('btn-generate-code');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Generating...';
    }
    try {
      const res = await fetch('/api/voice-suite/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runtime: document.getElementById('cb-runtime').value,
          projectName: document.getElementById('cb-project').value.trim() || 'puyal-voice-assistant',
          wakeWord: document.getElementById('cb-wake').value.trim() || 'hey puyal',
          model: document.getElementById('cb-model').value,
          includeHardware: document.getElementById('cb-include-hw').checked,
          customSkillPrompt: document.getElementById('cb-custom-skill').value.trim()
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Code generation failed');
      }
      state.generatedFiles = Array.isArray(data.files) ? data.files : [];
      state.activeFileIndex = 0;
      renderGeneratedFiles();
      showToast(`Generated ${state.generatedFiles.length} modular ${data.runtime} files.`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to generate code.', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '⚡ Generate Modular Code';
      }
    }
  }

  async function downloadBlobFromPost(url, bodyObj, fallbackFilename) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyObj)
    });
    if (!res.ok) {
      let msg = 'Download failed';
      try {
        const j = await res.json();
        msg = j.error || msg;
      } catch (e) {}
      throw new Error(msg);
    }
    const blob = await res.blob();
    const disp = res.headers.get('Content-Disposition') || '';
    const match = disp.match(/filename="([^"]+)"/i);
    const filename = (match && match[1]) || fallbackFilename;

    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objUrl), 2000);
    return filename;
  }

  function initCodeBuilderAndApk() {
    const cbForm = document.getElementById('code-builder-form');
    if (cbForm) {
      cbForm.addEventListener('submit', (e) => {
        e.preventDefault();
        generateModularCode();
      });
    }

    const dlKitBtn = document.getElementById('btn-download-kit');
    if (dlKitBtn) {
      dlKitBtn.addEventListener('click', async () => {
        dlKitBtn.disabled = true;
        try {
          const filename = await downloadBlobFromPost(
            '/api/voice-suite/download-kit',
            {
              runtime: document.getElementById('cb-runtime').value,
              projectName: document.getElementById('cb-project').value.trim() || 'puyal-voice-assistant',
              wakeWord: document.getElementById('cb-wake').value.trim() || 'hey puyal',
              model: document.getElementById('cb-model').value,
              includeHardware: document.getElementById('cb-include-hw').checked,
              files: state.generatedFiles.length > 0 ? state.generatedFiles : undefined
            },
            'puyal-voice-assistant.zip'
          );
          showToast(`Downloaded ${filename}`, 'success');
        } catch (err) {
          showToast(err.message || 'Could not download starter kit.', 'error');
        } finally {
          dlKitBtn.disabled = false;
        }
      });
    }

    const copyBtn = document.getElementById('btn-copy-code');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        const active = state.generatedFiles[state.activeFileIndex];
        if (!active) {
          showToast('Generate code first to copy.', 'info');
          return;
        }
        try {
          await navigator.clipboard.writeText(active.content);
          showToast(`Copied ${active.path}`, 'success');
        } catch (err) {
          showToast('Clipboard copy blocked by browser.', 'error');
        }
      });
    }

    // Android APK Export
    const apkForm = document.getElementById('apk-builder-form');
    if (apkForm) {
      apkForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const exportBtn = document.getElementById('btn-export-apk');
        exportBtn.disabled = true;
        exportBtn.textContent = '⏳ Packaging APK Project...';
        try {
          const payload = {
            appName: document.getElementById('apk-app-name').value.trim(),
            packageId: document.getElementById('apk-package-id').value.trim(),
            versionName: document.getElementById('apk-version-name').value.trim(),
            versionCode: Number(document.getElementById('apk-version-code').value) || 1,
            serverUrl: document.getElementById('apk-server-url').value.trim() || window.location.origin,
            enableLocation: document.getElementById('perm-loc').checked,
            enableCamera: document.getElementById('perm-cam').checked,
            enableMicrophone: document.getElementById('perm-mic').checked,
            enableVibration: document.getElementById('perm-vib').checked,
            enableBluetooth: document.getElementById('perm-ble').checked,
            enableNotifications: document.getElementById('perm-notif').checked,
            includeVoiceKit: document.getElementById('apk-include-voice-kit').checked,
            voiceRuntime: document.getElementById('cb-runtime').value
          };
          const filename = await downloadBlobFromPost('/api/apk/export-bundle', payload, 'puyal-android-apk-project.zip');
          showToast(`Downloaded ${filename}`, 'success');
          await loadApkConfig();
        } catch (err) {
          showToast(err.message || 'APK bundle export failed.', 'error');
        } finally {
          exportBtn.disabled = false;
          exportBtn.textContent = '📥 Download Android APK Project (.zip)';
        }
      });
    }

    const installPwaBtn = document.getElementById('btn-install-android-pwa');
    if (installPwaBtn) {
      installPwaBtn.addEventListener('click', () => {
        if (window.PuyalPWA && typeof window.PuyalPWA.promptInstall === 'function') {
          window.PuyalPWA.promptInstall();
        } else {
          const navInstall = document.getElementById('pwa-install-btn');
          if (navInstall) {
            navInstall.click();
          } else {
            showToast('Use Chrome menu -> "Install App" or "Add to Home Screen" on Android.', 'info');
          }
        }
      });
    }
  }

  async function loadApkConfig() {
    try {
      const res = await fetch('/api/apk/config');
      const data = await res.json();
      if (!data || !data.success) return;
      state.apkConfig = data.config;

      document.getElementById('apk-app-name').value = data.config.appName || 'PUYAL Command';
      document.getElementById('apk-package-id').value = data.config.packageId || 'com.puyal.command';
      document.getElementById('apk-version-name').value = data.config.versionName || '1.0.0';
      document.getElementById('apk-version-code').value = data.config.versionCode || 1;
      document.getElementById('apk-server-url').value = data.config.serverUrl || window.location.origin;
      document.getElementById('kpi-apk-pkg').textContent = data.config.packageId || 'com.puyal.command';

      const files = Array.isArray(data.files) ? data.files : [];
      document.getElementById('apk-file-count').textContent = String(files.length);
      const listEl = document.getElementById('apk-file-list');
      if (listEl) {
        listEl.innerHTML = files
          .map(
            (f) => `<div class="apk-file-item"><span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(f.path)}">${escapeHtml(f.path)}</span><span style="color:#64748b;">${(f.size / 1024).toFixed(1)}KB</span></div>`
          )
          .join('');
      }

      const cmdEl = document.getElementById('apk-build-cmds');
      if (cmdEl && data.buildCommands) {
        cmdEl.textContent = [
          `# Option A: Android Studio / Gradle APK`,
          `unzip ${data.config.packageId}-android-apk-project.zip && cd puyal-android-apk`,
          `${data.buildCommands.gradleDebug}`,
          ``,
          `# Option B: Google Bubblewrap TWA APK`,
          `${data.buildCommands.bubblewrapInit}`,
          `${data.buildCommands.bubblewrapBuild}`
        ].join('\n');
      }
    } catch (err) {
      console.warn('Could not load APK config:', err);
    }
  }

  // --------------------------------------------------------------------------
  // Live SSE Subscription for Hardware & Command Module Updates
  // --------------------------------------------------------------------------
  function connectRealtimeEvents() {
    if (typeof EventSource === 'undefined') return;
    try {
      const es = new EventSource('/api/events');
      es.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'HARDWARE_STATE_UPDATED') {
            loadHardwareDevices();
          } else if (msg.type === 'VOICE_MODULE_UPDATED') {
            loadModules();
          }
        } catch (e) {}
      };
    } catch (e) {}
  }

  // --------------------------------------------------------------------------
  // Bootstrap
  // --------------------------------------------------------------------------
  async function init() {
    initTabs();
    initVoiceInputs();
    initForms();
    initHardwareBridges();
    initCodeBuilderAndApk();
    connectRealtimeEvents();

    await Promise.all([loadModels(), loadModules(), loadHardwareDevices(), loadApkConfig()]);
    // Pre-generate default Python modular assistant code so Code Builder tab is immediately inspectable
    generateModularCode();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
