# LUMO — Resumen del Proyecto v8
*Actualizado al cierre de Sesión 7 — 17 de abril de 2026*

---

## 1. QUÉ ES LUMO

Herramienta de inteligencia operativa para dueños de negocios físicos en Argentina. Detecta inconsistencias, proyecta pérdidas, y recomienda acciones concretas. No es un sistema de vigilancia — es el sistema nervioso del negocio.

**Filosofía central:** "La plata siempre deja rastros. Un robo rompe el ADN del negocio aunque sea microscópico."

Lumo no dice "fraude". Dice "inconsistencia operativa". Nunca nombra empleados en alertas automáticas — siempre el patrón o el turno. Cada alerta termina con una acción concreta. Impacto siempre en pesos argentinos con etiqueta "estimado".

---

## 2. STACK TÉCNICO

| Componente | Tecnología | URL / Ubicación |
|------------|-----------|-----------------|
| Frontend | Next.js 16 + TypeScript | https://lumo-psi.vercel.app |
| Backend | Node.js + Express | https://lumo-backend-production.up.railway.app |
| Base de datos | PostgreSQL | Railway (proyecto: romantic-patience) |
| Repo frontend | GitHub | github.com/Hensly93/lumo |
| Repo backend | GitHub | github.com/Hensly93/lumo-backend |
| Local frontend | — | C:\Users\ALE\lumo |
| Local backend | — | C:\Users\ALE\lumo\backend |

**Founder:** Hensly Holy Castelly — castellyholy@gmail.com — GitHub: Hensly93  
**Entorno:** Windows 10 Home, Git Bash  
**Comandos clave:** `npm run dev` (puertos 3000/5000), `npx vercel --yes` (deploy Vercel)

---

## 3. SESIONES COMPLETADAS

### Sesión 1 — Base del proyecto
- Setup inicial Next.js + Express + PostgreSQL
- Tablas: `usuarios`, `transacciones`
- Auth: `POST /api/auth/register`, `POST /api/auth/login` (bcrypt + JWT 30d)
- Motor de detección v1: z-score básico, estacionalidad argentina hardcodeada

### Sesión 2 — Motor de análisis v1
- `deteccion.js`: z-score simple con MAD
- `baseline.js`: baseline por usuario (ticket promedio, ventas/turno)
- `segmentacion.js`: segmentación de transacciones por turno y método de pago
- `insights.js`: generación de insights textuales básicos
- `GET /api/analisis`: primer endpoint de análisis completo

### Sesión 3 — Benchmarks del sector
- `benchmarks_sector.js`: benchmarks reales Argentina (8 tipos de negocio: kiosko, almacén, cafetería, restaurante, parrilla, panadería, farmacia, retail)
- Ajuste inflación 4% mensual
- Tabla `benchmarks_sector` en DB
- `TIPOS_VALIDOS` exportado para validación en toda la app
- `PATCH /api/perfil`: actualización tipo_negocio

### Sesión 4 — Sistema híbrido 3 capas
- `baseline_negocio.js`: baseline propio calculado desde transacciones reales
- `benchmark_hibrido.js`: `calcularPesos(totalTx)` — transición suave Capa1→Capa2
  - `peso_propio = min(total_tx / 500, 1.0)` → completamente propio a las 500 tx
- Tabla `baseline_negocio` en DB
- `GET /api/perfil`: perfil con benchmarks_sector + baseline_propio + pesos actuales
- `GET /api/negocio/perfil`: endpoint detallado capa1 + capa2 + progreso

### Sesión 5 — Integración Mercado Pago (OAuth2)
- `routes_mp.js` (253 líneas): OAuth2 completo
  - `GET /api/mp/conectar`: genera state JWT firmado → redirect a MP auth
  - `GET /api/mp/callback`: intercambia code por tokens, guarda en DB
  - `GET /api/mp/estado`: estado de la conexión (email, expiración)
  - `GET /api/mp/importar`: importa 18 meses de pagos aprobados con paginación, mapea a transacciones, recalcula baseline
- Tabla `integraciones_mp` en DB (access_token, refresh_token, mp_user_id, mp_email, fecha_expiracion)
- Auto-refresh de token antes de importar
- `UNIQUE(usuario_id, mp_payment_id)` → deduplicación de importaciones
- **Estado actual:** código 100% completo. Pendiente: credenciales reales de MP en Railway

