const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_PAGE_ID = process.env.NOTION_TASKS_PAGE_ID;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  if (!NOTION_TOKEN || !NOTION_PAGE_ID) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Missing env vars' }) };
  }

  let tasks;
  try {
    tasks = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const PROJECTS = { gzbr: 'GZBR', imaginat: 'Imagina-T', teraxio: 'Teraxio' };
  const TAG_LABELS = { estrategia: '🧠 Estrategia', tactica: '⚙️ Táctica', accion: '▶️ Acción', urgente: '🔴 Urgente' };

  // Construir bloques de Notion
  const blocks = [];

  // Encabezado con fecha
  const now = new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Tijuana' });
  blocks.push({
    object: 'block', type: 'heading_2',
    heading_2: { rich_text: [{ type: 'text', text: { content: `📋 Tareas GZBR Dashboard — ${now}` } }] }
  });

  // Separador
  blocks.push({ object: 'block', type: 'divider', divider: {} });

  let totalTareas = 0;

  for (const [projId, projName] of Object.entries(PROJECTS)) {
    const tareas = (tasks[projId] || []);
    if (tareas.length === 0) continue;

    // Encabezado proyecto
    blocks.push({
      object: 'block', type: 'heading_3',
      heading_3: { rich_text: [{ type: 'text', text: { content: projName } }] }
    });

    for (const tarea of tareas) {
      const tag = TAG_LABELS[tarea.tag] || tarea.tag;
      const estado = tarea.done ? '✅' : '⬜';
      blocks.push({
        object: 'block', type: 'to_do',
        to_do: {
          rich_text: [{ type: 'text', text: { content: `${tag}  ${tarea.text}` } }],
          checked: tarea.done === true
        }
      });
      totalTareas++;
    }
  }

  if (totalTareas === 0) {
    blocks.push({
      object: 'block', type: 'paragraph',
      paragraph: { rich_text: [{ type: 'text', text: { content: 'Sin tareas registradas.' } }] }
    });
  }

  blocks.push({ object: 'block', type: 'divider', divider: {} });

  // Limpiar bloques anteriores de la página y agregar los nuevos
  try {
    // 1. Obtener bloques existentes
    const existingRes = await fetch(`https://api.notion.com/v1/blocks/${NOTION_PAGE_ID}/children`, {
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28'
      }
    });
    const existing = await existingRes.json();

    // 2. Borrar bloques existentes
    if (existing.results && existing.results.length > 0) {
      await Promise.all(existing.results.map(block =>
        fetch(`https://api.notion.com/v1/blocks/${block.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${NOTION_TOKEN}`,
            'Notion-Version': '2022-06-28'
          }
        })
      ));
    }

    // 3. Agregar bloques nuevos
    const appendRes = await fetch(`https://api.notion.com/v1/blocks/${NOTION_PAGE_ID}/children`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ children: blocks })
    });

    if (!appendRes.ok) {
      const err = await appendRes.text();
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Notion API error', detail: err }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, synced: totalTareas }) };

  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
