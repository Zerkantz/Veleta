import React, { useEffect, useRef, useState } from 'react';

/**
 * Emoticonos e iconos vectoriales animados en estilo serigrafía (cero emojis Unicode).
 * Cada emoticono incluye una micro-animación continua acelerada por GPU (transform / opacity).
 */
export function AnimatedEmoticon({ name = 'smile', size = 18, style = {} }) {
  const s = size;

  switch (name) {
    case 'camera':
      return (
        <span className="anim-emoticon anim-emoticon-pulse" style={style} aria-hidden="true">
          <svg width={s} height={s} viewBox="0 0 24 24">
            <rect x="2" y="6" width="20" height="14" rx="2" fill="#FFC21A" stroke="#1A1830" strokeWidth="2" />
            <path d="M8 6L9.5 3.5H14.5L16 6" fill="#E4007C" stroke="#1A1830" strokeWidth="2" />
            <circle cx="12" cy="13" r="4" fill="#1A1830" />
            <circle cx="13.2" cy="11.8" r="1.3" fill="#FAF8F3" />
            <circle cx="18" cy="9.5" r="1.2" fill="#E4007C" />
          </svg>
        </span>
      );

    case 'zoom':
      return (
        <span className="anim-emoticon anim-emoticon-tilt" style={style} aria-hidden="true">
          <svg width={s} height={s} viewBox="0 0 24 24">
            <circle cx="10.5" cy="10.5" r="6.5" fill="#00A3A1" stroke="#1A1830" strokeWidth="2.2" />
            <path d="M8 8.5C9 7.2 11 7.2 12 8.5" stroke="#FAF8F3" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <line x1="15.2" y1="15.2" x2="21" y2="21" stroke="#FFC21A" strokeWidth="3.2" strokeLinecap="round" />
          </svg>
        </span>
      );

    case 'bolt':
      return (
        <span className="anim-emoticon anim-emoticon-hop" style={style} aria-hidden="true">
          <svg width={s} height={s} viewBox="0 0 24 24">
            <polygon
              points="13,2 4,14 11,14 10,22 20,10 13,10"
              fill="#FFC21A"
              stroke="#1A1830"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      );

    case 'lock':
      return (
        <span className="anim-emoticon anim-emoticon-tilt" style={style} aria-hidden="true">
          <svg width={s} height={s} viewBox="0 0 24 24">
            <path d="M7 11V7.5a5 5 0 0 1 10 0V11" fill="none" stroke="#1A1830" strokeWidth="2.4" strokeLinecap="round" />
            <rect x="4.5" y="11" width="15" height="10.5" rx="2" fill="#FFC21A" stroke="#1A1830" strokeWidth="2" />
            <circle cx="9.5" cy="15.2" r="1.1" fill="#1A1830" />
            <circle cx="14.5" cy="15.2" r="1.1" fill="#1A1830" />
            <path d="M9.5 18C10.8 19.2 13.2 19.2 14.5 18" fill="none" stroke="#1A1830" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
      );

    case 'folder':
      return (
        <span className="anim-emoticon anim-emoticon-float" style={style} aria-hidden="true">
          <svg width={s} height={s} viewBox="0 0 24 24">
            <path
              d="M2.5 6.5A1.5 1.5 0 0 1 4 5h5l2 2.5h9A1.5 1.5 0 0 1 21.5 9v9.5A1.5 1.5 0 0 1 20 20H4a1.5 1.5 0 0 1-1.5-1.5V6.5Z"
              fill="#FFC21A"
              stroke="#1A1830"
              strokeWidth="2"
            />
            <circle cx="9.5" cy="13.2" r="1.1" fill="#1A1830" />
            <circle cx="14.5" cy="13.2" r="1.1" fill="#1A1830" />
            <path d="M9.5 16c1.2 1.1 3.8 1.1 5 0" fill="none" stroke="#1A1830" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
      );

    case 'save':
      return (
        <span className="anim-emoticon anim-emoticon-press" style={style} aria-hidden="true">
          <svg width={s} height={s} viewBox="0 0 24 24">
            <path d="M4 4h13l3 3v13H4V4Z" fill="#00A3A1" stroke="#1A1830" strokeWidth="2" strokeLinejoin="round" />
            <rect x="7" y="4" width="8" height="5" fill="#FAF8F3" stroke="#1A1830" strokeWidth="1.6" />
            <rect x="6.5" y="13" width="11" height="7" fill="#FFC21A" stroke="#1A1830" strokeWidth="1.6" />
          </svg>
        </span>
      );

    case 'calendar':
      return (
        <span className="anim-emoticon anim-emoticon-float" style={style} aria-hidden="true">
          <svg width={s} height={s} viewBox="0 0 24 24">
            <rect x="3" y="5" width="18" height="16" rx="2" fill="#FAF8F3" stroke="#1A1830" strokeWidth="2" />
            <rect x="3" y="5" width="18" height="5" fill="#E4007C" stroke="#1A1830" strokeWidth="2" />
            <line x1="8" y1="2.5" x2="8" y2="6.5" stroke="#1A1830" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="16" y1="2.5" x2="16" y2="6.5" stroke="#1A1830" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="9.5" cy="14" r="1.1" fill="#1A1830" />
            <circle cx="14.5" cy="14" r="1.1" fill="#1A1830" />
            <path d="M9.5 17c1.2 1.1 3.8 1.1 5 0" fill="none" stroke="#1A1830" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
      );

    case 'hotel':
      return (
        <span className="anim-emoticon anim-emoticon-float" style={style} aria-hidden="true">
          <svg width={s} height={s} viewBox="0 0 24 24">
            <rect x="4" y="4" width="16" height="17" fill="#FFC21A" stroke="#1A1830" strokeWidth="2" />
            <rect x="7" y="7" width="3" height="3" fill="#1A1830" />
            <rect x="14" y="7" width="3" height="3" fill="#1A1830" />
            <rect x="7" y="12" width="3" height="3" fill="#1A1830" />
            <rect x="14" y="12" width="3" height="3" fill="#1A1830" />
            <rect x="10" y="16" width="4" height="5" fill="#E4007C" stroke="#1A1830" strokeWidth="1.6" />
          </svg>
        </span>
      );

    case 'pin':
      return (
        <span className="anim-emoticon anim-emoticon-hop" style={style} aria-hidden="true">
          <svg width={s} height={s} viewBox="0 0 24 24">
            <path
              d="M12 2C7.8 2 4.5 5.2 4.5 9.3C4.5 14.4 12 22 12 22C12 22 19.5 14.4 19.5 9.3C19.5 5.2 16.2 2 12 2Z"
              fill="#E4007C"
              stroke="#1A1830"
              strokeWidth="2"
            />
            <circle cx="12" cy="9.2" r="3.2" fill="#FFC21A" stroke="#1A1830" strokeWidth="1.6" />
          </svg>
        </span>
      );

    case 'gift':
      return (
        <span className="anim-emoticon anim-emoticon-tilt" style={style} aria-hidden="true">
          <svg width={s} height={s} viewBox="0 0 24 24">
            <rect x="3.5" y="10" width="17" height="11" fill="#FFC21A" stroke="#1A1830" strokeWidth="2" />
            <rect x="2.5" y="6.5" width="19" height="4" fill="#E4007C" stroke="#1A1830" strokeWidth="2" />
            <line x1="12" y1="6.5" x2="12" y2="21" stroke="#1A1830" strokeWidth="2.2" />
            <path d="M12 6.5C9.5 6.5 8 4.8 9 3.5C10 2.2 12 4.2 12 6.5Z" fill="#00A3A1" stroke="#1A1830" strokeWidth="1.8" />
            <path d="M12 6.5C14.5 6.5 16 4.8 15 3.5C14 2.2 12 4.2 12 6.5Z" fill="#00A3A1" stroke="#1A1830" strokeWidth="1.8" />
          </svg>
        </span>
      );

    case 'print':
      return (
        <span className="anim-emoticon anim-emoticon-press" style={style} aria-hidden="true">
          <svg width={s} height={s} viewBox="0 0 24 24">
            <rect x="6" y="3" width="12" height="5" fill="#FAF8F3" stroke="#1A1830" strokeWidth="2" />
            <rect x="3" y="8" width="18" height="9" rx="2" fill="#00A3A1" stroke="#1A1830" strokeWidth="2" />
            <rect x="6" y="14" width="12" height="7" fill="#FFC21A" stroke="#1A1830" strokeWidth="2" />
            <line x1="8.5" y1="17.5" x2="15.5" y2="17.5" stroke="#1A1830" strokeWidth="1.8" />
          </svg>
        </span>
      );

    case 'star':
      return (
        <span className="anim-emoticon anim-emoticon-twinkle" style={style} aria-hidden="true">
          <svg width={s} height={s} viewBox="0 0 24 24">
            <polygon
              points="12,2 15,8.5 22,9.3 16.8,14 18.2,21 12,17.5 5.8,21 7.2,14 2,9.3 9,8.5"
              fill="#FFC21A"
              stroke="#1A1830"
              strokeWidth="1.9"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      );

    case 'star-outline':
      return (
        <span className="anim-emoticon anim-emoticon-tilt" style={style} aria-hidden="true">
          <svg width={s} height={s} viewBox="0 0 24 24">
            <polygon
              points="12,2 15,8.5 22,9.3 16.8,14 18.2,21 12,17.5 5.8,21 7.2,14 2,9.3 9,8.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      );

    case 'check':
      return (
        <span className="anim-emoticon anim-emoticon-pulse" style={style} aria-hidden="true">
          <svg width={s} height={s} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9.5" fill="#1E8E5A" stroke="#1A1830" strokeWidth="2" />
            <polyline
              points="7.5,12.5 10.6,15.6 16.8,9"
              fill="none"
              stroke="#FAF8F3"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      );

    case 'cross':
      return (
        <span className="anim-emoticon anim-emoticon-tilt" style={style} aria-hidden="true">
          <svg width={s} height={s} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9.5" fill="#D3242C" stroke="#1A1830" strokeWidth="2" />
            <line x1="8.5" y1="8.5" x2="15.5" y2="15.5" stroke="#FAF8F3" strokeWidth="2.4" strokeLinecap="round" />
            <line x1="15.5" y1="8.5" x2="8.5" y2="15.5" stroke="#FAF8F3" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </span>
      );

    case 'edit':
    case 'quill':
      return (
        <span className="anim-emoticon anim-emoticon-tilt" style={style} aria-hidden="true">
          <svg width={s} height={s} viewBox="0 0 24 24">
            <path
              d="M20.5 3.5C15.5 3.5 10.5 7 8 12.5L4 20l7.5-4c5.5-2.5 9-7.5 9-12.5Z"
              fill="#FFC21A"
              stroke="#1A1830"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <line x1="4" y1="20" x2="14" y2="10" stroke="#1A1830" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </span>
      );

    case 'seal':
      return (
        <span className="anim-emoticon anim-emoticon-pulse" style={style} aria-hidden="true">
          <svg width={s} height={s} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9.5" fill="#E4007C" stroke="#1A1830" strokeWidth="2" />
            <circle cx="12" cy="12" r="6" fill="none" stroke="#FFC21A" strokeWidth="1.6" strokeDasharray="3 2" />
            <path d="M9.2 11.8L11.2 13.8L15 9.8" fill="none" stroke="#FAF8F3" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      );

    case 'smile':
    default:
      return (
        <span className="anim-emoticon anim-emoticon-hop" style={style} aria-hidden="true">
          <svg width={s} height={s} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9.5" fill="#FFC21A" stroke="#1A1830" strokeWidth="2" />
            <circle cx="8.8" cy="10.2" r="1.3" fill="#1A1830" />
            <circle cx="15.2" cy="10.2" r="1.3" fill="#1A1830" />
            <path d="M8 14.2C9.4 16.5 14.6 16.5 16 14.2" fill="none" stroke="#1A1830" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
      );
  }
}

// Contenedor que anima sus hijos cuando entran en el viewport al hacer scroll.
export function ScrollReveal({ children, delay = 0, className = '', style = {} }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            obs.disconnect();
            break;
          }
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -24px 0px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`scroll-reveal-item ${visible ? 'is-visible' : ''} ${className}`.trim()}
      style={{ '--stagger-delay': `${delay}ms`, ...style }}
    >
      {children}
    </div>
  );
}

