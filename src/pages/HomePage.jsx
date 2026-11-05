import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PosterCard, SkyEmblem } from '../components/PosterArt.jsx';
import { ScrollReveal, DuotonePhoto, AnimatedEmoticon } from '../components/Motion.jsx';
import { TripPlanner } from '../components/TripPlanner.jsx';

export function HomePage() {
  const navigate = useNavigate();
  const { favorites, toggleFavorite } = useAuth();
  const [destinations, setDestinations] = useState([]);
  const [weatherList, setWeatherList] = useState([]);
  const [activeHeroSlug, setActiveHeroSlug] = useState('cancun');
  const [featuredWeather, setFeaturedWeather] = useState(null);
  const [featuredDetail, setFeaturedDetail] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estado de parallax suave para el cartel del héroe
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const carouselRef = useRef(null);

  useEffect(() => {
    let active = true;
    async function loadCatalog() {
      try {
        setLoading(true);
        const [destRes, wxRes] = await Promise.all([
          apiRequest('/api/destinos'),
          apiRequest('/api/clima'),
        ]);
        if (!active) return;
        setDestinations(destRes.destinations || []);
        setWeatherList(wxRes.items || []);
        setError('');
      } catch (err) {
        if (active) setError(err.message || 'No se pudo cargar el catálogo de destinos.');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadCatalog();
    return () => {
      active = false;
    };
  }, []);

  // Cargar detalle fotográfico y clima del destino activo en el escaparate
  useEffect(() => {
    let active = true;
    Promise.all([
      apiRequest(`/api/clima/${activeHeroSlug}`),
      apiRequest(`/api/destinos/${activeHeroSlug}`),
    ])
      .then(([wx, detail]) => {
        if (!active) return;
        setFeaturedWeather(wx);
        setFeaturedDetail(detail);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [activeHeroSlug]);

  const weatherBySlug = useMemo(() => {
    const map = new Map();
    for (const item of weatherList) map.set(item.slug, item);
    return map;
  }, [weatherList]);

  const featuredDest = useMemo(
    () =>
      featuredDetail ||
      destinations.find((d) => d.slug === activeHeroSlug) ||
      destinations[0] ||
      null,
    [featuredDetail, destinations, activeHeroSlug],
  );

  const filteredDestinations = useMemo(() => {
    const norm = searchTerm
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
    return destinations.filter((d) => {
      if (onlyFavorites && !favorites.includes(d.slug)) return false;
      if (!norm) return true;
      const hay = `${d.name} ${d.state} ${d.tagline}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      return hay.includes(norm);
    });
  }, [destinations, searchTerm, onlyFavorites, favorites]);

  const handleFavorite = async (slug) => {
    const res = await toggleFavorite(slug);
    if (res?.requiresAuth) {
      navigate('/registro');
    }
  };

  const handleHeroMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: nx * 9, y: -ny * 9 });
  };

  const scrollCarousel = (dir) => {
    if (!carouselRef.current) return;
    carouselRef.current.scrollBy({ left: dir * 380, behavior: 'smooth' });
  };

  return (
    <div>
      {/* PRIMERA VISTA: Escaparate fotográfico con selector de postales en vivo y cartel con foto protagonista */}
      <section
        className="wrap hero-split press-reveal"
        aria-labelledby="hero-heading"
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      >
        <div className="hero-copy">
          <div>
            <span className="script-accent" style={{ fontSize: '2.2rem', display: 'block', lineHeight: 1 }}>
              Visite México hoy
            </span>
            <h1 id="hero-heading" className="display-title misregister" style={{ marginTop: '4px' }}>
              Fotografía, clima y hoteles en cartel.
            </h1>
          </div>

          <p className="hero-lead">
            Explora México en <strong>fotografía de gran formato</strong>, consulta los{' '}
            <strong>días recomendados por la API de clima</strong> y arma tu ruta con{' '}
            <strong>hoteles, lugares turísticos, mapa desde tu hotel e imprimible de recuerdos</strong>.
          </p>

          {/* TIRA DE POSTALES FOTOGRÁFICAS INTERACTIVAS: haz clic para cambiar la foto y cartel del héroe */}
          {destinations.length > 0 && (
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', color: 'var(--color-cobalt)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AnimatedEmoticon name="camera" size={16} />
                <span>Galería rápida · Haz clic en una postal para ver su foto y clima en vivo:</span>
              </div>
              <div className="hero-photo-strip">
                {destinations.map((d) => {
                  const active = d.slug === activeHeroSlug;
                  return (
                    <button
                      key={d.slug}
                      type="button"
                      onClick={() => setActiveHeroSlug(d.slug)}
                      className={`hero-thumb-btn ${active ? 'active' : ''}`}
                      title={`${d.name}, ${d.state}`}
                    >
                      <img src={d.heroPhoto} alt={d.name} loading="lazy" />
                      <span>{d.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <form
            className="search-bar"
            onSubmit={(e) => {
              e.preventDefault();
              const el = document.getElementById('pared-carteles');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <div style={{ flex: '1 1 240px' }}>
              <label htmlFor="destino-search" className="field-label" style={{ display: 'block', marginBottom: '6px' }}>
                Buscar destino, estado o atractivo
              </label>
              <input
                id="destino-search"
                type="search"
                className="input-field"
                placeholder="Ej. Oaxaca, Cancún, Chichén Itzá, Chiapas…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
              <a href="#armador-viaje" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <AnimatedEmoticon name="bolt" size={16} />
                <span>Armar guía interactiva / 1 clic</span>
              </a>
              <a href="#pared-carteles" className="btn btn-sun">
                Ver galería ({filteredDestinations.length})
              </a>
            </div>
          </form>

          {/* Etiqueta rápida del destino destacado */}
          {featuredWeather && (
            <div className="luggage-tag" style={{ marginTop: '4px' }}>
              <span className="luggage-grommet" aria-hidden="true" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
                <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.45rem', textTransform: 'uppercase' }}>
                  Maleta sugerida hoy para {featuredWeather.name}:
                </strong>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-cobalt)' }}>
                  {featuredWeather.verdict?.label} · Hoteles desde ${featuredDest?.minHotelPrice?.toLocaleString('es-MX') || '950'} MXN/noche
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                {(featuredWeather.packing || []).slice(0, 5).map((item) => (
                  <span
                    key={item}
                    style={{
                      background: '#FFFFFF',
                      border: '1.5px solid #1A1830',
                      padding: '4px 10px',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <AnimatedEmoticon name="check" size={14} />
                    <span>{item}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Cartel fotográfico vertical clavado a la derecha con parallax interactivo */}
        <div className="hero-poster-stage">
          <div
            className="pinned-poster-wrap"
            style={{
              transform: `rotate(1.6deg) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
            }}
          >
            <div className="poster-pin" aria-hidden="true" />
            {featuredDest ? (
              <PosterCard
                destination={featuredDest}
                weather={featuredWeather || weatherBySlug.get(featuredDest.slug)}
                featured
                isFavorite={favorites.includes(featuredDest.slug)}
                onToggleFavorite={handleFavorite}
              />
            ) : (
              <div className="ticket-sheet" style={{ aspectRatio: '3 / 4', display: 'grid', placeItems: 'center' }}>
                Revelando fotografía del día…
              </div>
            )}
          </div>
        </div>
      </section>

      {/* TABLERO MECÁNICO DE SALIDAS CON MINIATURAS FOTOGRÁFICAS */}
      <section className="departure-board no-print" aria-labelledby="board-heading">
        <div className="wrap">
          <div className="board-header">
            <h2 id="board-heading" className="section-title" style={{ color: '#FFC21A', fontSize: '2rem' }}>
              Tablero nacional · Fotografía, clima en vivo y tarifa hotelera
            </h2>
            <span style={{ fontSize: '0.86rem', color: '#D8D4C8' }}>
              Haz clic en cualquier destino para abrir su galería de lugares famosos y hoteles
            </span>
          </div>

          <div className="board-grid">
            {destinations.map((d) => {
              const wx = weatherBySlug.get(d.slug);
              return (
                <Link key={d.slug} to={`/destinos/${d.slug}`} className="flap-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {d.heroPhoto && (
                      <img
                        src={d.heroPhoto}
                        alt={d.name}
                        loading="lazy"
                        style={{
                          width: 56,
                          height: 56,
                          objectFit: 'cover',
                          border: '2px solid #FFC21A',
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <div>
                      <div className="flap-city">{d.name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#D8D4C8' }}>
                        {d.state} · {wx?.description || 'Consultando…'}
                        {d.minHotelPrice ? ` · Desde $${d.minHotelPrice.toLocaleString('es-MX')}` : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#FFC21A' }}>
                    <SkyEmblem sky={wx?.sky || 'clear'} size={24} />
                    <span className="flap-temp">{wx?.temp ?? '—'}°</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CARRUSEL FOTOGRÁFICO DE GRAN FORMATO DEL DESTINO SELECCIONADO */}
      {featuredDetail?.places?.length > 0 && (
        <section className="wrap no-print" style={{ paddingTop: '56px' }} aria-labelledby="featured-places-heading">
          <div className="section-head" style={{ marginBottom: '20px' }}>
            <div>
              <span className="script-accent" style={{ fontSize: '1.85rem', display: 'block' }}>
                Galería de lugares emblemáticos y hoteles
              </span>
              <h2 id="featured-places-heading" className="section-title">
                Fotografías de {featuredDetail.name}, {featuredDetail.state}
              </h2>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => scrollCarousel(-1)} className="btn btn-sm" aria-label="Anterior lugar">
                ← Anterior
              </button>
              <button type="button" onClick={() => scrollCarousel(1)} className="btn btn-sm" aria-label="Siguiente lugar">
                Siguiente →
              </button>
              <Link to={`/destinos/${featuredDetail.slug}`} className="btn btn-primary btn-sm">
                Abrir guía completa de {featuredDetail.name} →
              </Link>
            </div>
          </div>

          <div className="places-carousel-wrap">
            <div className="places-carousel-track" ref={carouselRef}>
              {featuredDetail.places.map((place) => (
                <article key={place.name} className="place-slide-card">
                  <DuotonePhoto
                    src={place.photo}
                    alt={place.name}
                    tint={featuredDetail.inks.bg}
                    ink={featuredDetail.inks.ink}
                    height={255}
                    badgeText={place.kind}
                    credit={place.photographer}
                  />
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', textTransform: 'uppercase', margin: 0, lineHeight: 0.96 }}>
                      {place.name}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-ink)' }}>{place.description}</p>
                    <div
                      style={{
                        marginTop: 'auto',
                        paddingTop: '10px',
                        borderTop: '1.5px dashed #1A1830',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '8px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span style={{ color: 'var(--color-cobalt)' }}>{place.entry}</span>
                      <span style={{ color: 'var(--color-muted)' }}>{place.hours}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ARMADOR INTERACTIVO DE GUÍA TURÍSTICA (EXCLUSIVO PARA USUARIOS REGISTRADOS) */}
      <div className="wrap" style={{ paddingTop: '56px' }}>
        <TripPlanner
          initialSlug={featuredDest?.slug || 'cancun'}
          onSlugChange={(slug) => setActiveHeroSlug(slug)}
        />
      </div>

      {/* PARED DE CARTELES FOTOGRÁFICOS 3:4 CON ENTRADA ESCALONADA AL HACER SCROLL */}
      <section id="pared-carteles" className="wrap poster-wall-section" aria-labelledby="wall-heading">
        <div className="section-head">
          <div>
            <span className="script-accent" style={{ fontSize: '1.8rem', display: 'block' }}>
              Colección fotográfica con clima en vivo y tarifas
            </span>
            <h2 id="wall-heading" className="section-title">
              Destinos de México ({filteredDestinations.length})
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setOnlyFavorites((v) => !v)}
              className={`btn btn-sm ${onlyFavorites ? 'btn-primary' : ''}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <AnimatedEmoticon name={onlyFavorites ? 'star' : 'star-outline'} size={15} />
              <span>{onlyFavorites ? 'Mostrando favoritos' : 'Filtrar mis favoritos'}</span>
            </button>
            {searchTerm && (
              <button type="button" onClick={() => setSearchTerm('')} className="btn btn-sm">
                Limpiar búsqueda
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="ticket-sheet" role="alert" style={{ borderColor: 'var(--color-red)', marginBottom: '24px' }}>
            <strong style={{ color: 'var(--color-red)' }}>Problema al cargar:</strong> {error}
          </div>
        )}

        {loading ? (
          <div className="ticket-sheet" style={{ textAlign: 'center', padding: '48px' }}>
            Revelando fotografías, clima, lugares y hoteles…
          </div>
        ) : filteredDestinations.length === 0 ? (
          <div className="ticket-sheet" style={{ textAlign: 'center', padding: '48px' }}>
            <p style={{ marginTop: 0, fontWeight: 700 }}>
              No encontramos destinos que coincidan con tu filtro actual.
            </p>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                setSearchTerm('');
                setOnlyFavorites(false);
              }}
            >
              Ver todos los carteles
            </button>
          </div>
        ) : (
          <div className="poster-wall-grid">
            {filteredDestinations.map((dest, idx) => (
              <ScrollReveal key={dest.slug} delay={(idx % 3) * 80}>
                <PosterCard
                  destination={dest}
                  weather={weatherBySlug.get(dest.slug)}
                  isFavorite={favorites.includes(dest.slug)}
                  onToggleFavorite={handleFavorite}
                />
              </ScrollReveal>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
