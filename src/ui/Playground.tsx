import React, { useState, useEffect } from 'react';
import { api, type CompressResponse } from '../api/adapter';
import { useGameStore } from '../state/gameStore';
import { useSceneStore } from '../state/sceneStore';
import { playCollapseAnimation } from '../scene/timeline';
import { generateQR, renderToCanvas, renderToSVG, downloadPNG, downloadSVG } from '../qrcode.js';

export interface RushTarget {
  code: string;
  domain: string;
  aliases: string[];
}

export const RUSH_TARGETS: RushTarget[] = [
  { code: 'https://lz.io/gIThUb', domain: 'github.com', aliases: ['github', 'gh'] },
  { code: 'https://lz.io/gOogLE', domain: 'google.com', aliases: ['google', 'goog'] },
  { code: 'https://lz.io/yTUbE', domain: 'youtube.com', aliases: ['youtube', 'yt'] },
  { code: 'https://lz.io/rEDdIT', domain: 'reddit.com', aliases: ['reddit'] },
  { code: 'https://lz.io/tWItTEr', domain: 'twitter.com', aliases: ['twitter', 'x', 'x.com'] },
  { code: 'https://lz.io/sPOtIFy', domain: 'spotify.com', aliases: ['spotify'] },
  { code: 'https://lz.io/nETfLIx', domain: 'netflix.com', aliases: ['netflix', 'nflx'] },
  { code: 'https://lz.io/dIScORd', domain: 'discord.com', aliases: ['discord'] },
  { code: 'https://lz.io/aMaZoN', domain: 'amazon.com', aliases: ['amazon', 'amzn'] },
  { code: 'https://lz.io/wIkIPeD', domain: 'wikipedia.org', aliases: ['wikipedia', 'wiki'] },
  { code: 'https://lz.io/iNStAGr', domain: 'instagram.com', aliases: ['instagram', 'ig', 'insta'] },
  { code: 'https://lz.io/lINkEDin', domain: 'linkedin.com', aliases: ['linkedin'] },
  { code: 'https://lz.io/oPEn-AI', domain: 'openai.com', aliases: ['openai', 'chatgpt'] },
  { code: 'https://lz.io/sTAcK-ov', domain: 'stackoverflow.com', aliases: ['stackoverflow', 'stack'] },
  { code: 'https://lz.io/tWItCH', domain: 'twitch.tv', aliases: ['twitch'] },
  { code: 'https://lz.io/fAcEBoOK', domain: 'facebook.com', aliases: ['facebook', 'fb', 'meta'] },
  { code: 'https://lz.io/aPPlE-io', domain: 'apple.com', aliases: ['apple'] },
  { code: 'https://lz.io/mICrOsFT', domain: 'microsoft.com', aliases: ['microsoft', 'msft'] },
  { code: 'https://lz.io/tIkTOk', domain: 'tiktok.com', aliases: ['tiktok'] },
  { code: 'https://lz.io/sTEaM', domain: 'steampowered.com', aliases: ['steam', 'steampowered'] },
  { code: 'https://lz.io/nOTiOn-so', domain: 'notion.so', aliases: ['notion'] },
  { code: 'https://lz.io/fIGmA', domain: 'figma.com', aliases: ['figma'] },
  { code: 'https://lz.io/sLAcK', domain: 'slack.com', aliases: ['slack'] },
  { code: 'https://lz.io/pINtERst', domain: 'pinterest.com', aliases: ['pinterest'] },
  { code: 'https://lz.io/dROpBoX', domain: 'dropbox.com', aliases: ['dropbox'] },
  { code: 'https://lz.io/mEDiUM', domain: 'medium.com', aliases: ['medium'] },
  { code: 'https://lz.io/tELeGrAM', domain: 'telegram.org', aliases: ['telegram', 'tg'] },
  { code: 'https://lz.io/wHAtSaPP', domain: 'whatsapp.com', aliases: ['whatsapp'] },
  { code: 'https://lz.io/pAyPAl', domain: 'paypal.com', aliases: ['paypal'] },
  { code: 'https://lz.io/eBAy-us', domain: 'ebay.com', aliases: ['ebay'] },
  { code: 'https://lz.io/zOOm-us', domain: 'zoom.us', aliases: ['zoom'] },
  { code: 'https://lz.io/iMDb-mv', domain: 'imdb.com', aliases: ['imdb'] },
];

