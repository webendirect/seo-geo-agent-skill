#!/usr/bin/env node
// Pont Bing Webmaster Tools — zero dependance npm.
// Authentification par cle d'API simple (pas de compte de service, pas de JWT).
//
// Cle attendue dans $BING_API_KEY, sinon dans ~/.claude/bing-api-key.txt
//
//   node tools/bing.mjs sites
//   node tools/bing.mjs ai <site> [--days 30]
//   node tools/bing.mjs traffic <site>
//   node tools/bing.mjs index <site>
//   node tools/bing.mjs sitemaps <site>
//   node tools/bing.mjs keywords <site> [--limit 30]
//
// <site> est l'URL exacte de la propriete, telle qu'affichee par "sites" :
//   https://exemple.com/     (slash final compris)
//
// La commande "ai" est celle qui compte pour le GEO : elle rend les citations
// des moteurs IA (Copilot, ChatGPT via Bing), que Search Console ne mesure pas.

import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const API = 'https://ssl.bing.com/webmaster/api.svc/json';

class Fail extends Error {}
const fail = (m) => { throw new Fail(m); };

function loadKey() {
  if (process.env.BING_API_KEY) return process.env.BING_API_KEY.trim();
  const path = join(homedir(), '.claude', 'bing-api-key.txt');
  try {
    const k = readFileSync(path, 'utf8').trim();
    if (!k) fail(`Le fichier ${path} est vide.`);
    return k;
  } catch (e) {
    if (e instanceof Fail) throw e;
    fail(
      'OUTIL NON DISPONIBLE — cle API Bing Webmaster introuvable.\n' +
      `  Cherchee dans $BING_API_KEY, puis ici : ${path}\n` +
      '  Voir references/bing-webmaster.md pour la generer, puis reessayer.'
    );
  }
}

async function api(method, params = {}) {
  const url = new URL(`${API}/${method}`);
  url.searchParams.set('apikey', loadKey());
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url, { headers: { accept: 'application/json' } });
  const text = await res.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    fail(`Reponse illisible de Bing (HTTP ${res.status}) : ${text.slice(0, 200)}`);
  }

  if (!res.ok || data.ErrorCode) {
    const msg = data.Message || data.message || `HTTP ${res.status}`;
    if (/key|unauthor|forbidden/i.test(msg) || res.status === 401 || res.status === 403) {
      fail(
        `Acces refuse : ${msg}\n` +
        "  Verifier que la cle d'API est valide et que le compte a bien acces\n" +
        '  a cette propriete dans Bing Webmaster Tools.'
      );
    }
    fail(`Erreur API Bing : ${msg}`);
  }
  return data.d !== undefined ? data.d : data;
}

