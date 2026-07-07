#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scout.py — lokalny scout trendów dla skadprodukt.org.

Codziennie zbiera DARMOWE sygnały (bez klucza API, bez płatnych usług):
  1) Google autocomplete (PL)      — o co ludzie pytają: "czy {marka} jest polskie/niemieckie…"
  2) Wikipedia Pageviews API (PL)   — skoki odsłon artykułów marek = ktoś o nich mówi
  3) Google Trends RSS (PL)         — świeże, gorące hasła (przejęcia, newsy)

Dopasowuje sygnały do bazy data/products.json i dzieli na kubełki:
  A) marka W BAZIE + trend   → "zrób shorta teraz"
  B) hasło/marka SPOZA bazy  → "kandydat do researchu /dodaj-marke"
  C) news o przejęciu        → "sprawdź, czy właściciel się zmienił"

Scoring: heurystyka (zawsze) → opcjonalnie doprecyzowanie przez model:
  --scorer heuristic   (0 tokenów, bez sieci)
  --scorer ollama      (lokalny model na GPU, 0 tokenów; localhost:11434)
  --scorer claude      (Claude Code headless `claude -p`; jakość, zużywa limit —
                        dostaje TYLKO top-N po heurystyce, więc mało tokenów)

Wynik: content/pomysly.json (ranking) + content/POMYSLY-DIGEST.md (do czytania).
NIC nie trafia na kanał ani do bazy automatycznie — to tylko podpowiedzi do przeglądu.

