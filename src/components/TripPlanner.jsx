import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { SkyEmblem } from './PosterArt.jsx';
import { DuotonePhoto, AnimatedEmoticon } from './Motion.jsx';

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const TIER_BADGE = {
  economico: { label: 'Económico · $', bg: '#00A3A1', fg: '#1A1830' },
  medio: { label: 'Gama Media · $$', bg: '#FFC21A', fg: '#1A1830' },
  alto: { label: 'Gran Turismo · $$$', bg: '#E4007C', fg: '#FFFFFF' },
};

const fmtMxn = (n) => `$${Math.round(Number(n) || 0).toLocaleString('es-MX')}`;

function haversineKm(lat1, lon1, lat2, lon2) {
  if (
    typeof lat1 !== 'number' ||
    typeof lon1 !== 'number' ||
    typeof lat2 !== 'number' ||
    typeof lon2 !== 'number'
  ) {
    return 2.4;
  }
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.max(0.4, R * c);
}

function formatShortDate(isoDate, idx) {
  if (!isoDate) return '';
  const d = new Date(`${isoDate}T12:00:00`);
  const label = d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
  if (idx === 0) return `Hoy (${label})`;
  if (idx === 1) return `Mañana (${label})`;
  return label;
}

/**
 * Mapa cartográfico serigráfico que dibuja el recorrido empezando desde el Hotel seleccionado (Punto H)
 * y conectando en orden los lugares turísticos elegidos (1, 2, 3...)
 */
