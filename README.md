# Mario64Web

Versión web de Super Mario 64 basada en el proyecto abierto [sm64js](https://github.com/sm64js/sm64js), con controles táctiles añadidos para móviles y publicación preparada para GitHub Pages.

## Cómo jugar

1. Abre la página publicada desde un navegador compatible.
2. Selecciona tu propia ROM estadounidense de Super Mario 64 en formato `.z64`.
3. Inicia el juego. En móviles aparecerán controles táctiles; también se pueden forzar con `?touch=1`.

**Este repositorio no incluye una ROM.** Los archivos del juego deben ser aportados por el usuario; no subas ni distribuyas ROMs con el proyecto.

## Ejecutar localmente

Requiere Node.js 16 y npm:

```bash
npm install
npm run start
```

Para generar los archivos estáticos:

```bash
npm run build
```

El resultado se guarda en `dist/`.

## Publicación

El workflow `.github/workflows/pages.yml` compila y publica la rama `arena/be9a0343-mario64web` en GitHub Pages al recibir cambios. En GitHub, configura **Settings → Pages → Build and deployment → Source: GitHub Actions** si todavía no está activado.

## Controles

- **Móvil:** palanca virtual, A/B/Z, Start, R y botones C.
- **Teclado y mando:** compatibles con los controles configurables de la aplicación.

## Créditos y licencia

El motor y los archivos fuente del juego derivan de [sm64js](https://github.com/sm64js/sm64js). Se conserva la licencia original en [`LICENSE`](LICENSE). Los controles táctiles y los ajustes de compilación para GitHub Pages se añadieron en este repositorio.
