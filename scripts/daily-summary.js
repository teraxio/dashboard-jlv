#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const https = require('https');

const TOKEN = process.env.NOTION_TOKEN;
const PAGE_ID = '342e54e2-80a7-8136-a285-c6aa14a3405c';
const TASKS_FILE = path.join(process.env.HOME, 'Dashboard-JLV', 'tasks.json');

if (!TOKEN) {
  console.error('[daily-summary] NOTION_TOKEN missing in env');
  process.exit(1);
}

if (!fs.existsSync(TASKS_FILE)) {
  console.error('[daily-summary] tasks.json not found at', TASKS_FILE);
  process.exit(1);
}

let data;
try {
  data = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
} catch (e) {
  console.error('[daily-summary] tasks.json parse error:', e.message);
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const tasks = Array.isArray(data.tasks) ? data.tasks : [];
const byProject = tasks.reduce((acc, t) => {
  const p = t.project || 'general';
  (acc[p] ||= []).push(t);
  return acc;
}, {});

const children = [];

children.push({
  type: 'paragraph',
  paragraph: {
    rich_text: [{ type: 'text', text: { content: `━━━ ${today} • ${tasks.length} tarea(s) ━━━` } }]
  }
});

if (tasks.length === 0) {
  children.push({
    type: 'paragraph',
    paragraph: {
      rich_text: [{ type: 'text', text: { content: 'Sin tareas pendientes hoy.' } }]
    }
  });
} else {
  for (const [project, items] of Object.entries(byProject)) {
    children.push({
      type: 'paragraph',
      paragraph: {
        rich_text: [{ type: 'text', text: { content: `── ${project.toUpperCase()} (${items.length}) ──` } }]
      }
    });
    for (const t of items) {
      const line = `[${t.id}] ${t.title}${t.note ? ' — ' + t.note : ''}`;
      children.push({
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ type: 'text', text: { content: line } }]
        }
      });
    }
  }
}

children.push({
  type: 'paragraph',
  paragraph: {
    rich_text: [{ type: 'text', text: { content: `Fuente: ~/Dashboard-JLV/tasks.json  •  Generado: ${new Date().toISOString()}` } }]
  }
});

const body = JSON.stringify({ children });

const options = {
  hostname: 'api.notion.com',
  path: `/v1/blocks/${PAGE_ID}/children`,
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
    'Notion-Version': '2022-06-28',
    'Content-Length': Buffer.byteLength(body)
  }
};

const req = https.request(options, (res) => {
  let chunks = '';
  res.on('data', (c) => { chunks += c; });
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log(`[daily-summary] OK: ${tasks.length} task(s) posted at ${new Date().toISOString()}`);
      process.exit(0);
    } else {
      console.error(`[daily-summary] Notion API ${res.statusCode}: ${chunks}`);
      process.exit(1);
    }
  });
});
req.on('error', (e) => {
  console.error('[daily-summary] request error:', e.message);
  process.exit(1);
});
req.write(body);
req.end();
