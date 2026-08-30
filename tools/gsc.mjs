#!/usr/bin/env node
// Pont Google Search Console — zero dependance npm.
// Authentification par compte de service (JWT RS256 -> access token OAuth2).
//
// Cle attendue dans $GSC_KEY_FILE, sinon ~/.claude/gsc-service-account.json
//
//   node tools/gsc.mjs sites
//   node tools/gsc.mjs query <site> [--days 28] [--dim query,page] [--limit 50]
//   node tools/gsc.mjs opportunities <site> [--days 28]
//   node tools/gsc.mjs sitemaps <site>
//   node tools/gsc.mjs inspect <site> <url>
//
// <site> est l'identifiant exact de la propriete Search Console :
//   sc-domain:exemple.com        (propriete de domaine)
//   https://exemple.com/         (prefixe d'URL, slash final compris)

import { createSign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';
const WM = 'https://www.googleapis.com/webmasters/v3';
const SC = 'https://searchconsole.googleapis.com/v1';

// Un process.exit() pendant une requete en cours fait planter libuv sous Windows.
// On leve une erreur, interceptee tout en bas, et on laisse Node se fermer seul.
class Fail extends Error {}
const fail = (m) => { throw new Fail(m); };

const b64url = (buf) =>
  Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function loadKey() {
  const path = process.env.GSC_KEY_FILE || join(homedir(), '.claude', 'gsc-service-account.json');
  let raw;
  try {
    raw = readFileSync(path, 'utf8');
  } catch {
    fail(
      'OUTIL NON DISPONIBLE — cle de compte de service introuvable.\n' +
      `  Cherchee ici : ${path}\n` +
      '  Voir references/search-console.md pour la creer, puis reessayer.'
    );
  }
  let key;
  try {
    key = JSON.parse(raw);
  } catch {
    fail(`Le fichier ${path} n'est pas un JSON valide.`);
  }
  if (!key.client_email || !key.private_key) {
    fail(`Le fichier ${path} ne ressemble pas a une cle de compte de service (client_email / private_key manquants).`);
  }
  return key;
}

async function accessToken() {
  const key = loadKey();
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(JSON.stringify({
    iss: key.client_email,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  }));
  const signer = createSign('RSA-SHA256');
  signer.update(`${header}.${claim}`);
  const jwt = `${header}.${claim}.${b64url(signer.sign(key.private_key))}`;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    fail(
      `Echec de l'authentification Google (HTTP ${res.status}).\n` +
      `  ${body.error || ''} ${body.error_description || ''}\n` +
      "  Verifier que l'API Search Console est activee sur le projet Google Cloud."
    );
  }
  return body.access_token;
}

async function api(url, { method = 'GET', body } = {}) {
  const token = await accessToken();
  const res = await fetch(url, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data && data.error && data.error.message) || `HTTP ${res.status}`;
    if (res.status === 403) {
      // Deux causes tres differentes se presentent toutes les deux en 403.
      if (/has not been used|is disabled|SERVICE_DISABLED/i.test(msg)) {
        const projet = (msg.match(/project (\d+)/) || [])[1];
        fail(
          "Acces refuse (403) : l'API Search Console n'est pas activee sur le projet Google Cloud.\n" +
          (projet
            ? `  Activer ici : https://console.cloud.google.com/apis/library/searchconsole.googleapis.com?project=${projet}\n`
            : '  Activer depuis APIs & Services > Library > Google Search Console API.\n') +
          '  Compter une a deux minutes de propagation, puis relancer.'
        );
      }
      fail(
        `Acces refuse (403) : ${msg}\n` +
        '  Le compte de service est-il bien ajoute comme utilisateur de la propriete\n' +
        '  dans Search Console > Parametres > Utilisateurs et autorisations ?'
      );
    }
    fail(`Erreur API : ${msg}`);
  }
  return data;
}

const enc = (site) => encodeURIComponent(site);
const ymd = (d) => d.toISOString().slice(0, 10);
const pct = (n) => `${(n * 100).toFixed(1)}%`;
const round = (n) => Math.round(n * 10) / 10;

function range(days) {
  // Search Console accuse environ 2 jours de latence sur les donnees.
  const end = new Date(Date.now() - 2 * 86400000);
  const start = new Date(end.getTime() - (days - 1) * 86400000);
  return { startDate: ymd(start), endDate: ymd(end) };
}