### Sesión 6 — Motor de detección v2 + NICOLE
- `motor.js` (285 líneas): motor principal reescrito
  - Carga baseline propio (Capa2) + benchmarks sector (Capa1) + pesos híbridos
  - Evalúa señales por métrica con z-score MAD-based
  - Combina señales → score final → alertas candidatas
  - Contexto temporal integrado (S7)
- `deteccion.js` (147 líneas): z-score robusto (MAD), umbral dinámico
- **NICOLE — Diseño teórico de 8 problemas (Sesión 6B):**
  - P1: Inverse Variance Weighting + Welford's algorithm + 6 niveles jerarquía contextos
  - P2: 3 dimensiones decorrelacionadas (Volumen, Proceso, Historia)
  - P3: Factores multiplicativos con términos de interacción
  - P4: Z-score propio primero, peers como referencia; calibración silenciosa primeros 10 turnos
  - P5: Firma histórica esperada por causa externa
  - P6: Umbral dinámico por celda (turno + día + condición)
  - P7: Error-Weighted Threshold Adaptation (EWTA) — activa con ≥5 feedbacks
  - P8: CUSUM + Baseline Reset Protocol
  - **NICOLE es diseño. Implementación comienza en S8.**

### Sesión 7 — Control de caja + predicciones + alertas *(sesión actual, completa)*

**Obj 1: Sistema de control de caja (I0–I5)**
- `routes_caja.js` (487 líneas): sistema completo de caja
  - `POST /api/caja/empleados`: crear empleado con PIN (bcrypt)
  - `GET /api/caja/empleados/:id`: listar empleados activos
  - `POST /api/caja/apertura`: apertura de turno — identifica empleado + PIN + caja inicial → programa conteo aleatorio (40–180 min)
  - `GET /api/caja/conteo-pendiente/:id`: devuelve conteo pendiente si está dentro de los 15 min
  - `POST /api/caja/conteo/:turnoId`: registra conteo con monto declarado
  - `POST /api/caja/egreso`: registra egreso de caja con motivo
  - `POST /api/caja/cierre`: cierre de turno con caja final — calcula brecha y la persiste
  - `GET /api/caja/cruce/:id`: análisis cruce de variables del turno
  - `GET /api/caja/patrones/:id`: patrones históricos del negocio
  - `GET /api/caja/goteo/:id`: detección de goteo acumulado
  - `GET /api/caja/ranking/:id/:tipo`: ranking de empleados por tipo de turno
  - `GET /api/caja/contexto-turno/:id`: contexto temporal del turno activo
  - `GET /api/caja/contexto-activo/:id/:tipo`: comportamiento en contexto actual
  - `GET /api/caja/comportamiento/:id/:emp/:tipo`: comportamiento individual vs peers
- Tablas nuevas en DB: `empleados_negocio`, `turnos_caja`, `conteos_caja`, `egresos_caja`
- Fórmula central de brecha:
  ```
  efectivoEsperado = cajaApertura + ventasTotales - ventasMP - egresos
  brecha = efectivoEsperado - cajaCierre
  ```
- Conteo aleatorio: `40 + Math.floor(Math.random() * 141)` minutos desde apertura; 2 conteos si turno >6h; sin respuesta en 15min → registra omitido + alerta

**Obj 2: Motor de cruce de variables**
- `cruce_variables.js` (397 líneas):
  - `analizarCruceTurno(turnoId)`: 4 señales simultáneas → grade ok/atencion/inconsistencia/critico
  - `detectarGoteo(usuarioId, ventanaDias=21)`: acumulación de brechas pequeñas
  - `resumenPatronesNegocio(usuarioId, limiteTurnos=30)`: patrones históricos + racha limpia

**Obj 3: Z-score contextual con Open-Meteo**
- `zscore_contextual.js` (437 líneas):
  - `FERIADOS_ARG`: Set hardcodeado 2025–2026 (todos los feriados argentinos)
  - `getContextoTemporal(fecha)`: normalizado a UTC-3 (Argentina); devuelve diaSemana, hora, turno, quincena, esFeriado, esDiaCobro, etc.
  - `fetchClima(fechaStr)`: Open-Meteo API — Buenos Aires lat=-34.6037, lon=-58.3816; caché en memoria 6h; timeout 3s
  - `factoresAjuste(ctx, clima)`: factores multiplicativos para ajustar baseline
    - feriado × 0.65 | fin_semana × 1.20 | dia_cobro × 1.15 | fin_quincena × 0.90
    - lluvia × 0.80 | calor_extremo × 0.85 | lluvia+feriado bonus × 0.90
  - `calcularZScoreEmpleado(usuarioId, empleado, tipoTurno)`: mínimo 10 turnos; confianza 65%/80%/95%
  - `rankingEmpleadosTurno`: score = 100 - (brecha/max)×50 - tasa_inconsistencia×30 - tasa_omision×20
  - `detectarCambioComportamiento`: empleado vs peers z-score comparison
