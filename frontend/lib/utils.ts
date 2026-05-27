import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(sec: number) {
  if (!Number.isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const STRIP_PARENS = /[\(\[][^\)\]]*[\)\]]/g;
const STRIP_SUFFIX = /\s+-\s+(remix|remaster(ed)?|live|acoustic|edit|version|mix|radio).*$/i;
const FEAT_RE = /\b(feat\.?|ft\.?|featuring|with)\b/gi;
const ARTIST_SPLIT = /\s*(?:,|&|\+|x|×|\/|\bvs?\b|\band\b|\bet\b)\s*/i;

export function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function cleanTitle(s: string) {
  return s.replace(STRIP_PARENS, " ").replace(STRIP_SUFFIX, " ").replace(FEAT_RE, " ");
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const prev = new Array(b.length + 1);
  const curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

function editTolerance(maxLen: number): number {
  if (maxLen <= 3) return 0;
  if (maxLen <= 5) return 1;
  if (maxLen <= 8) return 2;
  if (maxLen <= 12) return 3;
  return Math.ceil(maxLen * 0.28);
}

function fuzzyOne(guess: string, target: string) {
  const g = normalize(guess);
  const t = normalize(target);
  if (!g || !t) return false;
  if (g === t) return true;
  if (g.length >= 3 && t.includes(g)) return true;
  if (t.length >= 3 && g.includes(t)) return true;
  const tol = editTolerance(Math.max(g.length, t.length));
  if (Math.abs(g.length - t.length) <= tol + 2 && levenshtein(g, t) <= tol) return true;
  if (t.length > g.length && g.length >= 3) {
    const subTol = editTolerance(g.length);
    for (let i = 0; i + g.length <= t.length; i++) {
      if (levenshtein(g, t.slice(i, i + g.length)) <= subTol) return true;
    }
  }
  return false;
}

export function matches(guess: string, answer: string) {
  if (!guess || !answer) return false;
  const guesses = guess.split(ARTIST_SPLIT).map((s) => s.trim()).filter(Boolean);
  const targets = cleanTitle(answer).split(ARTIST_SPLIT).map((s) => s.trim()).filter(Boolean);
  if (targets.length === 0) targets.push(answer);
  for (const g of guesses) {
    for (const t of targets) {
      if (fuzzyOne(g, t)) return true;
    }
    if (fuzzyOne(g, answer)) return true;
    if (fuzzyOne(g, cleanTitle(answer))) return true;
  }
  return false;
}
