# Portfolio — Yorman Alvarez

Sitio web de portafolio personal. Estética oscura premium con fondo WebGL
animado, scroll suave y animaciones avanzadas.

## Cómo verlo

**Opción rápida:** abre `index.html` con doble clic (necesita conexión a
internet para cargar las librerías desde CDN).

**Recomendado (servidor local):** algunas funciones van mejor servidas por HTTP.

```powershell
cd "C:\Users\yodalma\Documents\portfolio"
python -m http.server 5500
# luego abre http://localhost:5500
```

O con Node:

```powershell
npx serve .
```

## Stack del sitio

- **HTML + CSS + JavaScript** vanilla (sin build, cero dependencias locales)
- **Three.js** — fondo aurora con shader GLSL reactivo al ratón y al scroll
- **GSAP + ScrollTrigger** — reveals, parallax, timelines, contadores
- **Lenis** — scroll suave
- Cursor personalizado, botones magnéticos, tilt 3D, marquee infinito

Todas las librerías se cargan vía CDN (cdnjs / unpkg).

## Estructura

```
portfolio/
├── index.html
├── css/style.css
├── js/main.js
├── assets/avatar.jpg
└── README.md
```

## Personalizar

- **Proyectos:** edita las tarjetas `<article class="project">` en `index.html`.
- **Colores:** variables `--violet / --cyan / --pink / --grad` al inicio de `css/style.css`.
- **Textos:** todo el contenido es HTML plano, fácil de editar.
