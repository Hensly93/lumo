# LumoBi — Marca

Fuente única de verdad del logo. Si algo de este archivo choca con lo que ves en el código, gana este archivo.

## Nombre
Siempre **LumoBi**. Lumo + Bi (Business Intelligence).
Nunca: "Lumo" a secas, "LumoBI", "lumobi", "LUMOBI", "Lumo BI".
Excepción: URLs y dominios van en minúscula porque así funcionan.

## Archivos oficiales (no se editan a mano)
| Archivo | Uso |
|---|---|
| `public/brand/lumobi-logo-light.svg` | Ícono + nombre, sobre fondo claro |
| `public/brand/lumobi-logo-dark.svg` | Ícono + nombre, sobre fondo oscuro |
| `public/brand/lumobi-icon-light.svg` | Solo ícono, sobre fondo claro |
| `public/brand/lumobi-icon-dark.svg` | Solo ícono, sobre fondo oscuro |
| `public/icons/icon-72.png`, `icon-192.png`, `icon-512.png` | PWA / manifest |
| `public/icons/icon-maskable-512.png` | PWA maskable (Android) |
| `public/icons/apple-touch-icon.png` | iOS |
| `public/icons/favicon-32.png` | Favicon |

Los SVG tienen el texto convertido a curvas: no dependen de ninguna fuente.
En código se usa el componente `app/components/Logo.tsx` o un `<img src="/brand/...">`. Nada más.

## Colores del logo
| Nombre | Hex | Dónde |
|---|---|---|
| Azul noche | `#0A1628` | Fondo del ícono claro, texto sobre claro |
| Blanco | `#FFFFFF` | L del ícono claro, texto sobre oscuro, fondo del ícono oscuro |
| Cian luz | `#00C2FF` | El punto de luz del ícono y el punto de la "i". Siempre cian, en las dos variantes |

Los colores de la interfaz (botones, fondos, estados) NO están definidos acá; se definen aparte con el diseño de pantallas.

## Tipografía del logo
Wordmark en **Urbanist Bold (700)**, espaciado -2 %, con la "i" sin punto propio y un punto cian dibujado a medida. Es parte del archivo del logo, no una fuente para usar en la app.

## Reglas
1. Una sola tinta en el nombre (azul noche o blanco). Nada de degradados, sombras, contornos ni efectos.
2. No cambiar proporciones, no estirar, no rotar.
3. No recolorear el punto cian.
4. No separar el nombre del ícono para armar otras combinaciones; para eso existe la variante `icon`.
5. Sobre fotos o fondos de color: usar `light` o `dark` según el contraste, nunca una versión nueva.
6. Si hace falta una variante que no existe (monocromo, horizontal, etc.), se pide y se genera con `gen.js`; no se improvisa.

Pendientes de definir (no inventados): zona de respeto mínima y tamaño mínimo de uso. Recomendación provisoria: no bajar de 24 px de alto para el logo completo ni de 16 px para el ícono.

## Regenerar
Todo sale de `gen.js` (Urbanist 700 vía `@fontsource/urbanist`, `opentype.js`, `@resvg/resvg-js`). Cambiar el logo = cambiar `gen.js` y regenerar, nunca editar un SVG a mano.