- `motor.js` actualizado: aplica `factoresAjuste` al baseline antes del z-score; agrega `contexto_temporal` en la respuesta

**Obj 4 + 5: Expected Revenue Model + Motor de predicciones**
- `predicciones.js` (234 líneas):
  - `nivelConfianza(diasDatos)`: <30→insuficiente | 30-59→baja | 60-89→media | 90+→alta
  - `rango(esperado, variacion)`: devuelve `{min, esperado, max}` — nunca un número único
  - `proyectarFacturacion`: promedio diario × factor_tendencia (prom7/prom30) × factor_quincena × factor_clima; proyección resto mes + mes completo
  - `proyectarPerdidas`: brecha_promedio × factor_tendencia (segunda mitad / primera mitad) × turnos_restantes_mes
  - `generarPrediccionCompleta`: combina ambas + semáforo verde/amarillo/rojo por % de pérdida sobre facturación
  - `GET /api/predicciones`

**Obj 6: Motor de recomendaciones**
- `recomendaciones.js` (256 líneas): 6 reglas con evaluar() + mensaje() + accion()
  - R1: TURNO_INCONSISTENTE_SOSTENIDO (3+ semanas, tasa ≥50%)
  - R2: BRECHA_CRECIENTE (tendencia semana a semana)
  - R3: CONTEOS_OMITIDOS_FRECUENTES (tasa ≥30%)
  - R4: RACHA_POSITIVA_TURNO (7+ turnos limpios — mensaje positivo)
  - R5: DIFERENCIA_ENTRE_TURNOS (ratio ≥2.5x entre mejor y peor turno)
  - R6: EGRESOS_FRAGMENTADOS (10+ egresos/semana, promedio <$2000)
  - Reglas fallan silenciosamente (Promise.allSettled)
  - `GET /api/recomendaciones`

**Obj 7: Alert manager con cap diario**
- `alert_manager.js` (204 líneas):
  - Cap: máx 2 alertas fuertes (critico/inconsistencia) + máx 5 totales por día
  - Deduplicación 24h por (usuario + tipo + contexto)
  - Excepción: z-score >4.0 pasa aunque supere el cap
  - Balance enforcement: si hay críticas sin positivos, rescata uno de las suprimidas
  - Feedback loop: `registrarFeedback(alertaId, {confirmada, notas})`
  - Tabla `alertas_gestionadas` en DB
  - `GET /api/alertas` | `POST /api/alertas/feedback`

**Obj 8: Open-Meteo (incluido en Obj 3)**
- Integrado en `zscore_contextual.js` — ver Obj 3

**Obj 9: OAuth MP — código 100% completo desde S5**
- Ver Sesión 5 — solo faltan credenciales reales en Railway

**Vista empleado (frontend)**
- `app/empleado/page.tsx` (522 líneas): PWA empleado — 9 estados
  - codigo → empleado → pin → apertura → activo → egreso → conteo → cierre → resumen
  - Polling conteo pendiente cada 30s
  - Countdown 15 min para responder conteo
  - Atajos de egreso rápidos
  - Resumen cierre con brecha en color (verde/rojo)

**Frontend `/login` (inicio de S7 continuación)**
- `app/login/page.tsx`: login + registro; guarda JWT en localStorage; redirige a `/`

---

## 4. ARCHIVOS BACKEND — ESTADO ACTUAL

