// ═══════════════════════════════════════════════════════════════
// KDPL MATCH SUMMARY POSTER — final score + result + Man of the Match,
// downloadable as an image.
// ═══════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react';
import { XIcon, DownloadIcon } from '../ui/Icons';
import type { Fixture, Team, Player, Tournament } from '../../types';

interface MatchSummaryPosterModalProps {
  fixture: Fixture;
  teamA: Team | undefined;
  teamB: Team | undefined;
  mom: Player | undefined;
  tournament: Tournament | null;
  onClose: () => void;
}

const W = 1080;
const H = 1080;

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  const r = (bigint >> 16) & 255, g = (bigint >> 8) & 255, b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
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

function drawBadge(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string, logo: string) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  grad.addColorStop(0, hexToRgba(color, 0.95));
  grad.addColorStop(1, hexToRgba(color, 0.45));
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.restore();
  ctx.font = /^[A-Za-z0-9]{1,3}$/.test(logo) ? '700 46px Oswald, sans-serif' : '400 60px sans-serif';
  ctx.fillStyle = '#0b0f0c';
  ctx.textAlign = 'center';
  ctx.fillText(logo, cx, cy + 18);
}

function drawSummary(canvas: HTMLCanvasElement, fixture: Fixture, teamA: Team | undefined, teamB: Team | undefined, mom: Player | undefined, tournament: Tournament | null) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.width = W; canvas.height = H;

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#050b12');
  bg.addColorStop(0.5, '#08170f');
  bg.addColorStop(1, '#03060a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, 620);
  glow.addColorStop(0, 'rgba(57,255,136,0.16)');
  glow.addColorStop(1, 'rgba(57,255,136,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

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

  ctx.fillStyle = '#39ff88'; ctx.fillRect(0, 0, W, 10);
  ctx.fillStyle = '#39ff88'; ctx.fillRect(0, H - 10, W, 10);

  ctx.textAlign = 'center';
  ctx.font = '600 26px Oswald, sans-serif';
  ctx.fillStyle = '#39ff88';
  ctx.fillText((tournament?.name || 'KD PREMIER LEAGUE').toUpperCase(), W / 2, 90);
  ctx.font = '500 20px Inter, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillText(`MATCH #${fixture.matchNumber} · FULL SCORECARD`, W / 2, 124);

  const colorA = teamA?.color || '#39ff88';
  const colorB = teamB?.color || '#3b82f6';
  const badgeY = 250;
  drawBadge(ctx, 300, badgeY, 90, colorA, teamA?.logo || teamA?.shortName?.slice(0, 2) || '?');
  drawBadge(ctx, W - 300, badgeY, 90, colorB, teamB?.logo || teamB?.shortName?.slice(0, 2) || '?');

  ctx.font = '700 34px Oswald, sans-serif';
  ctx.fillStyle = fixture.result?.winnerId === teamA?.id ? '#39ff88' : '#ffffff';
  ctx.fillText(teamA?.name || 'Team A', 300, badgeY + 130);
  ctx.font = '800 50px Oswald, sans-serif';
  ctx.fillText(String(fixture.result?.teamAScore ?? 0), 300, badgeY + 185);
  ctx.font = '500 20px Inter, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText(`(${fixture.result?.teamAOvers ?? '0.0'} ov)`, 300, badgeY + 215);

  ctx.font = '700 34px Oswald, sans-serif';
  ctx.fillStyle = fixture.result?.winnerId === teamB?.id ? '#39ff88' : '#ffffff';
  ctx.fillText(teamB?.name || 'Team B', W - 300, badgeY + 130);
  ctx.font = '800 50px Oswald, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(String(fixture.result?.teamBScore ?? 0), W - 300, badgeY + 185);
  ctx.font = '500 20px Inter, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText(`(${fixture.result?.teamBOvers ?? '0.0'} ov)`, W - 300, badgeY + 215);

  ctx.font = '800 40px Oswald, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillText('VS', W / 2, badgeY + 15);

  // Result banner
  const resultY = 560;
  ctx.fillStyle = 'rgba(57,255,136,0.1)';
  roundRect(ctx, 100, resultY, W - 200, 80, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(57,255,136,0.35)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, 100, resultY, W - 200, 80, 20);
  ctx.stroke();
  ctx.font = '700 30px Oswald, sans-serif';
  ctx.fillStyle = '#39ff88';
  const winnerName = fixture.result?.winnerId === teamA?.id ? teamA?.name : fixture.result?.winnerId === teamB?.id ? teamB?.name : null;
  ctx.fillText(winnerName ? `🏆 ${winnerName} won by ${fixture.result?.margin}` : 'Match Tied', W / 2, resultY + 50);

  // Man of the Match
  if (mom) {
    const momY = 700;
    ctx.fillStyle = 'rgba(250,204,21,0.08)';
    roundRect(ctx, 140, momY, W - 280, 200, 24);
    ctx.fill();
    ctx.strokeStyle = 'rgba(250,204,21,0.35)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, 140, momY, W - 280, 200, 24);
    ctx.stroke();

    ctx.font = '700 22px Inter, sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.fillText('⭐ MAN OF THE MATCH', W / 2, momY + 48);
    ctx.font = '800 42px Oswald, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(mom.name, W / 2, momY + 100);
    ctx.font = '500 22px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText(`${mom.role} · ${mom.runs} runs · ${mom.wickets} wkts this tournament`, W / 2, momY + 140);
  }

  ctx.font = '600 22px Oswald, sans-serif';
  ctx.fillStyle = '#39ff88';
  ctx.fillText('🏏 KDPL — CRICKET TOURNAMENT MANAGER', W / 2, H - 40);
}

export default function MatchSummaryPosterModal({ fixture, teamA, teamB, mom, tournament, onClose }: MatchSummaryPosterModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setReady(false);
    const raf = requestAnimationFrame(() => {
      if (canvasRef.current) {
        drawSummary(canvasRef.current, fixture, teamA, teamB, mom, tournament);
        setReady(true);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [fixture, teamA, teamB, mom, tournament]);

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
        link.download = `match-${fixture.matchNumber}-summary.png`;
        link.href = url;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
      }, 'image/png');
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/85 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 h-14 flex-shrink-0">
        <span className="text-kdpl-text font-oswald font-bold">Match Summary</span>
        <button onClick={onClose} className="w-9 h-9 rounded-lg bg-kdpl-card border border-kdpl-border flex items-center justify-center text-kdpl-text">
          <XIcon size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-auto flex items-start justify-center p-4 relative">
        <canvas ref={canvasRef} className={`w-full max-w-sm rounded-2xl shadow-2xl transition-opacity ${ready ? 'opacity-100' : 'opacity-0'}`} />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-kdpl-muted text-sm">Generating summary...</span>
          </div>
        )}
      </div>
      <div className="p-4 flex-shrink-0">
        <button onClick={handleDownload} disabled={!ready || downloading}
          className="w-full py-3.5 rounded-2xl bg-kdpl-neon text-kdpl-darker font-oswald font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50">
          <DownloadIcon size={18} /> {downloading ? 'Preparing...' : 'Download Summary'}
        </button>
      </div>
    </div>
  );
}
