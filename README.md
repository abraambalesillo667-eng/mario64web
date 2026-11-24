# Super Mario 64 · Fan Site

Sitio web homenaje a **Super Mario 64** (Nintendo, 1996): historia, mundos, sombreros, personajes, curiosidades y una pequeña búsqueda de estrellas ocultas.

## Características

- Diseño editorial moderno y limpio, con acentos de la paleta de los 90.
- 100% estático: HTML + CSS + JavaScript, sin dependencias ni build.
- Tipografías autoalojadas (Outfit + Inter) y arte original generado para el proyecto.
- Totalmente responsive, con menú móvil y animaciones de entrada.
- Accesible: navegación por teclado, `aria-expanded`, `prefers-reduced-motion`.
- Interacción: 5 estrellas ocultas clicables, contador persistente, pistas visuales y confeti al completar.
- Contadores animados, acordeón de curiosidades y tilt sutil en el hero.

## Ejecutar

Cualquier servidor estático funciona:

```bash
python3 -m http.server 4173
```

Luego abre `http://localhost:4173`.

## Estructura

```
index.html          # Página única
css/style.css       # Sistema de diseño y estilos
js/main.js          # Interacciones
assets/fonts/       # WOFF2 autoalojadas
assets/img/         # Arte original generado para el sitio
assets/favicon.svg  # Ícono
```

## Nota legal

Fan site no oficial y sin ánimo de lucro. Super Mario 64 y sus personajes son marcas de Nintendo.
