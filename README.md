# MechMate AI — Industrial Machine Maintenance & Engineering Intelligence Platform

> **Tagline:** AI Engineering Intelligence for Industrial Machinery Maintenance & Predictive Reliability  
> **Core Paradigm:** `Observe → Understand → Reason → Simulate → Recommend → Explain`

MechMate AI is an advanced, AI-powered industrial machine maintenance platform designed for rotating machinery (gearboxes, electric induction motors, slurry pumps, centrifugal compressors, and turbines). 

The platform combines real-time multi-sensor telemetry, physics-informed mechanical calculations, 3D parametric digital twins, what-if operational simulations, and an intelligent root-cause reasoning engine.

It also features a unified multi-channel deployment layer supporting:
1. **Fire TV Control Room** — 10-foot industrial display board with full D-pad remote and keyboard navigation.
2. **Alexa+ AI Voice Assistant** — Self-hosted Model Context Protocol (MCP) Streamable HTTP server exposing 7 grounded engineering tools.
3. **Bee Wearable & Smartwatch** — On-the-floor technician wrist notifications, tactile haptic vibration alerts, and hands-free voice triage.
4. **Ring Perimeter & Safety Monitoring** — Industrial safety camera zones linking physical perimeter motion directly with machinery hazard states.

---

## 1. Unified System Architecture

All multi-device experiences communicate directly with the central **MechMate Industrial AI Core**:

```text
                           ┌───────────────────────────────────────────────┐
                           │               MECHMATE AI CORE                │
                           │   • Machine Monitoring   • Sensor Telemetry   │
                           │   • Failure Prediction   • ISO 17359 Plans    │
                           │   • Causal Diagnostics   • Risk Scoring       │
                           │   • Physics Equations    • What-If Simulator  │
                           └───────────────────────┬───────────────────────┘
                                                   │
         ┌─────────────────────────┬───────────────┴───────────────┬─────────────────────────┐
         ▼                         ▼                               ▼                         ▼
┌──────────────────┐      ┌──────────────────┐           ┌───────────────────┐     ┌──────────────────┐
│   1. FIRE TV     │      │   2. ALEXA+      │           │   3. BEE          │     │   4. RING        │
│ 10-Foot Display  │      │ Streamable MCP   │           │ Smartwatch / Wear │     │ Perimeter Safety │
│ D-Pad Navigation │      │ 7 Grounded Tools │           │ Haptic Wrist Push │     │ Industrial Cams  │
│ Control Room Feed│      │ Speech & Cards   │           │ Technician Query  │     │ Causal Hazard    │
└──────────────────┘      └──────────────────┘           └───────────────────┘     └──────────────────┘
```

### Modular Codebase Organization:
```text
/
├── server.ts                       # Express backend: MCP streamable HTTP server + Multi-device endpoints
├── .env.example                    # Environment configuration template + Gemini AI API keys
├── src/
│   ├── core/
│   │   ├── machineStore.ts         # Central unified store for machines, diagnostics, alerts, events
│   │   └── calculations.ts         # Mechanical engineering equations (Torque, Ratio, Sizing)
│   ├── amazon/                     # Connected Multi-Device Ecosystem Layer
│   │   ├── types.ts                # TypeScript schemas for Fire TV, Alexa+ MCP, Bee, and Ring
│   │   ├── AmazonHubView.tsx       # Master multi-device command center and live status badges
│   │   ├── firetv/
│   │   │   └── FireTvExperience.tsx # 10-foot TV control room UI with D-Pad remote navigation
│   │   ├── alexa/
│   │   │   ├── mcpTools.ts         # 7 MCP tool definitions + execution engine + Alexa voice handler
│   │   │   └── AlexaAgentExperience.tsx # Alexa+ voice console & live MCP inspector
│   │   ├── bee/
│   │   │   ├── beeAdapter.ts       # Bee wearable data ingestion, haptic alert dispatcher, device status
│   │   │   └── BeeExperience.tsx   # Smartwatch wrist simulator & technician query interface
│   │   └── ring/
│   │       ├── ringAdapter.ts      # Ring camera zones, event converter & causal safety bridge
│   │       └── RingExperience.tsx  # Industrial camera surveillance & official event simulator
│   ├── ai/
│   │   └── reasoningEngine.ts      # Multi-agent orchestrator & root-cause diagnostic evaluator
│   ├── ml/
│   │   └── sensorIntelligence.ts   # Rolling statistics, Z-score anomaly detection, CSV ingestion
│   ├── components/
│   │   ├── DigitalTwin3D.tsx       # Interactive Three.js/WebGL 3D CAD digital twin
│   │   └── AICopilotPanel.tsx      # Natural-language copilot panel
│   └── App.tsx                     # Main workstation with top bar, responsive tablet/mobile scaling
```