/**
 * Animación cinematográfica de entrada ("Cortinilla Fotográfica Visite México")
 * Muestra un tríptico de fotografías reales de México con apertura de telón serigráfico.
 * Al presionar el nombre de la página ("VELETA"), salta la animación de inmediato y lleva al inicio.
 */
export function IntroSplash({ forceOpenCounter = 0, skipCounter = 0, moduleLabel = '', onBrandClick }) {
  const [phase, setPhase] = useState('entering');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    try {
      sessionStorage.removeItem('veleta_intro_seen');
    } catch {
      // Ignorar
    }
  }, []);

  useEffect(() => {
    if (forceOpenCounter > 0) {
      setProgress(0);
      setPhase('entering');
    }
  }, [forceOpenCounter]);

  useEffect(() => {
    if (skipCounter > 0) {
      setPhase('hidden');
    }
  }, [skipCounter]);

  // Avanza la barra de carga del 0% al 100% y en cuanto llega al 100% quita la animación
  useEffect(() => {
    if (phase !== 'entering') return undefined;
    setProgress(0);
    const start = performance.now();
    const durationMs = forceOpenCounter > 1 ? 1150 : 1500;

    const interval = setInterval(() => {
      const elapsed = performance.now() - start;
      const pct = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(interval);
        setPhase('curtain-open');
      }
    }, 28);

    return () => clearInterval(interval);
  }, [phase, forceOpenCounter]);

  // En cuanto entra en 'curtain-open', abre el telón y desmonta el componente por completo
  useEffect(() => {
    if (phase !== 'curtain-open') return undefined;
    const timer = setTimeout(() => {
      setPhase('hidden');
    }, 420);
    return () => clearTimeout(timer);
  }, [phase]);

  const handlePressPageName = () => {
    setPhase('hidden');
    if (onBrandClick) onBrandClick();
  };

  if (phase === 'hidden') return null;

  const panels = [
    {
      state: 'Quintana Roo',
      title: 'Caribe y Arrecifes',
      accent: '#00A3A1',
      photo:
        'https://images.pexels.com/photos/1802255/pexels-photo-1802255.jpeg?auto=compress&cs=tinysrgb&w=1000',
    },
    {
      state: 'Oaxaca y Chiapas',
      title: 'Sierra, Templos y Tradición',
      accent: '#E4007C',
      photo:
        'https://images.pexels.com/photos/3879071/pexels-photo-3879071.jpeg?auto=compress&cs=tinysrgb&w=1000',
    },
    {
      state: 'Yucatán y Centro',
      title: 'Zonas Arqueológicas y Palacios',
      accent: '#FFC21A',
      photo:
        'https://images.pexels.com/photos/3290068/pexels-photo-3290068.jpeg?auto=compress&cs=tinysrgb&w=1000',
    },
  ];

  return (
    <div
      className={`intro-splash-overlay ${phase === 'curtain-open' ? 'is-opening' : ''}`}
      role="dialog"
      aria-label="Bienvenida a Veleta — Guía Fotográfica y Clima de México"
    >
      {/* Mitad izquierda del telón */}
      <div className="intro-curtain intro-curtain-left" />
      {/* Mitad derecha del telón */}
      <div className="intro-curtain intro-curtain-right" />

      {/* Tríptico fotográfico de fondo a pantalla completa */}
      <div className="intro-photo-triptych">
        {panels.map((p, idx) => (
          <div
            key={p.state}
            className="intro-triptych-col"
            style={{ animationDelay: `${idx * 110}ms` }}
          >
            <img src={p.photo} alt={p.title} className="intro-triptych-img" />
            <div
              className="intro-triptych-tint"
              style={{
                background: `linear-gradient(180deg, rgba(26,24,48,0.35) 0%, rgba(26,24,48,0.82) 100%)`,
              }}
            />
            <div className="intro-triptych-caption">
              <span
                className="stamp-pill"
                style={{ background: p.accent, color: p.accent === '#E4007C' ? '#FFFFFF' : '#1A1830', borderColor: '#1A1830' }}
              >
                {p.state}
              </span>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: '#FAF8F3', textTransform: 'uppercase', marginTop: '4px' }}>
                {p.title}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cartela central de bienvenida */}
      <div className="intro-center-badge">
        <div className="intro-sun-spinner" aria-hidden="true">
          <svg width="68" height="68" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="16" fill="#FFC21A" stroke="#1A1830" strokeWidth="2.2" />
            <line x1="18" y1="4" x2="18" y2="32" stroke="#1A1830" strokeWidth="2.2" />
            <line x1="5" y1="22" x2="31" y2="22" stroke="#1A1830" strokeWidth="2.2" />
            <polygon points="31,22 25,18.5 25,25.5" fill="#E4007C" stroke="#1A1830" strokeWidth="1.4" />
            <path d="M14 17 C14 11 19 9 22 12 C24 10 26 12 24 15 C22 18 17 18 14 17 Z" fill="#1A1830" />
          </svg>
        </div>

        <span className="script-accent" style={{ fontSize: '2.5rem', color: '#FFC21A', lineHeight: 1, display: 'block' }}>
          Visite México hoy
        </span>

        <h1>
          <button
            type="button"
            onClick={handlePressPageName}
            className="intro-giant-wordmark intro-giant-wordmark-btn"
            title="Presiona VELETA para ir al inicio y saltar la animación"
          >
            VELETA
          </button>
        </h1>

        <p className="intro-subtitle">
          {moduleLabel
            ? `Abriendo módulo: ${moduleLabel}`
            : 'Itinerarios Inteligentes · Clima en Vivo · Hoteles y Rutas desde tu Hotel'}
        </p>

        {/* Barra de carga sincronizada al 100% */}
        <div className="intro-progress-track" aria-hidden="true">
          <div
            className="intro-progress-bar"
            style={{ transform: `scaleX(${progress / 100})` }}
          />
        </div>
        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#FFC21A', marginTop: '6px' }}>
          {moduleLabel ? `Preparando ${moduleLabel.toLowerCase()}… ${progress}%` : `Cargando fotografías y clima… ${progress}%`}
        </div>
      </div>
    </div>
  );
}

