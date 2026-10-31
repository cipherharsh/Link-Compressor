/*
 * PURPOSE: Interactive compression playground and gamified dev arena with round-trip decoding and mini-games.
 * INPUTS: User input URLs/codes, adapter compress/decompress responses, mini-game timer ticks.
 * OUTPUTS: Short URL generation, 1.8s collapse trigger, XP awards, and QR downloads.
 * DEPENDS_ON: React, adapter.ts, gameStore.ts, sceneStore.ts, timeline.ts, qrcode.js, tokens.css.
 * WHY_THIS_DESIGN: Unifies production URL compression with gamified mini-games in a cohesive tabbed panel.
 */

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
  { code: 'https://lz.io/iMDb-mv', domain: 'imdb.com', aliases: ['imdb'] }
];

export function shuffleTargets(list: RushTarget[]): RushTarget[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const Playground: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'compress' | 'decode' | 'daily' | 'rush'>('compress');

  // Compress state
  const [inputUrl, setInputUrl] = useState('https://github.com/cipherharsh/Link-Compressor');
  const [compressResult, setCompressResult] = useState<CompressResponse | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressError, setCompressError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Decode state
  const [inputCode, setInputCode] = useState('');
  const [decodeResult, setDecodeResult] = useState<string | null>(null);
  const [decodeError, setDecodeError] = useState<string | null>(null);

  // Daily Squeeze state
  const [dailyUrl, setDailyUrl] = useState('');
  const [dailyResult, setDailyResult] = useState<{ originalLen: number; compressedLen: number; ratio: number } | null>(null);

  // Decode Rush state
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

  // Initialize Daily Squeeze URL based on calendar date
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const initialDaily = `https://www.youtube.com/watch?v=dQw4w9WgXcQ&utm_source=twitter&utm_medium=social&utm_campaign=daily_${today.replace(/-/g, '')}&ref=linkzip`;
    setDailyUrl(initialDaily);
  }, []);

  // Handle Compression Action
  const handleCompress = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputUrl.trim()) return;

    setIsCompressing(true);
    setCompressError(null);

    try {
      const res = await api.compress(inputUrl.trim());
      setCompressResult(res);

      // Trigger 1.8s 3D collapse animation
      playCollapseAnimation({
        url: inputUrl.trim(),
        stages: res.stages,
        qrPayload: res.qrPayload
      });

      // Award XP & track achievements
      const hasDictHit = res.stages.some(
        (st) => st.label.toLowerCase().includes('dict') || st.label.toLowerCase().includes('huffman')
      );
      recordCompression({
        originalLength: res.originalLength,
        compressedLength: res.compressedLength,
        hasDictionaryHit: hasDictHit
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Compression failed. Please verify the URL.';
      setCompressError(msg);
    } finally {
      setIsCompressing(false);
    }
  };

  // Handle Decode Action
  const handleDecode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputCode.trim()) return;

    setDecodeError(null);
    try {
      const res = await api.decompress(inputCode.trim());
      setDecodeResult(res.url);
      recordDecode();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Decoding failed. Code is invalid or malformed.';
      setDecodeError(msg);
    }
  };

  // Clipboard copy
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Download QR Code
  const handleDownloadQR = (type: 'png' | 'svg') => {
    if (!compressResult) return;
    const qr = generateQR(compressResult.qrPayload, 'M');
    if (type === 'png') {
      const canvas = document.createElement('canvas');
      renderToCanvas(qr.matrix, canvas, { scale: 8, margin: 4 });
      downloadPNG(canvas, 'linkzip-qr.png');
    } else {
      const svg = renderToSVG(qr.matrix, { scale: 8, margin: 4 });
      downloadSVG(svg, 'linkzip-qr.svg');
    }
  };

  // Decode Rush Game Controller
  const startRush = () => {
    const shuffled = shuffleTargets(RUSH_TARGETS);
    setRushDeck(shuffled);
    setRushTargetIndex(0);
    setRushActive(true);
    setRushGameOver(false);
    setRushTimeLeft(30);
    setRushScore(0);
    setRushSolvedCount(0);
    setRushInput('');
    setRushFeedback(null);
  };

  // Decode Rush Timer
  useEffect(() => {
    if (!rushActive) return;
    if (rushTimeLeft <= 0) {
      setRushActive(false);
      setRushGameOver(true);
      return;
    }
    const timer = setInterval(() => {
      setRushTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [rushActive, rushTimeLeft]);

  // Answer matching helper
  const checkRushMatch = (input: string, target: RushTarget): boolean => {
    const clean = input.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '');
    if (!clean) return false;

    // Direct domain match
    if (clean === target.domain.toLowerCase()) return true;

    // Base name match (e.g. "github" for "github.com")
    const baseName = target.domain.toLowerCase().replace(/\..*/, '');
    if (clean === baseName) return true;

    // Alias match (e.g. "gh", "yt", "x", "fb", "chatgpt")
    if (target.aliases.some((alias) => clean === alias.toLowerCase())) return true;

    // Substring match for base names of 3+ letters
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
    <div
      style={{
        width: '100%',
        maxWidth: '720px',
        background: 'var(--color-surface-glass)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)',
        padding: 'clamp(16px, 4vw, 32px)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        textAlign: 'left'
      }}
    >
      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: '16px',
          marginBottom: '24px',
          overflowX: 'auto'
        }}
        role="tablist"
      >
        {[
          { id: 'compress', label: '⚡ Compress' },
          { id: 'decode', label: '🔄 Round Trip Decode' },
          { id: 'daily', label: '🎯 Daily Squeeze' },
          { id: 'rush', label: '⏱️ Decode Rush' }
        ].map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-pill)',
              background: activeTab === tab.id ? 'var(--color-accent)' : 'rgba(255, 255, 255, 0.04)',
              color: activeTab === tab.id ? 'var(--color-bg)' : 'var(--color-muted)',
              border: 'none',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ TAB 1: COMPRESS ═══ */}
      {activeTab === 'compress' && (
        <div>
          <form onSubmit={handleCompress} style={{ marginBottom: '24px' }}>
            <label
              htmlFor="url-compress-input"
              style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-muted)',
                marginBottom: '8px',
                textTransform: 'uppercase'
              }}
            >
              Paste Any Web URL
            </label>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <input
                id="url-compress-input"
                type="url"
                required
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://example.com/very/long/path?with=parameters"
                style={{
                  flex: '1 1 300px',
                  padding: '14px 18px',
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-text)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-small)'
                }}
              />
              <button
                type="submit"
                disabled={isCompressing}
                style={{
                  padding: '14px 28px',
                  background: 'var(--color-accent)',
                  color: 'var(--color-bg)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontSize: 'var(--text-small)',
                  cursor: isCompressing ? 'wait' : 'pointer',
                  boxShadow: '0 0 20px rgba(108, 242, 194, 0.3)'
                }}
              >
                {isCompressing ? 'Compressing...' : 'Compress URL'}
              </button>
            </div>
          </form>

          {/* Quick Preset Samples */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>TRY SAMPLES:</span>
            {[
              { label: 'GitHub Repo', url: 'https://github.com/cipherharsh/Link-Compressor' },
              { label: 'YouTube Video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
              { label: 'Wikipedia Deep Link', url: 'https://en.wikipedia.org/wiki/Huffman_coding#History' }
            ].map((s) => (
              <button
                key={s.label}
                onClick={() => setInputUrl(s.url)}
                style={{
                  padding: '4px 10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-pill)',
                  color: 'var(--color-muted)',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer'
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Error Message */}
          {compressError && (
            <div
              style={{
                background: 'rgba(255, 107, 129, 0.15)',
                border: '1px solid var(--color-danger)',
                color: 'var(--color-danger)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '24px',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-small)'
              }}
            >
              ⚠️ {compressError}
            </div>
          )}

          {/* Compress Result Card */}
          {compressResult && (
            <div
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-card)',
                padding: '24px',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>
                  COMPRESSED SHORT LINK
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-accent)',
                    background: 'rgba(108, 242, 194, 0.15)',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-pill)'
                  }}
                >
                  {Math.round((1 - compressResult.compressedLength / compressResult.originalLength) * 100)}% SMALLER
                </span>
              </div>

              {/* Link String + Copy Button */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--color-bg)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  marginBottom: '16px'
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-small)',
                    color: 'var(--color-accent)',
                    wordBreak: 'break-all'
                  }}
                >
                  {compressResult.shortUrl}
                </span>
                <button
                  onClick={() => handleCopy(compressResult.shortUrl)}
                  style={{
                    padding: '6px 14px',
                    background: copiedLink ? 'var(--color-accent)' : 'rgba(255, 255, 255, 0.08)',
                    color: copiedLink ? 'var(--color-bg)' : 'var(--color-text)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginLeft: '12px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {copiedLink ? 'Copied ✓' : 'Copy'}
                </button>
              </div>

              {/* Reduction Metrics */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '12px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-muted)',
                  marginBottom: '20px'
                }}
              >
                <div>Original: <strong style={{ color: 'var(--color-text)' }}>{compressResult.originalLength} chars</strong></div>
                <div>Compressed: <strong style={{ color: 'var(--color-accent)' }}>{compressResult.compressedLength} chars</strong></div>
                <div>Saved: <strong style={{ color: 'var(--color-xp)' }}>{compressResult.originalLength - compressResult.compressedLength} bytes</strong></div>
              </div>

              {/* Action Toolbar: Flatten Mode & QR Downloads */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                <button
                  onClick={toggleFlattenQR}
                  style={{
                    padding: '8px 14px',
                    background: flattenQR ? 'var(--color-accent)' : 'rgba(255, 255, 255, 0.06)',
                    color: flattenQR ? 'var(--color-bg)' : 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-pill)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  📷 {flattenQR ? 'Restore 3D Angle' : 'Flatten for Camera Scan'}
                </button>
                <button
                  onClick={() => handleDownloadQR('png')}
                  style={{
                    padding: '8px 14px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-pill)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  💾 Download PNG
                </button>
                <button
                  onClick={() => handleDownloadQR('svg')}
                  style={{
                    padding: '8px 14px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-pill)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  📐 Download SVG
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB 2: ROUND TRIP DECODE ═══ */}
      {activeTab === 'decode' && (
        <div>
          <form onSubmit={handleDecode} style={{ marginBottom: '24px' }}>
            <label
              htmlFor="code-decode-input"
              style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-muted)',
                marginBottom: '8px'
              }}
            >
              PASTE COMPRESSED CODE OR SHORT LINK
            </label>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <input
                id="code-decode-input"
                type="text"
                required
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="e.g. 8z$h7B-01 or full URL https://lz.io/8z$h7B-01"
                style={{
                  flex: '1 1 300px',
                  padding: '14px 18px',
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-text)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-small)'
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '14px 28px',
                  background: 'var(--color-accent-2)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Decode Link
              </button>
            </div>
          </form>

          {decodeError && (
            <div style={{ color: 'var(--color-danger)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-small)', marginBottom: '16px' }}>
              ⚠️ {decodeError}
            </div>
          )}

          {decodeResult && (
            <div style={{ background: 'var(--color-surface)', padding: '20px', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-muted)', marginBottom: '8px' }}>
                DECODED ORIGINAL URL
              </div>
              <a
                href={decodeResult}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-small)',
                  color: 'var(--color-accent)',
                  wordBreak: 'break-all',
                  display: 'block',
                  marginBottom: '12px'
                }}
              >
                {decodeResult} ↗
              </a>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-xp)' }}>
                ✓ Lossless Round-Trip Verified! Achievement awarded.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB 3: DAILY SQUEEZE MINI-GAME ═══ */}
      {activeTab === 'daily' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--color-xp)', marginBottom: '6px' }}>
              Daily Squeeze Challenge
            </h4>
            <p style={{ color: 'var(--color-muted)', fontSize: 'var(--text-small)', lineHeight: 1.5 }}>
              Strip tracking parameters, query bloat, or redundant tokens from today’s seeded target URL. Reach the lowest compressed length to maximize your ratio score.
            </p>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <textarea
              rows={3}
              value={dailyUrl}
              onChange={(e) => setDailyUrl(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-text)',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px'
              }}
            />
          </div>

          <button
            onClick={() => {
              try {
                const res = api.compress(dailyUrl);
                res.then((c) => {
                  setDailyResult({
                    originalLen: c.originalLength,
                    compressedLen: c.compressedLength,
                    ratio: 1 - c.compressedLength / c.originalLength
                  });
                });
              } catch {
                // ignore
              }
            }}
            style={{
              padding: '10px 20px',
              background: 'var(--color-xp)',
              color: 'var(--color-bg)',
              border: 'none',
              borderRadius: 'var(--radius-pill)',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              cursor: 'pointer',
              marginBottom: '16px'
            }}
          >
            Evaluate Squeeze Ratio
          </button>

          {dailyResult && (
            <div style={{ background: 'var(--color-surface)', padding: '16px', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-small)' }}>
              <div>Original: {dailyResult.originalLen} chars</div>
              <div>Final Compressed: <strong style={{ color: 'var(--color-accent)' }}>{dailyResult.compressedLen} chars</strong></div>
              <div>Score (Efficiency): <strong style={{ color: 'var(--color-xp)' }}>{(dailyResult.ratio * 100).toFixed(1)}%</strong></div>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB 4: DECODE RUSH MINI-GAME ═══ */}
      {activeTab === 'rush' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--color-accent)', marginBottom: '6px' }}>
              Decode Rush (30s Sprint)
            </h4>
            <p style={{ color: 'var(--color-muted)', fontSize: 'var(--text-small)' }}>
              Identify the original domain for each compressed code before the timer expires. +25 XP per correct domain!
            </p>
          </div>

          {/* Game Over Screen */}
          {rushGameOver && !rushActive && (
            <div
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-accent)',
                borderRadius: 'var(--radius-card)',
                padding: '24px',
                textAlign: 'center',
                marginBottom: '20px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
              }}
            >
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--color-accent)', marginBottom: '8px' }}>
                Time's Up! Rush Complete
              </h3>
              <p style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-small)', marginBottom: '20px' }}>
                You identified <strong style={{ color: 'var(--color-text)' }}>{rushSolvedCount} domains</strong> and scored <strong style={{ color: 'var(--color-xp)' }}>+{rushScore} XP</strong>!
              </p>
              <button
                onClick={startRush}
                style={{
                  padding: '12px 28px',
                  background: 'var(--color-accent)',
                  color: 'var(--color-bg)',
                  border: 'none',
                  borderRadius: 'var(--radius-pill)',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Play Again
              </button>
            </div>
          )}

          {/* Initial Start Button */}
          {!rushActive && !rushGameOver && (
            <button
              onClick={startRush}
              style={{
                padding: '12px 24px',
                background: 'var(--color-accent)',
                color: 'var(--color-bg)',
                border: 'none',
                borderRadius: 'var(--radius-pill)',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Start 30s Rush ⏱️
            </button>
          )}

          {/* Active Game Sprint View */}
          {rushActive && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--font-mono)', fontSize: '12px', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <span
                  style={{
                    color: rushTimeLeft < 10 ? 'var(--color-danger)' : 'var(--color-xp)',
                    fontWeight: 700,
                    fontSize: 'var(--text-small)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  ⏱️ Time Left: {rushTimeLeft}s
                </span>
                <span style={{ color: 'var(--color-accent)', fontWeight: 600, fontSize: 'var(--text-small)' }}>
                  Score: +{rushScore} XP ({rushSolvedCount} solved)
                </span>
                <span style={{ color: 'var(--color-muted)', fontSize: 'var(--text-xs)' }}>
                  Target #{rushTargetIndex + 1}
                </span>
              </div>

              {/* Target Code Card */}
              <div
                style={{
                  background: 'var(--color-bg)',
                  padding: '18px 20px',
                  borderRadius: 'var(--radius-sm)',
                  border: rushFeedback === 'correct'
                    ? '1px solid var(--color-accent)'
                    : rushFeedback === 'wrong'
                    ? '1px solid var(--color-danger)'
                    : '1px solid var(--color-border)',
                  marginBottom: '16px',
                  fontFamily: 'var(--font-mono)',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                  boxShadow: rushFeedback === 'correct'
                    ? '0 0 16px rgba(108, 242, 194, 0.3)'
                    : rushFeedback === 'wrong'
                    ? '0 0 16px rgba(255, 107, 129, 0.3)'
                    : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--color-muted)', fontSize: '11px' }}>TARGET CODE:</span>
                  {rushFeedback === 'correct' && (
                    <span style={{ color: 'var(--color-accent)', fontSize: '12px', fontWeight: 700 }}>
                      ✓ Correct! +25 XP
                    </span>
                  )}
                  {rushFeedback === 'wrong' && (
                    <span style={{ color: 'var(--color-danger)', fontSize: '12px', fontWeight: 700 }}>
                      ✗ Incorrect, try again!
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '1.25rem', color: 'var(--color-text)', wordBreak: 'break-all', fontWeight: 600 }}>
                  {currentRushTarget.code}
                </div>
              </div>

              {/* Guess Input Form */}
              <form onSubmit={handleRushAnswer} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  autoFocus
                  required
                  value={rushInput}
                  onChange={(e) => setRushInput(e.target.value)}
                  placeholder="Type domain (e.g. google, youtube, github, reddit)"
                  style={{
                    flex: '1 1 240px',
                    padding: '12px 16px',
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--color-text)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-small)'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '12px 22px',
                    background: 'var(--color-accent)',
                    color: 'var(--color-bg)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Submit
                </button>
                <button
                  type="button"
                  onClick={handleRushSkip}
                  title="Skip to next domain"
                  style={{
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: 'var(--color-muted)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
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