---

## 2. Core Machine Maintenance Features

1. **Multi-Channel Physical Telemetry:**
   - Drive-End (DE) and Non-Drive-End (NDE) Bearing Temperature (°C)
   - Housing Vibration Overall RMS (mm/s) according to ISO 10816 standards
   - Rotational Speed (RPM) for input and output shafts
   - Mechanical Load (%) and Electrical Transmitted Power (kW)
   - Sump Oil Temperature (°C), Viscosity Degradation (%), and Lubrication Pressure (bar)

2. **Interactive 3D Digital Twin (CAD & Topology):**
   - Parametric 3D visualization using Three.js / WebGL.
   - Component isolation for Housing, Input/Output Shafts, Roller Bearings, Gear Meshes, and Sump Lubrication.
   - Live thermal and mechanical stress hotspot highlights.

3. **Physics-Informed Anomaly Detection:**
   - Real-time torque calculation ($T = 9550 \cdot P / \text{RPM}$).
   - Exact reduction gear ratio determination ($i = N_{in} / N_{out}$).
   - ISO 281 $L_{10h}$ rolling-element bearing life derating.
   - 4 Machine Intelligence States: `NORMAL`, `WATCH`, `INVESTIGATE`, `CRITICAL`.

4. **"What-If" Physics Simulator:**
   - Modify input RPM and mechanical load percentage before applying changes in the physical plant.
   - Predicts resulting bearing temperatures, thermal margins, and lubrication film breakdown risk.

5. **Automated Diagnostic Reports & PDF Export:**
   - Instant generation of clean, formatted diagnostic inspection reports and maintenance checklists.

---

## 3. Connected Ecosystem & Multi-Device Tools

### 1. Amazon Fire TV Control Room (`/api/amazon/firetv/feed`)
- **Purpose:** 10-foot unattended factory control-room screen for operators and shift supervisors.
- **TV/Remote Navigation:**
  - `ArrowLeft` / `ArrowRight` / `ArrowUp` / `ArrowDown`: Seamlessly move focus across machinery asset cards.
  - `Enter` / `OK`: Select asset to spotlight live sensor readouts and ISO 17359 triage recommendations.
  - `Escape` / `Backspace`: Return to previous view.
- **Features:**
  - High-contrast metric gauges (Bearing Temp, RMS Vibration, Input RPM, Prototype Risk Index).
  - Audio alarm chime toggle (synthesized Web Audio alert beacon).
  - Unattended auto-rotating carousel (shifts every 9s if no remote input is detected).
  - Full-screen mode toggle (`F11` or on-screen button).

### 2. Amazon Alexa+ Voice Assistant (`/api/mcp` and `/api/amazon/alexa/skill`)
- **Purpose:** Hands-free voice interface for operators and reliability engineers.
- **Technology:** Self-hosted **Model Context Protocol (MCP)** server over **Streamable HTTP / JSON-RPC 2.0**.
- **Real Grounded MCP Tools Exposed:**
  1. `get_machine_status({ machineId })` — Operational state, category, speed, power.
  2. `get_machine_health({ machineId })` — Intelligence state, risk score, headline diagnostics.
  3. `get_high_risk_machines({})` — Ranked list of critical assets requiring immediate attention.
  4. `get_machine_sensor_data({ machineId, channel })` — Live physical sensor telemetry.
  5. `get_failure_prediction({ machineId })` — Physics-informed root-cause candidates & mechanisms.
  6. `get_maintenance_recommendation({ machineId })` — Prioritized ISO 17359 procedures and required tools.
  7. `get_recent_alerts({ limit })` — Combined alerts across telemetry, Ring perimeter, and Bee wearable.
- **Supported Operator Voice Queries:**
  - *"Which machine has the highest failure risk?"*
  - *"Why is Machine 04 showing high risk?"*
  - *"What maintenance should I perform?"*
  - *"Show me machines requiring immediate inspection."*
  - *"What happened to Machine 02?"*

### 3. Bee Wearable & Apple Watch (`/api/amazon/bee/webhook`)
- **Purpose:** Technician wrist-based maintenance notifications and on-the-floor voice triage.
- **Features:**
  - **Haptic Alerts:** Differentiated wrist vibrations (`triple_pulse` for critical alarms, `double_buzz` for warnings, `gentle_tap` for routine notifications).
  - **Smartwatch Wrist Simulator:** Real-time wearable UI showing active alert cards and one-tap acknowledge button.
  - **Field Voice Query:** Technicians can speak directly into the Bee microphone (e.g., *"Is Gearbox GT-204 safe to run through the shift?"*) and receive grounded guidance.
  - **Live Device vs Development Mode:** Transparent status indicator (`READY FOR DEVICE/SIMULATOR` vs `LIVE BEE HARDWARE CONNECTED`).

