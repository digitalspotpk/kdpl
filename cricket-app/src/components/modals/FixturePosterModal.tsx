// ═══════════════════════════════════════════════════════════════
// KDPL FIXTURE POSTER — Professional match poster with squads,
// rendered on a <canvas> and downloadable as PNG.
// ═══════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react';
import { XIcon, DownloadIcon } from '../ui/Icons';
import type { Fixture, Team, Venue, Player, Tournament } from '../../types';

interface FixturePosterModalProps {
  fixture: Fixture;
  teamA: Team | undefined;
  teamB: Team | undefined;
  venue: Venue | undefined;
  tournament: Tournament | null;
  playersA: Player[];
  playersB: Player[];
  onClose: () => void;
}

const W = 1080;
const H = 1350;

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  const r = (bigint >> 16) & 255, g = (bigint >> 8) & 255, b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function drawPoster(
  canvas: HTMLCanvasElement,
  fixture: Fixture, teamA: Team | undefined, teamB: Team | undefined,
  venue: Venue | undefined, tournament: Tournament | null,
  playersA: Player[], playersB: Player[]
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.width = W; canvas.height = H;

  const colorA = teamA?.color || '#39ff88';
  const colorB = teamB?.color || '#3b82f6';

  // ── Background: rich stadium-night gradient ──────────────────
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#050b12');
  bg.addColorStop(0.45, '#08170f');
  bg.addColorStop(1, '#050a08');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // radial glow behind center
  const glow = ctx.createRadialGradient(W / 2, 420, 40, W / 2, 420, 620);
  glow.addColorStop(0, 'rgba(57,255,136,0.22)');
  glow.addColorStop(1, 'rgba(57,255,136,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // stadium floodlight beams from top corners
  ctx.save();
  ctx.globalAlpha = 0.10;
  [-1, 1].forEach(side => {
    const ox = side === -1 ? -40 : W + 40;
    const beam = ctx.createLinearGradient(ox, -40, W / 2, 500);
    beam.addColorStop(0, 'rgba(255,255,255,0.9)');
    beam.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(ox, -40);
    ctx.lineTo(ox + side * -260, -40);
    ctx.lineTo(W / 2, 480);
    ctx.closePath();
    ctx.fill();
  });
  ctx.restore();

  // diagonal accent stripes
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.strokeStyle = '#39ff88';
  ctx.lineWidth = 40;
  for (let i = -2; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 220 - 200, 0);
    ctx.lineTo(i * 220 - 200 + H, H);
    ctx.stroke();
  }
  ctx.restore();

  // faint bat+ball watermark behind VS
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.font = '400 340px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🏏', W / 2, 420);
  ctx.restore();

  // top + bottom color bars (team colors) with a stitch dash pattern
  drawStitchBar(ctx, 0, 0, W / 2, colorA);
  drawStitchBar(ctx, W / 2, 0, W / 2, colorB);
  drawStitchBar(ctx, 0, H - 10, W / 2, colorB);
  drawStitchBar(ctx, W / 2, H - 10, W / 2, colorA);

  // ── Header: tournament name + match number ─────────────────
  ctx.textAlign = 'center';
  ctx.fillStyle = '#39ff88';
  ctx.font = '600 28px Oswald, sans-serif';
  ctx.fillText((tournament?.name || 'KD PREMIER LEAGUE').toUpperCase(), W / 2, 90);

  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '500 22px Inter, sans-serif';
  const stageLabel = fixture.stage && fixture.stage !== 'group' ? fixture.stage.toUpperCase() : `ROUND ${fixture.round}`;
  ctx.fillText(`MATCH #${fixture.matchNumber}  •  ${stageLabel}`, W / 2, 130);

  // divider
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(140, 160); ctx.lineTo(W - 140, 160); ctx.stroke();

  // ── Team badges (cricket-ball stitched ring) + VS ────────────
  const badgeY = 320;
  const badgeR = 112;

  drawTeamBadge(ctx, 280, badgeY, badgeR, colorA, teamA?.logo || teamA?.shortName?.slice(0, 2) || '?');
  drawTeamBadge(ctx, W - 280, badgeY, badgeR, colorB, teamB?.logo || teamB?.shortName?.slice(0, 2) || '?');

  // VS medallion
  ctx.save();
  ctx.beginPath();
  ctx.arc(W / 2, badgeY, 56, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(5,10,10,0.75)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.stroke();
  ctx.restore();
  ctx.font = '800 46px Oswald, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText('VS', W / 2, badgeY + 16);

  // Team names below badges
  ctx.font = '700 38px Oswald, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(truncate(ctx, teamA?.name || 'Team A', 320), 280, badgeY + badgeR + 58);
  ctx.fillText(truncate(ctx, teamB?.name || 'Team B', 320), W - 280, badgeY + badgeR + 58);
  ctx.font = '500 22px Inter, sans-serif';
  ctx.fillStyle = hexToRgba(colorA, 0.9);
  ctx.fillText(teamA?.city || '', 280, badgeY + badgeR + 88);
  ctx.fillStyle = hexToRgba(colorB, 0.9);
  ctx.fillText(teamB?.city || '', W - 280, badgeY + badgeR + 88);

  // ── Match info pill ──────────────────────────────────────────
  const pillY = 560;
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  roundRect(ctx, 140, pillY, W - 280, 90, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(57,255,136,0.35)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, 140, pillY, W - 280, 90, 20);
  ctx.stroke();

  ctx.font = '600 30px Inter, sans-serif';
  ctx.fillStyle = '#39ff88';
  const dateStr = new Date(fixture.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  ctx.fillText(`📅 ${dateStr}   •   🕐 ${fixture.time}   •   ${fixture.overs} Overs`, W / 2, pillY + 40);
  ctx.font = '500 24px Inter, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText(`📍 ${venue?.name || 'Venue TBA'}${venue?.city ? ', ' + venue.city : ''}`, W / 2, pillY + 72);

  if (fixture.umpires && fixture.umpires.length > 0) {
    ctx.font = '500 20px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    const umpireStr = fixture.umpires.map(u => `${u.name}${u.city ? ` (${u.city})` : ''}`).join('  •  ');
    ctx.fillText(`🧑‍⚖️ ${truncate(ctx, umpireStr, W - 300)}`, W / 2, pillY + 118);
  }

  // ── Squads header ─────────────────────────────────────────────
  const squadTop = 700;
  ctx.textAlign = 'center';
  ctx.font = '700 26px Oswald, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('S Q U A D S', W / 2, squadTop);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath(); ctx.moveTo(140, squadTop + 20); ctx.lineTo(W - 140, squadTop + 20); ctx.stroke();

  // Column headers
  ctx.textAlign = 'left';
  ctx.font = '700 26px Oswald, sans-serif';
  ctx.fillStyle = colorA;
  ctx.fillText(`${teamA?.logo || ''} ${teamA?.shortName || 'TEAM A'}`, 100, squadTop + 65);
  ctx.textAlign = 'right';
  ctx.fillStyle = colorB;
  ctx.fillText(`${teamB?.shortName || 'TEAM B'} ${teamB?.logo || ''}`, W - 100, squadTop + 65);

  // Player lists
  const roleIcon = (r: string) => r === 'Batsman' ? '🏏' : r === 'Bowler' ? '🎳' : r === 'Wicket-Keeper' ? '🧤' : r === 'All-Rounder' ? '🌟' : '👤';
  const maxPlayers = 12;
  const rowH = 40;
  const rowY = squadTop + 105;

  ctx.font = '500 24px Inter, sans-serif';
  playersA.slice(0, maxPlayers).forEach((p, i) => {
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText(`${roleIcon(p.role)}  ${truncate(ctx, p.name, 300)}`, 100, rowY + i * rowH);
  });
  playersB.slice(0, maxPlayers).forEach((p, i) => {
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText(`${truncate(ctx, p.name, 300)}  ${roleIcon(p.role)}`, W - 100, rowY + i * rowH);
  });

  // vertical divider between squads
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath(); ctx.moveTo(W / 2, squadTop + 40); ctx.lineTo(W / 2, squadTop + 40 + maxPlayers * rowH + 10); ctx.stroke();

  // ── Grass texture strip ───────────────────────────────────────
  const grassY = H - 118;
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#0f5132';
  ctx.fillRect(0, grassY, W, 30);
  ctx.strokeStyle = 'rgba(57,255,136,0.4)';
  ctx.lineWidth = 2;
  for (let x = 20; x < W; x += 26) {
    ctx.beginPath();
    ctx.moveTo(x, grassY + 30);
    ctx.lineTo(x + 6, grassY + 8);
    ctx.stroke();
  }
  ctx.restore();

  // ── Footer ───────────────────────────────────────────────────
  const footerY = H - 60;
  ctx.textAlign = 'center';
  ctx.font = '600 22px Oswald, sans-serif';
  ctx.fillStyle = '#39ff88';
  ctx.fillText('🏏 KDPL — CRICKET TOURNAMENT MANAGER', W / 2, footerY);
  if (tournament?.customRules?.[0]) {
    ctx.font = '400 18px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText(`Rule: ${truncate(ctx, tournament.customRules[0], 800)}`, W / 2, footerY + 28);
  }
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + '…').width > maxWidth) t = t.slice(0, -1);
  return t + '…';
}

