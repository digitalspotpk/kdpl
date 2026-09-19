// ═══════════════════════════════════════════════════════════════
// KDPL TOURNAMENT PROMO POSTER — Ultra-advanced advertising poster
// for the whole tournament, generated on demand (never saved on the
// host). Ends with KDPL app branding + creator's WhatsApp number.
// ═══════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react';
import { XIcon, DownloadIcon } from '../ui/Icons';
import type { Tournament, Team, Venue } from '../../types';

interface TournamentPosterModalProps {
  tournament: Tournament;
  teams: Team[];
  venues: Venue[];
  supportWhatsapp: string;
  onClose: () => void;
}

const W = 1080;
const H = 1620;

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  const r = (bigint >> 16) & 255, g = (bigint >> 8) & 255, b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + '…').width > maxWidth) t = t.slice(0, -1);
  return t + '…';
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawStitchBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  ctx.fillStyle = '#39ff88';
  ctx.fillRect(x, y, w, 10);
  ctx.save();
  ctx.strokeStyle = 'rgba(5,10,10,0.55)';
  ctx.lineWidth = 1.5;
  for (let i = x + 8; i < x + w; i += 16) {
    ctx.beginPath();
    ctx.moveTo(i, y + 2);
    ctx.lineTo(i + 6, y + 8);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPromoPoster(canvas: HTMLCanvasElement, tournament: Tournament, teams: Team[], venues: Venue[], supportWhatsapp: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.width = W; canvas.height = H;

  // ── Background ────────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#050b12');
  bg.addColorStop(0.4, '#08170f');
  bg.addColorStop(1, '#03060a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W / 2, 260, 40, W / 2, 260, 700);
  glow.addColorStop(0, 'rgba(57,255,136,0.24)');
  glow.addColorStop(1, 'rgba(57,255,136,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // stadium floodlight beams
  ctx.save();
  ctx.globalAlpha = 0.09;
  [-1, 1].forEach(side => {
    const ox = side === -1 ? -40 : W + 40;
    const beam = ctx.createLinearGradient(ox, -40, W / 2, 460);
    beam.addColorStop(0, 'rgba(255,255,255,0.9)');
    beam.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(ox, -40);
    ctx.lineTo(ox + side * -260, -40);
    ctx.lineTo(W / 2, 440);
    ctx.closePath();
    ctx.fill();
  });
  ctx.restore();

  // diagonal accents
  ctx.save();
  ctx.globalAlpha = 0.045;
  ctx.strokeStyle = '#39ff88';
  ctx.lineWidth = 46;
  for (let i = -2; i < 10; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 220 - 200, 0);
    ctx.lineTo(i * 220 - 200 + H, H);
    ctx.stroke();
  }
  ctx.restore();

  // faint watermark
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.font = '400 380px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🏆', W / 2, 520);
  ctx.restore();

  drawStitchBar(ctx, 0, 0, W);
  drawStitchBar(ctx, 0, H - 10, W);

  // ── Header ───────────────────────────────────────────────────
  ctx.textAlign = 'center';
  ctx.font = '600 24px Inter, sans-serif';
  ctx.fillStyle = 'rgba(57,255,136,0.9)';
  ctx.fillText('OFFICIAL TOURNAMENT', W / 2, 80);

  ctx.font = '800 62px Oswald, sans-serif';
  ctx.fillStyle = '#ffffff';
  const nameLines = wrapLines(ctx, tournament.name.toUpperCase(), W - 160);
  let y = 155;
  nameLines.forEach(line => { ctx.fillText(line, W / 2, y); y += 68; });

  ctx.font = '500 26px Inter, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  const dateRange = `${fmtDate(tournament.startDate)} — ${fmtDate(tournament.endDate)}`;
  ctx.fillText(dateRange, W / 2, y + 20);

  // format + overs + prize pill row
  const pillsY = y + 60;
  const pills = [
    tournament.format,
    `${tournament.overs} Overs`,
    tournament.prizePool ? `🏆 ${tournament.prizePool}` : '',
  ].filter(Boolean);
  let pillX = W / 2 - (pills.length * 130);
  pills.forEach(text => {
    ctx.font = '600 22px Inter, sans-serif';
    const width = ctx.measureText(text).width + 44;
    ctx.fillStyle = 'rgba(57,255,136,0.12)';
    roundRect(ctx, pillX, pillsY, width, 46, 23);
    ctx.fill();
    ctx.strokeStyle = 'rgba(57,255,136,0.4)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, pillX, pillsY, width, 46, 23);
    ctx.stroke();
    ctx.fillStyle = '#39ff88';
    ctx.fillText(text, pillX + width / 2, pillsY + 30);
    pillX += width + 16;
  });

  // ── Venue ────────────────────────────────────────────────────
  const venueY = pillsY + 90;
  ctx.font = '500 26px Inter, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  const venueText = venues[0] ? `📍 ${venues[0].name}, ${venues[0].city}` : tournament.venue ? `📍 ${tournament.venue}` : '';
  if (venueText) ctx.fillText(truncate(ctx, venueText, W - 160), W / 2, venueY);

  // ── Teams grid ───────────────────────────────────────────────
  const gridTop = venueY + 60;
  ctx.font = '700 28px Oswald, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('P A R T I C I P A T I N G   T E A M S', W / 2, gridTop);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath(); ctx.moveTo(120, gridTop + 22); ctx.lineTo(W - 120, gridTop + 22); ctx.stroke();

  const cols = 4;
  const cellW = (W - 160) / cols;
  const cellH = 130;
  const gridStartY = gridTop + 60;
  const shown = teams.slice(0, 16);
  shown.forEach((team, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = 80 + col * cellW + cellW / 2;
    const cy = gridStartY + row * cellH;
    const r = 42;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    grad.addColorStop(0, hexToRgba(team.color, 0.9));
    grad.addColorStop(1, hexToRgba(team.color, 0.4));
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = team.color;
    ctx.stroke();
    ctx.restore();

    ctx.font = /^[A-Za-z0-9]{1,3}$/.test(team.logo) ? '700 30px Oswald, sans-serif' : '400 38px sans-serif';
    ctx.fillStyle = '#0b0f0c';
    ctx.textAlign = 'center';
    ctx.fillText(team.logo, cx, cy + 12);

    ctx.font = '600 20px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText(truncate(ctx, team.shortName || team.name, cellW - 16), cx, cy + r + 28);
  });
  if (teams.length > 16) {
    ctx.font = '500 20px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText(`+ ${teams.length - 16} more teams`, W / 2, gridStartY + Math.ceil(shown.length / cols) * cellH + 10);
  }

  // ── Organizer & Committee ─────────────────────────────────────
  let sectionY = gridStartY + Math.max(1, Math.ceil(shown.length / cols)) * cellH + (teams.length > 16 ? 40 : 10);
  if (tournament.officials && tournament.officials.length > 0) {
    ctx.font = '700 26px Oswald, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText('ORGANIZED BY', W / 2, sectionY);
    sectionY += 40;
    ctx.font = '500 24px Inter, sans-serif';
    tournament.officials.slice(0, 4).forEach(o => {
      ctx.fillStyle = '#39ff88';
      const line = `${o.name} — ${o.role}${o.whatsapp ? `  (📱 ${o.whatsapp})` : ''}`;
      ctx.fillText(truncate(ctx, line, W - 160), W / 2, sectionY);
      sectionY += 36;
    });
    sectionY += 14;
  }

  // ── Custom Rules highlight ─────────────────────────────────────
  if (tournament.customRules && tournament.customRules.length > 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    const boxH = 30 + Math.min(tournament.customRules.length, 3) * 32;
    roundRect(ctx, 120, sectionY, W - 240, boxH, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(57,255,136,0.25)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, 120, sectionY, W - 240, boxH, 18);
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.font = '600 22px Inter, sans-serif';
    ctx.fillStyle = '#39ff88';
    let ry = sectionY + 34;
    tournament.customRules.slice(0, 3).forEach((rule, i) => {
      ctx.fillText(`${i + 1}. ${truncate(ctx, rule, W - 300)}`, 150, ry);
      ry += 32;
    });
    ctx.textAlign = 'center';
    sectionY += boxH + 30;
  }

  // ── Sponsors (aggregated across teams) ─────────────────────────
  const sponsors = Array.from(new Set(teams.flatMap(t => t.sponsors || [])));
  if (sponsors.length > 0) {
    ctx.font = '600 22px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText(`🤝 Sponsors: ${truncate(ctx, sponsors.join(' · '), W - 200)}`, W / 2, sectionY);
    sectionY += 40;
  }

  // ── Grass strip ─────────────────────────────────────────────────
  const grassY = H - 150;
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#0f5132';
  ctx.fillRect(0, grassY, W, 26);
  ctx.strokeStyle = 'rgba(57,255,136,0.4)';
  ctx.lineWidth = 2;
  for (let x = 20; x < W; x += 26) {
    ctx.beginPath();
    ctx.moveTo(x, grassY + 26);
    ctx.lineTo(x + 6, grassY + 6);
    ctx.stroke();
  }
  ctx.restore();

  // ── Footer — KDPL app branding ──────────────────────────────────
  ctx.font = '700 28px Oswald, sans-serif';
  ctx.fillStyle = '#39ff88';
  ctx.fillText('🏏 KD PREMIER LEAGUE — CRICKET TOURNAMENT MANAGER', W / 2, H - 92);
  ctx.font = '500 20px Inter, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillText('Live scores · Fixtures · Standings — all in one app', W / 2, H - 62);
  if (supportWhatsapp) {
    ctx.font = '600 22px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText(`📱 Get your own tournament app — WhatsApp +${supportWhatsapp}`, W / 2, H - 30);
  }
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 2);
}

