import React, { useEffect, useMemo, useRef, useState } from 'react';
import { processAlexaVoiceQuery } from '../amazon/alexa/mcpTools';
import {
  mcpCallTool,
  getWireLog,
  clearWireLog,
  resetMcpSession,
  McpWireEntry,
} from '../amazon/alexa/mcpClient';
import { AlexaSpeechResponse, BeeWearableNotification, RingIndustrialEvent } from '../amazon/types';

/**
 * Narrated demo tour (open /?mode=demo).
 * Press Start, then screen-record the browser window (Win+G in Edge).
 * Every scene is driven by the narration: the next scene starts when the voice finishes.
 * The Alexa and Ring scenes call the real server; nothing here is mocked.
 */

type Scene = 'intro' | 'firetv' | 'alexa' | 'inspector' | 'ring' | 'outro';
type Phase = 'setup' | 'running' | 'done';

const SCENES: { id: Scene; label: string }[] = [
  { id: 'intro', label: 'The product' },
  { id: 'firetv', label: 'Fire TV control room' },
  { id: 'alexa', label: 'Alexa+ over MCP' },
  { id: 'inspector', label: 'MCP Inspector' },
  { id: 'ring', label: 'Ring and Bee' },
  { id: 'outro', label: 'Try it' },
];

const GITHUB_URL = 'github.com/dipsptl/MachMateAI';
const QUESTION = 'Which machine has the highest failure risk?';

// Voices to prefer, best first (Edge "Natural" voices sound the most human)
const FEMALE_HINTS = [
  /aria/i, /jenny/i, /sonia/i, /neerja/i, /libby/i, /zira/i, /hazel/i,
  /google uk english female/i, /samantha/i, /susan/i, /female/i,
];

const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const en = voices.filter((v) => /^en[-_]/i.test(v.lang));
  for (const hint of FEMALE_HINTS) {
    const natural = en.find((v) => hint.test(v.name) && /natural|online/i.test(v.name));
    if (natural) return natural;
  }
  for (const hint of FEMALE_HINTS) {
    const v = en.find((x) => hint.test(x.name));
    if (v) return v;
  }
  return en[0];
}

const wirePreview = (w: McpWireEntry): string => {
  const r = (w.response as { result?: any })?.result; // eslint-disable-line @typescript-eslint/no-explicit-any
  if (w.method === 'initialize') {
    return `protocolVersion ${r?.protocolVersion}  ·  server ${r?.serverInfo?.name}`;
  }
  if (w.method === 'tools/call') {
    return String(r?.content?.[0]?.text ?? '').replace(/\s+/g, ' ').slice(0, 150);
  }
  return '';
};

const wireLabel = (w: McpWireEntry): string => {
  const name = (w.request as { params?: { name?: string } })?.params?.name;
  return w.method === 'tools/call' && name ? `tools/call  ${name}` : w.method;
};

