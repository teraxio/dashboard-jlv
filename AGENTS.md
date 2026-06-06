# Dashboard-JLV — Instrucciones para agentes

Panel personal de Jose Luis Valencia desplegado en `dashboard-jlv.netlify.app`.
Stack: **HTML estático puro** (sin build step) + **Netlify** + pipeline `tasks.json`.

## Estructura

```
Dashboard-JLV/
├── index.html               # Landing principal del dashboard
├── imagina-t-portal.html    # Portal público Imagina-T
├── imagina-t-recursos.html  # Recursos/biblioteca
├── tasks.json               # Pipeline de tareas (Claude escribe aquí)
├── docs/                    # Documentación del panel
└── .claude/settings.json    # Permisos locales del harness
```

## Reglas de edición

- **No introducir build tooling** (webpack, vite, npm). El repo es HTML estático a propósito: deploy directo a Netlify sin pipeline.
- **No añadir dependencias npm** salvo que el usuario lo pida explícitamente. Si hace falta JS, inline o CDN.
- **Acentos y español**: todos los textos visibles van en español con acentos correctos (á, é, í, ó, ú, ñ).
- **Mobile-first**: probar en viewport de iPhone antes de dar por terminado un cambio visual.

## `tasks.json` — pipeline de tareas

Formato del archivo:

```json
{
  "version": 1,
  "updated": "YYYY-MM-DD",
  "tasks": [
    {
      "id": "YYYY-MM-DD-NNN",
      "title": "Título breve",
      "project": "general | gzbr | teraxio | imaginat",
      "created": "YYYY-MM-DD",
      "note": "Contexto opcional"
    }
  ]
}
```

Al añadir una tarea:
1. Generar `id` con fecha actual + contador secuencial del día.
2. Actualizar `updated` al día actual.
3. Mantener orden cronológico ascendente.
4. No borrar tareas existentes salvo instrucción explícita.

## Deploy

- Target: `dashboard-jlv.netlify.app`
- Requiere `NETLIFY_AUTH_TOKEN` en entorno (ver feedback memory del usuario).
- Al terminar cambios visuales, generar reporte HTML y deployarlo (directiva global del usuario).

## Qué NO hacer

- No crear carpetas `src/`, `dist/`, `build/`.
- No mover `tasks.json` de la raíz — otras herramientas dependen de esa ubicación.
- No renombrar archivos HTML de nivel superior sin confirmar — son URLs públicas.
- No escribir secretos ni tokens en archivos versionados. Usar `.env` (ya en `.gitignore`).

## Contexto del usuario

Jose Luis prefiere respuestas directas en español. Archivos de proyectos grandes viven en `/Volumes/Disk JLV/`. Dashboard-JLV es la excepción: vive en `~/` porque es código activo.
