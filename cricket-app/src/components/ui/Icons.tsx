// ═══════════════════════════════════════════════════════════════
// KDPL SVG ICON LIBRARY
// ═══════════════════════════════════════════════════════════════

import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

const icon = (path: string | React.ReactNode, viewBox = '0 0 24 24') =>
  ({ size = 20, className = '', strokeWidth = 2 }: IconProps) => (
    <svg width={size} height={size} viewBox={viewBox} fill="none"
      stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      {typeof path === 'string' ? <path d={path} /> : path}
    </svg>
  );

export const HomeIcon = icon(<>
  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
  <polyline points="9 22 9 12 15 12 15 22" />
</>);

export const CalendarIcon = icon(<>
  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
  <line x1="16" y1="2" x2="16" y2="6" />
  <line x1="8" y1="2" x2="8" y2="6" />
  <line x1="3" y1="10" x2="21" y2="10" />
</>);

export const RadioIcon = icon(<>
  <circle cx="12" cy="12" r="2" />
  <path d="M16.24 7.76a6 6 0 010 8.49m-8.48-.01a6 6 0 010-8.49m11.31-2.82a10 10 0 010 14.14m-14.14 0a10 10 0 010-14.14" />
</>);

export const EditIcon = icon(<>
  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
</>);

export const BarChartIcon = icon(<>
  <line x1="18" y1="20" x2="18" y2="10" />
  <line x1="12" y1="20" x2="12" y2="4" />
  <line x1="6" y1="20" x2="6" y2="14" />
</>);

export const PlusIcon = icon(<>
  <line x1="12" y1="5" x2="12" y2="19" />
  <line x1="5" y1="12" x2="19" y2="12" />
</>);

export const TrashIcon = icon(<>
  <polyline points="3 6 5 6 21 6" />
  <path d="M19 6l-1 14H6L5 6" />
  <path d="M10 11v6M14 11v6" />
  <path d="M9 6V4h6v2" />
</>);

export const EditPenIcon = icon(<path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />);

export const SearchIcon = icon(<>
  <circle cx="11" cy="11" r="8" />
  <line x1="21" y1="21" x2="16.65" y2="16.65" />
</>);

export const TrophyIcon = icon(<>
  <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
  <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
  <path d="M4 22h16" />
  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
  <path d="M18 2H6v7a6 6 0 0012 0V2z" />
</>);

export const ShieldIcon = icon(<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />);

export const LogoutIcon = icon(<>
  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
  <path d="M16 17l5-5-5-5" />
  <path d="M21 12H9" />
</>);


export const UserIcon = icon(<>
  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
  <circle cx="12" cy="7" r="4" />
</>);

export const UsersIcon = icon(<>
  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
  <circle cx="9" cy="7" r="4" />
  <path d="M23 21v-2a4 4 0 00-3-3.87" />
  <path d="M16 3.13a4 4 0 010 7.75" />
</>);

export const MapPinIcon = icon(<>
  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
  <circle cx="12" cy="10" r="3" />
</>);

export const SettingsIcon = icon(<>
  <circle cx="12" cy="12" r="3" />
  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
</>);

export const BellIcon = icon(<>
  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
  <path d="M13.73 21a2 2 0 01-3.46 0" />
</>);

export const SunIcon = icon(<>
  <circle cx="12" cy="12" r="5" />
  <line x1="12" y1="1" x2="12" y2="3" />
  <line x1="12" y1="21" x2="12" y2="23" />
  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
  <line x1="1" y1="12" x2="3" y2="12" />
  <line x1="21" y1="12" x2="23" y2="12" />
  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
</>);

export const MoonIcon = icon(<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />);

export const LockIcon = icon(<>
  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
  <path d="M7 11V7a5 5 0 0110 0v4" />
</>);

export const UnlockIcon = icon(<>
  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
  <path d="M7 11V7a5 5 0 019.9-1" />
</>);

export const WifiOffIcon = icon(<>
  <line x1="1" y1="1" x2="23" y2="23" />
  <path d="M16.72 11.06A10.94 10.94 0 0119 12.55" />
  <path d="M5 12.55a10.94 10.94 0 015.17-2.39" />
  <path d="M10.71 5.05A16 16 0 0122.56 9" />
  <path d="M1.42 9a15.91 15.91 0 014.7-2.88" />
  <path d="M8.53 16.11a6 6 0 016.95 0" />
  <line x1="12" y1="20" x2="12.01" y2="20" />
</>);

export const CheckIcon = icon(<polyline points="20 6 9 17 4 12" />);

export const XIcon = icon(<>
  <line x1="18" y1="6" x2="6" y2="18" />
  <line x1="6" y1="6" x2="18" y2="18" />
</>);

export const ChevronDownIcon = icon(<polyline points="6 9 12 15 18 9" />);
export const ChevronUpIcon = icon(<polyline points="18 15 12 9 6 15" />);
export const ChevronRightIcon = icon(<polyline points="9 18 15 12 9 6" />);

export const ArrowLeftIcon = icon(<>
  <line x1="19" y1="12" x2="5" y2="12" />
  <polyline points="12 19 5 12 12 5" />
</>);

