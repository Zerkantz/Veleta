import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PosterCard, SkyEmblem } from '../components/PosterArt.jsx';
import { ScrollReveal, DuotonePhoto, AnimatedEmoticon } from '../components/Motion.jsx';
import { TripPlanner } from '../components/TripPlanner.jsx';

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const TIER_META = {
  economico: { label: 'Económico · $', bg: '#00A3A1', fg: '#1A1830' },
  medio: { label: 'Gama Media · $$', bg: '#FFC21A', fg: '#1A1830' },
  alto: { label: 'Gran Turismo / Boutique · $$$', bg: '#E4007C', fg: '#FFFFFF' },
};

function formatDayName(isoDate, idx) {
  if (idx === 0) return 'Hoy';
  if (idx === 1) return 'Mañana';
  const d = new Date(`${isoDate}T12:00:00`);
  return d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' });
}

const fmtMxn = (n) => `$${Number(n).toLocaleString('es-MX')}`;

export function DestinationPage() {
  const { slug = 'cancun' } = useParams();
  const navigate = useNavigate();
  const { favorites, toggleFavorite } = useAuth();
  const [allDestinations, setAllDestinations] = useState([]);
  const [destination, setDestination] = useState(null);
  const [weather, setWeather] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});
  const [kindFilter, setKindFilter] = useState('todos');
  const [nights, setNights] = useState(3);
  const [selectedTier, setSelectedTier] = useState('medio');
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const placesCarouselRef = useRef(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        const [allRes, destRes, wxRes] = await Promise.all([
          apiRequest('/api/destinos'),
          apiRequest(`/api/destinos/${slug}`),
          apiRequest(`/api/clima/${slug}`),
        ]);
        if (!active) return;
        setAllDestinations(allRes.destinations || []);
        setDestination(destRes);
        setWeather(wxRes);
        setCheckedItems({});
        setKindFilter('todos');
        setActivePhotoIndex(0);
        setError('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (err) {
        if (active) setError(err.message || 'No se pudo cargar este destino.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [slug]);

  const handleFavorite = async (targetSlug) => {
    const res = await toggleFavorite(targetSlug);
    if (res?.requiresAuth) navigate('/registro');
  };

  // Galería unificada de fotos del destino (panorámica + lugares + hoteles)
  const destinationGallery = useMemo(() => {
    if (!destination) return [];
    const items = [
      {
        src: destination.heroPhoto,
        label: `Panorámica de ${destination.name}`,
        badge: `Postal de ${destination.state}`,
        credit: destination.heroPhotographer,
      },
      ...(destination.places || []).map((p) => ({
        src: p.photo,
        label: p.name,
        badge: `Lugar · ${p.kind} (${p.entry})`,
        credit: p.photographer,
      })),
      ...(destination.hotels || []).map((h) => ({
        src: h.photo,
        label: h.name,
        badge: `Hotel · $${h.priceFrom}–$${h.priceTo} MXN`,
        credit: null,
      })),
    ];
    return items.filter((i) => Boolean(i.src));
  }, [destination]);

  const currentHeroPhoto = destinationGallery[activePhotoIndex] || destinationGallery[0] || {
    src: destination?.heroPhoto,
    label: destination?.name,
    badge: destination?.state,
  };

  const placeKinds = useMemo(() => {
    const set = new Set((destination?.places || []).map((p) => p.kind));
    return ['todos', ...set];
  }, [destination]);

  const filteredPlaces = useMemo(() => {
    const list = destination?.places || [];
    if (kindFilter === 'todos') return list;
    return list.filter((p) => p.kind === kindFilter);
  }, [destination, kindFilter]);

  const selectedHotel = useMemo(() => {
    const hotels = destination?.hotels || [];
    return hotels.find((h) => h.tier === selectedTier) || hotels[0] || null;
  }, [destination, selectedTier]);

  const scrollPlaces = (dir) => {
    if (!placesCarouselRef.current) return;
    placesCarouselRef.current.scrollBy({ left: dir * 360, behavior: 'smooth' });
  };

  if (loading && !destination) {
    return (
      <div className="wrap" style={{ padding: '64px 24px' }}>
        <div className="ticket-sheet">Consultando guía turística, fotos, hoteles y pronóstico de {slug}…</div>
      </div>
    );
  }

  if (error || !destination) {
    return (
      <div className="wrap" style={{ padding: '64px 24px' }}>
        <div className="ticket-sheet" role="alert">
          <h1 className="section-title">Destino no encontrado</h1>
          <p>{error || 'El cartel solicitado no existe en el catálogo.'}</p>
          <Link to="/" className="btn btn-primary btn-sm">
            Volver a la pared de carteles
          </Link>
        </div>
      </div>
    );
  }

  const currentMonth = new Date().getMonth() + 1;
  const verdict = weather?.verdict || { level: 'si', label: 'Buen momento', text: '' };
  const verdictColor =
    verdict.level === 'si' ? '#1E8E5A' : verdict.level === 'no' ? '#D3242C' : '#FFC21A';
  const verdictTextFg = verdict.level === 'quizas' ? '#1A1830' : '#FFFFFF';

  return (
    <div key={destination.slug} className="wrap press-reveal" style={{ padding: '36px 24px 64px' }}>
      {/* Selector rápido de destino estilo pestañas de imprenta */}
      <nav className="no-print" aria-label="Cambiar de destino" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <Link to="/" style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--color-cobalt)' }}>
            ← Volver a la pared de carteles
          </Link>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--color-muted)', fontWeight: 700 }}>
            <span>Clima: {weather?.demo ? `Modo Demo (${weather.demoReason})` : 'OpenWeather API en tiempo real'}</span>
            <span>·</span>
            <span>Fotos: {destination.photosLive ? 'Pexels API en vivo' : 'Fotografías HD activas'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {allDestinations.map((d) => {
            const active = d.slug === destination.slug;
            return (
              <Link
                key={d.slug}
                to={`/destinos/${d.slug}`}
                className="btn btn-sm"
                style={{
                  background: active ? d.inks.bg : '#FFFFFF',
                  color: active ? d.inks.text : '#1A1830',
                }}
              >
                {d.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* SECCIÓN 1: Cartel fotográfico a la izquierda + Visor de Galería Panorámica y Clima a la derecha */}
      <div
        className="no-print"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '40px',
          alignItems: 'start',
          marginBottom: '56px',
        }}
      >
        <div style={{ maxWidth: 430, width: '100%', margin: '0 auto' }}>
          <PosterCard
            destination={destination}
            weather={weather}
            featured
            isFavorite={favorites.includes(destination.slug)}
            onToggleFavorite={handleFavorite}
          />
          <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <a href="#armador-viaje" className="btn btn-sm btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <AnimatedEmoticon name="bolt" size={14} />
              <span>Armar ruta, mapa e imprimible</span>
            </a>
            <a href="#lugares-conocidos" className="btn btn-sm btn-sun">
              ↓ Ver {destination.places?.length || 5} lugares
            </a>
            <a href="#hoteles-precios" className="btn btn-sm">
              ↓ Hoteles y precios
            </a>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Visor fotográfico panorámico con tira de miniaturas interactivas */}
          <div className="ticket-sheet" style={{ padding: 0, overflow: 'hidden' }}>
            <DuotonePhoto
              src={currentHeroPhoto.src}
              alt={currentHeroPhoto.label}
              tint={destination.inks.bg}
              ink={destination.inks.ink}
              height={340}
              badgeText={`${currentHeroPhoto.badge} · ${currentHeroPhoto.label}`}
              credit={currentHeroPhoto.credit}
            />

            {/* Tira de miniaturas de lugares y hoteles del destino */}
            {destinationGallery.length > 1 && (
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  padding: '10px 14px',
                  background: '#1A1830',
                  overflowX: 'auto',
                  borderBottom: '2px solid #1A1830',
                }}
              >
                {destinationGallery.map((item, idx) => (
                  <button
                    key={`${item.label}-${idx}`}
                    type="button"
                    onClick={() => setActivePhotoIndex(idx)}
                    style={{
                      border: activePhotoIndex === idx ? '2.5px solid #FFC21A' : '1.5px solid #575568',
                      padding: 0,
                      background: '#000',
                      cursor: 'pointer',
                      flexShrink: 0,
                      position: 'relative',
                      width: 78,
                      height: 52,
                      overflow: 'hidden',
                    }}
                    title={item.label}
                  >
                    <img
                      src={item.src}
                      alt={item.label}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: activePhotoIndex === idx ? 1 : 0.7,
                      }}
                    />
                  </button>
                ))}
              </div>
            )}

            <div style={{ padding: '24px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-cobalt)' }}>
                    Guía turística y fotográfica · {destination.state}
                  </span>
                  <h1 className="section-title" style={{ marginTop: '4px' }}>
                    {destination.name}
                  </h1>
                </div>

                <span
                  style={{
                    background: verdictColor,
                    color: verdictTextFg,
                    padding: '8px 14px',
                    border: '2px solid #1A1830',
                    fontWeight: 900,
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    boxShadow: '3px 3px 0 #1A1830',
                  }}
                >
                  Veredicto hoy: {verdict.label}
                </span>
              </div>

              <p className="measure" style={{ fontSize: '1.05rem', marginTop: '12px', marginBottom: '8px' }}>
                {destination.description}
              </p>
              <p style={{ margin: 0, fontWeight: 700, color: 'var(--color-cobalt)' }}>{verdict.text}</p>

              {/* Métricas en vivo sobre papel limpio */}
              {weather?.current && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '12px',
                    marginTop: '18px',
                    paddingTop: '16px',
                    borderTop: '2px dashed #1A1830',
                  }}
                >
                  <div>
                    <div className="field-hint">Temperatura</div>
                    <strong style={{ fontFamily: 'var(--font-display)', fontSize: '2rem' }}>{weather.current.temp}°C</strong>
                  </div>
                  <div>
                    <div className="field-hint">Sensación térmica</div>
                    <strong style={{ fontFamily: 'var(--font-display)', fontSize: '2rem' }}>{weather.current.feelsLike}°C</strong>
                  </div>
                  <div>
                    <div className="field-hint">Humedad</div>
                    <strong style={{ fontFamily: 'var(--font-display)', fontSize: '2rem' }}>{weather.current.humidity}%</strong>
                  </div>
                  <div>
                    <div className="field-hint">Viento</div>
                    <strong style={{ fontFamily: 'var(--font-display)', fontSize: '2rem' }}>{weather.current.windKmh} km/h</strong>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pronóstico extendido de 5 días */}
          {weather?.daily && (
            <section className="ticket-sheet" aria-labelledby="forecast-heading">
              <h2 id="forecast-heading" style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', textTransform: 'uppercase', margin: '0 0 14px' }}>
                Pronóstico de 5 días
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))', gap: '10px' }}>
                {weather.daily.map((day, idx) => (
                  <div
                    key={day.date}
                    style={{
                      border: '2px solid #1A1830',
                      background: idx === 0 ? '#FFF6D6' : '#F3F1EC',
                      padding: '12px 10px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase' }}>
                      {formatDayName(day.date, idx)}
                    </div>
                    <div style={{ margin: '8px auto', color: '#1A1830', display: 'flex', justifyContent: 'center' }}>
                      <SkyEmblem sky={day.sky} size={28} />
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.55rem', fontWeight: 900 }}>
                      {day.max}° <span style={{ color: 'var(--color-muted)', fontSize: '1.2rem' }}>/ {day.min}°</span>
                    </div>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, marginTop: '4px' }}>
                      Lluvia: {day.pop}%
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* ARMADOR INTERACTIVO DE VIAJE, RUTA DESDE EL HOTEL E IMPRIMIBLE DE COMPRAS */}
      <ScrollReveal>
        <div style={{ marginBottom: '56px' }}>
          <TripPlanner
            initialSlug={destination.slug}
            onSlugChange={(newSlug) => {
              if (newSlug !== destination.slug) navigate(`/destinos/${newSlug}`);
            }}
          />
        </div>
      </ScrollReveal>

      {/* SECCIÓN 2: CARRUSEL DE LUGARES CONOCIDOS CON FOTOS Y PRECIOS DE ENTRADA */}
      <ScrollReveal>
        <section id="lugares-conocidos" className="no-print" style={{ marginBottom: '56px' }} aria-labelledby="places-heading">
          <div className="section-head" style={{ marginBottom: '20px' }}>
            <div>
              <span className="script-accent" style={{ fontSize: '1.85rem', display: 'block' }}>
                Guía de atractivos imperdibles
              </span>
              <h2 id="places-heading" className="section-title">
                Lugares conocidos en {destination.name} ({filteredPlaces.length})
              </h2>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {placeKinds.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKindFilter(k)}
                  className={`btn btn-sm ${kindFilter === k ? 'btn-cobalt' : ''}`}
                >
                  {k === 'todos' ? 'Todos' : k}
                </button>
              ))}
              <button type="button" onClick={() => scrollPlaces(-1)} className="btn btn-sm" aria-label="Desplazar carrusel a la izquierda">
                ←
              </button>
              <button type="button" onClick={() => scrollPlaces(1)} className="btn btn-sm" aria-label="Desplazar carrusel a la derecha">
                →
              </button>
            </div>
          </div>

          <div className="places-carousel-wrap">
            <div className="places-carousel-track" ref={placesCarouselRef}>
              {filteredPlaces.map((place) => (
                <article key={place.name} className="place-slide-card">
                  <DuotonePhoto
                    src={place.photo}
                    alt={place.name}
                    tint={destination.inks.bg}
                    ink={destination.inks.ink}
                    height={255}
                    badgeText={place.kind}
                    credit={place.photographer}
                  />
                  <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                    <h3
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.75rem',
                        textTransform: 'uppercase',
                        margin: 0,
                        lineHeight: 0.95,
                      }}
                    >
                      {place.name}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.92rem' }}>{place.description}</p>

                    <div
                      style={{
                        marginTop: 'auto',
                        paddingTop: '12px',
                        borderTop: '2px dashed #1A1830',
                        display: 'grid',
                        gap: '4px',
                        fontSize: '0.82rem',
                      }}
                    >
                      <div>
                        <strong>Costo de entrada:</strong>{' '}
                        <span style={{ color: 'var(--color-cobalt)', fontWeight: 800 }}>{place.entry}</span>
                      </div>
                      <div>
                        <strong>Horario:</strong> <span style={{ color: 'var(--color-muted)' }}>{place.hours}</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* SECCIÓN 3: HOTELES RECOMENDADOS CON RANGO DE PRECIOS Y CALCULADORA DE PRESUPUESTO */}
      <ScrollReveal>
        <section id="hoteles-precios" className="no-print" style={{ marginBottom: '56px' }} aria-labelledby="hotels-heading">
          <div className="section-head" style={{ marginBottom: '20px' }}>
            <div>
              <span className="script-accent" style={{ fontSize: '1.85rem', display: 'block' }}>
                Hospedaje por categoría
              </span>
              <h2 id="hotels-heading" className="section-title">
                Hoteles en {destination.name} y Precios por Noche
              </h2>
            </div>
            <span className="stamp-pill" style={{ color: 'var(--color-cobalt)' }}>
              Precios de referencia en MXN · {destination.priceReferenceDate || 'Octubre 2026'} (habitación doble estándar)
            </span>
          </div>

          <div className="hotels-grid">
            {(destination.hotels || []).map((hotel) => {
              const tier = TIER_META[hotel.tier] || TIER_META.medio;
              return (
                <article key={hotel.name} className="hotel-voucher-card">
                  <DuotonePhoto
                    src={hotel.photo}
                    alt={hotel.name}
                    tint={destination.inks.bg}
                    ink={destination.inks.ink}
                    height={235}
                    badgeText={tier.label}
                  />

                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-muted)' }}>
                        {hotel.zone}
                      </span>
                      <span
                        style={{
                          background: '#FFC21A',
                          color: '#1A1830',
                          border: '1.5px solid #1A1830',
                          padding: '2px 7px',
                          fontSize: '0.76rem',
                          fontWeight: 900,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <AnimatedEmoticon name="star" size={12} />
                        <span>{String(hotel.rating || '4.6').replace('★', '').trim()}</span>
                      </span>
                    </div>

                    <h3
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.85rem',
                        textTransform: 'uppercase',
                        margin: 0,
                        lineHeight: 0.95,
                      }}
                    >
                      {hotel.name}
                    </h3>

                    <p style={{ margin: 0, fontSize: '0.92rem' }}>{hotel.highlight}</p>

                    <div
                      style={{
                        marginTop: 'auto',
                        paddingTop: '14px',
                        borderTop: '2px dashed #1A1830',
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'space-between',
                        gap: '12px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-muted)' }}>
                          Tarifa de referencia / noche
                        </div>
                        <div className="price-stamp">
                          {fmtMxn(hotel.priceFrom)} – {fmtMxn(hotel.priceTo)} <span style={{ fontSize: '1rem' }}>MXN</span>
                        </div>
                      </div>

                      <a
                        href={hotel.availabilityUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-sm"
                      >
                        Ver disponibilidad ↗
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Calculadora interactiva de presupuesto de hospedaje */}
          {selectedHotel && (
            <div className="ticket-sheet" style={{ marginTop: '24px', background: '#FFF6D6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 300px' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', textTransform: 'uppercase', margin: '0 0 6px' }}>
                    Calculadora rápida de hospedaje en {destination.name}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>
                    Elige el número de noches y la categoría de hotel para estimar tu presupuesto de estancia (tarifas de referencia octubre 2026):
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div>
                    <label htmlFor="calc-nights" className="field-label" style={{ display: 'block', marginBottom: '4px' }}>
                      Noches: {nights}
                    </label>
                    <input
                      id="calc-nights"
                      type="range"
                      min="1"
                      max="10"
                      value={nights}
                      onChange={(e) => setNights(Number(e.target.value))}
                      style={{ width: '150px', accentColor: 'var(--color-pink)' }}
                    />
                  </div>

                  <div>
                    <label htmlFor="calc-tier" className="field-label" style={{ display: 'block', marginBottom: '4px' }}>
                      Categoría
                    </label>
                    <select
                      id="calc-tier"
                      className="input-field"
                      style={{ padding: '8px 12px' }}
                      value={selectedTier}
                      onChange={(e) => setSelectedTier(e.target.value)}
                    >
                      <option value="economico">Económico ($)</option>
                      <option value="medio">Gama Media ($$)</option>
                      <option value="alto">Gran Turismo / Boutique ($$$)</option>
                    </select>
                  </div>

                  <div
                    style={{
                      background: '#FFFFFF',
                      border: '2px solid #1A1830',
                      padding: '10px 16px',
                      boxShadow: '3px 3px 0 #1A1830',
                    }}
                  >
                    <div style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-muted)' }}>
                      Estimado por {nights} {nights === 1 ? 'noche' : 'noches'} ({selectedHotel.name})
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', fontWeight: 900 }}>
                      {fmtMxn(selectedHotel.priceFrom * nights)} – {fmtMxn(selectedHotel.priceTo * nights)} MXN
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </ScrollReveal>

      {/* SECCIÓN 4: Etiqueta de maleta troquelada y Calendario de mejor época */}
      <ScrollReveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
          <section className="luggage-tag" aria-labelledby="packing-heading">
            <span className="luggage-grommet" aria-hidden="true" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px' }}>
              <h2 id="packing-heading" style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', textTransform: 'uppercase', margin: 0 }}>
                Etiqueta de equipaje · ¿Qué llevar a {destination.name}?
              </h2>
              <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                Según clima actual ({weather?.current?.temp}°C)
              </span>
            </div>

            <p style={{ margin: '6px 0 14px', fontSize: '0.92rem' }}>
              Marca lo que ya tienes listo en tu maleta:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: '10px' }}>
              {(weather?.packing || destination.basePacking || []).map((item) => {
                const done = Boolean(checkedItems[item]);
                return (
                  <label
                    key={item}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: done ? '#1E8E5A' : '#FFFFFF',
                      color: done ? '#FFFFFF' : '#1A1830',
                      border: '2px solid #1A1830',
                      padding: '9px 12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '2px 2px 0 #1A1830',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={done}
                      onChange={() => setCheckedItems((prev) => ({ ...prev, [item]: !prev[item] }))}
                    />
                    <span style={{ textDecoration: done ? 'line-through' : 'none' }}>{item}</span>
                  </label>
                );
              })}
            </div>
          </section>

          <section className="ticket-sheet" aria-labelledby="season-heading">
            <h2 id="season-heading" style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', textTransform: 'uppercase', margin: '0 0 10px' }}>
              Mejor época para viajar (Calendario anual)
            </h2>
            <p style={{ margin: '0 0 8px' }}>
              <strong>Temporada ideal:</strong> {destination.bestSeason}
            </p>
            <p style={{ margin: '0 0 16px', color: 'var(--color-red)', fontWeight: 700 }}>
              <strong>Precaución:</strong> {destination.caution}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
              {MONTH_NAMES.map((m, idx) => {
                const mNum = idx + 1;
                const ideal = destination.bestMonths?.includes(mNum);
                const isNow = mNum === currentMonth;
                return (
                  <div
                    key={m}
                    style={{
                      border: isNow ? '2.5px solid #E4007C' : '1.5px solid #1A1830',
                      background: ideal ? '#00A3A1' : '#F3F1EC',
                      color: ideal ? '#1A1830' : '#575568',
                      padding: '8px 4px',
                      textAlign: 'center',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                    }}
                    title={ideal ? 'Mes recomendado para viajar' : 'Temporada media o lluvias'}
                  >
                    <div>{m}</div>
                    <div style={{ fontSize: '0.7rem', marginTop: '2px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '3px' }}>
                      {ideal ? (
                        <>
                          <AnimatedEmoticon name="star" size={11} />
                          <span>Ideal</span>
                        </>
                      ) : (
                        '·'
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </ScrollReveal>
    </div>
  );
}