// Bing serialise ses dates en /Date(1234567890000)/
const bingDate = (v) => {
  const m = typeof v === 'string' && v.match(/\/Date\((\d+)\)\//);
  return m ? new Date(Number(m[1])).toISOString().slice(0, 10) : v;
};

function flag(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const num = (n) => (n === undefined || n === null ? '?' : n);

function usage() {
  const src = readFileSync(new URL(import.meta.url), 'utf8');
  console.log(
    src.split('\n').filter((l) => l.startsWith('//')).map((l) => l.replace(/^\/\/ ?/, '')).join('\n')
  );
}

async function main() {
  const [cmd, site] = process.argv.slice(2);
  if (!cmd || cmd === 'help' || cmd === '--help') return usage();

  if (cmd === 'sites') {
    const rows = await api('GetUserSites');
    if (!rows || !rows.length) {
      console.log('Aucune propriete accessible avec cette cle.');
      return;
    }
    console.log('PROPRIETES ACCESSIBLES');
    for (const s of rows) console.log(`  ${s.Url}`);
    return;
  }

  const known = ['ai', 'traffic', 'index', 'sitemaps', 'keywords'];
  if (!known.includes(cmd)) fail(`Commande inconnue : ${cmd}. Lancer "node tools/bing.mjs help".`);
  if (!site) fail(`Commande "${cmd}" : URL de propriete manquante. Lancer "sites" pour la liste.`);

  if (cmd === 'ai') {
    // Rapport AI Performance : ce que les moteurs IA citent reellement.
    const rows = await api('GetPageStats', { siteUrl: site });
    console.log(`CITATIONS IA — ${site}\n`);
    if (!rows || !rows.length) {
      console.log('  (aucune donnee)');
      console.log('\n  Si la propriete est recente, Bing met plusieurs jours a produire');
      console.log('  ce rapport. Le consulter aussi dans l\'interface, onglet AI Performance.');
      return;
    }
    const tri = [...rows].sort((a, b) => (b.Impressions || 0) - (a.Impressions || 0)).slice(0, 25);
    for (const r of tri) {
      console.log(`  ${r.Query || r.Url || '?'}`);
      console.log(`     impressions ${num(r.Impressions)}   clics ${num(r.Clicks)}   position ${num(r.AvgImpressionPosition)}`);
    }
    console.log('\n  Rappel : une citation IA n\'est pas un classement Google.');
    return;
  }

  if (cmd === 'traffic') {
    const rows = await api('GetRankAndTrafficStats', { siteUrl: site });
    console.log(`TRAFIC — ${site}\n`);
    if (!rows || !rows.length) return console.log('  (aucune donnee sur la periode)');
    for (const r of rows.slice(-14)) {
      console.log(`  ${bingDate(r.Date)}   impressions ${num(r.Impressions)}   clics ${num(r.Clicks)}`);
    }
    return;
  }

  if (cmd === 'index') {
    // GetUrlTrafficInfo exige une URL precise ; pour une vue site entier ce sont
    // GetCrawlStats et GetCrawlIssues qui repondent.
    const crawl = await api('GetCrawlStats', { siteUrl: site });
    const issues = await api('GetCrawlIssues', { siteUrl: site }).catch(() => []);
    console.log(`INDEXATION — ${site}\n`);

    if (!crawl || !crawl.length) {
      console.log('  Aucune statistique de crawl.');
      console.log('  Sur une propriete recente, Bing met plusieurs jours a explorer le site.');
    } else {
      const d = crawl[crawl.length - 1];
      console.log(`  Dernier releve : ${bingDate(d.Date)}`);
      console.log(`     pages explorees ${num(d.CrawledPages)}   en index ${num(d.InIndex)}`);
      console.log(`     erreurs ${num(d.CrawlErrors)}   en 404 ${num(d.HttpCode404)}`);
      console.log(`     bloquees par robots.txt ${num(d.BlockedByRobotsTxt)}`);
    }

    console.log(`\n  Problemes de crawl signales : ${issues && issues.length ? issues.length : 0}`);
    for (const i of (issues || []).slice(0, 10)) {
      console.log(`     ${i.Url || '?'} — ${i.Issues ?? i.IssueType ?? '?'}`);
    }
    return;
  }

  if (cmd === 'sitemaps') {
    const rows = await api('GetFeeds', { siteUrl: site });
    console.log(`SITEMAPS — ${site}\n`);
    if (!rows || !rows.length) return console.log('  Aucun sitemap declare.');
    for (const f of rows) {
      console.log(`  ${f.Url}`);
      console.log(`     URLs ${num(f.UrlCount)}   dernier telechargement ${bingDate(f.LastCrawled)}   type ${f.Type ?? '?'}`);
    }
    return;
  }

  if (cmd === 'keywords') {
    const limit = Number(flag('limit', 30));
    const rows = await api('GetQueryStats', { siteUrl: site });
    console.log(`REQUETES — ${site}\n`);
    if (!rows || !rows.length) return console.log('  (aucune donnee sur la periode)');
    const tri = [...rows].sort((a, b) => (b.Impressions || 0) - (a.Impressions || 0)).slice(0, limit);
    for (const r of tri) {
      console.log(`  ${r.Query}`);
      console.log(`     impressions ${num(r.Impressions)}   clics ${num(r.Clicks)}   position ${num(r.AvgImpressionPosition)}`);
    }
    return;
  }
}

main().catch((e) => {
  console.error(e instanceof Fail ? e.message : `Erreur inattendue : ${e.message}`);
  process.exitCode = 1;
});