/**
 * Marco fotográfico de alta prioridad visual:
 * Muestra las fotografías reales a todo color y alto contraste desde el primer instante,
 * con zoom cinematográfico suave al pasar el cursor y visor Lightbox a pantalla completa.
 */
export function DuotonePhoto({
  src,
  alt,
  tint = '#00A3A1',
  ink = '#1A1830',
  height = 240,
  badgeText,
  credit,
  allowLightbox = true,
}) {
  const [failed, setFailed] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <>
      <div
        className="silkscreen-photo-frame"
        style={{
          '--duotone-bg': tint,
          height,
          backgroundColor: tint,
        }}
      >
        {!failed && src ? (
          <img
            src={src}
            alt={alt}
            loading="lazy"
            className="silkscreen-photo-img"
            onError={() => setFailed(true)}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'grid',
              placeItems: 'center',
              background: tint,
              color: '#FFFFFF',
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              textTransform: 'uppercase',
              padding: '12px',
              textAlign: 'center',
            }}
          >
            {alt}
          </div>
        )}

        {/* Viñeta sutil inferior solo para legibilidad de sellos */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg, rgba(26,24,48,0.18) 0%, transparent 35%, transparent 68%, rgba(26,24,48,0.62) 100%)`,
            pointerEvents: 'none',
          }}
        />

        {/* Filete de color del estado en el borde inferior de la foto */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '5px',
            background: tint,
            pointerEvents: 'none',
          }}
        />

        {badgeText && (
          <span
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              background: '#1A1830',
              color: '#FFC21A',
              padding: '4px 10px',
              fontSize: '0.73rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              border: '1.5px solid #FAF8F3',
              boxShadow: '2px 2px 0 rgba(0,0,0,0.45)',
            }}
          >
            {badgeText}
          </span>
        )}

        {allowLightbox && !failed && src && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxOpen(true);
            }}
            aria-label={`Ampliar fotografía de ${alt}`}
            title="Ampliar fotografía a pantalla completa"
            className="photo-zoom-btn no-print"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <AnimatedEmoticon name="zoom" size={14} />
            <span>Ampliar</span>
          </button>
        )}

        {credit && (
          <span
            style={{
              position: 'absolute',
              bottom: 9,
              right: 8,
              background: 'rgba(26, 24, 48, 0.85)',
              color: '#FAF8F3',
              padding: '2px 7px',
              fontSize: '0.68rem',
              fontWeight: 700,
              border: '1px solid rgba(255,255,255,0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <AnimatedEmoticon name="camera" size={12} />
            <span>{credit}</span>
          </span>
        )}
      </div>

      {/* Visor Fotográfico a Pantalla Completa (Lightbox) */}
      {lightboxOpen && (
        <div
          className="photo-lightbox-backdrop no-print"
          role="dialog"
          aria-label={`Fotografía ampliada: ${alt}`}
          onClick={(e) => {
            e.stopPropagation();
            setLightboxOpen(false);
          }}
        >
          <div
            className="photo-lightbox-frame"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ position: 'relative', background: '#1A1830' }}>
              <img
                src={src}
                alt={alt}
                style={{
                  width: '100%',
                  maxHeight: '76vh',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </div>
            <div
              style={{
                padding: '14px 20px',
                background: '#FAF8F3',
                borderTop: '3px solid #1A1830',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 900, textTransform: 'uppercase' }}>
                  {alt}
                </div>
                {badgeText && (
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-cobalt)' }}>
                    {badgeText} {credit ? `· Fotografía: ${credit}` : ''}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                className="btn btn-primary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <AnimatedEmoticon name="cross" size={15} />
                <span>Cerrar visor</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