export default function DemoTour() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [scene, setScene] = useState<Scene>('intro');
  const [caption, setCaption] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState('');
  const [rate, setRate] = useState(1.0);
  const [typed, setTyped] = useState('');
  const [wire, setWire] = useState<McpWireEntry[]>([]);
  const [answer, setAnswer] = useState<AlexaSpeechResponse | null>(null);
  const [ringEvent, setRingEvent] = useState<RingIndustrialEvent | null>(null);
  const [beeNote, setBeeNote] = useState<BeeWearableNotification | null>(null);
  const [error, setError] = useState('');
  const [finalTime, setFinalTime] = useState(0);

  const runRef = useRef(0);
  const startRef = useRef(0);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    document.title = 'MechMate AI demo';
    const load = () => {
      const v = window.speechSynthesis.getVoices();
      setVoices(v);
      setVoiceURI((cur) => cur || pickVoice(v)?.voiceURI || '');
    };
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  useEffect(() => {
    if (phase !== 'running') return;
    const id = setInterval(() => setElapsed((Date.now() - startRef.current) / 1000), 400);
    return () => clearInterval(id);
  }, [phase]);

  const stop = () => {
    runRef.current += 1;
    window.speechSynthesis.cancel();
    videoRef.current?.pause();
    setCaption('');
    setPhase('setup');
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && phase === 'running') stop();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const voice = useMemo(() => voices.find((v) => v.voiceURI === voiceURI), [voices, voiceURI]);
  const englishVoices = useMemo(() => voices.filter((v) => /^en[-_]/i.test(v.lang)), [voices]);

  const speakOne = (text: string): Promise<void> =>
    new Promise((resolve) => {
      const u = new SpeechSynthesisUtterance(text);
      if (voice) {
        u.voice = voice;
        u.lang = voice.lang;
      }
      u.rate = rate;
      u.pitch = 1;
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        clearTimeout(guard);
        resolve();
      };
      // Safety net: some browsers never fire `onend`
      const guard = setTimeout(finish, (text.split(/\s+/).length / (2.4 * rate)) * 1000 + 4000);
      u.onend = finish;
      u.onerror = finish;
      window.speechSynthesis.speak(u);
    });

  const runTour = async () => {
    const my = ++runRef.current;
    const alive = () => runRef.current === my;
    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

    /** Speak sentence by sentence; the caption follows the voice. `shown` overrides the caption text. */
    const say = async (spoken: string, shown?: string) => {
      const parts = spoken.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [spoken];
      const shownParts = shown ? shown.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [shown] : parts;
      for (let i = 0; i < parts.length; i++) {
        if (!alive()) return;
        setCaption((shownParts[i] ?? parts[i]).trim());
        await speakOne(parts[i].trim());
      }
      if (alive()) setCaption('');
    };
    const pressKey = (key: string) => {
      const w = iframeRef.current?.contentWindow;
      w?.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    };

    window.speechSynthesis.cancel();
    setError('');
    setTyped('');
    setWire([]);
    setAnswer(null);
    setRingEvent(null);
    setBeeNote(null);
    setElapsed(0);
    startRef.current = Date.now();
    setPhase('running');

    try {
      // 1. Product
      setScene('intro');
      await sleep(900);
      await say(
        'This is MechMate AI, a maintenance assistant for industrial gearboxes, pumps and compressors. It is our entry for the Alexa Plus track of the Amazon Developer Hackathon.',
        'This is MechMate AI, a maintenance assistant for industrial gearboxes, pumps and compressors. It is our entry for the Alexa+ track of the Amazon Developer Hackathon.'
      );
      if (!alive()) return;

      // 2. Fire TV
      setScene('firetv');
      await sleep(1200);
      const fireTalk = say(
        'On a plant floor, nobody can watch every machine. This Fire TV control room ranks every asset by risk, and moves on its own when nobody touches the remote.'
      );
      await sleep(3500);
      pressKey('ArrowRight');
      await sleep(2800);
      pressKey('ArrowRight');
      await fireTalk;
      if (!alive()) return;

      // 3. Alexa+ over MCP (real JSON-RPC calls to /api/mcp)
      setScene('alexa');
      resetMcpSession();
      clearWireLog();
      await sleep(700);
      await say(
        'Here is the core of the project: a self-hosted M C P server, over Streamable HTTP, using the November twenty twenty five protocol. An operator asks a question out loud.',
        'Here is the core of the project: a self-hosted MCP server, over Streamable HTTP, using the 2025-11-25 protocol. An operator asks a question out loud.'
      );
      for (let i = 1; i <= QUESTION.length; i++) {
        if (!alive()) return;
        setTyped(QUESTION.slice(0, i));
        await sleep(32);
      }
      await sleep(500);
      const resp = await processAlexaVoiceQuery(QUESTION, mcpCallTool);
      if (!alive()) return;
      setAnswer(resp);
      const log = [...getWireLog()];
      for (let i = 0; i < log.length; i++) {
        if (!alive()) return;
        setWire(log.slice(0, i + 1));
        await sleep(650);
      }
      await say(
        'The console is a real M C P client. It sends initialize, then tools slash call, as genuine JSON R P C over HTTP, and every request you see here travelled to the server.',
        'The console is a real MCP client. It sends initialize, then tools/call, as genuine JSON-RPC over HTTP, and every request you see here travelled to the server.'
      );
      const spokenAnswer = resp.speech
        .replace(/,\s[^,]*?\b(?:GT|GP|GC)-\d{3},/, '') // drop the repeated machine name
        .split(/(?<=[.!?])\s+/)
        .slice(0, 2)
        .join(' ')
        .slice(0, 260);
      await say(`The assistant answers. ${spokenAnswer.replace(/GT-204/g, 'G T two oh four').replace(/GP-108/g, 'G P one oh eight').replace(/GC-310/g, 'G C three ten')}`);
      await say('The answer is grounded in live sensor data. It is not guessed.');
      if (!alive()) return;

      // 4. Inspector clip (screen recording)
      setScene('inspector');
      await sleep(500);
      const vid = videoRef.current;
      let clipDone: Promise<void> = Promise.resolve();
      if (vid) {
        vid.currentTime = 0;
        vid.playbackRate = 1.4;
        clipDone = new Promise<void>((r) => {
          vid.onended = () => r();
          setTimeout(r, 24000);
        });
        vid.play().catch(() => undefined);
      }
      await say(
        'To prove that any client can connect, here is the official M C P Inspector. It lists our seven tools, then calls get machine status for G T two oh four, and gets live JSON back.',
        'To prove that any client can connect, here is the official MCP Inspector. It lists our seven tools, then calls get_machine_status for GT-204, and gets live JSON back.'
      );
      await clipDone;
      if (!alive()) return;

      // 5. Ring + Bee
      setScene('ring');
      await sleep(700);
      await say('Ring and Bee are included as simulator demos. No physical devices are used.');
      await say('A Ring camera sees someone enter the restricted gearbox bay.');
      try {
        const res = await fetch('/api/amazon/ring/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId: 'cam-gearbox-bay-01', eventType: 'restricted_area_intrusion' }),
        });
        const data = (await res.json()) as { event: RingIndustrialEvent };
        setRingEvent(data.event);
        await sleep(1100);
        const nres = await fetch('/api/amazon/bee/notifications');
        const notes = (await nres.json()) as BeeWearableNotification[];
        setBeeNote(notes.find((n) => n.title.startsWith('PERIMETER')) ?? notes[0] ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
      await sleep(600);
      await say(
        'Because that machine is already under investigation, MechMate raises the severity and sends a haptic alert to the technician wearable.'
      );
      await sleep(900);
      if (!alive()) return;

      // 6. Outro
      setScene('outro');
      await sleep(600);
      await say(
        'MechMate AI. Seven grounded M C P tools, a live public endpoint, and the full code on GitHub. Thank you for watching.',
        'MechMate AI. Seven grounded MCP tools, a live public endpoint, and the full code on GitHub. Thank you for watching.'
      );
      await sleep(1500);
      if (!alive()) return;
      setFinalTime((Date.now() - startRef.current) / 1000);
      setPhase('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase('setup');
    }
  };

  const testVoice = () => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance('Hello, this is the voice for the MechMate AI demo.');
    if (voice) {
      u.voice = voice;
      u.lang = voice.lang;
    }
    u.rate = rate;
    window.speechSynthesis.speak(u);
  };

  const running = phase === 'running';
  const sceneIndex = SCENES.findIndex((s) => s.id === scene);

  return (
    <div className={`dt-root ${running ? 'dt-run' : ''}`}>
      <style>{CSS}</style>

      <aside className="dt-rail">
        <div className="dt-brand">
          <b>MechMate</b> AI
        </div>
        <ol>
          {SCENES.map((s, i) => (
            <li key={s.id} className={running && i === sceneIndex ? 'on' : running && i < sceneIndex ? 'past' : ''}>
              <span>{i + 1}</span>
              {s.label}
            </li>
          ))}
        </ol>
        <div className={`dt-clock ${elapsed > 165 ? 'warn' : ''}`}>
          {fmt(running ? elapsed : phase === 'done' ? finalTime : 0)}
          <small> / 3:00 limit</small>
        </div>
      </aside>

      <main className="dt-stage">
        {phase === 'setup' && (
          <section className="dt-setup">
            <h1>Narrated demo</h1>
            <p>
              Pick a voice, press Start, then screen-record this window (Windows: <kbd>Win</kbd>+<kbd>G</kbd> in
              Edge, or OBS). Press <kbd>F11</kbd> for full screen and <kbd>Esc</kbd> to stop. Runs about two and a
              half minutes.
            </p>
            <label>
              Voice
              <select value={voiceURI} onChange={(e) => setVoiceURI(e.target.value)}>
                {englishVoices.length === 0 && <option value="">Loading voices…</option>}
                {englishVoices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Speed {rate.toFixed(2)}
              <input type="range" min={0.85} max={1.2} step={0.05} value={rate} onChange={(e) => setRate(Number(e.target.value))} />
            </label>
            <div className="dt-row">
              <button className="ghost" onClick={testVoice}>Test voice</button>
              <button className="go" onClick={runTour}>{phase === 'setup' && elapsed > 0 ? 'Start again' : 'Start demo'}</button>
            </div>
            <p className="dt-tip">
              For the most natural female voice use Microsoft Edge and choose an “Aria” or “Jenny” (Natural) voice.
            </p>
            {error && <p className="dt-error">Problem: {error}</p>}
          </section>
        )}

        {phase === 'done' && (
          <section className="dt-setup">
            <h1>Finished in {fmt(finalTime)}</h1>
            <p>{finalTime <= 180 ? 'That fits the 3 minute limit.' : 'Over 3 minutes: raise the speed a little and run it again.'}</p>
            <div className="dt-row">
              <button className="go" onClick={runTour}>Run again</button>
              <button className="ghost" onClick={stop}>Back to setup</button>
            </div>
          </section>
        )}

        {running && scene === 'intro' && (
          <section className="dt-center">
            <h1 className="dt-title">MechMate AI</h1>
            <p className="dt-sub">Predict, prevent and explain machine failures. Ask by voice, answered over MCP.</p>
          </section>
        )}

        {running && scene === 'firetv' && (
          <iframe ref={iframeRef} className="dt-frame" title="Fire TV control room" src="/?mode=firetv" />
        )}

        {running && scene === 'alexa' && (
          <section className="dt-alexa">
            <div className="dt-ask">
              <span className="dt-who">Operator</span>
              <p>{typed}<i className="dt-caret" /></p>
              {answer && (
                <div className="dt-answer">
                  <span className="dt-who">Assistant · {answer.invokedTools.join(', ')}</span>
                  <p>{answer.speech}</p>
                </div>
              )}
            </div>
            <div className="dt-wire">
              <div className="dt-wire-head">POST {window.location.origin}/api/mcp · JSON-RPC 2.0</div>
              {wire.map((w, i) => (
                <div key={i} className="dt-wire-row">
                  <div>
                    <b>{wireLabel(w)}</b>
                    <em>{w.ms} ms</em>
                  </div>
                  <code>{wirePreview(w)}</code>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className={`dt-clip ${running && scene === 'inspector' ? 'show' : ''}`}>
          <video ref={videoRef} muted playsInline preload="auto">
            <source src="/demo/inspector.mp4" type="video/mp4" />
            <source src="/demo/inspector.webm" type="video/webm" />
          </video>
        </section>

        {running && scene === 'ring' && (
          <section className="dt-ring">
            <div className="dt-cam">
              <span className="dt-who">Ring camera · {ringEvent ? ringEvent.sourceDeviceName : 'Gearbox Bay'}</span>
              <p className="dt-big">{ringEvent ? ringEvent.eventType.replace(/_/g, ' ') : 'watching…'}</p>
              {ringEvent && (
                <>
                  <p className={`dt-sev ${ringEvent.severity}`}>Severity: {ringEvent.severity}</p>
                  <p className="dt-small">{ringEvent.aiSafetyActionTaken}</p>
                </>
              )}
            </div>
            <div className={`dt-watch ${beeNote ? 'buzz' : ''}`}>
              <span className="dt-who">Bee wearable</span>
              {beeNote ? (
                <>
                  <p className="dt-big">{beeNote.priority}</p>
                  <p className="dt-small">{beeNote.title}</p>
                  <p className="dt-small">Haptic: {beeNote.hapticPattern.replace(/_/g, ' ')}</p>
                  <p className="dt-small">{beeNote.guidanceText}</p>
                </>
              ) : (
                <p className="dt-big dim">waiting for an alert</p>
              )}
            </div>
            {error && <p className="dt-error">Problem: {error}</p>}
          </section>
        )}

        {running && scene === 'outro' && (
          <section className="dt-center">
            <h1 className="dt-title">Try it</h1>
            <p className="dt-link">{window.location.origin.replace(/^https?:\/\//, '')}/api/mcp</p>
            <p className="dt-link">{GITHUB_URL}</p>
            <p className="dt-sub">7 MCP tools · protocol 2025-11-25 · Streamable HTTP</p>
          </section>
        )}

        {running && caption && <div className="dt-caption">{caption}</div>}
      </main>
    </div>
  );
}

const CSS = `
.dt-root{--ink:#12161B;--panel:#1B222A;--line:#2C3640;--paper:#ECE7DA;--mute:#8C98A4;--amber:#F2A93B;--teal:#6CC3BE;--red:#E4574B;
  position:fixed;inset:0;display:grid;grid-template-columns:230px 1fr;background:var(--ink);color:var(--paper);
  font-family:'Bahnschrift','Segoe UI Variable','Segoe UI',system-ui,sans-serif;overflow:hidden}
.dt-run{cursor:none}
.dt-rail{padding:28px 20px;border-right:1px solid var(--line);display:flex;flex-direction:column;gap:28px;background:#0F1317}
.dt-brand{font-size:20px;letter-spacing:.02em}.dt-brand b{color:var(--amber);font-weight:700}
.dt-rail ol{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
.dt-rail li{display:flex;gap:10px;align-items:center;padding:9px 10px;border-left:3px solid transparent;color:var(--mute);font-size:15px}
.dt-rail li span{width:22px;height:22px;border:1px solid var(--line);border-radius:50%;display:grid;place-items:center;font-size:12px}
.dt-rail li.past{color:#5E6A75}
.dt-rail li.on{color:var(--paper);border-left-color:var(--amber);background:var(--panel)}
.dt-rail li.on span{border-color:var(--amber);color:var(--amber)}
.dt-clock{margin-top:auto;font-size:34px;font-variant-numeric:tabular-nums}.dt-clock small{font-size:12px;color:var(--mute)}
.dt-clock.warn{color:var(--amber)}
.dt-stage{position:relative;min-width:0;min-height:0}
.dt-setup{max-width:640px;margin:9vh auto 0;padding:0 24px;display:flex;flex-direction:column;gap:18px}
.dt-setup h1{font-size:44px;margin:0;font-weight:600}
.dt-setup p{color:var(--mute);line-height:1.55;margin:0;font-size:17px}
.dt-setup label{display:flex;flex-direction:column;gap:6px;color:var(--mute);font-size:14px}
.dt-setup select,.dt-setup input{background:var(--panel);color:var(--paper);border:1px solid var(--line);padding:10px;border-radius:6px;font:inherit}
.dt-setup kbd{background:var(--panel);border:1px solid var(--line);border-radius:4px;padding:1px 6px;color:var(--paper)}
.dt-row{display:flex;gap:12px}
.dt-row button{font:inherit;font-size:17px;padding:12px 22px;border-radius:6px;border:1px solid var(--line);cursor:pointer;color:var(--paper);background:transparent}
.dt-row button.go{background:var(--amber);color:#201605;border-color:var(--amber);font-weight:700}
.dt-tip{font-size:14px!important}
.dt-error{color:var(--red)!important}
.dt-center{height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 8vw;gap:18px}
.dt-title{font-size:clamp(56px,8vw,120px);line-height:1;margin:0;font-weight:600;letter-spacing:-.01em}
.dt-sub{font-size:clamp(20px,2vw,30px);color:var(--mute);margin:0;max-width:900px}
.dt-link{font-family:Consolas,'Cascadia Mono',monospace;font-size:clamp(22px,2.4vw,36px);margin:0;color:var(--teal)}
.dt-frame{position:absolute;inset:0;width:100%;height:100%;border:0;background:#000}
.dt-alexa{height:100%;display:grid;grid-template-columns:1fr 1.15fr;gap:24px;padding:40px 40px 140px}
.dt-who{font-size:13px;color:var(--mute);letter-spacing:.04em}
.dt-ask{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:28px;display:flex;flex-direction:column;gap:10px;overflow:hidden}
.dt-ask p{margin:0;font-size:clamp(22px,2.2vw,32px);line-height:1.3}
.dt-caret{display:inline-block;width:3px;height:1em;background:var(--amber);margin-left:3px;vertical-align:-3px}
.dt-answer{margin-top:18px;padding-top:18px;border-top:1px solid var(--line)}
.dt-answer p{color:var(--teal);font-size:clamp(17px,1.6vw,24px)}
.dt-wire{background:#0D1115;border:1px solid var(--line);border-radius:10px;padding:18px;font-family:Consolas,'Cascadia Mono',monospace;overflow:hidden;display:flex;flex-direction:column;gap:10px}
.dt-wire-head{color:var(--mute);font-size:14px}
.dt-wire-row{border-left:3px solid var(--amber);padding:4px 0 4px 12px}
.dt-wire-row div{display:flex;justify-content:space-between;font-size:17px}
.dt-wire-row b{color:var(--amber);font-weight:600}.dt-wire-row em{color:var(--mute);font-style:normal}
.dt-wire-row code{display:block;color:var(--teal);font-size:14px;margin-top:4px;word-break:break-word}
.dt-clip{position:absolute;inset:0;display:none;background:#000;place-items:center}
.dt-clip.show{display:grid}
.dt-clip video{width:100%;height:100%;object-fit:contain}
.dt-ring{height:100%;display:grid;grid-template-columns:1.2fr 1fr;gap:28px;padding:44px 44px 150px;align-items:start}
.dt-cam,.dt-watch{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:28px;display:flex;flex-direction:column;gap:10px;min-height:260px}
.dt-watch{border-radius:44px;border-width:3px;max-width:380px}
.dt-big{font-size:clamp(30px,3.2vw,48px);margin:0;line-height:1.1;text-transform:capitalize}
.dt-big.dim{color:var(--mute);text-transform:none;font-size:26px}
.dt-small{margin:0;color:var(--mute);font-size:clamp(15px,1.3vw,20px);line-height:1.4}
.dt-sev{margin:0;font-size:24px;text-transform:capitalize}
.dt-sev.critical,.dt-sev.high{color:var(--red)}
.dt-sev.medium{color:var(--amber)}
.dt-caption{position:absolute;left:50%;bottom:34px;transform:translateX(-50%);max-width:min(1180px,90%);width:max-content;
  background:rgba(8,10,13,.86);border:1px solid var(--line);padding:16px 26px;border-radius:8px;
  font-size:clamp(22px,2.2vw,34px);line-height:1.35;text-align:center}
@media (prefers-reduced-motion:no-preference){
  .dt-watch.buzz{animation:dtbuzz .9s ease-in-out 3;border-color:var(--red)}
  @keyframes dtbuzz{0%,100%{transform:translateX(0)}20%{transform:translateX(-7px)}40%{transform:translateX(7px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}
  .dt-caret{animation:dtblink 1s steps(2) infinite}
  @keyframes dtblink{50%{opacity:0}}
}
`;
