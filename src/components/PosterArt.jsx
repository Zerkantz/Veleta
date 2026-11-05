import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatedEmoticon } from './Motion.jsx';

// Ilustraciones serigráficas por motivo de destino (capas planas con ligero desfase de registro).
export function SilkscreenMotif({ motif, ink, sun }) {
  switch (motif) {
    case 'palms':
      return (
        <svg viewBox="0 0 300 220" width="100%" height="100%" aria-hidden="true" preserveAspectRatio="none">
          <path d="M0 165 Q37 152 75 165 T150 165 T225 165 T300 165 L300 220 L0 220 Z" fill={ink} opacity="0.92" />
          <path d="M0 184 Q37 172 75 184 T150 184 T225 184 T300 184 L300 220 L0 220 Z" fill="#1A1830" />
          <path d="M48 188 C52 135 58 95 66 56 L73 56 C66 95 61 135 58 188 Z" fill="#1A1830" />
          <path d="M68 58 C38 45 18 58 8 76 C30 68 48 66 68 65 Z" fill="#1A1830" />
          <path d="M68 58 C46 30 22 28 6 40 C28 42 48 48 68 58 Z" fill="#1A1830" />
          <path d="M70 58 C95 36 122 40 136 56 C114 52 92 54 70 62 Z" fill="#1A1830" />
          <path d="M70 60 C98 54 118 68 128 86 C106 74 88 68 70 65 Z" fill="#1A1830" />
        </svg>
      );
    case 'agave':
      return (
        <svg viewBox="0 0 300 220" width="100%" height="100%" aria-hidden="true" preserveAspectRatio="none">
          <polygon points="0,175 95,120 195,168 300,115 300,220 0,220" fill={ink} />
          <polygon points="3,178 98,123 198,171 300,118 300,220 0,220" fill="#1A1830" opacity="0.88" />
          <g fill={sun} transform="translate(150,185)">
            <polygon points="0,0 -12,-78 0,-95 12,-78" />
            <polygon points="0,0 -48,-62 -44,-82 -14,-54" />
            <polygon points="0,0 48,-62 44,-82 14,-54" />
            <polygon points="0,0 -76,-34 -80,-52 -32,-34" />
            <polygon points="0,0 76,-34 80,-52 32,-34" />
          </g>
        </svg>
      );
    case 'volcanoes':
      return (
        <svg viewBox="0 0 300 220" width="100%" height="100%" aria-hidden="true" preserveAspectRatio="none">
          <polygon points="15,185 105,88 188,185" fill={ink} />
          <polygon points="88,112 105,88 124,112 114,116 105,108 96,116" fill="#FAF8F3" />
          <polygon points="135,185 215,108 295,185" fill="#1A1830" />
          <rect x="0" y="180" width="300" height="40" fill="#1A1830" />
          <path d="M55 182 L245 182 L225 204 L75 204 Z" fill={sun} />
        </svg>
      );
    case 'mountains':
      return (
        <svg viewBox="0 0 300 220" width="100%" height="100%" aria-hidden="true" preserveAspectRatio="none">
          <polygon points="0,165 78,92 162,158 242,84 300,145 300,220 0,220" fill={ink} />
          <rect x="18" y="138" width="190" height="8" fill="#FAF8F3" opacity="0.85" />
          <rect x="70" y="156" width="210" height="8" fill="#FAF8F3" opacity="0.85" />
          <rect x="112" y="128" width="76" height="62" fill={sun} />
          <polygon points="112,128 150,98 188,128" fill="#1A1830" />
        </svg>
      );
    case 'town':
      return (
        <svg viewBox="0 0 300 220" width="100%" height="100%" aria-hidden="true" preserveAspectRatio="none">
          <rect x="18" y="128" width="54" height="82" fill={ink} />
          <rect x="68" y="102" width="58" height="108" fill="#1A1830" />
          <rect x="122" y="118" width="62" height="92" fill={sun} />
          <rect x="180" y="94" width="56" height="116" fill={ink} />
          <rect x="232" y="124" width="52" height="86" fill="#1A1830" />
          <rect x="86" y="120" width="10" height="18" fill="#FAF8F3" />
          <rect x="104" y="120" width="10" height="18" fill="#FAF8F3" />
          <rect x="198" y="114" width="12" height="20" fill="#FAF8F3" />
        </svg>
      );
    case 'arch':
      return (
        <svg viewBox="0 0 300 220" width="100%" height="100%" aria-hidden="true" preserveAspectRatio="none">
          <rect x="0" y="168" width="300" height="52" fill={ink} />
          <path d="M36 172 L68 92 L176 108 L206 172 L152 172 C150 138 112 138 108 172 Z" fill="#1A1830" />
          <rect x="244" y="102" width="10" height="70" fill="#1A1830" />
          <path d="M230 128 L244 128 L244 114 L230 114 Z" fill="#1A1830" />
          <path d="M254 138 L268 138 L268 120 L254 120 Z" fill="#1A1830" />
        </svg>
      );
    case 'pyramid':
      return (
        <svg viewBox="0 0 300 220" width="100%" height="100%" aria-hidden="true" preserveAspectRatio="none">
          <polygon points="30,195 270,195 250,168 50,168" fill={ink} />
          <polygon points="56,168 244,168 224,142 76,142" fill={ink} />
          <polygon points="82,142 218,142 198,116 102,116" fill={ink} />
          <rect x="122" y="92" width="56" height="24" fill={sun} />
          <polygon points="128,195 172,195 162,116 138,116" fill="#1A1830" />
        </svg>
      );
    case 'bay':
      return (
        <svg viewBox="0 0 300 220" width="100%" height="100%" aria-hidden="true" preserveAspectRatio="none">
          <path d="M0 130 Q110 95 220 148 L300 148 L300 220 L0 220 Z" fill={ink} />
          <rect x="0" y="172" width="300" height="48" fill={sun} opacity="0.88" />
          <path d="M0 190 Q50 180 100 190 T200 190 T300 190 L300 220 L0 220 Z" fill="#1A1830" />
        </svg>
      );
    case 'canyon':
    default:
      return (
        <svg viewBox="0 0 300 220" width="100%" height="100%" aria-hidden="true" preserveAspectRatio="none">
          <polygon points="0,70 92,115 118,195 0,220" fill={ink} />
          <polygon points="300,62 204,112 176,195 300,220" fill="#1A1830" />
          <polygon points="0,128 76,154 96,220 0,220" fill="#1A1830" />
          <polygon points="300,126 218,154 196,220 300,220" fill={ink} />
        </svg>
      );
  }
}