Zero zależności zewnętrznych (tylko biblioteka standardowa). Działa na Windows i WSL2.
"""
import argparse
import json
import re
import subprocess
import sys
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from pathlib import Path

try:  # spójne UTF-8 na stdout/stderr (Windows cp1250 psuje polskie znaki i strzałki)
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

UA = "Mozilla/5.0 (compatible; skadprodukt-scout/1.0; +https://skadprodukt.org)"
TIMEOUT = 20

# --- ścieżki (repo = katalog nadrzędny nad trend_scout/) ---
REPO = Path(__file__).resolve().parent.parent
PRODUCTS = REPO / "data" / "products.json"
OUT_JSON = REPO / "content" / "pomysly.json"
OUT_MD = REPO / "content" / "POMYSLY-DIGEST.md"

# słowa-klucze newsów o zmianie właściciela (kubełek C / discovery)
MA_KW = ["przej", "kupił", "kupuje", "wykupi", "nabył", "akwizycj", "fuzj", "sprzeda",
         "właściciel", "udzia", "akcje", "inwestor", "koncern", "grupa "]
# frazy pytań o pochodzenie (do autocomplete + wykrywania popytu)
ORIGIN_HINT = ["polsk", "polski", "niemieck", "czyj", "właścicie", "nestle", "nestlé",
               "koncern", "zagraniczn", "kto ", "chińsk", "amerykań"]

_PL = str.maketrans("ąćęłńóśźżĄĆĘŁŃÓŚŹŻ", "acelnoszzACELNOSZZ")


def norm(s):
    return re.sub(r"[^a-z0-9]+", " ", (s or "").translate(_PL).lower()).strip()


def http_get(url, as_json=False):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "pl"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        data = r.read().decode("utf-8", "replace")
    return json.loads(data) if as_json else data


# ---------------------------------------------------------------- źródła
def src_autocomplete(brands, limit, day_index):
    """Rotujący podzbiór marek: pobiera podpowiedzi Google 'czy {marka} jest'.
    Zwraca listę {brand, slug, suggestions[], origin_hits} — origin_hits mierzy popyt."""
    out = []
    # rotacja: inny wycinek marek każdego dnia, żeby w kilka dni pokryć wszystkie
    rot = brands[(day_index * limit) % len(brands):] + brands[:(day_index * limit) % len(brands)]
    for b in rot[:limit]:
        q = f"czy {b['brand']} jest"
        try:
            url = ("https://suggestqueries.google.com/complete/search?client=firefox&hl=pl&q="
                   + urllib.parse.quote(q))
            arr = http_get(url, as_json=True)
            sugg = arr[1] if len(arr) > 1 else []
        except Exception as e:
            sugg = []
        hits = sum(1 for s in sugg if any(h in s.lower() for h in ORIGIN_HINT))
        if sugg:
            out.append({"brand": b["brand"], "slug": b["slug"], "suggestions": sugg,
                        "origin_hits": hits})
        time.sleep(0.4)  # łagodnie dla endpointu
    return out


def src_wiki_spikes(brands, limit, day_index):
    """Skoki dziennych odsłon PL-wiki dla marek. spike = max(ost.3 dni)/max(mediana,1)."""
    end = datetime.now(timezone.utc).date() - timedelta(days=1)
    start = end - timedelta(days=20)
    out = []
    rot = brands[(day_index * limit) % len(brands):] + brands[:(day_index * limit) % len(brands)]
    for b in rot[:limit]:
        title = b["brand"].split(" (")[0].strip().replace(" ", "_")
        try:
            url = ("https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/"
                   f"pl.wikipedia/all-access/all-agents/{urllib.parse.quote(title)}/daily/"
                   f"{start.strftime('%Y%m%d')}/{end.strftime('%Y%m%d')}")
            js = http_get(url, as_json=True)
            views = [it["views"] for it in js.get("items", [])]
        except Exception:
            views = []
        if len(views) >= 7:
            recent = max(views[-3:])
            base = sorted(views[:-3])
            med = base[len(base) // 2] if base else 0
            spike = recent / max(med, 1)
            if spike >= 2.0 and recent >= 15:
                out.append({"brand": b["brand"], "slug": b["slug"], "recent": recent,
                            "baseline": med, "spike": round(spike, 1)})
        time.sleep(0.2)
    return out


def src_trends_rss():
    """Google Trends PL — gorące hasła. Zwraca [{title, traffic, snippet}]."""
    out = []
    try:
        xml = http_get("https://trends.google.com/trending/rss?geo=PL")
        root = ET.fromstring(xml)
        for item in root.iter("item"):
            title = (item.findtext("title") or "").strip()
            # approx_traffic w namespace ht:
            traffic = ""
            for ch in item:
                if ch.tag.endswith("approx_traffic"):
                    traffic = ch.text or ""
            snippet = (item.findtext("description") or "")[:200]
            if title:
                out.append({"title": title, "traffic": traffic, "snippet": snippet})
    except Exception:
        pass
    return out


# ---------------------------------------------------------------- matcher
def build_index(products):
    idx = []
    for p in products:
        idx.append({"slug": p["slug"], "brand": p["brand"], "norm": norm(p["brand"]),
                    "cap": p.get("capitalCountry", ""), "cat": p.get("category", "")})
    return idx


def match_brand(text, index):
    # dopasowanie po TOKENACH (nie podłańcuchu) — krótkie nazwy nie trafiają przypadkiem
    # w niespokrewnione tytuły (np. "mg" w "img"). Cała nazwa marki musi wystąpić jako
    # spójna sekwencja tokenów w tekście.
    toks = norm(text).split()
    for b in index:
        bt = b["norm"].split()
        if not bt:
            continue
        n = len(bt)
        if any(toks[i:i + n] == bt for i in range(len(toks) - n + 1)):
            return b
    return None


# ---------------------------------------------------------------- scoring
def heuristic_score(cand):
    s = 0.0
    sig = cand["signal"]
    if cand["bucket"] == "A":
        s += 3
    if cand["bucket"] == "C":
        s += 4  # zmiana właściciela = świeży, mocny temat
    s += min(cand.get("origin_hits", 0), 6) * 0.8
    s += min(cand.get("spike", 0), 10) * 0.6
    if cand.get("cap") and cand["cap"] != "PL":
        s += 1.5  # zagraniczny kapitał = większy „szok"
    if cand.get("cat") in ("spożywcze", "napoje", "słodycze", "nabiał", "sieci handlowe"):
        s += 1.2  # sektory o najwyższym zasięgu (research popularności)
    return round(s, 1)


def score_ollama(cands, model):
    prompt = _score_prompt(cands)
    try:
        body = json.dumps({"model": model, "prompt": prompt, "stream": False,
                           "options": {"temperature": 0.3}}).encode()
        req = urllib.request.Request("http://localhost:11434/api/generate", data=body,
                                     headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=120) as r:
            resp = json.loads(r.read().decode())
        return _parse_scores(resp.get("response", ""), cands)
    except Exception as e:
        print(f"[scout] ollama niedostępny ({e}) — zostawiam heurystykę", file=sys.stderr)
        return cands


def score_claude(cands):
    prompt = _score_prompt(cands)
    try:
        p = subprocess.run(["claude", "-p", prompt], capture_output=True, text=True,
                           timeout=180, encoding="utf-8")
        return _parse_scores(p.stdout, cands)
    except Exception as e:
        print(f"[scout] claude CLI niedostępny ({e}) — zostawiam heurystykę", file=sys.stderr)
        return cands


def _score_prompt(cands):
    items = [{"id": i, "temat": c["label"], "sygnal": c["signal"],
              "kubelek": c["bucket"]} for i, c in enumerate(cands)]
    return (
        "Jesteś redaktorem kanału YouTube Shorts skadprodukt.org o PRAWDZIWYM pochodzeniu "
        "marek (kto produkuje, czyj kapitał). Oceń poniższe pomysły na short. Dla każdego zwróć "
        "obiekt: {\"id\":int, \"ocena\":0-10 (potencjał wiralowy + zgodność z tematem kanału), "
        "\"angle\":\"1 zdanie: jak ugryźć temat\", \"hook\":\"chwytliwe pierwsze zdanie\"}. "
        "Wyżej ceń: zaskakującą własność (marka brzmi swojsko a jest zagraniczna), świeże przejęcia, "
        "sektor spożywczy. Odpowiedz TYLKO tablicą JSON, bez komentarza.\n\n"
        + json.dumps(items, ensure_ascii=False))


def _parse_scores(text, cands):
    m = re.search(r"\[.*\]", text, re.S)
    if not m:
        return cands
    try:
        arr = json.loads(m.group(0))
    except Exception:
        return cands
    by_id = {o.get("id"): o for o in arr if isinstance(o, dict)}
    for i, c in enumerate(cands):
        o = by_id.get(i)
        if o:
            if isinstance(o.get("ocena"), (int, float)):
                c["score"] = round((c["score"] + float(o["ocena"])) / 2, 1)  # miks z heurystyką
            c["angle"] = o.get("angle", "")
            c["hook"] = o.get("hook", "")
    return cands


# ---------------------------------------------------------------- główny przepływ
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--scorer", choices=["heuristic", "ollama", "claude"], default="heuristic")
    ap.add_argument("--ollama-model", default="qwen2.5:14b")
    ap.add_argument("--limit", type=int, default=24, help="ile marek na źródło (rotacja co dzień)")
    ap.add_argument("--top-model", type=int, default=15, help="ile top-kandydatów posłać do modelu")
    ap.add_argument("--no-net", action="store_true", help="pomiń źródła sieciowe (test matchera)")
    args = ap.parse_args()

    products = json.loads(PRODUCTS.read_text(encoding="utf-8"))["products"]
    index = build_index(products)
    day_index = (datetime.now(timezone.utc).date() - datetime(2026, 1, 1).date()).days

    cands = []
    if not args.no_net:
        # 1) autocomplete → popyt na origin-story (kubełek A dla marek z bazy)
        for a in src_autocomplete(index, args.limit, day_index):
            cands.append({"bucket": "A", "label": a["brand"], "slug": a["slug"],
                          "signal": f"pytania Google: {', '.join(a['suggestions'][:4])}",
                          "origin_hits": a["origin_hits"],
                          "cap": next((b['cap'] for b in index if b['slug'] == a['slug']), ""),
                          "cat": next((b['cat'] for b in index if b['slug'] == a['slug']), ""),
                          "score": 0.0, "angle": "", "hook": ""})
        # 2) wiki spikes → timing (kubełek A)
        for w in src_wiki_spikes(index, args.limit, day_index):
            cands.append({"bucket": "A", "label": w["brand"], "slug": w["slug"],
                          "signal": f"skok odsłon Wikipedii ×{w['spike']} ({w['baseline']}→{w['recent']}/dzień)",
                          "spike": w["spike"],
                          "cap": next((b['cap'] for b in index if b['slug'] == w['slug']), ""),
                          "cat": next((b['cat'] for b in index if b['slug'] == w['slug']), ""),
                          "score": 0.0, "angle": "", "hook": ""})
        # 3) trends RSS → discovery (B) lub news o przejęciu (C)
        for t in src_trends_rss():
            b = match_brand(t["title"] + " " + t["snippet"], index)
            is_ma = any(k in (t["title"] + " " + t["snippet"]).lower() for k in MA_KW)
            if b and is_ma:
                cands.append({"bucket": "C", "label": b["brand"], "slug": b["slug"],
                              "signal": f"news (możliwa zmiana właściciela): {t['title']}",
                              "cap": b["cap"], "cat": b["cat"], "score": 0.0, "angle": "", "hook": ""})
            elif not b and is_ma:
                cands.append({"bucket": "B", "label": t["title"], "slug": "",
                              "signal": f"trend + wątek własnościowy: {t['snippet'][:120]}",
                              "score": 0.0, "angle": "", "hook": ""})

    # scal duplikaty po (bucket,label) — NIE gub sygnału. Marka może mieć naraz sygnał
    # z autocomplete i skok na Wikipedii; łączymy je (silniejszy kandydat), zamiast odrzucać.
    merged = {}
    for c in cands:
        k = (c["bucket"], norm(c["label"]))
        if k not in merged:
            merged[k] = c
        else:
            m = merged[k]
            m["signal"] = m["signal"] + " · " + c["signal"]
            m["origin_hits"] = max(m.get("origin_hits", 0), c.get("origin_hits", 0))
            m["spike"] = max(m.get("spike", 0), c.get("spike", 0))
            m["cap"] = m.get("cap") or c.get("cap")
            m["cat"] = m.get("cat") or c.get("cat")
    cands = list(merged.values())

    for c in cands:
        c["score"] = heuristic_score(c)
    cands.sort(key=lambda c: c["score"], reverse=True)

    # doprecyzowanie modelem tylko dla top-N (mało tokenów, ta sama jakość na finale)
    if args.scorer == "claude" and cands:
        top = cands[:args.top_model]
        _parse_res = score_claude(top)
        cands = _parse_res + cands[args.top_model:]
        cands.sort(key=lambda c: c["score"], reverse=True)
    elif args.scorer == "ollama" and cands:
        top = cands[:args.top_model]
        cands = score_ollama(top, args.ollama_model) + cands[args.top_model:]
        cands.sort(key=lambda c: c["score"], reverse=True)

    stamp = datetime.now(timezone.utc).astimezone().strftime("%Y-%m-%d %H:%M")
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps({"generated": stamp, "scorer": args.scorer,
                                    "candidates": cands}, ensure_ascii=False, indent=2),
                        encoding="utf-8")
    write_digest(cands, stamp, args.scorer)
    print(f"[scout] {len(cands)} pomysłów → {OUT_JSON.name} / {OUT_MD.name} (scorer={args.scorer})")


def write_digest(cands, stamp, scorer):
    B = {"A": "🎬 Marki w bazie na fali — zrób shorta", "C": "🔄 Możliwa zmiana właściciela — zweryfikuj rekord",
         "B": "🔎 Kandydaci spoza bazy — do researchu /dodaj-marke"}
    lines = [f"# Pomysły na shorty — {stamp}", "",
             f"Scorer: **{scorer}**. To podpowiedzi do przeglądu — nic nie idzie na kanał ani do bazy automatycznie.", ""]
    for bucket in ("A", "C", "B"):
        grp = [c for c in cands if c["bucket"] == bucket]
        if not grp:
            continue
        lines.append(f"## {B[bucket]}")
        for c in grp[:12]:
            lines.append(f"- **{c['label']}** · ocena {c['score']}"
                         + (f" · {c.get('cap')}" if c.get("cap") else ""))
            lines.append(f"  - sygnał: {c['signal']}")
            if c.get("hook"):
                lines.append(f"  - hook: „{c['hook']}”")
            if c.get("angle"):
                lines.append(f"  - ujęcie: {c['angle']}")
        lines.append("")
    OUT_MD.write_text("\n".join(lines), encoding="utf-8")


if __name__ == "__main__":
    main()
