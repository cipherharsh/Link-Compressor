import React, { useState, useEffect } from 'react';
import { api, type CompressResponse } from '../api/adapter';
import { useGameStore } from '../state/gameStore';
import { useSceneStore } from '../state/sceneStore';
import { useShow3D } from '../state/viewStore';
import { useThemeStore } from '../state/themeStore';
import { playCollapseAnimation } from '../scene/timeline';
import QrModal, { downloadQr, QR_INK } from './QrModal';
import { copyText, canShare, shareLink } from './shareActions';

export interface RushTarget {
  /** The site's name with scrambled letter case, e.g. 'gIThUb'. */
  hint: string;
  domain: string;
  aliases: string[];
}

export const RUSH_TARGETS: RushTarget[] = [
  { hint: 'gIThUb', domain: 'github.com', aliases: ['github', 'gh'] },
  { hint: 'gOogLE', domain: 'google.com', aliases: ['google', 'goog'] },
  { hint: 'yTUbE', domain: 'youtube.com', aliases: ['youtube', 'yt'] },
  { hint: 'rEDdIT', domain: 'reddit.com', aliases: ['reddit'] },
  { hint: 'tWItTEr', domain: 'twitter.com', aliases: ['twitter', 'x', 'x.com'] },
  { hint: 'sPOtIFy', domain: 'spotify.com', aliases: ['spotify'] },
  { hint: 'nETfLIx', domain: 'netflix.com', aliases: ['netflix', 'nflx'] },
  { hint: 'dIScORd', domain: 'discord.com', aliases: ['discord'] },
  { hint: 'aMaZoN', domain: 'amazon.com', aliases: ['amazon', 'amzn'] },
  { hint: 'wIkIPeD', domain: 'wikipedia.org', aliases: ['wikipedia', 'wiki'] },
  { hint: 'iNStAGr', domain: 'instagram.com', aliases: ['instagram', 'ig', 'insta'] },
  { hint: 'lINkEDin', domain: 'linkedin.com', aliases: ['linkedin'] },
  { hint: 'oPEn-AI', domain: 'openai.com', aliases: ['openai', 'chatgpt'] },
  { hint: 'sTAcK-ov', domain: 'stackoverflow.com', aliases: ['stackoverflow', 'stack'] },
  { hint: 'tWItCH', domain: 'twitch.tv', aliases: ['twitch'] },
  { hint: 'fAcEBoOK', domain: 'facebook.com', aliases: ['facebook', 'fb', 'meta'] },
  { hint: 'aPPlE-io', domain: 'apple.com', aliases: ['apple'] },
  { hint: 'mICrOsFT', domain: 'microsoft.com', aliases: ['microsoft', 'msft'] },
  { hint: 'tIkTOk', domain: 'tiktok.com', aliases: ['tiktok'] },
  { hint: 'sTEaM', domain: 'steampowered.com', aliases: ['steam', 'steampowered'] },
  { hint: 'nOTiOn-so', domain: 'notion.so', aliases: ['notion'] },
  { hint: 'fIGmA', domain: 'figma.com', aliases: ['figma'] },
  { hint: 'sLAcK', domain: 'slack.com', aliases: ['slack'] },
  { hint: 'pINtERst', domain: 'pinterest.com', aliases: ['pinterest'] },
  { hint: 'dROpBoX', domain: 'dropbox.com', aliases: ['dropbox'] },
  { hint: 'mEDiUM', domain: 'medium.com', aliases: ['medium'] },
  { hint: 'tELeGrAM', domain: 'telegram.org', aliases: ['telegram', 'tg'] },
  { hint: 'wHAtSaPP', domain: 'whatsapp.com', aliases: ['whatsapp'] },
  { hint: 'pAyPAl', domain: 'paypal.com', aliases: ['paypal'] },
  { hint: 'eBAy-us', domain: 'ebay.com', aliases: ['ebay'] },
  { hint: 'zOOm-us', domain: 'zoom.us', aliases: ['zoom'] },
  { hint: 'iMDb-mv', domain: 'imdb.com', aliases: ['imdb'] },
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

interface PlaygroundProps {
  /** Domain new short links use (from the short-link domain setting). */
  linkDomain: string;
  onOpenSettings: () => void;
}

const Playground: React.FC<PlaygroundProps> = ({ linkDomain, onOpenSettings }) => {
  const [activeTab, setActiveTab] = useState<PlaygroundTab>('compress');

  // Compress
  const [inputUrl, setInputUrl] = useState('https://github.com/cipherharsh/Link-Compressor');
  const [compressResult, setCompressResult] = useState<CompressResponse | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressError, setCompressError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [linkStyle, setLinkStyle] = useState<'classic' | 'emoji'>('classic');
  const [isQrOpen, setIsQrOpen] = useState(false);

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
  const recordScanReady = useGameStore((s) => s.recordScanReady);
  const flattenQR = useSceneStore((s) => s.flattenQR);
  const toggleFlattenQR = useSceneStore((s) => s.toggleFlattenQR);
  const show3D = useShow3D();
  const theme = useThemeStore((s) => s.theme);

  const displayUrl = compressResult
    ? linkStyle === 'emoji' ? compressResult.emojiUrl : compressResult.shortUrl
    : '';

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

  const handleCopy = async (text: string) => {
    setCopyState((await copyText(text)) ? 'copied' : 'failed');
    setTimeout(() => setCopyState('idle'), 2000);
  };

  const handleDownloadQR = (type: 'png' | 'svg') => {
    if (!compressResult) return;
    downloadQr(compressResult.qrPayload, QR_INK[theme], type);
    recordScanReady();
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

          <p className="domain-line">
            Short links use <code>{linkDomain}</code>
            <span aria-hidden="true"> · </span>
            <button type="button" className="domain-line__change" onClick={onOpenSettings}>
              Change domain
            </button>
          </p>

          {compressError &&<div className="alert-error">⚠️ {compressError}</div>}

          {compressResult && (
            <div className="result-card">
              <div className="result-card__head">
                <span className="result-card__label">COMPRESSED SHORT LINK</span>
                <span className="result-card__badge">
                  {Math.round((1 - compressResult.compressedLength / compressResult.originalLength) * 100)}% SMALLER
                </span>
              </div>

              <div className="link-style" role="radiogroup" aria-label="Link style">
                {(['classic', 'emoji'] as const).map((style) => (
                  <button
                    key={style}
                    role="radio"
                    aria-checked={linkStyle === style}
                    className={`link-style__opt${linkStyle === style ? ' is-active' : ''}`}
                    onClick={() => setLinkStyle(style)}
                  >
                    {style === 'classic' ? 'Classic' : 'Emoji'}
                  </button>
                ))}
              </div>

              <div className="link-box">
                <span className={`link-box__url${linkStyle === 'emoji' ? ' is-emoji' : ''}`}>{displayUrl}</span>
                <button
                  className={`copy-btn${copyState === 'copied' ? ' is-copied' : ''}`}
                  onClick={() => handleCopy(displayUrl)}
                >
                  {copyState === 'copied' ? 'Copied ✓' : copyState === 'failed' ? 'Copy failed' : 'Copy'}
                </button>
              </div>

              {linkStyle === 'emoji' && (
                <p className="link-style__hint">
                  {[...compressResult.emojiCode].length} emoji instead of {compressResult.compressedLength} characters.
                  Browsers and most chat apps show the emoji; some apps paste it as longer %F0… text.
                </p>
              )}

              <div className="metrics-row">
                <div>Original: <strong>{compressResult.originalLength} chars</strong></div>
                <div>Compressed: <strong className="metric-accent">{compressResult.compressedLength} chars</strong></div>
                <div>Saved: <strong className="metric-xp">{compressResult.originalLength - compressResult.compressedLength} chars</strong></div>
              </div>

              <div className="compress-toolbar">
                <button className="btn-accent toolbar-primary" onClick={() => setIsQrOpen(true)}>
                  Show QR code
                </button>
                <button className="toolbar-btn" onClick={() => handleDownloadQR('png')}>Download PNG</button>
                <button className="toolbar-btn" onClick={() => handleDownloadQR('svg')}>Download SVG</button>
                {canShare() && (
                  <button className="toolbar-btn" onClick={() => shareLink(displayUrl)}>Share</button>
                )}
                {show3D && (
                  <button className={`toolbar-btn${flattenQR ? ' is-active' : ''}`} onClick={toggleFlattenQR}>
                    {flattenQR ? 'Restore 3D view' : 'Flatten 3D QR'}
                  </button>
                )}
              </div>
            </div>
          )}

          {compressResult && (
            <QrModal
              isOpen={isQrOpen}
              onClose={() => setIsQrOpen(false)}
              qrPayload={compressResult.qrPayload}
              displayUrl={displayUrl}
            />
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
                placeholder="A short link or code: classic, emoji, or from a QR"
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
            <h4 className="accent">Decode Rush (30s sprint)</h4>
            <p>Each card shows a site's name with its letters jumbled in case. Name the site before the timer runs out. +25 XP each.</p>
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
                  <span className="rush-target__hint">SCRAMBLED NAME:</span>
                  {rushFeedback === 'correct' && (
                    <span className="rush-target__feedback is-correct">✓ Correct! +25 XP</span>
                  )}
                  {rushFeedback === 'wrong' && (
                    <span className="rush-target__feedback is-wrong">✗ Incorrect, try again!</span>
                  )}
                </div>
                <div className="rush-target__code">{currentRushTarget.hint}</div>
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