function RouteMapFromHotel({ destination, hotel, places, activeStopIdx, onSelectStop }) {
  const nodes = useMemo(() => {
    if (!hotel) return [];
    return [
      {
        id: 'hotel-origin',
        order: 0,
        code: 'H',
        isHotel: true,
        name: hotel.name,
        subtitle: `Punto de partida · ${hotel.zone}`,
        lat: Number(hotel.lat) || destination?.coords?.lat || 20,
        lon: Number(hotel.lon) || destination?.coords?.lon || -100,
        costLabel: `${fmtMxn(hotel.priceFrom)}–${fmtMxn(hotel.priceTo)}/noche`,
      },
      ...(places || []).map((p, idx) => ({
        id: p.name,
        order: idx + 1,
        code: String(idx + 1),
        isHotel: false,
        name: p.name,
        subtitle: `${p.kind} · ${p.hours}`,
        lat: Number(p.lat) || (destination?.coords?.lat || 20) + (idx + 1) * 0.012,
        lon: Number(p.lon) || (destination?.coords?.lon || -100) + (idx + 1) * 0.015,
        costLabel: p.entryFeeMxn > 0 ? `Entrada ${fmtMxn(p.entryFeeMxn)}` : 'Entrada Gratis',
      })),
    ];
  }, [hotel, places, destination]);

  const projected = useMemo(() => {
    if (nodes.length === 0) return { points: [], legs: [], totalKm: 0 };
    const lats = nodes.map((n) => n.lat);
    const lons = nodes.map((n) => n.lon);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);

    const latSpan = Math.max(maxLat - minLat, 0.008);
    const lonSpan = Math.max(maxLon - minLon, 0.008);

    const padX = 95;
    const padY = 68;
    const width = 760 - padX * 2;
    const height = 400 - padY * 2;

    const points = nodes.map((n, idx) => {
      const nx = (n.lon - minLon) / lonSpan;
      const ny = 1 - (n.lat - minLat) / latSpan;
      const jitterX = nodes.length > 1 ? Math.sin(idx * 2.1) * 14 : 0;
      const jitterY = nodes.length > 1 ? Math.cos(idx * 1.7) * 12 : 0;
      return {
        ...n,
        x: Math.round(padX + nx * width + jitterX),
        y: Math.round(padY + ny * height + jitterY),
      };
    });

    const legs = [];
    let totalKm = 0;
    for (let i = 0; i < points.length - 1; i += 1) {
      const a = points[i];
      const b = points[i + 1];
      const km = haversineKm(a.lat, a.lon, b.lat, b.lon);
      totalKm += km;
      legs.push({
        from: a,
        to: b,
        km: Number(km.toFixed(1)),
        midX: Math.round((a.x + b.x) / 2),
        midY: Math.round((a.y + b.y) / 2),
      });
    }

    return { points, legs, totalKm: Number(totalKm.toFixed(1)) };
  }, [nodes]);

  const googleMapsRouteUrl = useMemo(() => {
    if (nodes.length === 0) return 'https://www.google.com/maps';
    const origin = `${encodeURIComponent(`${nodes[0].name}, ${destination?.name || ''}, México`)}`;
    if (nodes.length === 1) {
      return `https://www.google.com/maps/search/?api=1&query=${origin}`;
    }
    const last = nodes[nodes.length - 1];
    const dest = encodeURIComponent(`${last.name}, ${destination?.name || ''}, México`);
    const waypoints = nodes
      .slice(1, -1)
      .map((n) => encodeURIComponent(`${n.name}, ${destination?.name || ''}, México`))
      .join('|');
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}${
      waypoints ? `&waypoints=${waypoints}` : ''
    }&travelmode=driving`;
  }, [nodes, destination]);

  if (!hotel) return null;

  const polylinePoints = projected.points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="route-map-board">
      <div className="route-map-header">
        <div>
          <span className="stamp-pill" style={{ background: '#FFC21A', color: '#1A1830' }}>
            Cartografía de Ruta · Salida desde tu Hotel
          </span>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.95rem',
              textTransform: 'uppercase',
              margin: '6px 0 0',
              lineHeight: 0.95,
            }}
          >
            Mapa del viaje empezando en {hotel.name}
          </h3>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span
            style={{
              fontWeight: 900,
              fontSize: '0.86rem',
              background: '#FAF8F3',
              border: '2px solid #1A1830',
              padding: '6px 12px',
              boxShadow: '2px 2px 0 #1A1830',
            }}
          >
            Recorrido total: {projected.totalKm} km · {places.length} paradas
          </span>
          <a
            href={googleMapsRouteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-cobalt btn-sm no-print"
          >
            Abrir ruta en Google Maps ↗
          </a>
        </div>
      </div>

      <div className="route-svg-frame">
        <svg
          viewBox="0 0 760 400"
          role="img"
          aria-label={`Mapa de ruta iniciando en ${hotel.name} pasando por ${places.length} lugares turísticos`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        >
          <defs>
            <pattern id="map-grid" width="38" height="38" patternUnits="userSpaceOnUse">
              <path d="M 38 0 L 0 0 0 38" fill="none" stroke="#1A1830" strokeWidth="0.6" strokeOpacity="0.18" />
            </pattern>
          </defs>

          <rect x="0" y="0" width="760" height="400" fill="#EAE6DC" />
          <rect x="0" y="0" width="760" height="400" fill="url(#map-grid)" />

          <circle
            cx="140"
            cy="310"
            r="120"
            fill={destination?.inks?.bg || '#00A3A1'}
            fillOpacity="0.16"
          />
          <circle
            cx="620"
            cy="95"
            r="105"
            fill={destination?.inks?.accent || '#FFC21A'}
            fillOpacity="0.22"
          />

          <rect x="14" y="14" width="732" height="372" fill="none" stroke="#1A1830" strokeWidth="3" />
          <rect
            x="20"
            y="20"
            width="720"
            height="360"
            fill="none"
            stroke="#1A1830"
            strokeWidth="1"
            strokeDasharray="6 4"
          />

          {/* Rosa de los vientos */}
          <g transform="translate(695, 64)">
            <circle cx="0" cy="0" r="28" fill="#FAF8F3" stroke="#1A1830" strokeWidth="2" />
            <polygon points="0,-24 6,-6 0,-10 -6,-6" fill="#E4007C" stroke="#1A1830" strokeWidth="1" />
            <polygon points="0,22 5,6 0,10 -5,6" fill="#1A1830" />
            <line x1="-20" y1="0" x2="20" y2="0" stroke="#1A1830" strokeWidth="1.5" />
            <text
              x="0"
              y="-31"
              textAnchor="middle"
              fontFamily="Big Shoulders Display, sans-serif"
              fontWeight="900"
              fontSize="13"
              fill="#1A1830"
            >
              N
            </text>
          </g>

          <g transform="translate(36, 46)">
            <rect x="0" y="-18" width="250" height="32" fill="#1A1830" />
            <text
              x="12"
              y="3"
              fontFamily="Big Shoulders Display, sans-serif"
              fontWeight="900"
              fontSize="16"
              fill="#FFC21A"
              letterSpacing="1.2"
            >
              ESTADO: {(destination?.state || 'MÉXICO').toUpperCase()}
            </text>
          </g>

          {projected.points.length > 1 && (
            <polyline
              points={polylinePoints}
              fill="none"
              stroke="#1A1830"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              transform="translate(3, 3)"
              opacity="0.3"
            />
          )}

          {projected.points.length > 1 && (
            <polyline
              points={polylinePoints}
              fill="none"
              stroke="#E4007C"
              strokeWidth="4.5"
              strokeDasharray="10 7"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="route-animated-path"
            />
          )}

          {projected.legs.map((leg) => (
            <g key={`${leg.from.id}-${leg.to.id}`} transform={`translate(${leg.midX}, ${leg.midY})`}>
              <rect x="-34" y="-11" width="68" height="20" fill="#FAF8F3" stroke="#1A1830" strokeWidth="1.5" />
              <text
                x="0"
                y="3"
                textAnchor="middle"
                fontFamily="Archivo, sans-serif"
                fontWeight="800"
                fontSize="10.5"
                fill="#1D3FBB"
              >
                {leg.km} km
              </text>
            </g>
          ))}

          {projected.points.map((pt, idx) => {
            const isSelected = activeStopIdx === idx;
            const labelAbove = pt.y > 220;
            const badgeBg = pt.isHotel ? '#FFC21A' : isSelected ? '#1D3FBB' : '#E4007C';
            const badgeFg = pt.isHotel ? '#1A1830' : '#FFFFFF';
            const shortName = pt.name.length > 25 ? `${pt.name.slice(0, 23)}…` : pt.name;

            return (
              <g
                key={pt.id}
                transform={`translate(${pt.x}, ${pt.y})`}
                style={{ cursor: 'pointer' }}
                onClick={() => onSelectStop && onSelectStop(idx)}
              >
                {(pt.isHotel || isSelected) && (
                  <circle
                    cx="0"
                    cy="0"
                    r="25"
                    fill="none"
                    stroke={pt.isHotel ? '#E4007C' : '#1D3FBB'}
                    strokeWidth="2.5"
                    strokeDasharray="4 3"
                  />
                )}

                <circle cx="3" cy="3" r={pt.isHotel ? 19 : 16} fill="#1A1830" />
                <circle
                  cx="0"
                  cy="0"
                  r={pt.isHotel ? 19 : 16}
                  fill={badgeBg}
                  stroke="#1A1830"
                  strokeWidth="2.5"
                />

                <text
                  x="0"
                  y="5"
                  textAnchor="middle"
                  fontFamily="Big Shoulders Display, sans-serif"
                  fontWeight="900"
                  fontSize={pt.isHotel ? '17' : '15'}
                  fill={badgeFg}
                >
                  {pt.code}
                </text>

                <g transform={`translate(0, ${labelAbove ? -34 : 32})`}>
                  <rect
                    x="-92"
                    y="-14"
                    width="184"
                    height="26"
                    fill={pt.isHotel ? '#FFC21A' : '#FFFFFF'}
                    stroke="#1A1830"
                    strokeWidth="2"
                  />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    fontFamily="Archivo, sans-serif"
                    fontWeight="800"
                    fontSize="11"
                    fill="#1A1830"
                  >
                    {pt.isHotel ? `HOTEL: ${shortName}` : `${pt.order}. ${shortName}`}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="route-stops-strip">
        {projected.points.map((pt, idx) => {
          const prevLeg = idx > 0 ? projected.legs[idx - 1] : null;
          return (
            <button
              key={pt.id}
              type="button"
              onClick={() => onSelectStop && onSelectStop(idx)}
              className="route-stop-chip"
              style={{
                background:
                  activeStopIdx === idx
                    ? '#FFF6D6'
                    : pt.isHotel
                    ? '#FFC21A'
                    : '#FFFFFF',
                borderColor: '#1A1830',
              }}
            >
              <span
                className="route-stop-badge"
                style={{
                  background: pt.isHotel ? '#1A1830' : '#E4007C',
                  color: pt.isHotel ? '#FFC21A' : '#FFFFFF',
                }}
              >
                {pt.isHotel ? 'SALIDA H' : `PARADA ${pt.order}`}
              </span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 900, fontSize: '0.9rem', lineHeight: 1.15 }}>{pt.name}</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--color-muted)', fontWeight: 700 }}>
                  {pt.isHotel
                    ? `Kilómetro 0 · ${pt.costLabel}`
                    : `A ${prevLeg?.km ?? 1.5} km de la parada anterior · ${pt.costLabel}`}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Armador Interactivo de Viaje y Guía Turística (Exclusivo para Usuarios con Sesión Activa).
 * Guarda cada guía en la configuración del usuario y mantiene un historial de lugares visitados.
 */
export function TripPlanner({ initialSlug = 'cancun', onSlugChange }) {
  const navigate = useNavigate();
  const {
    user,
    login,
    savedGuides,
    visitedPlaces,
    saveGuide,
    deleteGuide,
    markPlacesVisited,
    removeVisitedPlace,
  } = useAuth();

  const [destinations, setDestinations] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState(initialSlug);
  const [destination, setDestination] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  // Pasos: 1 = Estado, 2 = Calendario y Clima, 3 = Hotel y Lugares, 4 = Mapa, Presupuesto e Imprimible
  const [step, setStep] = useState(1);
  const [autoGeneratedBanner, setAutoGeneratedBanner] = useState(false);

  // Selecciones del viajero e Itinerario inteligente estilo Itinio
  const [selectedDate, setSelectedDate] = useState('');
  const [nights, setNights] = useState(3);
  const [selectedHotelName, setSelectedHotelName] = useState('');
  const [selectedPlaceNames, setSelectedPlaceNames] = useState([]);
  const [selectedSouvenirItems, setSelectedSouvenirItems] = useState([]);
  const [checkedPacking, setCheckedPacking] = useState({});
  const [customBuyText, setCustomBuyText] = useState('');
  const [customBuyList, setCustomBuyList] = useState([]);
  const [activeStopIdx, setActiveStopIdx] = useState(0);

  // Parámetros de personalización de itinerario estilo Itinio
  const [travelPace, setTravelPace] = useState('equilibrado'); // 'relajado' (2/día) | 'equilibrado' (3/día) | 'intenso' (4/día)
  const [travelStyle, setTravelStyle] = useState('completo'); // 'completo' | 'cultural' | 'gastronomico' | 'naturaleza'
  const [extraTransitMinutes, setExtraTransitMinutes] = useState(45); // 0 | 45 | 90 (Optimizador Punto A -> Punto B)
  const [activeDayTab, setActiveDayTab] = useState('todos'); // 'todos' | 1 | 2 | 3...
  const [customStops, setCustomStops] = useState([]);
  const [customStopName, setCustomStopName] = useState('');
  const [customStopTime, setCustomStopTime] = useState('18:30');

  // Feedback de guardado en configuración e historial
  const [saveStatus, setSaveStatus] = useState('');
  const [savingGuide, setSavingGuide] = useState(false);

  // Formulario rápido de Carta de Acceso cuando el visitante no está autenticado
  const [quickEmail, setQuickEmail] = useState('');
  const [quickPassword, setQuickPassword] = useState('');
  const [quickSignature, setQuickSignature] = useState('');
  const [quickAuthError, setQuickAuthError] = useState('');
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const [authPromptNotice, setAuthPromptNotice] = useState('');

  useEffect(() => {
    if (initialSlug && initialSlug !== selectedSlug) {
      setSelectedSlug(initialSlug);
    }
  }, [initialSlug]);

  useEffect(() => {
    let active = true;
    apiRequest('/api/destinos')
      .then((res) => {
        if (active) setDestinations(res.destinations || []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadSelectedState() {
      try {
        setLoading(true);
        const [destRes, wxRes] = await Promise.all([
          apiRequest(`/api/destinos/${selectedSlug}`),
          apiRequest(`/api/clima/${selectedSlug}`),
        ]);
        if (!active) return;
        setDestination(destRes);
        setWeather(wxRes);

        const daily = wxRes?.daily || [];
        const bestDay =
          daily.find((d) => d.pop <= 30 && d.sky !== 'rain' && d.sky !== 'storm') ||
          daily[0] ||
          null;
        setSelectedDate(bestDay?.date || new Date().toISOString().slice(0, 10));

        const defaultHotel =
          (destRes.hotels || []).find((h) => h.tier === 'medio') ||
          (destRes.hotels || [])[0] ||
          null;
        setSelectedHotelName(defaultHotel ? defaultHotel.name : '');

        setSelectedPlaceNames((destRes.places || []).slice(0, 4).map((p) => p.name));
        setSelectedSouvenirItems((destRes.souvenirs || []).slice(0, 3).map((s) => s.item));

        const packMap = {};
        (wxRes?.packing || destRes.basePacking || []).forEach((item) => {
          packMap[item] = true;
        });
        setCheckedPacking(packMap);
        setActiveStopIdx(0);
      } catch {
        // Ignorar errores transitorios
      } finally {
        if (active) setLoading(false);
      }
    }
    loadSelectedState();
    return () => {
      active = false;
    };
  }, [selectedSlug]);

  const recommendedForecastDays = useMemo(() => {
    const daily = weather?.daily || [];
    return daily.map((day, idx) => {
      const isRecommended = day.pop <= 35 && day.sky !== 'storm' && day.sky !== 'rain';
      let reason = 'Clima agradable para recorrer a pie';
      if (day.sky === 'clear' && day.pop <= 20) {
        reason = 'Cielo despejado y mínima lluvia';
      } else if (day.pop > 50) {
        reason = 'Alta probabilidad de lluvia (prioriza museos)';
      } else if (day.max >= 33) {
        reason = 'Calor intenso (hidrátate y sal temprano)';
      }
      return {
        ...day,
        idx,
        isRecommended,
        reason,
      };
    });
  }, [weather]);

  const selectedHotel = useMemo(() => {
    const hotels = destination?.hotels || [];
    return hotels.find((h) => h.name === selectedHotelName) || hotels[1] || hotels[0] || null;
  }, [destination, selectedHotelName]);

  const selectedPlaces = useMemo(() => {
    const places = destination?.places || [];
    const byName = new Map(places.map((p) => [p.name, p]));
    return selectedPlaceNames.map((name) => byName.get(name)).filter(Boolean);
  }, [destination, selectedPlaceNames]);

  const selectedSouvenirs = useMemo(() => {
    const souvenirs = destination?.souvenirs || [];
    return souvenirs.filter((s) => selectedSouvenirItems.includes(s.item));
  }, [destination, selectedSouvenirItems]);

  // Motor de Itinerario Día por Día estilo Itinio (con bloques horarios y paradas Punto A -> Punto B)
  const itineraryDays = useMemo(() => {
    const stopsPerDay = travelPace === 'relajado' ? 2 : travelPace === 'intenso' ? 4 : 3;
    const totalDays = Math.max(1, Math.min(nights, Math.max(1, Math.ceil((selectedPlaces.length + customStops.length) / stopsPerDay))));
    const baseDateObj = selectedDate ? new Date(`${selectedDate}T12:00:00`) : new Date();
    const slotTimes = ['09:30', '13:30', '16:30', '19:30'];
    const slotPeriods = ['Mañana', 'Mediodía', 'Tarde', 'Noche'];

    const allStops = [
      ...selectedPlaces.map((p) => ({ ...p, isCustom: false })),
      ...customStops.map((c) => ({
        name: c.name,
        kind: 'parada personal',
        hours: c.time,
        entryFeeMxn: 0,
        entry: 'Libre',
        description: 'Parada personalizada agregada a tu itinerario.',
        lat: (destination?.coords?.lat || 20) + 0.018,
        lon: (destination?.coords?.lon || -100) + 0.018,
        isCustom: true,
        customId: c.id,
      })),
    ];

    const days = [];
    for (let dIdx = 0; dIdx < totalDays; dIdx += 1) {
      const dayDate = new Date(baseDateObj);
      dayDate.setDate(baseDateObj.getDate() + dIdx);
      const iso = dayDate.toISOString().slice(0, 10);
      const label = dayDate.toLocaleDateString('es-MX', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
      const forecast =
        recommendedForecastDays[dIdx] ||
        recommendedForecastDays[dIdx % Math.max(1, recommendedForecastDays.length)] ||
        null;

      const dayStopsRaw = allStops.slice(dIdx * stopsPerDay, (dIdx + 1) * stopsPerDay);
      let prevLat = Number(selectedHotel?.lat) || destination?.coords?.lat || 20;
      let prevLon = Number(selectedHotel?.lon) || destination?.coords?.lon || -100;

      const dayStops = dayStopsRaw.map((stop, sIdx) => {
        const km = Number(haversineKm(prevLat, prevLon, Number(stop.lat) || prevLat + 0.01, Number(stop.lon) || prevLon + 0.01).toFixed(1));
        const transitMin = Math.max(8, Math.round(km * 4.5));
        prevLat = Number(stop.lat) || prevLat;
        prevLon = Number(stop.lon) || prevLon;

        // Sugerencia inteligente Punto A -> Punto B estilo Itinio según tiempo extra elegido
        const souvSuggestion = (destination?.souvenirs || [])[(dIdx + sIdx) % Math.max(1, (destination?.souvenirs || []).length)];
        let detourText = null;
        if (extraTransitMinutes === 45) {
          detourText = `Parada en ruta (+45 min): Café tradicional y mirador local camino a ${stop.name}`;
        } else if (extraTransitMinutes === 90) {
          detourText = souvSuggestion
            ? `Exploración Punto A→B (+90 min): Visitar ${souvSuggestion.where} (${souvSuggestion.item})`
            : `Exploración Punto A→B (+90 min): Recorrido por callejones, mercado gastronómico y artesanías`;
        }

        return {
          ...stop,
          slotTime: stop.isCustom ? stop.hours : slotTimes[sIdx % slotTimes.length],
          slotPeriod: slotPeriods[sIdx % slotPeriods.length],
          kmFromPrev: km,
          transitMin,
          detourText,
        };
      });

      days.push({
        dayNum: dIdx + 1,
        iso,
        label,
        forecast,
        stops: dayStops,
      });
    }
    return days;
  }, [travelPace, nights, selectedPlaces, customStops, selectedDate, recommendedForecastDays, selectedHotel, destination, extraTransitMinutes]);

  const placesForActiveMap = useMemo(() => {
    if (activeDayTab === 'todos') return selectedPlaces;
    const found = itineraryDays.find((d) => d.dayNum === activeDayTab);
    return found ? found.stops : selectedPlaces;
  }, [activeDayTab, itineraryDays, selectedPlaces]);

  // Mapa rápido de lugares ya visitados por este usuario
  const visitedByPlaceKey = useMemo(() => {
    const map = new Map();
    for (const vp of visitedPlaces || []) {
      map.set(`${vp.slug}::${vp.placeName}`, vp);
    }
    return map;
  }, [visitedPlaces]);

  const budgetBreakdown = useMemo(() => {
    const hotelMin = (selectedHotel?.priceFrom || 0) * nights;
    const hotelMax = (selectedHotel?.priceTo || 0) * nights;
    const hotelAvg = Math.round((hotelMin + hotelMax) / 2);

    const placesTotal = selectedPlaces.reduce((acc, p) => acc + (Number(p.entryFeeMxn) || 0), 0);
    const souvenirsTotal = selectedSouvenirs.reduce((acc, s) => acc + (Number(s.priceMxn) || 0), 0);

    return {
      hotelMin,
      hotelMax,
      hotelAvg,
      placesTotal,
      souvenirsTotal,
      grandTotalMin: hotelMin + placesTotal + souvenirsTotal,
      grandTotalMax: hotelMax + placesTotal + souvenirsTotal,
      grandTotalAvg: hotelAvg + placesTotal + souvenirsTotal,
    };
  }, [selectedHotel, nights, selectedPlaces, selectedSouvenirs]);

  const togglePlace = (name) => {
    setSelectedPlaceNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  };

  const movePlaceOrder = (name, dir) => {
    setSelectedPlaceNames((prev) => {
      const idx = prev.indexOf(name);
      if (idx === -1) return prev;
      const targetIdx = idx + dir;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.splice(targetIdx, 0, item);
      return copy;
    });
  };

  const applyTravelStyleFilter = (styleKey) => {
    setTravelStyle(styleKey);
    const all = destination?.places || [];
    if (styleKey === 'completo') {
      setSelectedPlaceNames(all.map((p) => p.name));
      return;
    }
    const preferredKinds =
      styleKey === 'cultural'
        ? ['arqueologia', 'museo', 'templo']
        : styleKey === 'gastronomico'
        ? ['mercado', 'barrio', 'templo']
        : ['playa', 'naturaleza', 'mirador'];

    const matched = all.filter((p) => preferredKinds.includes(p.kind));
    const others = all.filter((p) => !preferredKinds.includes(p.kind));
    setSelectedPlaceNames([...matched, ...others.slice(0, 1)].map((p) => p.name));
  };

  const handleAddCustomStop = (e) => {
    e.preventDefault();
    const clean = customStopName.trim();
    if (!clean) return;
    setCustomStops((prev) => [
      ...prev,
      { id: Date.now(), name: clean, time: customStopTime || '18:30' },
    ]);
    setCustomStopName('');
  };

  const toggleSouvenir = (item) => {
    setSelectedSouvenirItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
    );
  };

  // Guarda la guía actual en la base de datos SQLite bajo la configuración del usuario
  const persistCurrentGuide = async (overrideParams = {}) => {
    if (!user || !destination || !selectedHotel) return;
    try {
      setSavingGuide(true);
      const activePacking = Object.entries(checkedPacking)
        .filter(([, v]) => Boolean(v))
        .map(([k]) => k)
        .concat(customBuyList.map((c) => c.label));

      const payload = {
        slug: destination.slug,
        startDate: overrideParams.startDate || selectedDate || new Date().toISOString().slice(0, 10),
        nights: overrideParams.nights || nights,
        hotelName: overrideParams.hotelName || selectedHotel.name,
        hotelTier: overrideParams.hotelTier || selectedHotel.tier || 'medio',
        places: overrideParams.places || selectedPlaceNames,
        souvenirs: overrideParams.souvenirs || selectedSouvenirItems,
        packing: overrideParams.packing || activePacking,
        estimatedTotalMxn: overrideParams.estimatedTotalMxn ?? budgetBreakdown.grandTotalAvg,
        mode: overrideParams.mode || 'manual',
      };

      await saveGuide(payload);
      setSaveStatus(
        `Guía de ${destination.name} (${destination.state}) guardada en tu configuración de cuenta.`,
      );
    } catch (err) {
      setSaveStatus(`No se pudo guardar: ${err.message}`);
    } finally {
      setSavingGuide(false);
    }
  };

  // Cargar una guía previamente guardada en la configuración del usuario
  const handleLoadSavedGuide = (guide) => {
    setSelectedSlug(guide.slug);
    if (onSlugChange) onSlugChange(guide.slug);
    setTimeout(() => {
      setSelectedDate(guide.startDate);
      setNights(guide.nights || 3);
      setSelectedHotelName(guide.hotelName);
      setSelectedPlaceNames(guide.places || []);
      setSelectedSouvenirItems(guide.souvenirs || []);
      const packMap = {};
      (guide.packing || []).forEach((p) => {
        packMap[p] = true;
      });
      setCheckedPacking(packMap);
      setAutoGeneratedBanner(guide.mode === 'auto');
      setStep(4);
      setSaveStatus(`Cargaste tu guía guardada de ${guide.destinationName} (${guide.startDate}).`);
    }, 120);
  };

  // Alternar o registrar un lugar turístico en el historial de lugares visitados del usuario
  const handleToggleVisitedPlace = async (placeName, e) => {
    if (e) e.stopPropagation();
    if (!user || !destination) return;
    const existing = visitedByPlaceKey.get(`${destination.slug}::${placeName}`);
    if (existing) {
      await removeVisitedPlace(existing.id);
      setSaveStatus(`Quitaste "${placeName}" de tu historial de lugares visitados.`);
    } else {
      await markPlacesVisited({
        slug: destination.slug,
        placeNames: [placeName],
        visitedDate: selectedDate || new Date().toISOString().slice(0, 10),
        notes: `Visitado en ruta desde ${selectedHotel?.name || destination.name}`,
      });
      setSaveStatus(`¡"${placeName}" se guardó en tu historial de lugares visitados!`);
    }
  };

  // Registrar todos los lugares de la guía actual como visitados
  const handleMarkAllRouteVisited = async () => {
    if (!user || !destination || selectedPlaceNames.length === 0) return;
    await markPlacesVisited({
      slug: destination.slug,
      placeNames: selectedPlaceNames,
      visitedDate: selectedDate || new Date().toISOString().slice(0, 10),
      notes: `Circuito completo desde ${selectedHotel?.name || destination.name}`,
    });
    setSaveStatus(
      `¡Se registraron los ${selectedPlaceNames.length} lugares de ${destination.name} en tu historial de visitados!`,
    );
  };

  // Botón mágico: "Crear guía automáticamente"
  const handleAutoCreateGuide = async () => {
    if (!user) {
      setAuthPromptNotice(
        'Inicia sesión o regístrate abajo para generar tu guía automática y guardarla en tu cuenta.',
      );
      return;
    }
    if (!destination) return;
    const bestDay =
      recommendedForecastDays.find((d) => d.isRecommended) || recommendedForecastDays[0];
    const nextDate = bestDay?.date || new Date().toISOString().slice(0, 10);
    const nextNights = 4;

    const recHotel =
      (destination.hotels || []).find((h) => h.tier === 'medio') ||
      (destination.hotels || [])[0];
    const nextPlaces = (destination.places || []).map((p) => p.name);
    const nextSouvenirs = (destination.souvenirs || []).slice(0, 4).map((s) => s.item);
    const nextPacking = weather?.packing || destination.basePacking || [];

    setSelectedDate(nextDate);
    setNights(nextNights);
    if (recHotel) setSelectedHotelName(recHotel.name);
    setSelectedPlaceNames(nextPlaces);
    setSelectedSouvenirItems(nextSouvenirs);

    const packMap = {};
    nextPacking.forEach((item) => {
      packMap[item] = true;
    });
    setCheckedPacking(packMap);

    setAutoGeneratedBanner(true);
    setStep(4);

    // Guardar automáticamente en la configuración del usuario
    const hotelAvg = recHotel ? Math.round(((recHotel.priceFrom + recHotel.priceTo) / 2) * nextNights) : 0;
    const placesSum = (destination.places || []).reduce((a, p) => a + (Number(p.entryFeeMxn) || 0), 0);
    const souvSum = (destination.souvenirs || [])
      .slice(0, 4)
      .reduce((a, s) => a + (Number(s.priceMxn) || 0), 0);

    await persistCurrentGuide({
      startDate: nextDate,
      nights: nextNights,
      hotelName: recHotel?.name || 'Hotel Centro',
      hotelTier: recHotel?.tier || 'medio',
      places: nextPlaces,
      souvenirs: nextSouvenirs,
      packing: nextPacking,
      estimatedTotalMxn: hotelAvg + placesSum + souvSum,
      mode: 'auto',
    });
  };

  const handleStateSelect = (slug) => {
    setSelectedSlug(slug);
    setAutoGeneratedBanner(false);
    if (onSlugChange) onSlugChange(slug);
  };

  const handleAddCustomBuy = (e) => {
    e.preventDefault();
    const clean = customBuyText.trim();
    if (!clean) return;
    setCustomBuyList((prev) => [...prev, { id: Date.now(), label: clean, done: true }]);
    setCustomBuyText('');
  };

  const handleQuickLogin = async (e) => {
    e.preventDefault();
    setQuickAuthError('');
    const effectiveSig = (quickSignature || quickEmail.split('@')[0] || '').trim();
    if (effectiveSig.length < 2) {
      setQuickAuthError('Por favor firma la carta con tu nombre o rúbrica antes de lacrarla.');
      return;
    }
    try {
      setQuickSubmitting(true);
      await login(quickEmail, quickPassword);
      setAuthPromptNotice('');
    } catch (err) {
      setQuickAuthError(err.message || 'Credenciales incorrectas.');
    } finally {
      setQuickSubmitting(false);
    }
  };

  const chosenMonthNum = useMemo(() => {
    if (!selectedDate) return new Date().getMonth() + 1;
    const parts = selectedDate.split('-');
    return Number(parts[1]) || new Date().getMonth() + 1;
  }, [selectedDate]);

  const isChosenMonthIdeal = destination?.bestMonths?.includes(chosenMonthNum);

  return (
    <section
      id="armador-viaje"
      className="trip-planner-shell"
      aria-labelledby="planner-main-heading"
    >
      {/* CABECERA DEL PLANIFICADOR DE ITINERARIO ESTILO ITINIO */}
      <div className="planner-top-bar no-print">
        <div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4px' }}>
            <span
              className="stamp-pill"
              style={{
                background: user ? '#1E8E5A' : '#E4007C',
                color: '#FFFFFF',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <AnimatedEmoticon name={user ? 'seal' : 'quill'} size={14} />
              <span>
                {user
                  ? `Bitácora Activa: ${user.name}`
                  : 'Firma tu Carta de Viajero para desbloquear tu itinerario'}
              </span>
            </span>
            {user && (
              <span className="stamp-pill" style={{ background: '#FFC21A', color: '#1A1830' }}>
                {savedGuides?.length || 0} itinerarios guardados · {visitedPlaces?.length || 0} lugares visitados
              </span>
            )}
          </div>
          <h2 id="planner-main-heading" className="section-title" style={{ marginTop: '4px' }}>
            Planificador Inteligente de Itinerario Día por Día
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: '0.96rem', maxWidth: '64ch' }}>
            Personaliza el <strong>ritmo y estilo de tu viaje</strong>, descubre <strong>paradas intermedias Punto A → Punto B</strong>,
            organiza tus días por horarios con ayuda del <strong>clima en tiempo real</strong> y genera el{' '}
            <strong>mapa de recorrido desde tu hotel</strong> con lista imprimible.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
          <button
            type="button"
            onClick={handleAutoCreateGuide}
            className="btn btn-primary"
            style={{
              fontSize: '1rem',
              padding: '14px 22px',
              boxShadow: '5px 5px 0 #1A1830',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AnimatedEmoticon name="bolt" size={18} />
            <span>Generar Itinerario Inteligente (1 Clic)</span>
          </button>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-cobalt)' }}>
            {user
              ? 'Arma automáticamente tu agenda día por día con paradas en ruta, hotel y clima'
              : 'Firma tu carta de acceso abajo para crear y guardar tu itinerario'}
          </span>
        </div>
      </div>

      {/* =========================================================================
          CARTA DE ACCESO PARA VISITANTES SIN SESIÓN: FIRMAR CARTA PARA ENTRAR
         ========================================================================= */}
      {!user ? (
        <div className="postal-letter-sheet user-module-readable">
          <div className="airmail-border" />
          <div className="postal-letter-body">
            {authPromptNotice && (
              <div
                role="alert"
                style={{
                  background: '#FFC21A',
                  border: '2px solid #1A1830',
                  padding: '10px 14px',
                  fontWeight: 700,
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AnimatedEmoticon name="quill" size={18} />
                <span>{authPromptNotice}</span>
              </div>
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '32px',
                alignItems: 'start',
              }}
            >
              {/* Explicación de las mecánicas del itinerario */}
              <div>
                <span className="user-badge-pill" style={{ background: '#FFF6D6' }}>
                  Correspondencia de Viajeros · Planificador de Rutas
                </span>
                <h3 className="user-title-lg" style={{ margin: '10px 0 12px' }}>
                  Firma tu carta de viajero para armar tu itinerario día por día
                </h3>
                <p style={{ margin: '0 0 14px', fontSize: '0.98rem' }}>
                  Al firmar tu carta de acceso o redactar tu registro en <strong>Veleta</strong> desbloqueas el
                  planificador de itinerarios:
                </p>

                <ul style={{ margin: '0 0 20px', paddingLeft: '20px', display: 'grid', gap: '8px', fontSize: '0.94rem', fontWeight: 500 }}>
                  <li>
                    <strong>1. Agenda Cronológica Día por Día:</strong> Organiza tus paradas en bloques de mañana, mediodía, tarde y noche según tu ritmo (<em>Relajado, Equilibrado o Intenso</em>).
                  </li>
                  <li>
                    <strong>2. Optimizador Punto A → Punto B:</strong> Indica cuánto tiempo extra tienes entre traslados y descubre cafés locales, miradores y mercados en el camino.
                  </li>
                  <li>
                    <strong>3. Mapa desde tu Hotel + Presupuesto:</strong> Visualiza kilómetros por tramo, costos de entradas y hospedaje, e imprime tu hoja de ruta.
                  </li>
                  <li>
                    <strong>4. Bitácora Personal:</strong> Guarda tus itinerarios y sella los lugares que ya visitaste.
                  </li>
                </ul>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <Link to="/registro" className="wax-seal-btn" style={{ textDecoration: 'none' }}>
                    <AnimatedEmoticon name="quill" size={18} />
                    <span>Redactar y Firmar Carta de Nuevo Viajero →</span>
                  </Link>
                </div>
              </div>

              {/* Pliego rápido para firmar e iniciar sesión ahí mismo */}
              <div
                style={{
                  background: '#FAF8F3',
                  border: '2.5px solid #1A1830',
                  boxShadow: '6px 6px 0 #1A1830',
                  padding: '22px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <h4 className="user-title-md" style={{ margin: 0 }}>
                    Carta Rápida de Acceso
                  </h4>
                  <AnimatedEmoticon name="seal" size={20} />
                </div>
                <p style={{ margin: '0 0 14px', fontSize: '0.9rem', color: 'var(--color-muted)' }}>
                  <em>«Por medio de la presente abro mi bitácora de itinerarios y estampo mi firma al calce:»</em>
                </p>

                {quickAuthError && (
                  <div
                    role="alert"
                    style={{
                      background: '#FDECEC',
                      border: '1.5px solid var(--color-red)',
                      color: 'var(--color-red)',
                      padding: '8px 12px',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      marginBottom: '12px',
                    }}
                  >
                    {quickAuthError}
                  </div>
                )}

                <form onSubmit={handleQuickLogin}>
                  <div className="field-group" style={{ marginBottom: '10px' }}>
                    <label htmlFor="quick-login-email" className="user-field-label">
                      Correo del remitente
                    </label>
                    <input
                      id="quick-login-email"
                      type="email"
                      className="input-field"
                      placeholder="viajero@dominio.mx"
                      value={quickEmail}
                      onChange={(e) => {
                        setQuickEmail(e.target.value);
                        if (!quickSignature) setQuickSignature(e.target.value.split('@')[0]);
                      }}
                      required
                    />
                  </div>

                  <div className="field-group" style={{ marginBottom: '10px' }}>
                    <label htmlFor="quick-login-pwd" className="user-field-label">
                      Clave de lacre (Contraseña)
                    </label>
                    <input
                      id="quick-login-pwd"
                      type="password"
                      className="input-field"
                      placeholder="Tu contraseña"
                      value={quickPassword}
                      onChange={(e) => setQuickPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="field-group" style={{ marginBottom: '12px' }}>
                    <label htmlFor="quick-login-sig" className="user-field-label">
                      Firma autógrafa del viajero
                    </label>
                    <input
                      id="quick-login-sig"
                      type="text"
                      className="input-field"
                      placeholder="Escribe tu nombre o rúbrica…"
                      value={quickSignature}
                      onChange={(e) => setQuickSignature(e.target.value)}
                    />
                    <div className="signature-line-stage" style={{ minHeight: '54px', marginTop: '6px' }}>
                      <span className="signature-script-preview" style={{ fontSize: '1.85rem' }}>
                        {quickSignature || (quickEmail ? quickEmail.split('@')[0] : 'Firma aquí…')}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button type="submit" disabled={quickSubmitting} className="wax-seal-btn" style={{ padding: '10px 16px', fontSize: '0.92rem' }}>
                      <AnimatedEmoticon name="seal" size={18} />
                      <span>{quickSubmitting ? 'Sellando…' : 'Firmar y Abrir Bitácora'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/registro')}
                      className="btn btn-sm"
                    >
                      Abrir Carta Completa
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="airmail-border airmail-border-bottom" />
        </div>
      ) : (
        <>
          {/* =========================================================================
              BARRA DE CONFIGURACIÓN GUARDADA E HISTORIAL DEL USUARIO AUTENTICADO
             ========================================================================= */}
          <div
            className="no-print user-module-readable"
            style={{
              background: '#FFFFFF',
              border: '2px solid #1A1830',
              boxShadow: '4px 4px 0 #1A1830',
              padding: '14px 18px',
              marginBottom: '20px',
              display: 'grid',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.96rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AnimatedEmoticon name="folder" size={18} />
                <span>Tu Configuración Guardada ({savedGuides?.length || 0} guías) y Sellos de Lugares Visitados ({visitedPlaces?.length || 0})</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => persistCurrentGuide()}
                  disabled={savingGuide}
                  className="btn btn-sm btn-sun"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <AnimatedEmoticon name="save" size={15} />
                  <span>{savingGuide ? 'Guardando…' : 'Guardar guía actual en mi configuración'}</span>
                </button>
                <Link to="/registro" className="btn btn-sm">
                  Ver todo mi Pasaporte e Historial →
                </Link>
              </div>
            </div>

            {saveStatus && (
              <div
                role="status"
                style={{
                  background: '#E7F8F0',
                  border: '1.5px solid #1E8E5A',
                  color: '#1A1830',
                  padding: '8px 12px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AnimatedEmoticon name="check" size={16} />
                <span>{saveStatus}</span>
              </div>
            )}

            {/* Lista rápida de guías guardadas para recargarlas con 1 clic */}
            {savedGuides?.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-muted)' }}>
                  Cargar guía guardada:
                </span>
                {savedGuides.slice(0, 5).map((g) => (
                  <div
                    key={g.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      border: '1.5px solid #1A1830',
                      background: '#FAF8F3',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleLoadSavedGuide(g)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '5px 10px',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                      title={`Cargar ruta en ${g.destinationName} (${g.hotelName})`}
                    >
                      {g.destinationName} ({g.startDate} · {g.nights}n · {fmtMxn(g.estimatedTotalMxn)})
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteGuide(g.id)}
                      aria-label={`Eliminar guía de ${g.destinationName}`}
                      style={{
                        background: '#FDECEC',
                        border: 'none',
                        borderLeft: '1.5px solid #1A1830',
                        padding: '5px 8px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        color: 'var(--color-red)',
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* BARRA DE 4 PASOS INTERACTIVOS */}
          <div className="planner-steps-nav no-print" role="tablist" aria-label="Pasos para armar tu guía">
            {[
              { num: 1, title: '1. Estado a visitar', sub: destination ? `${destination.state} (${destination.name})` : 'Elige estado' },
              { num: 2, title: '2. Calendario y Clima API', sub: `${selectedDate || 'Fecha'} · ${nights} noches` },
              { num: 3, title: '3. Hotel, Lugares y Recuerdos', sub: `${selectedHotel?.name || 'Hotel'} · ${selectedPlaces.length} lugares` },
              { num: 4, title: '4. Mapa, Precio e Imprimible', sub: `Total est. ${fmtMxn(budgetBreakdown.grandTotalAvg)} MXN` },
            ].map((item) => {
              const active = step === item.num;
              return (
                <button
                  key={item.num}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setStep(item.num)}
                  className={`planner-step-tab ${active ? 'active' : ''}`}
                >
                  <div className="planner-step-title">{item.title}</div>
                  <div className="planner-step-sub">{item.sub}</div>
                </button>
              );
            })}
          </div>

          {loading && !destination ? (
            <div className="ticket-sheet" style={{ textAlign: 'center', padding: '40px' }}>
              Entintando datos del estado, pronóstico meteorológico y coordenadas de ruta…
            </div>
          ) : (
            destination && (
              <div className="planner-stage-body">
                {/* =====================================================================
                    PASO 1: SELECCIONAR EL ESTADO Y DESTINO A VISITAR
                   ===================================================================== */}
                {step === 1 && (
                  <div className="no-print">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
                      <div>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', textTransform: 'uppercase', margin: 0 }}>
                          Paso 1 · Selecciona el estado de la República donde quieres viajar
                        </h3>
                        <p style={{ margin: '4px 0 0', fontSize: '0.94rem', color: 'var(--color-muted)' }}>
                          Haz clic en una tarjeta de estado para cargar su clima en vivo, hoteles y atractivos, o usa el botón de creación automática.
                        </p>
                      </div>
                      <button type="button" onClick={() => setStep(2)} className="btn btn-cobalt">
                        Continuar a Calendario y Clima →
                      </button>
                    </div>

                    <div className="state-selector-grid">
                      {destinations.map((d) => {
                        const isSelected = d.slug === selectedSlug;
                        const visitedCountInState = (visitedPlaces || []).filter((v) => v.slug === d.slug).length;
                        return (
                          <button
                            key={d.slug}
                            type="button"
                            onClick={() => handleStateSelect(d.slug)}
                            className={`state-option-card ${isSelected ? 'selected' : ''}`}
                            style={{
                              padding: 0,
                              overflow: 'hidden',
                              borderColor: '#1A1830',
                              background: isSelected ? d.inks.bg : '#FFFFFF',
                              color: isSelected ? d.inks.text : '#1A1830',
                            }}
                          >
                            <div style={{ width: '100%' }}>
                              <DuotonePhoto
                                src={d.heroPhoto}
                                alt={`${d.name}, ${d.state}`}
                                tint={d.inks.bg}
                                ink={d.inks.ink}
                                height={155}
                                badgeText={d.state}
                                allowLightbox={false}
                              />
                            </div>

                            <div
                              style={{
                                padding: '14px 16px 16px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                gap: '4px',
                                width: '100%',
                                flex: 1,
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', gap: '6px' }}>
                                <div
                                  style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: '1.85rem',
                                    fontWeight: 900,
                                    textTransform: 'uppercase',
                                    lineHeight: 0.95,
                                    textAlign: 'left',
                                  }}
                                >
                                  {d.name}
                                </div>
                                {visitedCountInState > 0 ? (
                                  <span style={{ fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <AnimatedEmoticon name="star" size={13} />
                                    <span>{visitedCountInState} visitados</span>
                                  </span>
                                ) : (
                                  isSelected && (
                                    <span style={{ fontWeight: 900, fontSize: '0.78rem', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                      <AnimatedEmoticon name="check" size={13} />
                                      <span>Elegido</span>
                                    </span>
                                  )
                                )}
                              </div>

                              <div style={{ fontSize: '0.84rem', textAlign: 'left', opacity: 0.92, marginBottom: '6px' }}>
                                {d.tagline}
                              </div>

                              <div
                                style={{
                                  marginTop: 'auto',
                                  paddingTop: '8px',
                                  borderTop: '1.5px dashed currentColor',
                                  width: '100%',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  fontSize: '0.76rem',
                                  fontWeight: 800,
                                }}
                              >
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <AnimatedEmoticon name="camera" size={13} />
                                  <span>{d.placesCount || 5} lugares</span>
                                </span>
                                <span>Hotel desde {fmtMxn(d.minHotelPrice || 950)}</span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={handleAutoCreateGuide}
                        className="btn btn-sun"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <AnimatedEmoticon name="bolt" size={16} />
                        <span>Saltar pasos y crear guía de {destination.state} ahora</span>
                      </button>
                      <button type="button" onClick={() => setStep(2)} className="btn btn-primary">
                        Siguiente: Elegir fechas con ayuda del clima →
                      </button>
                    </div>
                  </div>
                )}

                {/* =====================================================================
                    PASO 2: CALENDARIO INTERACTIVO + DÍAS RECOMENDADOS POR LA API DE CLIMA
                   ===================================================================== */}
                {step === 2 && (
                  <div className="no-print">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
                      <div>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', textTransform: 'uppercase', margin: 0 }}>
                          Paso 2 · Calendario de viaje y días recomendados por Weather API en {destination.name}, {destination.state}
                        </h3>
                        <p style={{ margin: '4px 0 0', fontSize: '0.94rem', color: 'var(--color-muted)' }}>
                          La API meteorológica analiza lluvia, viento y nubosidad para sugerirte qué días iniciar tu viaje.
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="button" onClick={() => setStep(1)} className="btn btn-sm">
                          ← Cambiar estado
                        </button>
                        <button type="button" onClick={() => setStep(3)} className="btn btn-cobalt btn-sm">
                          Siguiente: Hotel y Lugares →
                        </button>
                      </div>
                    </div>

                    <div className="ticket-sheet" style={{ marginBottom: '24px', background: '#FAF8F3' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                        <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.55rem', textTransform: 'uppercase', margin: 0 }}>
                          Pronóstico inteligente · Haz clic en un día recomendado para fijar tu llegada
                        </h4>
                        <span className="stamp-pill" style={{ color: '#1E8E5A', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <AnimatedEmoticon name="star" size={13} />
                          <span>Verde = Día recomendado por bajo riesgo de lluvia</span>
                        </span>
                      </div>

                      <div className="weather-calendar-grid">
                        {recommendedForecastDays.map((day) => {
                          const isChosen = selectedDate === day.date;
                          return (
                            <button
                              key={day.date}
                              type="button"
                              onClick={() => setSelectedDate(day.date)}
                              className="weather-day-card"
                              style={{
                                background: isChosen
                                  ? '#FFC21A'
                                  : day.isRecommended
                                  ? '#E7F8F0'
                                  : '#FFFFFF',
                                borderColor: '#1A1830',
                                boxShadow: isChosen ? '5px 5px 0 #1A1830' : '3px 3px 0 #1A1830',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', gap: '4px' }}>
                                <span style={{ fontWeight: 900, fontSize: '0.82rem', textTransform: 'uppercase' }}>
                                  {formatShortDate(day.date, day.idx)}
                                </span>
                                {day.isRecommended ? (
                                  <span
                                    style={{
                                      background: '#1E8E5A',
                                      color: '#FFFFFF',
                                      padding: '2px 6px',
                                      fontSize: '0.68rem',
                                      fontWeight: 900,
                                      textTransform: 'uppercase',
                                      border: '1px solid #1A1830',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                    }}
                                  >
                                    <AnimatedEmoticon name="star" size={11} />
                                    <span>Recomendado</span>
                                  </span>
                                ) : (
                                  <span
                                    style={{
                                      background: '#FF6B1A',
                                      color: '#1A1830',
                                      padding: '2px 6px',
                                      fontSize: '0.68rem',
                                      fontWeight: 900,
                                      textTransform: 'uppercase',
                                      border: '1px solid #1A1830',
                                    }}
                                  >
                                    Precaución
                                  </span>
                                )}
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '10px 0' }}>
                                <SkyEmblem sky={day.sky} size={34} />
                                <div style={{ textAlign: 'left' }}>
                                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 900, lineHeight: 1 }}>
                                    {day.max}°C <span style={{ fontSize: '1.2rem', color: 'var(--color-muted)' }}>/ {day.min}°C</span>
                                  </div>
                                  <div style={{ fontSize: '0.78rem', fontWeight: 800 }}>
                                    Prob. lluvia: {day.pop}% · {day.description}
                                  </div>
                                </div>
                              </div>

                              <div style={{ fontSize: '0.76rem', textAlign: 'left', fontWeight: 700, color: '#1A1830', borderTop: '1px dashed #1A1830', paddingTop: '6px', width: '100%' }}>
                                {day.reason}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '20px' }}>
                      <div className="ticket-sheet">
                        <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', textTransform: 'uppercase', margin: '0 0 12px' }}>
                          Configura tu fecha exacta y número de noches
                        </h4>

                        <div className="field-group" style={{ marginBottom: '14px' }}>
                          <label htmlFor="planner-date-input" className="field-label">
                            Fecha de llegada al hotel
                          </label>
                          <input
                            id="planner-date-input"
                            type="date"
                            className="input-field"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                          />
                        </div>

                        <div className="field-group">
                          <label htmlFor="planner-nights-range" className="field-label">
                            Duración del viaje: <strong>{nights} {nights === 1 ? 'noche' : 'noches'}</strong> ({nights + 1} días)
                          </label>
                          <input
                            id="planner-nights-range"
                            type="range"
                            min="1"
                            max="10"
                            value={nights}
                            onChange={(e) => setNights(Number(e.target.value))}
                            style={{ accentColor: 'var(--color-pink)', width: '100%' }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-muted)' }}>
                            <span>1 noche (Escapada)</span>
                            <span>4 noches (Ideal)</span>
                            <span>10 noches (Gran viaje)</span>
                          </div>
                        </div>
                      </div>

                      <div className="ticket-sheet">
                        <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', textTransform: 'uppercase', margin: '0 0 10px' }}>
                          Semáforo climático del mes seleccionado ({MONTH_NAMES[chosenMonthNum - 1]})
                        </h4>
                        <div
                          style={{
                            padding: '10px 14px',
                            border: '2px solid #1A1830',
                            background: isChosenMonthIdeal ? '#E7F8F0' : '#FFF6D6',
                            fontWeight: 800,
                            fontSize: '0.9rem',
                            marginBottom: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <AnimatedEmoticon name={isChosenMonthIdeal ? 'star' : 'smile'} size={16} />
                          <span>
                            {isChosenMonthIdeal
                              ? `¡Excelente elección! ${MONTH_NAMES[chosenMonthNum - 1]} está dentro de los mejores meses para visitar ${destination.name}.`
                              : `Nota meteorológica: ${MONTH_NAMES[chosenMonthNum - 1]} es temporada media o de lluvias ocasionales en ${destination.name}. (${destination.caution})`}
                          </span>
                        </div>
                        <p style={{ margin: '0 0 8px', fontSize: '0.88rem' }}>
                          <strong>Mejor temporada anual:</strong> {destination.bestSeason}
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px', marginTop: '10px' }}>
                          {MONTH_NAMES.map((mName, idx) => {
                            const mNum = idx + 1;
                            const ideal = destination.bestMonths?.includes(mNum);
                            const activeMonth = mNum === chosenMonthNum;
                            return (
                              <button
                                key={mName}
                                type="button"
                                onClick={() => {
                                  const year = new Date().getFullYear();
                                  const mm = String(mNum).padStart(2, '0');
                                  setSelectedDate(`${year}-${mm}-15`);
                                }}
                                style={{
                                  border: activeMonth ? '2.5px solid #E4007C' : '1.5px solid #1A1830',
                                  background: activeMonth ? '#FFC21A' : ideal ? '#00A3A1' : '#F3F1EC',
                                  color: '#1A1830',
                                  padding: '6px 4px',
                                  fontWeight: 800,
                                  fontSize: '0.74rem',
                                  cursor: 'pointer',
                                }}
                              >
                                <div>{mName.slice(0, 3)}</div>
                                <div style={{ fontSize: '0.66rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2px' }}>
                                  {ideal ? (
                                    <>
                                      <AnimatedEmoticon name="star" size={10} />
                                      <span>Ideal</span>
                                    </>
                                  ) : (
                                    '·'
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                      <button type="button" onClick={() => setStep(1)} className="btn">
                        ← Paso 1: Estado
                      </button>
                      <button type="button" onClick={() => setStep(3)} className="btn btn-primary">
                        Siguiente: Elegir Hotel, Lugares y Recuerdos →
                      </button>
                    </div>
                  </div>
                )}

                {/* =====================================================================
                    PASO 3: SELECCIONAR HOTEL + LUGARES TURÍSTICOS + RECUERDOS
                   ===================================================================== */}
                {step === 3 && (
                  <div className="no-print">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
                      <div>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', textTransform: 'uppercase', margin: 0 }}>
                          Paso 3 · Selecciona tu Hotel Base, Lugares a Visitar y Recuerdos
                        </h3>
                        <p style={{ margin: '4px 0 0', fontSize: '0.94rem', color: 'var(--color-muted)' }}>
                          El hotel que elijas será el <strong>Punto de Salida (H)</strong> en el mapa de tu recorrido. También puedes marcar lugares que ya hayas visitado.
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="button" onClick={() => setStep(2)} className="btn btn-sm">
                          ← Fechas y Clima
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            setStep(4);
                            await persistCurrentGuide({ mode: 'manual' });
                          }}
                          className="btn btn-primary btn-sm"
                        >
                          Guardar y Ver Guía Final + Mapa →
                        </button>
                      </div>
                    </div>

                    {/* 3A: Selección de Hotel */}
                    <div style={{ marginBottom: '28px' }}>
                      <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.65rem', textTransform: 'uppercase', margin: '0 0 12px' }}>
                        A) Elige tu hotel en {destination.name} ({nights} {nights === 1 ? 'noche' : 'noches'})
                      </h4>
                      <div className="hotels-grid">
                        {(destination.hotels || []).map((hotel) => {
                          const isChosen = selectedHotel?.name === hotel.name;
                          const tier = TIER_BADGE[hotel.tier] || TIER_BADGE.medio;
                          return (
                            <article
                              key={hotel.name}
                              className="hotel-voucher-card"
                              style={{
                                borderColor: isChosen ? '#E4007C' : '#1A1830',
                                borderWidth: isChosen ? '3px' : '2px',
                                background: isChosen ? '#FFF6D6' : '#FFFFFF',
                              }}
                            >
                              <DuotonePhoto
                                src={hotel.photo}
                                alt={hotel.name}
                                tint={destination.inks.bg}
                                ink={destination.inks.ink}
                                height={165}
                                badgeText={tier.label}
                              />
                              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', fontWeight: 800 }}>
                                  <span style={{ color: 'var(--color-muted)', textTransform: 'uppercase' }}>{hotel.zone}</span>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <AnimatedEmoticon name="star" size={12} />
                                    <span>{String(hotel.rating || '4.6').replace('★', '').trim()}</span>
                                  </span>
                                </div>
                                <h5 style={{ fontFamily: 'var(--font-display)', fontSize: '1.65rem', textTransform: 'uppercase', margin: 0, lineHeight: 0.95 }}>
                                  {hotel.name}
                                </h5>
                                <p style={{ margin: 0, fontSize: '0.88rem' }}>{hotel.highlight}</p>

                                <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '2px dashed #1A1830', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <div>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-muted)' }}>
                                      {nights} {nights === 1 ? 'noche' : 'noches'} est.
                                    </div>
                                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.55rem', fontWeight: 900 }}>
                                      {fmtMxn(hotel.priceFrom * nights)} – {fmtMxn(hotel.priceTo * nights)} MXN
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedHotelName(hotel.name)}
                                    className={`btn btn-sm ${isChosen ? 'btn-primary' : ''}`}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                  >
                                    {isChosen && <AnimatedEmoticon name="check" size={14} />}
                                    <span>{isChosen ? 'Hotel seleccionado' : 'Elegir este hotel'}</span>
                                  </button>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </div>

                    {/* 3B: Personalización inteligente estilo Itinio (Estilo, Ritmo y Traslados Punto A -> B) */}
                    <div className="ticket-sheet" style={{ marginBottom: '24px', background: '#FFF6D6' }}>
                      <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.65rem', textTransform: 'uppercase', margin: '0 0 10px' }}>
                        B) Personaliza tu estilo, ritmo diario y traslados Punto A → Punto B
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(235px, 1fr))', gap: '16px' }}>
                        <div>
                          <div className="field-label" style={{ marginBottom: '6px' }}>1. Estilo de ruta (filtra paradas sugeridas)</div>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {[
                              { id: 'completo', label: 'Todo Incluido' },
                              { id: 'cultural', label: 'Cultural / Historia' },
                              { id: 'gastronomico', label: 'Mercados / Barrios' },
                              { id: 'naturaleza', label: 'Naturaleza / Vistas' },
                            ].map((st) => (
                              <button
                                key={st.id}
                                type="button"
                                onClick={() => applyTravelStyleFilter(st.id)}
                                className={`btn btn-sm ${travelStyle === st.id ? 'btn-primary' : ''}`}
                                style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                              >
                                {st.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="field-label" style={{ marginBottom: '6px' }}>2. Ritmo del itinerario por día</div>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {[
                              { id: 'relajado', label: 'Relajado (2/día)' },
                              { id: 'equilibrado', label: 'Equilibrado (3/día)' },
                              { id: 'intenso', label: 'Intenso (4/día)' },
                            ].map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => setTravelPace(p.id)}
                                className={`btn btn-sm ${travelPace === p.id ? 'btn-cobalt' : ''}`}
                                style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="field-label" style={{ marginBottom: '6px' }}>3. Tiempo extra entre Punto A y Punto B</div>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {[
                              { min: 0, label: 'Directo (0 min)' },
                              { min: 45, label: '+45m Café / Mirador' },
                              { min: 90, label: '+90m Rincón Local' },
                            ].map((tr) => (
                              <button
                                key={tr.min}
                                type="button"
                                onClick={() => setExtraTransitMinutes(tr.min)}
                                className={`btn btn-sm ${extraTransitMinutes === tr.min ? 'btn-sun' : ''}`}
                                style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                              >
                                {tr.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 3C: Selección de Lugares Turísticos + Sello de Visitado */}
                    <div style={{ marginBottom: '28px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                        <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.65rem', textTransform: 'uppercase', margin: '0' }}>
                          C) Marca y ordena las paradas de tu itinerario ({selectedPlaces.length} seleccionadas)
                        </h4>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={() => setSelectedPlaceNames((destination.places || []).map((p) => p.name))}
                          >
                            Incluir todas las paradas
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(245px, 1fr))', gap: '16px' }}>
                        {(destination.places || []).map((place) => {
                          const included = selectedPlaceNames.includes(place.name);
                          const orderIdx = selectedPlaceNames.indexOf(place.name) + 1;
                          const visitedRecord = visitedByPlaceKey.get(`${destination.slug}::${place.name}`);
                          return (
                            <article
                              key={place.name}
                              onClick={() => togglePlace(place.name)}
                              style={{
                                cursor: 'pointer',
                                border: included ? '3px solid #1A1830' : '2px dashed #575568',
                                background: included ? '#FFFFFF' : '#EAE6DC',
                                opacity: included ? 1 : 0.78,
                                boxShadow: included ? '4px 4px 0 #1A1830' : 'none',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                              }}
                            >
                              <DuotonePhoto
                                src={place.photo}
                                alt={place.name}
                                tint={destination.inks.bg}
                                ink={destination.inks.ink}
                                height={140}
                                badgeText={included ? `Parada #${orderIdx} · ${place.kind}` : place.kind}
                              />
                              <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
                                  <h5 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', textTransform: 'uppercase', margin: 0, lineHeight: 0.96 }}>
                                    {place.name}
                                  </h5>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.84rem' }}>{place.description}</p>
                                <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1.5px dashed #1A1830', display: 'grid', gap: '6px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', fontWeight: 800 }}>
                                    <span style={{ color: 'var(--color-cobalt)' }}>
                                      {place.entryFeeMxn > 0 ? `${fmtMxn(place.entryFeeMxn)} MXN` : 'Gratis'}
                                    </span>
                                    <span
                                      style={{
                                        padding: '3px 8px',
                                        background: included ? '#1E8E5A' : '#FFFFFF',
                                        color: included ? '#FFFFFF' : '#1A1830',
                                        border: '1.5px solid #1A1830',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                      }}
                                    >
                                      {included && <AnimatedEmoticon name="check" size={12} />}
                                      <span>{included ? `En ruta (#${orderIdx})` : '+ Agregar'}</span>
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={(e) => handleToggleVisitedPlace(place.name, e)}
                                    style={{
                                      width: '100%',
                                      padding: '5px 8px',
                                      fontSize: '0.75rem',
                                      fontWeight: 900,
                                      textTransform: 'uppercase',
                                      border: '1.5px solid #1A1830',
                                      background: visitedRecord ? '#FFC21A' : '#FAF8F3',
                                      color: '#1A1830',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '5px',
                                    }}
                                  >
                                    <AnimatedEmoticon name={visitedRecord ? 'star' : 'star-outline'} size={13} />
                                    <span>
                                      {visitedRecord
                                        ? `Ya visitado (${visitedRecord.visitedDate})`
                                        : 'Marcar en mi historial de visitados'}
                                    </span>
                                  </button>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </div>

                    {/* 3C: Selección de Recuerdos y Artesanías del Estado */}
                    <div className="ticket-sheet" style={{ background: '#FAF8F3' }}>
                      <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.65rem', textTransform: 'uppercase', margin: '0 0 8px' }}>
                        C) Recuerdos y compras típicas de {destination.state} para tu lista imprimible
                      </h4>
                      <p style={{ margin: '0 0 14px', fontSize: '0.9rem', color: 'var(--color-muted)' }}>
                        Selecciona qué recuerdos regionales quieres presupuestar y anotar en tu hoja de viaje:
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                        {(destination.souvenirs || []).map((souvenir) => {
                          const active = selectedSouvenirItems.includes(souvenir.item);
                          return (
                            <label
                              key={souvenir.item}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '10px',
                                padding: '12px',
                                border: '2px solid #1A1830',
                                background: active ? '#FFF6D6' : '#FFFFFF',
                                boxShadow: '3px 3px 0 #1A1830',
                                cursor: 'pointer',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={active}
                                onChange={() => toggleSouvenir(souvenir.item)}
                                style={{ marginTop: '4px' }}
                              />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 900, fontSize: '0.92rem' }}>{souvenir.item}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--color-muted)', fontWeight: 700 }}>
                                  Dónde comprar: {souvenir.where}
                                </div>
                                <div style={{ fontSize: '0.84rem', fontWeight: 900, color: 'var(--color-cobalt)', marginTop: '4px' }}>
                                  Est. {fmtMxn(souvenir.priceMxn)} MXN
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                      <button type="button" onClick={() => setStep(2)} className="btn">
                        ← Paso 2: Calendario y Clima
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          setStep(4);
                          await persistCurrentGuide({ mode: 'manual' });
                        }}
                        className="btn btn-primary"
                      >
                        Guardar en mi Configuración y Ver Mapa + Imprimible →
                      </button>
                    </div>
                  </div>
                )}

                {/* =====================================================================
                    PASO 4: RESULTADO FINAL — PRECIO ESTIMADO, MAPA DESDE EL HOTEL E IMPRIMIBLE
                   ===================================================================== */}
                {step === 4 && (
                  <div className="printable-guide-sheet">
                    {autoGeneratedBanner && (
                      <div
                        className="no-print"
                        style={{
                          background: '#FFC21A',
                          border: '2px solid #1A1830',
                          boxShadow: '4px 4px 0 #1A1830',
                          padding: '12px 18px',
                          marginBottom: '20px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '12px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <AnimatedEmoticon name="bolt" size={18} />
                          <div>
                            <strong>Guía generada automáticamente y guardada en tu cuenta ({destination.name}, {destination.state}):</strong>{' '}
                            Mejor día pronosticado por OpenWeather ({selectedDate}), {nights} noches en{' '}
                            <strong>{selectedHotel?.name}</strong> y circuito de {selectedPlaces.length} lugares.
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="btn btn-sm"
                          style={{ background: '#FFFFFF' }}
                        >
                          Personalizar selección manualmente
                        </button>
                      </div>
                    )}

                    <div className="ticket-sheet" style={{ marginBottom: '28px', background: '#FFFFFF' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap', borderBottom: '3px solid #1A1830', paddingBottom: '16px' }}>
                        <div>
                          <span className="stamp-pill" style={{ color: 'var(--color-pink)' }}>
                            Expediente Oficial de Viaje · Pasaporte de {user.name}
                          </span>
                          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '2.6rem', textTransform: 'uppercase', margin: '6px 0 0', lineHeight: 0.92 }}>
                            Guía de Viaje: {destination.name}, {destination.state}
                          </h3>
                          <p style={{ margin: '6px 0 0', fontWeight: 700, color: 'var(--color-cobalt)' }}>
                            Salida: {selectedDate} · Estancia: {nights} {nights === 1 ? 'noche' : 'noches'} · Hotel base: {selectedHotel?.name} ({selectedHotel?.zone})
                          </p>
                        </div>

                        <div className="no-print" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => window.print()}
                            className="btn btn-primary"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            <AnimatedEmoticon name="print" size={16} />
                            <span>Imprimir Guía y Lista de Compras</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleMarkAllRouteVisited}
                            className="btn btn-sun btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            <AnimatedEmoticon name="star" size={14} />
                            <span>Marcar estos {selectedPlaces.length} lugares como visitados</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setStep(3)}
                            className="btn btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            <AnimatedEmoticon name="edit" size={14} />
                            <span>Editar hotel o lugares</span>
                          </button>
                        </div>
                      </div>

                      <div className="budget-summary-grid" style={{ marginTop: '20px' }}>
                        <div className="budget-box">
                          <div className="field-hint">1. Hospedaje ({nights} {nights === 1 ? 'noche' : 'noches'})</div>
                          <div className="budget-figure">
                            {fmtMxn(budgetBreakdown.hotelMin)} – {fmtMxn(budgetBreakdown.hotelMax)}
                          </div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                            {selectedHotel?.name} ({TIER_BADGE[selectedHotel?.tier]?.label})
                          </div>
                        </div>

                        <div className="budget-box">
                          <div className="field-hint">2. Entradas ({selectedPlaces.length} lugares turísticos)</div>
                          <div className="budget-figure">{fmtMxn(budgetBreakdown.placesTotal)} MXN</div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                            Boletos de acceso e INAH por persona
                          </div>
                        </div>

                        <div className="budget-box">
                          <div className="field-hint">3. Recuerdos y artesanías ({selectedSouvenirs.length})</div>
                          <div className="budget-figure">{fmtMxn(budgetBreakdown.souvenirsTotal)} MXN</div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                            Mercados y talleres locales de {destination.state}
                          </div>
                        </div>

                        <div className="budget-box" style={{ background: '#FFC21A' }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 900, textTransform: 'uppercase' }}>
                            Precio Estimado Total del Viaje
                          </div>
                          <div className="budget-figure" style={{ fontSize: '2.2rem' }}>
                            {fmtMxn(budgetBreakdown.grandTotalMin)} – {fmtMxn(budgetBreakdown.grandTotalMax)} MXN
                          </div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 800 }}>
                            Promedio estimado: {fmtMxn(budgetBreakdown.grandTotalAvg)} MXN
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AGENDA CRONOLÓGICA DÍA POR DÍA ESTILO ITINIO */}
                    <div className="ticket-sheet" style={{ marginBottom: '28px', background: '#FAF8F3' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                        <div>
                          <span className="stamp-pill" style={{ background: '#FFC21A', color: '#1A1830' }}>
                            Agenda Cronológica de Viaje · Ritmo {travelPace}
                          </span>
                          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '2.1rem', textTransform: 'uppercase', margin: '6px 0 0' }}>
                            Itinerario Día por Día y Rutas Punto A → Punto B
                          </h3>
                        </div>

                        <div className="no-print" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>Tiempo extra en traslados:</span>
                          {[
                            { min: 0, label: 'Directo' },
                            { min: 45, label: '+45m Café/Mirador' },
                            { min: 90, label: '+90m Rincón Local' },
                          ].map((opt) => (
                            <button
                              key={opt.min}
                              type="button"
                              onClick={() => setExtraTransitMinutes(opt.min)}
                              className={`btn btn-sm ${extraTransitMinutes === opt.min ? 'btn-cobalt' : ''}`}
                              style={{ padding: '4px 9px', fontSize: '0.76rem' }}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Pestañas para filtrar por Día o ver todo el itinerario */}
                      <div className="itinio-day-tabs no-print">
                        <button
                          type="button"
                          onClick={() => setActiveDayTab('todos')}
                          className={`itinio-day-tab ${activeDayTab === 'todos' ? 'active' : ''}`}
                        >
                          Todos los días ({itineraryDays.length})
                        </button>
                        {itineraryDays.map((d) => (
                          <button
                            key={d.dayNum}
                            type="button"
                            onClick={() => setActiveDayTab(d.dayNum)}
                            className={`itinio-day-tab ${activeDayTab === d.dayNum ? 'active' : ''}`}
                          >
                            Día {d.dayNum} · {d.label} ({d.stops.length} paradas)
                          </button>
                        ))}
                      </div>

                      {/* Bloques cronológicos por día */}
                      <div style={{ display: 'grid', gap: '24px' }}>
                        {itineraryDays
                          .filter((d) => activeDayTab === 'todos' || d.dayNum === activeDayTab)
                          .map((day) => (
                            <div
                              key={day.dayNum}
                              style={{
                                border: '2px solid #1A1830',
                                background: '#FFFFFF',
                                padding: '18px',
                                boxShadow: '4px 4px 0 #1A1830',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  gap: '12px',
                                  flexWrap: 'wrap',
                                  borderBottom: '2px dashed #1A1830',
                                  paddingBottom: '10px',
                                  marginBottom: '16px',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                  <span
                                    style={{
                                      background: '#1A1830',
                                      color: '#FFC21A',
                                      fontWeight: 900,
                                      padding: '4px 10px',
                                      fontSize: '0.88rem',
                                      textTransform: 'uppercase',
                                    }}
                                  >
                                    DÍA {day.dayNum} · {day.label}
                                  </span>
                                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--color-cobalt)' }}>
                                    Salida 08:30 desde {selectedHotel?.name}
                                  </span>
                                </div>

                                {day.forecast && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', fontWeight: 800 }}>
                                    <SkyEmblem sky={day.forecast.sky} size={22} />
                                    <span>
                                      {day.forecast.max}°/{day.forecast.min}°C · Lluvia {day.forecast.pop}% · {day.forecast.reason}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="itinio-timeline-list">
                                {day.stops.map((stop, sIdx) => {
                                  const visitedRecord = visitedByPlaceKey.get(`${destination.slug}::${stop.name}`);
                                  return (
                                    <div key={`${stop.name}-${sIdx}`} style={{ display: 'grid', gap: '8px' }}>
                                      {/* Píldora inteligente de traslado Punto A -> Punto B */}
                                      <div className="itinio-transit-pill">
                                        <AnimatedEmoticon name="pin" size={14} />
                                        <span>
                                          Tramo: <strong>{stop.kmFromPrev} km</strong> (~{stop.transitMin} min de traslado)
                                          {stop.detourText ? ` · ${stop.detourText}` : ''}
                                        </span>
                                      </div>

                                      <div className="itinio-timeline-card">
                                        <span className="itinio-timeline-dot" aria-hidden="true" />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                                          <div style={{ flex: '1 1 260px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                                              <span
                                                style={{
                                                  background: '#FFC21A',
                                                  border: '1.5px solid #1A1830',
                                                  padding: '2px 8px',
                                                  fontWeight: 900,
                                                  fontSize: '0.78rem',
                                                }}
                                              >
                                                {stop.slotTime} · {stop.slotPeriod}
                                              </span>
                                              <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-cobalt)' }}>
                                                {stop.kind}
                                              </span>
                                              <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>
                                                · {stop.entryFeeMxn > 0 ? `Entrada ${fmtMxn(stop.entryFeeMxn)} MXN` : 'Acceso libre'}
                                              </span>
                                            </div>

                                            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.55rem', textTransform: 'uppercase', margin: '2px 0 4px' }}>
                                              {stop.name}
                                            </h4>
                                            <p style={{ margin: 0, fontSize: '0.88rem' }}>{stop.description}</p>
                                          </div>

                                          <div className="no-print" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                                            {!stop.isCustom && (
                                              <>
                                                <button
                                                  type="button"
                                                  onClick={() => movePlaceOrder(stop.name, -1)}
                                                  className="btn btn-sm"
                                                  style={{ padding: '4px 8px', fontSize: '0.76rem' }}
                                                  title="Mover antes en el itinerario"
                                                >
                                                  ↑
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => movePlaceOrder(stop.name, 1)}
                                                  className="btn btn-sm"
                                                  style={{ padding: '4px 8px', fontSize: '0.76rem' }}
                                                  title="Mover después en el itinerario"
                                                >
                                                  ↓
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={(e) => handleToggleVisitedPlace(stop.name, e)}
                                                  className="btn btn-sm"
                                                  style={{
                                                    padding: '4px 9px',
                                                    fontSize: '0.75rem',
                                                    background: visitedRecord ? '#FFC21A' : '#FAF8F3',
                                                  }}
                                                >
                                                  {visitedRecord ? (
                                                    <>
                                                      <AnimatedEmoticon name="check" size={11} /> Visitado
                                                    </>
                                                  ) : (
                                                    'Sellar visita'
                                                  )}
                                                </button>
                                              </>
                                            )}
                                            {stop.isCustom && (
                                              <button
                                                type="button"
                                                onClick={() => setCustomStops((prev) => prev.filter((c) => c.id !== stop.customId))}
                                                className="btn btn-sm"
                                                style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--color-red)' }}
                                              >
                                                Quitar
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                      </div>

                      {/* Formulario para añadir paradas propias al itinerario estilo Itinio */}
                      <form
                        onSubmit={handleAddCustomStop}
                        className="no-print"
                        style={{
                          marginTop: '18px',
                          display: 'flex',
                          gap: '10px',
                          flexWrap: 'wrap',
                          alignItems: 'flex-end',
                          paddingTop: '14px',
                          borderTop: '1.5px dashed #1A1830',
                        }}
                      >
                        <div style={{ flex: '1 1 220px' }}>
                          <label htmlFor="custom-stop-name" className="field-label" style={{ display: 'block', marginBottom: '4px' }}>
                            Agregar parada propia a tu itinerario (café, restaurante, mirador…)
                          </label>
                          <input
                            id="custom-stop-name"
                            type="text"
                            className="input-field"
                            style={{ padding: '8px 12px', fontSize: '0.88rem' }}
                            placeholder="Ej. Cena en mercado local, Café del centro, Mirador…"
                            value={customStopName}
                            onChange={(e) => setCustomStopName(e.target.value)}
                          />
                        </div>
                        <div style={{ width: '125px' }}>
                          <label htmlFor="custom-stop-time" className="field-label" style={{ display: 'block', marginBottom: '4px' }}>
                            Horario
                          </label>
                          <input
                            id="custom-stop-time"
                            type="time"
                            className="input-field"
                            style={{ padding: '8px 10px', fontSize: '0.88rem' }}
                            value={customStopTime}
                            onChange={(e) => setCustomStopTime(e.target.value)}
                          />
                        </div>
                        <button type="submit" className="btn btn-sm btn-cobalt" style={{ padding: '9px 14px' }}>
                          + Añadir parada al itinerario
                        </button>
                      </form>
                    </div>

                    {/* MAPA DEL RECORRIDO EMPEZANDO DESDE EL HOTEL SELECCIONADO */}
                    <div style={{ marginBottom: '28px' }}>
                      <RouteMapFromHotel
                        destination={destination}
                        hotel={selectedHotel}
                        places={placesForActiveMap}
                        activeStopIdx={activeStopIdx}
                        onSelectStop={setActiveStopIdx}
                      />
                    </div>

                    {/* IMPRIMIBLE: LISTA DE COSAS QUE COMPRAR + RECUERDOS DE LA VISITA */}
                    <div className="printable-checklist-sheet ticket-sheet">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', borderBottom: '2px dashed #1A1830', paddingBottom: '14px', marginBottom: '18px' }}>
                        <div>
                          <span className="stamp-pill" style={{ background: '#00A3A1', color: '#1A1830' }}>
                            Formato Imprimible de Bolsillo
                          </span>
                          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '2.1rem', textTransform: 'uppercase', margin: '6px 0 0' }}>
                            Lista de Cosas que Comprar y Recuerdos de {destination.name}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="btn btn-sun btn-sm no-print"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <AnimatedEmoticon name="print" size={14} />
                          <span>Imprimir esta lista ahora</span>
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '24px' }}>
                        <div>
                          <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', textTransform: 'uppercase', margin: '0 0 10px', color: 'var(--color-cobalt)' }}>
                            1. Cosas que comprar / empacar (Clima {weather?.current?.temp ?? 24}°C · {weather?.current?.description || 'Actual'})
                          </h4>
                          <div style={{ display: 'grid', gap: '8px' }}>
                            {(weather?.packing || destination.basePacking || []).map((item) => {
                              const checked = Boolean(checkedPacking[item]);
                              return (
                                <label
                                  key={item}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '8px 12px',
                                    border: '1.5px solid #1A1830',
                                    background: checked ? '#FFFFFF' : '#F3F1EC',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() =>
                                      setCheckedPacking((prev) => ({ ...prev, [item]: !prev[item] }))
                                    }
                                  />
                                  <span>[ ] Comprar / empacar: {item}</span>
                                </label>
                              );
                            })}

                            {customBuyList.map((cItem) => (
                              <label
                                key={cItem.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  padding: '8px 12px',
                                  border: '1.5px solid #1A1830',
                                  background: '#FFF6D6',
                                  fontWeight: 700,
                                }}
                              >
                                <input type="checkbox" defaultChecked />
                                <span>[ ] {cItem.label}</span>
                              </label>
                            ))}
                          </div>

                          <form onSubmit={handleAddCustomBuy} className="no-print" style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                            <input
                              type="text"
                              className="input-field"
                              style={{ padding: '8px 12px', fontSize: '0.88rem' }}
                              placeholder="Agregar otra cosa que comprar (ej. rollo fotográfico, pilas…)"
                              value={customBuyText}
                              onChange={(e) => setCustomBuyText(e.target.value)}
                            />
                            <button type="submit" className="btn btn-sm btn-cobalt">
                              + Añadir
                            </button>
                          </form>
                        </div>

                        <div>
                          <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', textTransform: 'uppercase', margin: '0 0 10px', color: 'var(--color-pink)' }}>
                            2. Recuerdos auténticos que traer de {destination.name} ({destination.state})
                          </h4>
                          <div style={{ display: 'grid', gap: '8px' }}>
                            {(destination.souvenirs || []).map((s) => {
                              const isSelected = selectedSouvenirItems.includes(s.item);
                              return (
                                <label
                                  key={s.item}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    justifyContent: 'space-between',
                                    gap: '10px',
                                    padding: '10px 12px',
                                    border: '1.5px solid #1A1830',
                                    background: isSelected ? '#FFF6D6' : '#F3F1EC',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => toggleSouvenir(s.item)}
                                      style={{ marginTop: '4px' }}
                                    />
                                    <div>
                                      <div style={{ fontWeight: 900, fontSize: '0.92rem' }}>{s.item}</div>
                                      <div style={{ fontSize: '0.78rem', color: 'var(--color-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                        <AnimatedEmoticon name="pin" size={13} />
                                        <span>{s.where}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <span style={{ fontWeight: 900, fontSize: '0.88rem', whiteSpace: 'nowrap' }}>
                                    {fmtMxn(s.priceMxn)}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </>
      )}
    </section>
  );
}