| Archivo | Líneas | Descripción |
|---------|--------|-------------|
| `index.js` | 41 | Entry point — registra todas las rutas |
| `auth.js` | 52 | Register + Login (bcrypt + JWT) |
| `db.js` | — | Pool PostgreSQL |
| `setup.js` | 116 | Crea todas las tablas (ejecutar 1 vez) |
| `segmentacion.js` | 18 | Segmentación básica |
| `baseline.js` | 42 | Baseline v1 (legacy) |
| `deteccion.js` | 147 | Z-score MAD-based |
| `insights.js` | 89 | Insights textuales |
| `benchmarks_sector.js` | 94 | Benchmarks 8 sectores + inflación |
| `baseline_negocio.js` | 67 | Baseline propio por usuario |
| `benchmark_hibrido.js` | 37 | Pesos Capa1/Capa2 |
| `motor.js` | 285 | Motor principal análisis + contexto |
| `cruce_variables.js` | 397 | Cruce variables + goteo + patrones |
| `zscore_contextual.js` | 437 | Z-score + feriados + Open-Meteo + rankings |
| `predicciones.js` | 234 | Expected Revenue Model + proyecciones |
| `recomendaciones.js` | 256 | 6 reglas de recomendación |
| `alert_manager.js` | 204 | Cap diario + dedup + balance + feedback |
| `routes_analisis.js` | 215 | GET analisis/perfil/negocio/predicciones/recomendaciones/alertas |
| `routes_caja.js` | 487 | Sistema completo de control de caja |
| `routes_mp.js` | 253 | OAuth2 MP + importación 18 meses |

**Total: ~3.471 líneas de backend**

---

## 5. TABLAS EN BASE DE DATOS

| Tabla | Propósito |
|-------|-----------|
| `usuarios` | Registro y auth |
| `transacciones` | Todas las ventas (manual + MP) |
| `benchmarks_sector` | Benchmarks por tipo de negocio |
| `baseline_negocio` | Baseline propio calculado por usuario |
| `integraciones_mp` | Tokens OAuth de Mercado Pago |
| `empleados_negocio` | Empleados con PIN hasheado |
| `turnos_caja` | Apertura/cierre de turno + brecha |
| `conteos_caja` | Conteos aleatorios registrados |
| `egresos_caja` | Egresos durante el turno |
| `alertas_gestionadas` | Historial de alertas + feedback |

---

## 6. ARCHIVOS FRONTEND — ESTADO ACTUAL

| Ruta | Archivo | Estado |
|------|---------|--------|
| `/` | `app/page.tsx` | Mockup estático |
| `/dashboard` | `app/dashboard/page.tsx` | Mockup estático |
| `/alertas` | `app/alertas/page.tsx` | Mockup estático |
| `/empleados` | `app/empleados/page.tsx` | Mockup estático |
| `/benchmark` | `app/benchmark/page.tsx` | Placeholder "Plan Pro" |
| `/empleado` | `app/empleado/page.tsx` | **Funcional** — conectado al backend |
| `/login` | `app/login/page.tsx` | **Funcional** — conectado al backend |
| `/configuracion` | — | **Pendiente** — MP connect/import |

**Componentes:**
- `app/components/Nav.tsx`: bottom nav (Home, Alertas, Empleados, Negocio, Benchmark)
- `app/theme.ts`: `darkTheme` + `midnightTheme` — alterna por hora

**Sistema de diseño:**
- Fondo: `#070B12` (dark) / `#050D1A` (midnight)
- Accent: `#00D4FF` cyan / `#38BDF8` azul cielo
- Verde: `#00E5A0` | Rojo: `#FF4560` | Amarillo: `#FFB800`
- Tipografía monospace para números, letterSpacing en labels
- Tema alterna automáticamente: darkTheme 20:00–05:59, midnightTheme 06:00–19:59

---

## 7. VARIABLES DE ENTORNO

**Backend `.env` (Railway):**
```
PORT=5000
JWT_SECRET=lumo_secret_key_2026
DATABASE_URL=postgresql://postgres:...@shuttle.proxy.rlwy.net:28082/railway
MP_CLIENT_ID=          ← PENDIENTE (credenciales reales de MP)
MP_CLIENT_SECRET=      ← PENDIENTE
MP_REDIRECT_URI=https://lumo-backend-production.up.railway.app/api/mp/callback
FRONTEND_URL=https://lumo-psi.vercel.app
```

---

## 8. ENDPOINTS DISPONIBLES

### Auth
- `POST /api/auth/register` — nombre, email, password, negocio, tipo_negocio
- `POST /api/auth/login` — email, password → JWT

### Análisis
- `GET /api/analisis` — análisis completo del negocio
- `GET /api/perfil` — perfil + benchmarks + baseline
- `GET /api/negocio/perfil` — capas 1+2 con pesos
- `PATCH /api/perfil` — actualizar tipo_negocio
- `POST /api/transacciones` — registrar transacción
- `GET /api/predicciones` — proyección facturación + pérdidas
- `GET /api/recomendaciones` — 6 reglas de recomendación
- `GET /api/alertas` — pipeline de alertas filtradas
- `POST /api/alertas/feedback` — feedback del dueño