function flag(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

async function searchAnalytics(site, opts) {
  const data = await api(`${WM}/sites/${enc(site)}/searchAnalytics/query`, { method: 'POST', body: opts });
  return data.rows || [];
}

function table(rows) {
  if (!rows.length) return '  (aucune donnee sur la periode)';
  return rows.map((r) => {
    const keys = (r.keys || []).join('  |  ');
    return `  ${keys}\n     clics ${r.clicks}   impressions ${r.impressions}   CTR ${pct(r.ctr)}   position ${round(r.position)}`;
  }).join('\n');
}

function usage() {
  const src = readFileSync(new URL(import.meta.url), 'utf8');
  console.log(
    src.split('\n')
      .filter((l) => l.startsWith('//'))
      .map((l) => l.replace(/^\/\/ ?/, ''))
      .join('\n')
  );
}

async function main() {
  const [cmd, site, arg3] = process.argv.slice(2);

  if (!cmd || cmd === 'help' || cmd === '--help') return usage();

  if (cmd === 'sites') {
    const data = await api(`${WM}/sites`);
    const entries = data.siteEntry || [];
    if (!entries.length) {
      console.log('Aucune propriete accessible.');
      console.log("Le compte de service n'a ete ajoute a aucune propriete Search Console.");
      return;
    }
    console.log('PROPRIETES ACCESSIBLES');
    for (const e of entries) console.log(`  ${e.siteUrl}   [${e.permissionLevel}]`);
    return;
  }

  const known = ['query', 'opportunities', 'sitemaps', 'inspect'];
  if (!known.includes(cmd)) fail(`Commande inconnue : ${cmd}. Lancer "node tools/gsc.mjs help".`);
  if (!site) fail(`Commande "${cmd}" : identifiant de propriete manquant. Lancer "sites" pour la liste.`);
  const days = Number(flag('days', 28));
  const period = range(days);

  if (cmd === 'query') {
    const dimensions = flag('dim', 'query').split(',');
    const rowLimit = Number(flag('limit', 50));
    const rows = await searchAnalytics(site, { ...period, dimensions, rowLimit });
    console.log(`PERFORMANCE — ${site} — ${days} jours — dimensions : ${dimensions.join(', ')}`);
    console.log(`Periode : ${period.startDate} -> ${period.endDate}\n`);
    console.log(table(rows));
    return;
  }

  if (cmd === 'opportunities') {
    const pages = await searchAnalytics(site, { ...period, dimensions: ['page'], rowLimit: 500 });
    console.log(`OPPORTUNITES — ${site}`);
    console.log(`Periode : ${period.startDate} -> ${period.endDate} (${days} jours)\n`);

    const sorted = [...pages].sort((a, b) => a.impressions - b.impressions);
    const medianImpr = sorted.length ? sorted[Math.floor(sorted.length / 2)].impressions : 0;
    const ctrGaps = pages
      .filter((r) => r.impressions >= Math.max(50, medianImpr) && r.position <= 20 && r.ctr < 0.02)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 15);

    console.log("1. OPPORTUNITES CTR — beaucoup d'impressions, position correcte, CTR faible");
    console.log('   => retravailler le title et la meta description de ces pages\n');
    console.log(table(ctrGaps));

    const queries = await searchAnalytics(site, { ...period, dimensions: ['query'], rowLimit: 500 });
    const striking = queries
      .filter((r) => r.position >= 4 && r.position <= 20 && r.impressions >= 20)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 20);

    console.log('\n2. OPPORTUNITES SEO — requetes en position 4 a 20 avec du volume');
    console.log('   => creer ou enrichir le contenu correspondant\n');
    console.log(table(striking));
    return;
  }

  if (cmd === 'sitemaps') {
    const data = await api(`${WM}/sites/${enc(site)}/sitemaps`);
    const maps = data.sitemap || [];
    console.log(`SITEMAPS — ${site}\n`);
    if (!maps.length) return console.log('  Aucun sitemap declare.');
    for (const m of maps) {
      const web = (m.contents || []).find((c) => c.type === 'web') || {};
      console.log(`  ${m.path}`);
      console.log(`     soumises ${web.submitted || 0}   indexees ${web.indexed || 0}   erreurs ${m.errors || 0}   avertissements ${m.warnings || 0}`);
      if (m.lastDownloaded) console.log(`     dernier telechargement ${m.lastDownloaded}`);
    }
    return;
  }

  if (cmd === 'inspect') {
    if (!arg3) fail('Commande "inspect" : URL a inspecter manquante.');
    const data = await api(`${SC}/urlInspection/index:inspect`, {
      method: 'POST',
      body: { inspectionUrl: arg3, siteUrl: site },
    });
    const r = data.inspectionResult || {};
    const i = r.indexStatusResult || {};
    console.log(`INSPECTION — ${arg3}\n`);
    console.log(`  Verdict            ${i.verdict || '?'}`);
    console.log(`  Etat couverture    ${i.coverageState || '?'}`);
    console.log(`  Robots.txt         ${i.robotsTxtState || '?'}`);
    console.log(`  Indexation         ${i.indexingState || '?'}`);
    console.log(`  Canonique Google   ${i.googleCanonical || '?'}`);
    console.log(`  Canonique declaree ${i.userCanonical || '?'}`);
    console.log(`  Dernier crawl      ${i.lastCrawlTime || '?'}`);
    if (r.mobileUsabilityResult) console.log(`  Mobile             ${r.mobileUsabilityResult.verdict}`);
    if (r.richResultsResult) console.log(`  Resultats enrichis ${r.richResultsResult.verdict}`);
    return;
  }

  fail(`Commande inconnue : ${cmd}. Lancer "node tools/gsc.mjs help".`);
}

main().catch((e) => {
  console.error(e instanceof Fail ? e.message : `Erreur inattendue : ${e.message}`);
  process.exitCode = 1;
});