function drawTeamBadge(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string, logo: string) {
  // outer stitched ring (cricket-ball inspired)
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r + 14, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // badge circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  grad.addColorStop(0, hexToRgba(color, 0.95));
  grad.addColorStop(1, hexToRgba(color, 0.45));
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.restore();

  // logo / initials
  ctx.font = '400 90px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#0b0f0c';
  // if it's a short alpha string (initials fallback) use bold sans, else emoji font already covers it
  if (/^[A-Za-z0-9]{1,3}$/.test(logo)) {
    ctx.font = '700 68px Oswald, sans-serif';
  }
  ctx.fillText(logo, cx, cy + 30);
}

function drawStitchBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, 10);
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 1.5;
  for (let i = x + 8; i < x + w; i += 16) {
    ctx.beginPath();
    ctx.moveTo(i, y + 2);
    ctx.lineTo(i + 6, y + 8);
    ctx.stroke();
  }
  ctx.restore();
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

export default function FixturePosterModal({ fixture, teamA, teamB, venue, tournament, playersA, playersB, onClose }: FixturePosterModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastKeyRef = useRef<string>('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const key = [
      fixture.id, teamA?.id, teamB?.id, venue?.id, tournament?.id,
      playersA.map(p => p.id).join(','), playersB.map(p => p.id).join(','),
    ].join('|');
    if (key === lastKeyRef.current) return; // data hasn't actually changed — skip redraw
    lastKeyRef.current = key;
    setReady(false);
    // Defer the (heavier) drawing to the next frame so the modal shell
    // and loading state paint first — keeps the UI responsive on slow phones.
    const raf = requestAnimationFrame(() => {
      if (canvasRef.current) {
        drawPoster(canvasRef.current, fixture, teamA, teamB, venue, tournament, playersA, playersB);
        setReady(true);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [fixture, teamA, teamB, venue, tournament, playersA, playersB]);

  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || downloading) return;
    setDownloading(true);
    // Defer to the next frame so the "Preparing..." state actually paints
    // before the heavy encode runs, then use toBlob (async, off the main
    // thread in most browsers) instead of toDataURL (synchronous, and the
    // likely cause of the "app isn't responding" freeze on slower phones).
    requestAnimationFrame(() => {
      canvas.toBlob(blob => {
        setDownloading(false);
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${teamA?.shortName || 'TeamA'}-vs-${teamB?.shortName || 'TeamB'}-poster.png`;
        link.href = url;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
      }, 'image/png');
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/85 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 h-14 flex-shrink-0">
        <span className="text-kdpl-text font-oswald font-bold">Match Poster</span>
        <button onClick={onClose} className="w-9 h-9 rounded-lg bg-kdpl-card border border-kdpl-border flex items-center justify-center text-kdpl-text">
          <XIcon size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-auto flex items-start justify-center p-4">
        <canvas ref={canvasRef} className={`w-full max-w-sm rounded-2xl shadow-2xl transition-opacity ${ready ? 'opacity-100' : 'opacity-0'}`} />
        {!ready && (
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
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