### Caja
- `POST /api/caja/empleados` — crear empleado
- `GET /api/caja/empleados/:id` — listar empleados
- `POST /api/caja/apertura` — apertura turno
- `GET /api/caja/conteo-pendiente/:id` — conteo pendiente
- `POST /api/caja/conteo/:turnoId` — registrar conteo
- `POST /api/caja/egreso` — registrar egreso
- `POST /api/caja/cierre` — cierre turno + brecha
- `GET /api/caja/cruce/:id` — cruce de variables
- `GET /api/caja/patrones/:id` — patrones históricos
- `GET /api/caja/goteo/:id` — detección goteo
- `GET /api/caja/ranking/:id/:tipo` — ranking empleados
- `GET /api/caja/contexto-turno/:id` — contexto temporal
- `GET /api/caja/contexto-activo/:id/:tipo` — comportamiento en contexto actual
- `GET /api/caja/comportamiento/:id/:emp/:tipo` — empleado vs peers

### Mercado Pago
- `GET /api/mp/conectar?token=JWT` — inicia OAuth (navegar desde browser)
- `GET /api/mp/callback` — callback de MP (automático)
- `GET /api/mp/estado` — estado de la conexión
- `GET /api/mp/importar` — importa 18 meses de pagos

---

## 9. PENDIENTES INMEDIATOS (antes de pilotos)

| Tarea | Prioridad | Detalle |
|-------|-----------|---------|
| Despertar DB Railway + `node src/setup.js` | CRÍTICA | Crea las 4 tablas nuevas S7 |
| Credenciales reales de MP | ALTA | Portal developers.mercadopago.com.ar → crear app → Client ID + Secret → Railway vars |
| `/configuracion` frontend | ALTA | Pantalla MP: estado + conectar + importar |
| Conectar pantallas dueño a datos reales | ALTA | Home, Alertas, Dashboard con JWT + API |
| Nav update | MEDIA | Agregar "Ajustes" → `/configuracion` |

---

## 10. SESIONES FUTURAS

### Sesión 8 — Motor conductual avanzado + Multi-local
- Implementación NICOLE P2, P3, P5, P6, P7, P8 (diseñados en S6B)
- Multi-local: dashboard maestro para el Piloto 1 (amigo con 9 kioscos)
- Comparación cruzada entre sucursales
- **URGENTE: antes de arrancar pilotos**

### Sesión 9 — Pantallas dueño completas
- Home conectado a datos reales (análisis + predicciones + alertas)
- Alertas con detalle y feedback loop visual
- Dashboard Negocio con gráficos reales
- Equipo × 2: rankings + comportamiento por empleado

### Sesión 10 — Onboarding + Auth completo
- Pantalla de login/registro pulida (ya existe base en S7)
- Onboarding: tipo negocio, primer empleado, primera transacción
- Protección de rutas (redirect a /login si no hay JWT)
- Configuración: perfil del negocio + MP

### Sesión 11 — PWA completa
- Manifest + service worker
- Instalación en home screen (Android/iOS)
- Notificaciones push para alertas críticas
- Modo offline básico

### Sesión 12 — Deploy final + Pilotos reales
- Hardening de seguridad
- Rate limiting + logging
- Onboarding real con Piloto 1 y Piloto 2
- Monitoreo Railway + Vercel

---

## 11. PILOTOS CONFIRMADOS

| Piloto | Negocio | Caso de uso principal |
|--------|---------|-----------------------|
| Piloto 1 | Amigo — 9 kioscos | Multi-local — urgente antes de S8 |
| Piloto 2 | Dueño restaurante/cafetería | Con Mercado Pago conectado |

- Duración mínima: 90 días cada uno
- Objetivo: validar detección, medir reducción de brechas, ajustar EWTA

---

## 12. REGLAS DE PRODUCTO INAMOVIBLES

1. Nunca decir "fraude" — siempre "inconsistencia operativa"
2. Nunca nombrar empleados en alertas automáticas — solo el turno o el patrón
3. Mínimo 2 señales simultáneas para una alerta (excepción: z-score >4.0)
4. Máximo 2 intervenciones fuertes por turno
5. Cada alerta termina con acción concreta
6. Impacto siempre en pesos argentinos con etiqueta "estimado"
7. Balance 70% positivo / 20% atención / 10% crítico
8. `data_quality_score` siempre visible
9. Feedback loop obligatorio en cada alerta
10. Transparencia total — cada número tiene explicación con un toque
11. Excepción de nombre: pantalla Equipo sí muestra nombres (consulta activa del dueño)