function fmtDate(d: string): string {
  if (!d) return 'TBA';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function TournamentPosterModal({ tournament, teams, venues, supportWhatsapp, onClose }: TournamentPosterModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setReady(false);
    const raf = requestAnimationFrame(() => {
      if (canvasRef.current) {
        drawPromoPoster(canvasRef.current, tournament, teams, venues, supportWhatsapp);
        setReady(true);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [tournament, teams, venues, supportWhatsapp]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || downloading) return;
    setDownloading(true);
    requestAnimationFrame(() => {
      canvas.toBlob(blob => {
        setDownloading(false);
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${tournament.shortName || tournament.name}-poster.png`;
        link.href = url;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
      }, 'image/png');
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/85 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 h-14 flex-shrink-0">
        <span className="text-kdpl-text font-oswald font-bold">Tournament Poster</span>
        <button onClick={onClose} className="w-9 h-9 rounded-lg bg-kdpl-card border border-kdpl-border flex items-center justify-center text-kdpl-text">
          <XIcon size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-auto flex items-start justify-center p-4 relative">
        <canvas ref={canvasRef} className={`w-full max-w-sm rounded-2xl shadow-2xl transition-opacity ${ready ? 'opacity-100' : 'opacity-0'}`} />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-kdpl-muted text-sm">Generating poster...</span>
          </div>
        )}
      </div>
      <div className="p-4 flex-shrink-0">
        <button onClick={handleDownload} disabled={!ready || downloading}
          className="w-full py-3.5 rounded-2xl bg-kdpl-neon text-kdpl-darker font-oswald font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50">
          <DownloadIcon size={18} /> {downloading ? 'Preparing...' : 'Download Poster'}
        </button>
      </div>
    </div>
  );
}