export function shuffleTargets(list: RushTarget[]): RushTarget[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

type PlaygroundTab = 'compress' | 'decode' | 'daily' | 'rush';

const TABS: { id: PlaygroundTab; label: string }[] = [
  { id: 'compress', label: '⚡ Compress' },
  { id: 'decode', label: '🔄 Round Trip Decode' },
  { id: 'daily', label: '🎯 Daily Squeeze' },
  { id: 'rush', label: '⏱️ Decode Rush' },
];

const SAMPLE_URLS = [
  { label: 'GitHub Repo', url: 'https://github.com/cipherharsh/Link-Compressor' },
  { label: 'YouTube Video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  { label: 'Wikipedia Deep Link', url: 'https://en.wikipedia.org/wiki/Huffman_coding#History' },
];

const Playground: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PlaygroundTab>('compress');

  // Compress
  const [inputUrl, setInputUrl] = useState('https://github.com/cipherharsh/Link-Compressor');
  const [compressResult, setCompressResult] = useState<CompressResponse | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressError, setCompressError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Decode
  const [inputCode, setInputCode] = useState('');
  const [decodeResult, setDecodeResult] = useState<string | null>(null);
  const [decodeError, setDecodeError] = useState<string | null>(null);

  // Daily Squeeze
  const [dailyUrl, setDailyUrl] = useState('');
  const [dailyResult, setDailyResult] = useState<{ originalLen: number; compressedLen: number; ratio: number } | null>(null);

  // Decode Rush
  const [rushActive, setRushActive] = useState(false);
  const [rushGameOver, setRushGameOver] = useState(false);
  const [rushTimeLeft, setRushTimeLeft] = useState(30);
  const [rushScore, setRushScore] = useState(0);
  const [rushSolvedCount, setRushSolvedCount] = useState(0);
  const [rushTargetIndex, setRushTargetIndex] = useState(0);
  const [rushInput, setRushInput] = useState('');
  const [rushDeck, setRushDeck] = useState<RushTarget[]>(() => shuffleTargets(RUSH_TARGETS));
  const [rushFeedback, setRushFeedback] = useState<'correct' | 'wrong' | null>(null);

  const recordCompression = useGameStore((s) => s.recordCompression);
  const recordDecode = useGameStore((s) => s.recordDecode);
  const flattenQR = useSceneStore((s) => s.flattenQR);
  const toggleFlattenQR = useSceneStore((s) => s.toggleFlattenQR);

  // Seed the Daily Squeeze URL from the calendar date.
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setDailyUrl(
      `https://www.youtube.com/watch?v=dQw4w9WgXcQ&utm_source=twitter&utm_medium=social&utm_campaign=daily_${today.replace(/-/g, '')}&ref=linkzip`,
    );
  }, []);

  const handleCompress = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputUrl.trim()) return;

    setIsCompressing(true);
    setCompressError(null);

    try {
      const res = await api.compress(inputUrl.trim());
      setCompressResult(res);

      playCollapseAnimation({ url: inputUrl.trim(), stages: res.stages, qrPayload: res.qrPayload });

      const hasDictHit = res.stages.some(
        (st) => st.label.toLowerCase().includes('dict') || st.label.toLowerCase().includes('huffman'),
      );
      recordCompression({
        originalLength: res.originalLength,
        compressedLength: res.compressedLength,
        hasDictionaryHit: hasDictHit,
      });
    } catch (err: unknown) {
      setCompressError(err instanceof Error ? err.message : 'Compression failed. Please verify the URL.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDecode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputCode.trim()) return;

    setDecodeError(null);
    try {
      const res = await api.decompress(inputCode.trim());
      setDecodeResult(res.url);
      recordDecode();
    } catch (err: unknown) {
      setDecodeError(err instanceof Error ? err.message : 'Decoding failed. Code is invalid or malformed.');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadQR = (type: 'png' | 'svg') => {
    if (!compressResult) return;
    const qr = generateQR(compressResult.qrPayload, 'M');
    if (type === 'png') {
      const canvas = document.createElement('canvas');
      renderToCanvas(canvas, qr.matrix, { scale: 8, margin: 4 });
      downloadPNG(canvas, 'linkzip-qr.png');
    } else {
      downloadSVG(renderToSVG(qr.matrix, { scale: 8, margin: 4 }), 'linkzip-qr.svg');
    }
  };

  const startRush = () => {
    setRushDeck(shuffleTargets(RUSH_TARGETS));
    setRushTargetIndex(0);
    setRushActive(true);
    setRushGameOver(false);
    setRushTimeLeft(30);
    setRushScore(0);
    setRushSolvedCount(0);
    setRushInput('');
    setRushFeedback(null);
  };

  // Decode Rush countdown.
  useEffect(() => {
    if (!rushActive) return;
    if (rushTimeLeft <= 0) {
      setRushActive(false);
      setRushGameOver(true);
      return;
    }
    const timer = setInterval(() => setRushTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [rushActive, rushTimeLeft]);

  const checkRushMatch = (input: string, target: RushTarget): boolean => {
    const clean = input.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '');
    if (!clean) return false;
    if (clean === target.domain.toLowerCase()) return true;

    const baseName = target.domain.toLowerCase().replace(/\..*/, '');
    if (clean === baseName) return true;
    if (target.aliases.some((alias) => clean === alias.toLowerCase())) return true;
    if (baseName.length >= 3 && clean.includes(baseName)) return true;
    return false;
  };

  const handleRushAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rushActive || rushTimeLeft <= 0) return;

    const deck = rushDeck.length > 0 ? rushDeck : RUSH_TARGETS;
    const target = deck[rushTargetIndex % deck.length];

    if (checkRushMatch(rushInput, target)) {
      setRushScore((s) => s + 25);
      setRushSolvedCount((c) => c + 1);
      useGameStore.setState((s) => ({ xp: s.xp + 25 }));
      setRushFeedback('correct');
      setRushInput('');
      setRushTargetIndex((idx) => (idx + 1) % deck.length);
      setTimeout(() => setRushFeedback(null), 700);
    } else {
      setRushFeedback('wrong');
      setTimeout(() => setRushFeedback(null), 700);
    }
  };

  const handleRushSkip = () => {
    if (!rushActive || rushTimeLeft <= 0) return;
    const deck = rushDeck.length > 0 ? rushDeck : RUSH_TARGETS;
    setRushInput('');
    setRushFeedback(null);
    setRushTargetIndex((idx) => (idx + 1) % deck.length);
  };

  const activeDeck = rushDeck.length > 0 ? rushDeck : RUSH_TARGETS;
  const currentRushTarget = activeDeck[rushTargetIndex % activeDeck.length];

  return (
    <div className="playground">
      <div className="playground-tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab${activeTab === tab.id ? ' is-active' : ''}`}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'compress' && (
        <div>
          <form className="form-block" onSubmit={handleCompress}>
            <label htmlFor="url-compress-input" className="field-label field-label--caps">
              Paste Any Web URL
            </label>
            <div className="input-row">
              <input
                id="url-compress-input"
                className="text-input"
                type="url"
                required
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://example.com/very/long/path?with=parameters"
              />
              <button type="submit" className="btn-accent" disabled={isCompressing}>
                {isCompressing ? 'Compressing...' : 'Compress URL'}
              </button>
            </div>
          </form>

          <div className="sample-row">
            <span className="sample-row__label">TRY SAMPLES:</span>
            {SAMPLE_URLS.map((sample) => (
              <button key={sample.label} className="sample-chip" onClick={() => setInputUrl(sample.url)}>
                {sample.label}
              </button>
            ))}
          </div>

          {compressError && <div className="alert-error">⚠️ {compressError}</div>}

          {compressResult && (
            <div className="result-card">
              <div className="result-card__head">
                <span className="result-card__label">COMPRESSED SHORT LINK</span>
                <span className="result-card__badge">
                  {Math.round((1 - compressResult.compressedLength / compressResult.originalLength) * 100)}% SMALLER
                </span>
              </div>

              <div className="link-box">
                <span className="link-box__url">{compressResult.shortUrl}</span>
                <button
                  className={`copy-btn${copiedLink ? ' is-copied' : ''}`}
                  onClick={() => handleCopy(compressResult.shortUrl)}
                >
                  {copiedLink ? 'Copied ✓' : 'Copy'}
                </button>
              </div>

              <div className="metrics-row">
                <div>Original: <strong>{compressResult.originalLength} chars</strong></div>
                <div>Compressed: <strong style={{ color: 'var(--color-accent)' }}>{compressResult.compressedLength} chars</strong></div>
                <div>Saved: <strong style={{ color: 'var(--color-xp)' }}>{compressResult.originalLength - compressResult.compressedLength} bytes</strong></div>
              </div>

              <div className="compress-toolbar">
                <button className={`toolbar-btn${flattenQR ? ' is-active' : ''}`} onClick={toggleFlattenQR}>
                  📷 {flattenQR ? 'Restore 3D Angle' : 'Flatten for Camera Scan'}
                </button>
                <button className="toolbar-btn" onClick={() => handleDownloadQR('png')}>💾 Download PNG</button>
                <button className="toolbar-btn" onClick={() => handleDownloadQR('svg')}>📐 Download SVG</button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'decode' && (
        <div>
          <form className="form-block" onSubmit={handleDecode}>
            <label htmlFor="code-decode-input" className="field-label">
              PASTE COMPRESSED CODE OR SHORT LINK
            </label>
            <div className="input-row">
              <input
                id="code-decode-input"
                className="text-input"
                type="text"
                required
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="e.g. 8z$h7B-01 or full URL https://lz.io/8z$h7B-01"
              />
              <button type="submit" className="btn-accent2">Decode Link</button>
            </div>
          </form>

          {decodeError && <div className="inline-error">⚠️ {decodeError}</div>}

          {decodeResult && (
            <div className="decoded-card">
              <div className="field-label">DECODED ORIGINAL URL</div>
              <a className="decoded-card__link" href={decodeResult} target="_blank" rel="noreferrer">
                {decodeResult} ↗
              </a>
              <div className="decoded-card__verified">✓ Lossless Round-Trip Verified! Achievement awarded.</div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'daily' && (
        <div>
          <div className="minigame-head">
            <h4 className="accent-xp">Daily Squeeze Challenge</h4>
            <p>
              Strip tracking parameters, query bloat, or redundant tokens from today’s seeded target URL.
              Reach the lowest compressed length to maximize your ratio score.
            </p>
          </div>

          <textarea
            className="daily-textarea"
            rows={3}
            value={dailyUrl}
            onChange={(e) => setDailyUrl(e.target.value)}
          />

          <button
            className="btn-xp"
            onClick={() => {
              api
                .compress(dailyUrl)
                .then((c) =>
                  setDailyResult({
                    originalLen: c.originalLength,
                    compressedLen: c.compressedLength,
                    ratio: 1 - c.compressedLength / c.originalLength,
                  }),
                )
                .catch(() => {});
            }}
          >
            Evaluate Squeeze Ratio
          </button>

          {dailyResult && (
            <div className="score-card">
              <div>Original: {dailyResult.originalLen} chars</div>
              <div>Final Compressed: <strong className="accent">{dailyResult.compressedLen} chars</strong></div>
              <div>Score (Efficiency): <strong className="xp">{(dailyResult.ratio * 100).toFixed(1)}%</strong></div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'rush' && (
        <div>
          <div className="minigame-head">
            <h4 className="accent">Decode Rush (30s Sprint)</h4>
            <p>Identify the original domain for each compressed code before the timer expires. +25 XP per correct domain!</p>
          </div>

          {rushGameOver && !rushActive && (
            <div className="rush-over">
              <h3>Time's Up! Rush Complete</h3>
              <p>
                You identified <strong className="text">{rushSolvedCount} domains</strong> and scored{' '}
                <strong className="xp">+{rushScore} XP</strong>!
              </p>
              <button className="rush-start" onClick={startRush}>Play Again</button>
            </div>
          )}

          {!rushActive && !rushGameOver && (
            <button className="rush-start" onClick={startRush}>Start 30s Rush ⏱️</button>
          )}

          {rushActive && (
            <div>
              <div className="rush-hud">
                <span className={`rush-timer${rushTimeLeft < 10 ? ' is-urgent' : ''}`}>
                  ⏱️ Time Left: {rushTimeLeft}s
                </span>
                <span className="rush-score">Score: +{rushScore} XP ({rushSolvedCount} solved)</span>
                <span className="rush-index">Target #{rushTargetIndex + 1}</span>
              </div>

              <div
                className={`rush-target${
                  rushFeedback === 'correct' ? ' is-correct' : rushFeedback === 'wrong' ? ' is-wrong' : ''
                }`}
              >
                <div className="rush-target__head">
                  <span className="rush-target__hint">TARGET CODE:</span>
                  {rushFeedback === 'correct' && (
                    <span className="rush-target__feedback is-correct">✓ Correct! +25 XP</span>
                  )}
                  {rushFeedback === 'wrong' && (
                    <span className="rush-target__feedback is-wrong">✗ Incorrect, try again!</span>
                  )}
                </div>
                <div className="rush-target__code">{currentRushTarget.code}</div>
              </div>

              <form className="rush-form" onSubmit={handleRushAnswer}>
                <input
                  className="text-input"
                  type="text"
                  autoFocus
                  required
                  value={rushInput}
                  onChange={(e) => setRushInput(e.target.value)}
                  placeholder="Type domain (e.g. google, youtube, github, reddit)"
                />
                <button type="submit" className="btn-accent">Submit</button>
                <button type="button" className="rush-skip" onClick={handleRushSkip} title="Skip to next domain">
                  Skip ⏭️
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Playground;