// Emblema del cielo impreso dentro del disco solar según el clima en vivo.
export function SkyEmblem({ sky = 'clear', size = 28 }) {
  const s = size;
  if (sky === 'rain' || sky === 'storm') {
    return (
      <svg width={s} height={s} viewBox="0 0 32 32" aria-hidden="true">
        <path d="M8 20H24A5 5 0 0 0 24 10A7 7 0 0 0 11 9A5 5 0 0 0 8 20Z" fill="currentColor" />
        <line x1="11" y1="23" x2="9" y2="29" stroke="currentColor" strokeWidth="2.5" />
        <line x1="17" y1="23" x2="15" y2="29" stroke="currentColor" strokeWidth="2.5" />
        <line x1="23" y1="23" x2="21" y2="29" stroke="currentColor" strokeWidth="2.5" />
      </svg>
    );
  }
  if (sky === 'clouds' || sky === 'few' || sky === 'mist') {
    return (
      <svg width={s} height={s} viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="11" cy="12" r="5" fill="currentColor" opacity="0.65" />
        <path d="M9 23H25A5 5 0 0 0 25 13A6.5 6.5 0 0 0 13 12A4.5 4.5 0 0 0 9 23Z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg width={s} height={s} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="7" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="16" y1="26" x2="16" y2="30" />
        <line x1="2" y1="16" x2="6" y2="16" />
        <line x1="26" y1="16" x2="30" y2="16" />
        <line x1="6" y1="6" x2="9" y2="9" />
        <line x1="23" y1="23" x2="26" y2="26" />
        <line x1="26" y1="6" x2="23" y2="9" />
        <line x1="9" y1="23" x2="6" y2="26" />
      </g>
    </svg>
  );
}

const VERDICT_BADGE = {
  si: { label: 'Conviene viajar hoy', bg: '#1E8E5A', fg: '#FFFFFF' },
  quizas: { label: 'Temporada media', bg: '#FFC21A', fg: '#1A1830' },
  no: { label: 'Lluvia intensa', bg: '#D3242C', fg: '#FFFFFF' },
};

// Cartel completo de destino con prioridad total a la fotografía real a todo color,
// marco serigráfico en las tintas del estado y sello solar de clima en vivo.
export function PosterCard({
  destination,
  weather,
  featured = false,
  isFavorite = false,
  onToggleFavorite,
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const { inks } = destination;
  const temp = weather?.temp ?? weather?.current?.temp ?? '—';
  const desc = weather?.description ?? weather?.current?.description ?? 'Consultando clima…';
  const sky = weather?.sky ?? weather?.current?.sky ?? 'clear';
  const humidity = weather?.current?.humidity;
  const wind = weather?.current?.windKmh;
  const verdictKey = weather?.verdict?.level || weather?.verdict || 'si';
  const badge = VERDICT_BADGE[verdictKey] || VERDICT_BADGE.si;

  const sunDiscBg = inks.sun || '#FFC21A';
  const sunDiscFg = sunDiscBg === '#E4007C' || sunDiscBg === '#1D3FBB' ? '#FFFFFF' : '#1A1830';
  const minPrice = destination.minHotelPrice
    ? `$${Number(destination.minHotelPrice).toLocaleString('es-MX')}`
    : null;

  return (
    <article
      className={`poster-card ${featured ? '' : 'poster-card-interactive'}`}
      style={{
        backgroundColor: inks.bg,
        color: inks.text,
      }}
    >
      {/* Cabecera serigráfica superior con el nombre del estado y destino */}
      <div
        style={{
          padding: featured ? '14px 18px 12px' : '12px 14px 10px',
          backgroundColor: inks.bg,
          borderBottom: '2.5px solid #1A1830',
          position: 'relative',
          zIndex: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '8px',
        }}
      >
        <div>
          <span
            style={{
              display: 'inline-block',
              fontSize: '0.72rem',
              fontWeight: 900,
              letterSpacing: '0.09em',
              textTransform: 'uppercase',
            }}
          >
            Visite · {destination.state}
          </span>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              textTransform: 'uppercase',
              fontSize: featured ? 'clamp(2.2rem, 3.6vw, 2.85rem)' : '2rem',
              lineHeight: 0.9,
              margin: '2px 0 0',
              letterSpacing: '-0.01em',
              textShadow: `2px 2px 0 ${inks.ink}`,
            }}
          >
            <Link to={`/destinos/${destination.slug}`}>{destination.name}</Link>
          </h3>
        </div>

        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onToggleFavorite(destination.slug);
            }}
            aria-label={
              isFavorite
                ? `Quitar ${destination.name} de favoritos`
                : `Guardar ${destination.name} en favoritos`
            }
            title={isFavorite ? 'En tus favoritos' : 'Guardar cartel'}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: '2px solid #1A1830',
              background: isFavorite ? '#E4007C' : '#FAF8F3',
              color: isFavorite ? '#FFFFFF' : '#1A1830',
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '2px 2px 0 #1A1830',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <AnimatedEmoticon name={isFavorite ? 'star' : 'star-outline'} size={17} />
          </button>
        )}
      </div>

      {/* VENTANA FOTOGRÁFICA PROTAGONISTA (Ocupa el cuerpo principal del cartel a todo color) */}
      <Link
        to={`/destinos/${destination.slug}`}
        style={{
          position: 'relative',
          flex: 1,
          minHeight: featured ? 300 : 245,
          overflow: 'hidden',
          display: 'block',
          backgroundColor: '#1A1830',
        }}
        aria-label={`Explorar fotografías, lugares y hoteles de ${destination.name}`}
      >
        {destination.heroPhoto && !imgFailed ? (
          <img
            src={destination.heroPhoto}
            alt={`Fotografía de ${destination.name}, ${destination.state}`}
            loading="lazy"
            className="silkscreen-photo-img"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: inks.bg }}>
            <SilkscreenMotif motif={destination.motif} ink={inks.ink} sun={inks.sun} />
          </div>
        )}

        {/* Degradado inferior ligero solo para resaltar las etiquetas sobre la foto */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(26,24,48,0.12) 0%, transparent 45%, rgba(26,24,48,0.72) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Sello circular del Sol con el Clima en Vivo en la esquina superior derecha de la foto */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 3,
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: '#1A1830',
              transform: 'translate(4px, 4px)',
            }}
          />
          <div
            style={{
              width: featured ? 116 : 98,
              height: featured ? 116 : 98,
              borderRadius: '50%',
              background: sunDiscBg,
              color: sunDiscFg,
              border: '2.5px solid #1A1830',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '6px',
              position: 'relative',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '0.58rem',
                fontWeight: 900,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              <SkyEmblem sky={sky} size={14} />
              <span>En vivo</span>
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                fontSize: featured ? '2.45rem' : '2.05rem',
                lineHeight: 0.88,
                margin: '2px 0',
              }}
            >
              {temp}°C
            </div>
            <div
              style={{
                fontSize: '0.64rem',
                fontWeight: 800,
                textTransform: 'capitalize',
                maxWidth: '12ch',
                lineHeight: 1.05,
              }}
            >
              {desc}
            </div>
          </div>
        </div>

        {/* Etiquetas flotantes sobre la parte baja de la fotografía */}
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            right: 10,
            zIndex: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: '6px',
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              background: 'rgba(250, 248, 243, 0.96)',
              color: '#1A1830',
              border: '1.5px solid #1A1830',
              padding: '3px 8px',
              fontSize: '0.72rem',
              fontWeight: 900,
              boxShadow: '2px 2px 0 #1A1830',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <AnimatedEmoticon name="camera" size={14} />
            <span>{destination.placesCount || 5} lugares con foto</span>
          </span>
          {minPrice && (
            <span
              style={{
                background: '#FFC21A',
                color: '#1A1830',
                border: '1.5px solid #1A1830',
                padding: '3px 8px',
                fontSize: '0.73rem',
                fontWeight: 900,
                boxShadow: '2px 2px 0 #1A1830',
              }}
            >
              Hoteles desde {minPrice} MXN
            </span>
          )}
        </div>
      </Link>

      {/* Cintillo inferior tipo boleto con veredicto, humedad/viento y enlace */}
      <div
        style={{
          background: '#1A1830',
          color: '#FAF8F3',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          position: 'relative',
          zIndex: 3,
          borderTop: '2px solid #1A1830',
        }}
      >
        <span
          style={{
            background: badge.bg,
            color: badge.fg,
            fontSize: '0.68rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            padding: '3px 8px',
          }}
        >
          {badge.label}
        </span>
        {featured && humidity !== undefined ? (
          <span style={{ fontSize: '0.72rem', color: '#D8D4C8', fontWeight: 700 }}>
            Humedad {humidity}% · Viento {wind} km/h
          </span>
        ) : null}
        <Link
          to={`/destinos/${destination.slug}`}
          style={{
            fontWeight: 800,
            fontSize: '0.8rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#FFC21A',
          }}
        >
          Ver fotos y guía →
        </Link>
      </div>
    </article>
  );
}