### 4. Ring Industrial Perimeter Monitoring (`/api/amazon/ring/webhook`)
- **Purpose:** Industrial safety and perimeter monitoring linking Ring camera events with machinery hazard states.
- **Features:**
  - **4 Industrial Camera Zones:** Gearbox Bay (Restricted), Slurry Trench (Maintenance Bay), Boiler Feed (Restricted), Compressor Vault (Control Room).
  - **Causal Safety Correlation:** If a Ring camera detects motion in a restricted zone while the associated machine is in `CRITICAL` or `INVESTIGATE` state (e.g., GT-204 at 74.8°C), MechMate escalates the severity to `critical` and auto-dispatches an emergency wrist alert to the technician's Bee smartwatch.
  - **Official Ring Simulator:** Test `restricted_area_intrusion`, `person_detected`, `motion_detected`, or `hazard_smoke_or_steam` directly inside the app.

---

## 4. Implementation Status Transparency

| Channel | Implementation Status | Mode | Notes |
| :--- | :--- | :--- | :--- |
| **Fire TV** | `READY FOR DEVICE/SIMULATOR` | Simulator / WebApp | 10-foot remote navigation fully runnable locally; deployable as Fire OS Web App or Vega OS wrapper. |
| **Alexa+** | `CONNECTED` | Real MCP Server | Self-hosted streamable HTTP MCP server running on port 3000 at `/api/mcp` with 7 real tools. |
| **Bee** | `READY FOR DEVICE/SIMULATOR` | Dev Adapter | Documented adapter active; transitions to `CONNECTED` when live Bee API token is supplied. |
| **Ring** | `READY FOR DEVICE/SIMULATOR` | Official Simulator | Ingests official Ring webhook payload structure; correlates events with live machine telemetry. |

---

## 5. Local Setup & Running Commands

### Prerequisites:
- Node.js 18+ or 20+
- npm 9+

### Commands to Run Locally:
```bash
# 1. Install dependencies
npm install

# 2. Start the unified MechMate server (Backend Express + Frontend Vite on port 3000)
npm run dev

# 3. Open in your browser:
# Main Workstation:  http://localhost:3000
# Fire TV Mode:      http://localhost:3000/?mode=firetv
# Amazon Hub:        http://localhost:3000/?tab=amazon
# MCP Server:        http://localhost:3000/api/mcp
```

### Type Checking & Linting:
```bash
npm run lint
```

---

## 6. How to Test Each Channel

### 1. Test Fire TV Control Room:
- Open `http://localhost:3000` and click the **Amazon Hub** button on the top pill bar.
- Click **1. Fire TV** or visit `http://localhost:3000/?mode=firetv`.
- Press your keyboard's **Arrow keys (◀ ▲ ▼ ▶)** to navigate between machines. Press **Enter/OK** to inspect.
- Click the **Alarm Beacon** button to test the audio alarm chime.

### 2. Test Alexa+ & MCP Server:
- On the Amazon Hub, click **2. Alexa+ MCP**.
- Under **Voice Agent Interface**, click any sample inquiry (e.g., *"Which machine has the highest failure risk?"*).
- Observe the invoked MCP tools, grounded answer, and browser speech output.
- Switch to **MCP Tool Inspector (7 Tools)**: Select `get_high_risk_machines` and click **Execute MCP Tool**.
- Test external MCP query via curl:
  ```bash
  curl -X POST http://localhost:3000/api/mcp \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_machine_status","arguments":{"machineId":"GT-204"}}}'
  ```

### 3. Test Bee Wearable:
- On the Amazon Hub, click **3. Bee Wearable**.
- Click **Dispatch Wrist Alert** to simulate MechMate sending a critical alarm to the technician's watch.
- In the Smartwatch simulator, click **ACKNOWLEDGE & DISPATCH**.
- Test technician voice input: Enter *"Is Gearbox GT-204 safe to run through the shift?"* and click Send.

### 4. Test Ring Perimeter Monitoring:
- On the Amazon Hub, click **4. Ring Security**.
- In the **Ring Event Simulator**, select `restricted_area_intrusion` and click **Trigger Ring Event**.
- Observe the event appear in the MechMate Ring Event Stream. Notice that because GT-204 is in a critical state, the causal safety engine automatically flags it as high hazard and triggers a Bee smartwatch dispatch!

---

## 7. Quality & Architecture Highlights

- **Unified Core Architecture**: Single source of truth for telemetry, diagnostics, and multi-channel actions.
- **Physics-First AI**: Explains mechanical failure modes with physical equations and sensor correlations, not just unverified probability percentages.
- **Zero Hardcoded Credentials**: Configurable via `.env.example` with clear distinction between simulated development and live production modes.
