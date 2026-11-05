import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../lib/api.js';
import { IntroSplash, AnimatedEmoticon } from './Motion.jsx';

function WeathervaneIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 36 36" aria-hidden="true">
      <circle cx="18" cy="18" r="16" fill="#FFC21A" stroke="#1A1830" strokeWidth="2.2" />
      <line x1="18" y1="5" x2="18" y2="31" stroke="#1A1830" strokeWidth="2.2" />
      <line x1="6" y1="22" x2="30" y2="22" stroke="#1A1830" strokeWidth="2.2" />
      <polygon points="30,22 25,19 25,25" fill="#E4007C" stroke="#1A1830" strokeWidth="1.4" />
      <path d="M14 17 C14 11 19 9 22 12 C24 10 26 12 24 15 C22 18 17 18 14 17 Z" fill="#1A1830" />
    </svg>
  );
}

function getModuleTitle(pathname) {
  if (pathname === '/') return 'Escaparate e Itinerarios de México';
  if (pathname.startsWith('/destinos')) return 'Guía de Destino e Itinerario Inteligente';
  if (pathname.startsWith('/registro')) return 'Correspondencia y Carta de Viajero';
  return 'Veleta · Rutas de México';
}

export function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [health, setHealth] = useState({ demoMode: true, fotos: 'curadas' });
  const [forceIntroCounter, setForceIntroCounter] = useState(1);
  const [skipIntroCounter, setSkipIntroCounter] = useState(0);
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    apiRequest('/api/salud')
      .then((d) => setHealth({ demoMode: d.clima === 'demo', fotos: d.fotos || 'curadas' }))
      .catch(() => {});
  }, []);

  // Cada vez que se cambia de módulo (ruta), dispara la animación de entrada y sube al inicio
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      setForceIntroCounter((n) => n + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.pathname]);

  // Al presionar el nombre de la página ("Veleta"), lleva al inicio de la página
  const handleBrandClick = (e) => {
    if (e) e.preventDefault();
    if (location.pathname !== '/') {
      navigate('/');
    } else {
      setSkipIntroCounter((n) => n + 1);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Animación cinematográfica de entrada al recargar y al cambiar de módulo */}
      <IntroSplash
        forceOpenCounter={forceIntroCounter}
        skipCounter={skipIntroCounter}
        moduleLabel={getModuleTitle(location.pathname)}
        onBrandClick={handleBrandClick}
      />

      {/* Cintillo informativo superior de clima y fotografía */}
      <div className="press-ribbon">
        <div className="wrap press-ribbon-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              className="stamp-pill"
              style={{
                color: health.demoMode ? '#FFC21A' : '#00E5A3',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <AnimatedEmoticon name="smile" size={14} />
              <span>{health.demoMode ? 'Pronóstico Meteorológico Activo' : 'OpenWeather: Clima en Vivo'}</span>
            </span>
            <span
              className="stamp-pill"
              style={{
                color: health.fotos === 'pexels-api' ? '#00E5A3' : '#FFC21A',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <AnimatedEmoticon name="camera" size={14} />
              <span>{health.fotos === 'pexels-api' ? 'Pexels Fotografía en Vivo' : 'Colección Fotográfica HD'}</span>
            </span>
          </div>
          <Link to="/#armador-viaje" style={{ color: '#FFC21A', fontWeight: 700, fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <AnimatedEmoticon name="pin" size={13} />
            <span>Planificador inteligente de itinerario día por día →</span>
          </Link>
        </div>
      </div>

      {/* Cabecera principal */}
      <header className="site-header">
        <div className="wrap header-inner">
          <Link
            to="/"
            onClick={handleBrandClick}
            className="brand-mark"
            aria-label="Veleta — Ir al inicio de la página"
            title="Ir al inicio de la página"
          >
            <WeathervaneIcon />
            <span>Veleta</span>
          </Link>

          <nav className="nav-links" aria-label="Navegación principal">
            <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Inicio
            </NavLink>
            <NavLink to="/destinos/cancun" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Destinos e Itinerarios
            </NavLink>

            {user ? (
              <>
                <NavLink
                  to="/registro"
                  style={{
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    padding: '5px 10px',
                    background: '#FFC21A',
                    border: '2px solid #1A1830',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <AnimatedEmoticon name="quill" size={15} />
                  <span>Bitácora de {user.name}</span>
                </NavLink>
                <button type="button" onClick={logout} className="btn btn-sm">
                  Salir
                </button>
              </>
            ) : (
              <NavLink
                to="/registro"
                className="btn btn-primary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <AnimatedEmoticon name="quill" size={15} />
                <span>Firmar Carta / Entrar</span>
              </NavLink>
            )}
          </nav>
        </div>
      </header>

      <main style={{ flex: 1 }}>{children}</main>

      {/* Pie de imprenta */}
      <footer className="site-footer">
        <div className="wrap" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '32px' }}>
          <div>
            <Link
              to="/"
              onClick={handleBrandClick}
              className="brand-mark"
              style={{ color: '#FAF8F3', marginBottom: '8px' }}
              title="Ir al inicio de la página"
            >
              <WeathervaneIcon />
              <span>Veleta</span>
            </Link>
            <p style={{ margin: 0, color: '#D8D4C8', fontSize: '0.94rem', maxWidth: '42ch' }}>
              Planificador inteligente de itinerarios por México con rutas optimizadas día por día, paradas intermedias,
              hoteles con precios por noche, fotografías de gran formato y pronóstico en tiempo real.
            </p>
          </div>

          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', textTransform: 'uppercase', margin: '0 0 10px', color: '#FFC21A' }}>
              Módulos de Viaje
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '6px', fontSize: '0.94rem' }}>
              <li><Link to="/">1. Inicio · Escaparate Fotográfico, Tablero y Planificador</Link></li>
              <li><Link to="/destinos/cancun">2. Destinos e Itinerarios · Rutas Día por Día, Hoteles y Clima</Link></li>
              <li><Link to="/registro">3. Carta de Viajero · Firma de Acceso, Rutas Guardadas e Historial</Link></li>
            </ul>
          </div>

          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', textTransform: 'uppercase', margin: '0 0 10px', color: '#FFC21A' }}>
              Privacidad y Correspondencia Segura
            </h2>
            <p style={{ margin: 0, color: '#D8D4C8', fontSize: '0.9rem' }}>
              Tus itinerarios personalizados, bitácora de lugares visitados y preferencias de viaje se resguardan de
              forma cifrada bajo los lineamientos de protección de datos personales (Derechos ARCO).
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
