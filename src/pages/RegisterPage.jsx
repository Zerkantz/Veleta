import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../lib/api.js';
import { AnimatedEmoticon } from '../components/Motion.jsx';

const COMMON_PASSWORDS = new Set([
  'password', 'password1', '12345678', '123456789', 'qwerty123', 'contraseña', 'contrasena',
  'contraseña1', 'abc12345', '11111111', 'iloveyou', 'admin123', 'mexico123', 'veleta123',
]);

function validateRegisterClient(values) {
  const errors = {};
  const name = (values.name || '').trim();
  const email = (values.email || '').trim().toLowerCase();
  const password = values.password || '';
  const confirm = values.confirmPassword || '';
  const city = (values.homeCity || '').trim();

  if (name.length < 2) {
    errors.name = 'Escribe tu nombre en la carta (mínimo 2 letras).';
  } else if (name.length > 60) {
    errors.name = 'El nombre es demasiado largo (máximo 60).';
  } else if (!/^[\p{L}][\p{L} '.-]*$/u.test(name)) {
    errors.name = 'Usa solo letras, espacios, apóstrofo o guion.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Escribe un correo válido, como nombre@dominio.com.';
  }

  if (password.length < 8) {
    errors.password = 'La clave de lacre necesita al menos 8 caracteres.';
  } else if (!/[a-z]/.test(password)) {
    errors.password = 'Incluye al menos una letra minúscula.';
  } else if (!/[A-Z]/.test(password)) {
    errors.password = 'Incluye al menos una letra mayúscula.';
  } else if (!/\d/.test(password)) {
    errors.password = 'Incluye al menos un número.';
  } else if (!/[^A-Za-z0-9]/.test(password)) {
    errors.password = 'Incluye al menos un símbolo (ej. ! ? # $ %).';
  } else if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.password = 'Esa contraseña es demasiado común. Elige una única.';
  } else if (email && password.toLowerCase().includes(email.split('@')[0])) {
    errors.password = 'La contraseña no debe contener tu correo.';
  }

  if (!confirm || password !== confirm) {
    errors.confirmPassword = 'Las contraseñas no coinciden.';
  }

  if (city && !/^[\p{L} '.,-]*$/u.test(city)) {
    errors.homeCity = 'Usa solo letras para tu ciudad de origen.';
  }

  if (!values.acceptPrivacy) {
    errors.acceptPrivacy = 'Necesitas aceptar el aviso de privacidad postal antes de sellar tu carta.';
  }

  return errors;
}

/**
 * Renglón interactivo de firma autógrafa para la Carta de Viajero:
 * Permite firmar con caligrafía en vivo (teclado) o trazar la rúbrica con el cursor/dedo.
 */
function LetterSignatureBox({
  signatureText,
  onSignatureTextChange,
  hasDrawnStroke,
  onDrawnStrokeChange,
  fallbackName = '',
}) {
  const [drawMode, setDrawMode] = useState(false);
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);

  const effectiveSignature = (signatureText || fallbackName || '').trim();

  const startStroke = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    drawingRef.current = true;
    ctx.strokeStyle = '#1D3FBB';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    onDrawnStrokeChange(true);
  };

  const moveStroke = (e) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const endStroke = () => {
    drawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onDrawnStrokeChange(false);
  };

  return (
    <div className="signature-desk-box">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontWeight: 800, fontSize: '0.95rem' }}>
          <AnimatedEmoticon name="quill" size={18} />
          <span>Firma Autógrafa del Remitente (Requerida para sellar la carta)</span>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setDrawMode(false)}
            className={`btn btn-sm ${!drawMode ? 'btn-cobalt' : ''}`}
            style={{ padding: '4px 10px', fontSize: '0.78rem' }}
          >
            Pluma caligráfica (Teclado)
          </button>
          <button
            type="button"
            onClick={() => setDrawMode(true)}
            className={`btn btn-sm ${drawMode ? 'btn-cobalt' : ''}`}
            style={{ padding: '4px 10px', fontSize: '0.78rem' }}
          >
            Trazar rúbrica (Mouse / Táctil)
          </button>
          {drawMode && (
            <button
              type="button"
              onClick={clearCanvas}
              className="btn btn-sm"
              style={{ padding: '4px 10px', fontSize: '0.78rem' }}
            >
              Limpiar trazo
            </button>
          )}
        </div>
      </div>

      {!drawMode ? (
        <div>
          <input
            type="text"
            className="input-field"
            placeholder="Escribe aquí tu nombre o rúbrica para firmar la carta…"
            value={signatureText}
            onChange={(e) => onSignatureTextChange(e.target.value)}
            style={{ marginBottom: '10px', background: '#FFFFFF' }}
          />
          <div className="signature-line-stage">
            <div className="signature-script-preview">
              {effectiveSignature || 'Firma aquí tu carta…'}
            </div>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-muted)' }}>
              Rúbrica en tinta azul cobalto
            </span>
          </div>
        </div>
      ) : (
        <div>
          <canvas
            ref={canvasRef}
            width={460}
            height={92}
            className="signature-canvas"
            onMouseDown={startStroke}
            onMouseMove={moveStroke}
            onMouseUp={endStroke}
            onMouseLeave={endStroke}
            onTouchStart={startStroke}
            onTouchMove={moveStroke}
            onTouchEnd={endStroke}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-muted)', marginTop: '4px' }}>
            <span>Desliza el cursor o tu dedo sobre el recuadro para estampar tu rúbrica</span>
            <span>{hasDrawnStroke ? 'Firma trazada lista' : 'Sin trazo aún'}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function RegisterPage() {
  const {
    user,
    login,
    register,
    logout,
    refreshSession,
    savedGuides,
    visitedPlaces,
    deleteGuide,
    removeVisitedPlace,
  } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    homeCity: '',
    acceptPrivacy: false,
    marketingOptIn: false,
  });
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signatureText, setSignatureText] = useState('');
  const [hasDrawnStroke, setHasDrawnStroke] = useState(false);

  const [touched, setTouched] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [bannerError, setBannerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);

  // Estado del expediente de cuenta (cuando el usuario ha iniciado sesión)
  const [accountData, setAccountData] = useState(null);
  const [arcoFeedback, setArcoFeedback] = useState('');

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, []);

  const clientErrors = useMemo(() => validateRegisterClient(form), [form]);

  const passwordChecks = useMemo(() => {
    const p = form.password || '';
    const emailUser = (form.email || '').split('@')[0]?.toLowerCase();
    return [
      { label: 'Mínimo 8 caracteres', ok: p.length >= 8 },
      { label: 'Al menos una minúscula (a-z)', ok: /[a-z]/.test(p) },
      { label: 'Al menos una mayúscula (A-Z)', ok: /[A-Z]/.test(p) },
      { label: 'Al menos un número (0-9)', ok: /\d/.test(p) },
      { label: 'Al menos un símbolo (! ? # $ %)', ok: /[^A-Za-z0-9]/.test(p) },
      {
        label: 'No contiene tu correo ni es común',
        ok: p.length > 0 && !COMMON_PASSWORDS.has(p.toLowerCase()) && (!emailUser || !p.toLowerCase().includes(emailUser)),
      },
    ];
  }, [form.password, form.email]);

  useEffect(() => {
    if (user) {
      apiRequest('/api/cuenta')
        .then(setAccountData)
        .catch(() => {});
    } else {
      setAccountData(null);
    }
  }, [user]);

  const isLetterSigned = useMemo(() => {
    if (hasDrawnStroke) return true;
    if (signatureText.trim().length >= 2) return true;
    if (mode === 'register' && form.name.trim().length >= 2) return true;
    return false;
  }, [hasDrawnStroke, signatureText, mode, form.name]);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
      homeCity: true,
      acceptPrivacy: true,
    });
    setServerErrors({});
    setBannerError('');

    if (Object.keys(clientErrors).length > 0) {
      setBannerError('Por favor completa los datos de tu carta antes de estampar el sello de lacre.');
      return;
    }

    if (!isLetterSigned) {
      setBannerError('Por favor estampa tu firma autógrafa al final de la carta para validarla.');
      return;
    }

    try {
      setSubmitting(true);
      await register(form);
    } catch (err) {
      if (err.fields) setServerErrors(err.fields);
      setBannerError(err.message || 'No se pudo sellar la carta de registro.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setBannerError('');
    if (!isLetterSigned) {
      setBannerError('Por favor escribe tu nombre o traza tu firma al calce de la carta antes de lacrarla.');
      return;
    }
    try {
      setSubmitting(true);
      await login(loginForm.email, loginForm.password);
    } catch (err) {
      setBannerError(err.message || 'No se pudo verificar tu carta de acceso.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleMarketing = async (nextVal) => {
    try {
      await apiRequest('/api/cuenta/preferencias', {
        method: 'POST',
        body: { marketingOptIn: nextVal },
      });
      const updated = await apiRequest('/api/cuenta');
      setAccountData(updated);
      setArcoFeedback('Preferencia de correspondencia actualizada.');
    } catch (err) {
      setArcoFeedback(err.message);
    }
  };

  const handleDeleteAccount = async () => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('¿Confirmas cancelar tu expediente de viajero? Se eliminarán tu cuenta, itinerarios guardados e historial de lugares visitados.')) {
      return;
    }
    await apiRequest('/api/cuenta', { method: 'DELETE' });
    await refreshSession();
  };

  const fieldError = (key) => serverErrors[key] || (touched[key] ? clientErrors[key] : '');

  if (user) {
    return (
      <div className="wrap press-reveal user-module-readable" style={{ padding: '48px 24px' }}>
        <div className="postal-letter-sheet">
          <div className="airmail-border" />
          <div className="postal-letter-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
              <div>
                <span
                  className="user-badge-pill"
                  style={{
                    background: '#E7F8F0',
                    color: '#1E8E5A',
                    borderColor: '#1E8E5A',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <AnimatedEmoticon name="seal" size={16} />
                  <span>Carta sellada y verificada · Bitácora abierta</span>
                </span>
                <h1 className="user-title-xl" style={{ marginTop: '10px' }}>
                  Bitácora de Viajero: {user.name}
                </h1>
                <p style={{ margin: '6px 0 0', fontSize: '1.02rem', color: 'var(--color-muted)' }}>
                  Remitente registrado: <strong style={{ color: '#1A1830' }}>{user.email}</strong>
                  {accountData?.profile?.homeCity ? ` · Origen: ${accountData.profile.homeCity}` : ''}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Link to="/#armador-viaje" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <AnimatedEmoticon name="bolt" size={15} />
                  <span>Abrir Planificador de Itinerario</span>
                </Link>
                <button type="button" onClick={logout} className="btn btn-sm">
                  Cerrar bitácora
                </button>
              </div>
            </div>

            {/* 1. Configuración de Itinerarios Guardados */}
            <div style={{ marginTop: '28px', paddingTop: '24px', borderTop: '2px dashed #1A1830' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
                <h2 className="user-title-lg" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AnimatedEmoticon name="folder" size={20} />
                  <span>Tus itinerarios de viaje guardados ({savedGuides?.length || 0})</span>
                </h2>
                <Link to="/#armador-viaje" style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--color-cobalt)' }}>
                  + Planificar un nuevo itinerario día por día →
                </Link>
              </div>

              {savedGuides?.length ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(295px, 1fr))', gap: '16px' }}>
                  {savedGuides.map((g) => (
                    <div
                      key={g.id}
                      style={{
                        border: '2px solid #1A1830',
                        background: '#FAF8F3',
                        padding: '18px',
                        boxShadow: '4px 4px 0 #1A1830',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                        <span className="user-badge-pill" style={{ background: '#FFC21A', color: '#1A1830' }}>
                          {g.stateName}
                        </span>
                        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-muted)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <AnimatedEmoticon name={g.mode === 'auto' ? 'bolt' : 'quill'} size={14} />
                          <span>{g.mode === 'auto' ? 'Ruta inteligente' : 'Personalizado'}</span>
                        </span>
                      </div>

                      <div className="user-title-md">
                        {g.destinationName}
                      </div>

                      <div style={{ fontSize: '0.94rem', lineHeight: 1.6, display: 'grid', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <AnimatedEmoticon name="calendar" size={15} />
                          <span>Inicio: <strong>{g.startDate}</strong> ({g.nights} {g.nights === 1 ? 'día' : 'días'})</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <AnimatedEmoticon name="hotel" size={15} />
                          <span>Base: <strong>{g.hotelName}</strong></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <AnimatedEmoticon name="pin" size={15} />
                          <span>Itinerario: <strong>{g.places?.length || 0} paradas</strong></span>
                          <span>·</span>
                          <AnimatedEmoticon name="gift" size={15} />
                          <span><strong>{g.souvenirs?.length || 0} recuerdos</strong></span>
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: 'auto',
                          paddingTop: '12px',
                          borderTop: '1.5px dashed #1A1830',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <strong style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1A1830' }}>
                          Est. ${Number(g.estimatedTotalMxn || 0).toLocaleString('es-MX')} MXN
                        </strong>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <Link to={`/destinos/${g.slug}#armador-viaje`} className="btn btn-sm btn-cobalt">
                            Abrir itinerario
                          </Link>
                          <button
                            type="button"
                            onClick={() => deleteGuide(g.id)}
                            className="btn btn-sm"
                            style={{ color: 'var(--color-red)' }}
                          >
                            Borrar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '0.98rem' }}>
                  Todavía no tienes itinerarios guardados. Ve al{' '}
                  <Link to="/#armador-viaje" style={{ color: 'var(--color-pink)', fontWeight: 700 }}>
                    Planificador de Itinerario en Inicio
                  </Link>{' '}
                  para armar tu agenda día por día con ruta optimizada desde tu hotel.
                </p>
              )}
            </div>

            {/* 2. Historial de Lugares Turísticos Visitados */}
            <div style={{ marginTop: '28px', paddingTop: '24px', borderTop: '2px dashed #1A1830' }}>
              <h2 className="user-title-lg" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AnimatedEmoticon name="pin" size={20} />
                <span>Tu bitácora de lugares visitados ({visitedPlaces?.length || 0})</span>
              </h2>
              {visitedPlaces?.length ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(265px, 1fr))', gap: '14px' }}>
                  {visitedPlaces.map((vp) => (
                    <div
                      key={vp.id}
                      style={{
                        border: '2px solid #1A1830',
                        background: '#FFF6D6',
                        padding: '14px 16px',
                        boxShadow: '3px 3px 0 #1A1830',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '10px',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-cobalt)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <AnimatedEmoticon name="star" size={14} />
                          <span>{vp.stateName} · {vp.destinationName}</span>
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '1.05rem', marginTop: '3px' }}>{vp.placeName}</div>
                        <div style={{ fontSize: '0.86rem', color: 'var(--color-muted)', fontWeight: 600, marginTop: '3px' }}>
                          Sello de visita: {vp.visitedDate}
                        </div>
                        {vp.notes && (
                          <div style={{ fontSize: '0.86rem', marginTop: '4px' }}>{vp.notes}</div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVisitedPlace(vp.id)}
                        className="btn btn-sm"
                        style={{ padding: '4px 9px', fontSize: '0.8rem' }}
                        title="Quitar del historial"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '0.98rem' }}>
                  Aún no has sellado lugares visitados. En tu itinerario puedes marcar cualquier parada con{' '}
                  <strong>«Marcar como visitado»</strong> para registrarlo en tu bitácora.
                </p>
              )}
            </div>

            {/* 3. Destinos favoritos */}
            <div style={{ marginTop: '28px', paddingTop: '24px', borderTop: '2px dashed #1A1830' }}>
              <h2 className="user-title-lg" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AnimatedEmoticon name="star" size={20} />
                <span>Tus postales favoritas ({accountData?.favorites?.length || 0})</span>
              </h2>
              {accountData?.favorites?.length ? (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {accountData.favorites.map((slug) => (
                    <Link key={slug} to={`/destinos/${slug}`} className="btn btn-sun btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <AnimatedEmoticon name="star" size={14} />
                      <span>Abrir destino: {slug}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '0.98rem' }}>
                  Aún no has guardado postales favoritas. Ve a <Link to="/" style={{ color: 'var(--color-pink)', fontWeight: 700 }}>Inicio</Link> y pulsa la estrella en cualquier destino.
                </p>
              )}
            </div>

            {/* 4. Privacidad y Derechos ARCO */}
            <div style={{ marginTop: '28px', paddingTop: '24px', borderTop: '2px dashed #1A1830' }}>
              <h2 className="user-title-lg" style={{ marginBottom: '8px' }}>
                Gestión de Datos Personales y Correspondencia (ARCO)
              </h2>
              <p className="measure" style={{ marginTop: 0, fontSize: '0.96rem' }}>
                Administra tu información personal, descarga una copia de tu bitácora o cancela tu registro cuando lo desees:
              </p>

              {arcoFeedback && (
                <p style={{ fontWeight: 800, color: 'var(--color-agave)' }} role="status">
                  {arcoFeedback}
                </p>
              )}

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <a href="/api/cuenta/mis-datos" download className="btn btn-sm">
                  Descargar mi bitácora (JSON)
                </a>

                <button
                  type="button"
                  onClick={() => handleToggleMarketing(!accountData?.profile?.marketingOptIn)}
                  className="btn btn-sm"
                >
                  {accountData?.profile?.marketingOptIn ? 'Pausar avisos postales de clima' : 'Recibir avisos postales de clima'}
                </button>

                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="btn btn-sm"
                  style={{ background: 'var(--color-red)', color: '#FFFFFF' }}
                >
                  Eliminar mi cuenta y bitácora
                </button>
              </div>
            </div>
          </div>
          <div className="airmail-border airmail-border-bottom" />
        </div>
      </div>
    );
  }

  return (
    <div className="wrap press-reveal user-module-readable" style={{ padding: '44px 24px 64px' }}>
      <div
        style={{
          maxWidth: '860px',
          margin: '0 auto',
        }}
      >
        {/* PLIEGO DE CARTA POSTAL AÉREA */}
        <div className="postal-letter-sheet">
          <div className="airmail-border" />

          <div className="postal-letter-body">
            {/* Membrete superior con fecha y timbre postal */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '20px',
                flexWrap: 'wrap',
                borderBottom: '2px dashed #1A1830',
                paddingBottom: '18px',
                marginBottom: '22px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="user-badge-pill" style={{ background: '#FFC21A', color: '#1A1830' }}>
                    Servicio Postal de Viajeros · Correo Aéreo
                  </span>
                  <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--color-cobalt)' }}>
                    México, a {todayFormatted}
                  </span>
                </div>

                <h1 className="user-title-xl" style={{ marginTop: '10px', marginBottom: '4px' }}>
                  {mode === 'login'
                    ? 'Carta de Acceso a tu Bitácora de Viaje'
                    : 'Carta de Inscripción de Nuevo Viajero'}
                </h1>
                <p style={{ margin: 0, fontSize: '0.96rem', color: 'var(--color-muted)' }}>
                  Redacta tus datos en el pliego, estampa tu <strong>firma autógrafa al calce</strong> y coloca el sello de lacre.
                </p>
              </div>

              {/* Timbre postal ilustrado en la esquina superior derecha */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div className="postage-stamp-box" aria-hidden="true">
                  <div style={{ fontSize: '0.62rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#E4007C' }}>
                    Correos México
                  </div>
                  <div style={{ margin: '4px 0', display: 'flex', justifyContent: 'center' }}>
                    <AnimatedEmoticon name="quill" size={24} />
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 900, lineHeight: 1 }}>
                    VELETA · $5
                  </div>
                </div>
              </div>
            </div>

            {/* Selector de tipo de carta */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setBannerError('');
                }}
                className={`btn btn-sm ${mode === 'login' ? 'btn-primary' : ''}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <AnimatedEmoticon name="quill" size={14} />
                <span>Firmar Carta de Acceso (Iniciar sesión)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setBannerError('');
                }}
                className={`btn btn-sm ${mode === 'register' ? 'btn-primary' : ''}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <AnimatedEmoticon name="seal" size={14} />
                <span>Redactar Carta de Nuevo Viajero (Crear cuenta)</span>
              </button>
            </div>

            {bannerError && (
              <div
                role="alert"
                style={{
                  background: '#FDECEC',
                  border: '2px solid var(--color-red)',
                  color: 'var(--color-red)',
                  padding: '12px 14px',
                  fontWeight: 700,
                  fontSize: '0.96rem',
                  marginBottom: '18px',
                }}
              >
                {bannerError}
              </div>
            )}

            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} noValidate>
                <div className="letter-salutation">
                  <strong>Estimada Oficina de Itinerarios de Veleta:</strong>
                  <p style={{ margin: '6px 0 0' }}>
                    Por medio de la presente carta solicito abrir mi bitácora personal de rutas e itinerarios. Acredito mi
                    identidad como remitente registrado y firmo de conformidad al pie de este documento:
                  </p>
                </div>

                <div className="form-grid">
                  <div className="field-group">
                    <label htmlFor="login-email" className="user-field-label">
                      1. Correo postal electrónico del remitente *
                    </label>
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      className="input-field"
                      placeholder="viajero@dominio.mx"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm((f) => ({ ...f, email: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="field-group">
                    <label htmlFor="login-password" className="user-field-label">
                      2. Clave personal de resguardo *
                    </label>
                    <input
                      id="login-password"
                      type="password"
                      autoComplete="current-password"
                      className="input-field"
                      placeholder="Tu contraseña secreta"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                {/* Mesa de Firma Autógrafa */}
                <LetterSignatureBox
                  signatureText={signatureText}
                  onSignatureTextChange={setSignatureText}
                  hasDrawnStroke={hasDrawnStroke}
                  onDrawnStrokeChange={setHasDrawnStroke}
                  fallbackName={loginForm.email ? loginForm.email.split('@')[0] : ''}
                />

                <div
                  style={{
                    marginTop: '22px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '14px',
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ fontSize: '0.88rem', color: 'var(--color-muted)', fontWeight: 600 }}>
                    Atentamente, el viajero titular de la bitácora.
                  </span>

                  <button type="submit" disabled={submitting} className="wax-seal-btn">
                    <AnimatedEmoticon name="seal" size={20} />
                    <span>{submitting ? 'Lacrando y verificando…' : 'Firmar y Sellar Carta para Entrar'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} noValidate>
                <div className="letter-salutation">
                  <strong>A la Oficina Central de Rutas e Itinerarios de Veleta:</strong>
                  <p style={{ margin: '6px 0 0' }}>
                    Por medio de la presente misiva solicito la apertura de mi expediente de viajero para planificar
                    itinerarios día por día, optimizar mis traslados desde el hotel y conservar mi bitácora de lugares visitados:
                  </p>
                </div>

                <div className="form-grid">
                  <div className="field-group">
                    <label htmlFor="reg-name" className="user-field-label">
                      Yo, (Nombre completo del remitente) *
                    </label>
                    <input
                      id="reg-name"
                      type="text"
                      autoComplete="name"
                      className="input-field"
                      placeholder="Ej. Elena Poniatowska"
                      value={form.name}
                      aria-invalid={Boolean(fieldError('name'))}
                      aria-describedby={fieldError('name') ? 'err-name' : undefined}
                      onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm((f) => ({ ...f, name: val }));
                        if (!signatureText) setSignatureText(val);
                      }}
                    />
                    {fieldError('name') && (
                      <span id="err-name" className="field-error">
                        {fieldError('name')}
                      </span>
                    )}
                  </div>

                  <div className="field-group">
                    <label htmlFor="reg-city" className="user-field-label">
                      Originario(a) de la ciudad de (Opcional)
                    </label>
                    <input
                      id="reg-city"
                      type="text"
                      className="input-field"
                      placeholder="Ej. Guadalajara, Monterrey, Puebla…"
                      value={form.homeCity}
                      aria-invalid={Boolean(fieldError('homeCity'))}
                      onBlur={() => setTouched((t) => ({ ...t, homeCity: true }))}
                      onChange={(e) => setForm((f) => ({ ...f, homeCity: e.target.value }))}
                    />
                    {fieldError('homeCity') && (
                      <span className="field-error">{fieldError('homeCity')}</span>
                    )}
                  </div>

                  <div className="field-group">
                    <label htmlFor="reg-email" className="user-field-label">
                      Con dirección de correo electrónico *
                    </label>
                    <input
                      id="reg-email"
                      type="email"
                      autoComplete="email"
                      className="input-field"
                      placeholder="viajero@dominio.mx"
                      value={form.email}
                      aria-invalid={Boolean(fieldError('email'))}
                      aria-describedby={fieldError('email') ? 'err-email' : undefined}
                      onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    />
                    {fieldError('email') && (
                      <span id="err-email" className="field-error">
                        {fieldError('email')}
                      </span>
                    )}
                  </div>

                  <div className="field-group">
                    <label htmlFor="reg-password" className="user-field-label">
                      Establezco mi clave de lacre (Contraseña) *
                    </label>
                    <input
                      id="reg-password"
                      type="password"
                      autoComplete="new-password"
                      className="input-field"
                      placeholder="Mín. 8 caracteres, mayús, núm y símbolo"
                      value={form.password}
                      aria-invalid={Boolean(fieldError('password'))}
                      aria-describedby="pwd-checklist"
                      onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    />
                    {fieldError('password') && (
                      <span className="field-error">{fieldError('password')}</span>
                    )}
                  </div>

                  <div className="field-group">
                    <label htmlFor="reg-confirm" className="user-field-label">
                      Confirmo mi clave de lacre *
                    </label>
                    <input
                      id="reg-confirm"
                      type="password"
                      autoComplete="new-password"
                      className="input-field"
                      placeholder="Repite tu contraseña"
                      value={form.confirmPassword}
                      aria-invalid={Boolean(fieldError('confirmPassword'))}
                      aria-describedby={fieldError('confirmPassword') ? 'err-confirm' : undefined}
                      onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
                      onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                    />
                    {fieldError('confirmPassword') && (
                      <span id="err-confirm" className="field-error">
                        {fieldError('confirmPassword')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Lista interactiva de reglas de contraseña */}
                <div
                  id="pwd-checklist"
                  style={{
                    marginTop: '16px',
                    padding: '14px 16px',
                    background: '#F3F1EC',
                    border: '1.5px solid #1A1830',
                  }}
                >
                  <strong style={{ fontSize: '0.9rem', display: 'block', marginBottom: '6px' }}>
                    Requisitos de seguridad para el lacre de tu carta:
                  </strong>
                  <ul
                    style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: 0,
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                      gap: '6px',
                      fontSize: '0.9rem',
                    }}
                  >
                    {passwordChecks.map((c) => (
                      <li
                        key={c.label}
                        style={{
                          fontWeight: 600,
                          color: c.ok ? 'var(--color-agave)' : 'var(--color-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        {c.ok ? (
                          <AnimatedEmoticon name="check" size={14} />
                        ) : (
                          <span style={{ display: 'inline-block', width: 14, textAlign: 'center' }}>•</span>
                        )}
                        <span>{c.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Consentimiento de privacidad */}
                <div style={{ marginTop: '16px', display: 'grid', gap: '10px', fontSize: '0.94rem' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={form.acceptPrivacy}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, acceptPrivacy: e.target.checked }));
                        setTouched((t) => ({ ...t, acceptPrivacy: true }));
                      }}
                      style={{ marginTop: '4px' }}
                    />
                    <span>
                      He leído y acepto el{' '}
                      <button
                        type="button"
                        onClick={() => setShowPrivacyNotice((s) => !s)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          color: 'var(--color-cobalt)',
                          textDecoration: 'underline',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Aviso de Privacidad de Viajeros
                      </button>{' '}
                      para resguardar mis itinerarios e historial. *
                    </span>
                  </label>
                  {fieldError('acceptPrivacy') && (
                    <span className="field-error">{fieldError('acceptPrivacy')}</span>
                  )}

                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '0.92rem' }}>
                    <input
                      type="checkbox"
                      checked={form.marketingOptIn}
                      onChange={(e) => setForm((f) => ({ ...f, marketingOptIn: e.target.checked }))}
                      style={{ marginTop: '4px' }}
                    />
                    <span>
                      (Opcional) Deseo recibir correspondencia sobre temporadas recomendadas de viaje.
                    </span>
                  </label>
                </div>

                {showPrivacyNotice && (
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '14px',
                      background: '#FFF6D6',
                      border: '2px solid #1A1830',
                      fontSize: '0.9rem',
                      lineHeight: 1.55,
                    }}
                  >
                    <strong>Aviso de Privacidad de Correspondencia:</strong> Tus datos se emplean únicamente para
                    autenticar tu bitácora personal, guardar tus itinerarios y registrar tus visitas. Puedes descargar
                    o eliminar tu expediente completo en cualquier momento desde tu cuenta.
                  </div>
                )}

                {/* Mesa de Firma Autógrafa */}
                <LetterSignatureBox
                  signatureText={signatureText}
                  onSignatureTextChange={setSignatureText}
                  hasDrawnStroke={hasDrawnStroke}
                  onDrawnStrokeChange={setHasDrawnStroke}
                  fallbackName={form.name}
                />

                <div
                  style={{
                    marginTop: '22px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '14px',
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ fontSize: '0.88rem', color: 'var(--color-muted)', fontWeight: 600 }}>
                    Quedo de ustedes como su atento y seguro viajero.
                  </span>

                  <button type="submit" disabled={submitting} className="wax-seal-btn">
                    <AnimatedEmoticon name="seal" size={20} />
                    <span>{submitting ? 'Sellando carta…' : 'Firmar y Sellar mi Carta de Registro'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="airmail-border airmail-border-bottom" />
        </div>
      </div>
    </div>
  );
}