export const RefreshIcon = icon(<>
  <polyline points="23 4 23 10 17 10" />
  <polyline points="1 20 1 14 7 14" />
  <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
</>);

export const DownloadIcon = icon(<>
  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
  <polyline points="7 10 12 15 17 10" />
  <line x1="12" y1="15" x2="12" y2="3" />
</>);

export const ShareIcon = icon(<>
  <circle cx="18" cy="5" r="3" />
  <circle cx="6" cy="12" r="3" />
  <circle cx="18" cy="19" r="3" />
  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
</>);

export const CoinIcon = icon(<>
  <circle cx="12" cy="12" r="10" />
  <path d="M12 8v8M8 12h8" />
</>);

export const ShuffleIcon = icon(<>
  <polyline points="16 3 21 3 21 8" />
  <line x1="4" y1="20" x2="21" y2="3" />
  <polyline points="21 16 21 21 16 21" />
  <line x1="15" y1="15" x2="21" y2="21" />
  <line x1="4" y1="4" x2="9" y2="9" />
</>);

export const FacebookIcon = ({ size = 20, className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

export const WhatsAppIcon = ({ size = 20, className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M12.004 2.003c-5.514 0-9.997 4.483-9.997 9.997 0 1.763.462 3.486 1.34 5.004L2 22l5.13-1.334a9.965 9.965 0 004.874 1.242h.004c5.514 0 9.997-4.483 9.997-9.997 0-2.67-1.04-5.18-2.928-7.069a9.935 9.935 0 00-7.073-2.839zm0 18.166h-.003a8.28 8.28 0 01-4.223-1.157l-.303-.18-3.045.793.813-2.968-.198-.305a8.27 8.27 0 01-1.268-4.406c0-4.573 3.72-8.293 8.297-8.293a8.24 8.24 0 015.868 2.433 8.238 8.238 0 012.427 5.865c-.002 4.573-3.722 8.293-8.298 8.293z" />
  </svg>
);

export const StarIcon = icon(<>
  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
</>);

export const ZapIcon = icon(<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />);

export const ActivityIcon = icon(<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />);

export const AwardIcon = icon(<>
  <circle cx="12" cy="8" r="7" />
  <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
</>);

export const TargetIcon = icon(<>
  <circle cx="12" cy="12" r="10" />
  <circle cx="12" cy="12" r="6" />
  <circle cx="12" cy="12" r="2" />
</>);

export const TrendingUpIcon = icon(<>
  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
  <polyline points="17 6 23 6 23 12" />
</>);

export const LayersIcon = icon(<>
  <polygon points="12 2 2 7 12 12 22 7 12 2" />
  <polyline points="2 17 12 22 22 17" />
  <polyline points="2 12 12 17 22 12" />
</>);

export const SlidersIcon = icon(<>
  <line x1="4" y1="21" x2="4" y2="14" />
  <line x1="4" y1="10" x2="4" y2="3" />
  <line x1="12" y1="21" x2="12" y2="12" />
  <line x1="12" y1="8" x2="12" y2="3" />
  <line x1="20" y1="21" x2="20" y2="16" />
  <line x1="20" y1="12" x2="20" y2="3" />
  <line x1="1" y1="14" x2="7" y2="14" />
  <line x1="9" y1="8" x2="15" y2="8" />
  <line x1="17" y1="16" x2="23" y2="16" />
</>);

export const GlobeIcon = icon(<>
  <circle cx="12" cy="12" r="10" />
  <line x1="2" y1="12" x2="22" y2="12" />
  <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
</>);

export const ImageIcon = icon(<>
  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
  <circle cx="8.5" cy="8.5" r="1.5" />
  <polyline points="21 15 16 10 5 21" />
</>);

export const SendIcon = icon(<>
  <line x1="22" y1="2" x2="11" y2="13" />
  <polygon points="22 2 15 22 11 13 2 9 22 2" />
</>);

export const CreditCardIcon = icon(<>
  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
  <line x1="1" y1="10" x2="23" y2="10" />
</>);

export const ToggleLeftIcon = icon(<>
  <rect x="1" y="5" width="22" height="14" rx="7" ry="7" />
  <circle cx="8" cy="12" r="3" />
</>);

export const ToggleRightIcon = icon(<>
  <rect x="1" y="5" width="22" height="14" rx="7" ry="7" />
  <circle cx="16" cy="12" r="3" />
</>);

export const WifiIcon = icon(<>
  <path d="M5 12.55a11 11 0 0114.08 0" />
  <path d="M1.42 9a16 16 0 0121.16 0" />
  <path d="M8.53 16.11a6 6 0 016.95 0" />
  <line x1="12" y1="20" x2="12.01" y2="20" />
</>);

export const ClipboardIcon = icon(<>
  <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
</>);

export const CricketIcon = ({ size = 20, className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 20L20 4" />
    <path d="M4 20l4-1 12-15-1 4" />
    <circle cx="19" cy="5" r="2" fill="currentColor" stroke="none" />
  </svg>
);

export const DotIcon = ({ size = 8, className = '' }: IconProps) => (
  <span style={{ width: size, height: size }} className={`inline-block rounded-full ${className}`} />
);
