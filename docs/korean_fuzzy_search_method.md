# Korean‑Aware Fuzzy Search for Musical Ornament Retrieval
**(Methods & Implementation Notes for International Journal Submission)**

## 1. Overview
We present a client‑side fuzzy search engine tailored to Korean text retrieval in a musical ornament database. The method combines (i) Unicode‑aware normalization, (ii) Choseong (initial consonant) indexing for Hangul syllables, and (iii) edit‑distance–based similarity with a partial‑window scoring (“partial ratio”), plus pragmatic ranking heuristics (field weights, dynamic thresholds). This hybrid approach preserves the simplicity and reactivity of browser‑based search while substantially improving robustness to typos, incomplete IME inputs, and initial‑consonant queries common in Korean search behavior.

## 2. Background & Motivation
Typical Levenshtein similarity works at the code‑point level, enabling language‑agnostic tolerance to insertions, deletions, and substitutions. However, Hangul presents unique challenges: (a) users often type or expect matches by initial consonants (Choseong), (b) IME intermediate states produce decomposed Jamo sequences, and (c) subtle letter variants (e.g., tense vs plain consonants) can hinder naïve character‑level matching. We therefore extend a basic fuzzy pipeline with Hangul‑specific preprocessing and signals.

## 3. Method
### 3.1. Unicode‑Aware Normalization
We apply NFKD to decompose code points, remove combining diacritics, strip punctuation/whitespace, and keep alphanumerics plus Hangul blocks. Let \( \mathcal{N}(\cdot) \) denote this normalization. This mitigates formatting noise and harmonizes IME artifacts.

### 3.2. Choseong Extraction
For any Hangul syllable \( S \in [\mathrm{AC00}, \mathrm{D7A3}] \), its index is \( i = \lfloor (S - 0xAC00) / (21 \times 28) \rfloor \). The initial consonant is mapped via a fixed table \( \mathrm{CHO}[i] \). We precompute a Choseong sequence \( C(x) \) for text \( x \) by concatenating \( \mathrm{CHO}[i] \) for each syllable and passing through any existing ㄱ‑ㅎ characters. This enables matching queries that consist solely of Choseong (e.g., “ㅂㅅㅈ” → “박상준”).

### 3.3. Similarity Functions
Given a query \( q \) and field text \( t \), we compute:
1) **Exact‑substring signal**: \( s_{\mathrm{sub}} = \mathbb{1}[\mathcal{N}(t) \text{ contains } \mathcal{N}(q)] \).
2) **Levenshtein similarity**: \( s_{\mathrm{lev}} = 1 - d(\mathcal{N}(q), \mathcal{N}(t)) / \max(|q|, |t|) \).
3) **Partial ratio**: a sliding window of length \(|q|\) over \(\mathcal{N}(t)\), taking \( s_{\mathrm{par}} = \max\_w s_{\mathrm{lev}}(\mathcal{N}(q), w) \). This counters length bias for long fields.
4) **Choseong similarity** (when the query is Choseong): repeat (1–3) on \( C(t) \) vs \( C(q) \).

The per‑field score is \( s_f = \max(s_{\mathrm{sub}}, s_{\mathrm{par}}, s_{\mathrm{lev}}) \).

### 3.4. Ranking & Thresholding
We weight fields according to perceived discriminative power: name (1.0), instrument (0.85), category (0.7), description (0.45). The item score is the maximum weighted field score. To reduce false positives with short queries, we apply a **dynamic threshold**: 0.9 for |q|≤2, 0.7 for 3–4, and 0.6 otherwise. Results are sorted by score descending.

### 3.5. Efficiency
We cache partial‑ratio computations with an LRU map (size 200) and short‑circuit on exact‑substring hits (score 1.0). For larger corpora, the same primitives can be offloaded to Web Workers without changing APIs.

## 4. Implementation Summary
- **Normalization**: NFKD + filtering to `[\\p{L}\\p{N}ㄱ-ㅎㅏ-ㅣ가-힣]`.
- **Choseong**: table‑based extraction from Hangul Syllables; pass‑through of ㄱ‑ㅎ.
- **Similarity**: Levenshtein distance (unit costs) + windowed partial ratio; optional extension to Damerau–Levenshtein or weighted costs for tense/plain consonants.
- **Ranking**: field weights + dynamic threshold; exact‑substring takes precedence.
- **UX**: maintains prior API; seamlessly integrates into existing `performSearch` pipeline.

## 5. Evaluation Protocol
We recommend a three‑facet evaluation on a manually labeled query–document set:
1) **Korean‑specific retrieval**: (i) Choseong queries, (ii) IME intermediate inputs, (iii) Jamo‑level confusions (ㅐ/ㅔ, 받침 유무). Metrics: Recall@k, nDCG@k.
2) **Noise robustness**: synthetic typos with 1–2 edits per token (insert/delete/substitute/transpose). Metrics: success@k vs baseline (substring‑only, Levenshtein‑only).
3) **Latency**: p50/p95 timings for 100, 1k, and 10k items on target browsers. Report with/without caching.

## 6. Limitations & Extensions
- **Cost model**: plain Levenshtein uses uniform costs; Korean‑specific confusions (e.g., ㄲ vs ㄱ) may justify weighted substitutions.
- **Tokenization**: current design is character‑centric; subword tokenization and phonetic normalization could further improve recall in noisy inputs.
- **Scalability**: for >50k items, consider prebuilt indices (e.g., n‑gram inverted index) and hybrid reranking with the proposed scorer.

## 7. Reproducibility & Availability
The JavaScript reference implementation (browser‑native, dependency‑free) is provided alongside this manuscript. It can be integrated as a drop‑in replacement for an existing fuzzy search module.

## 8. Ethical & Practical Considerations
All processing is client‑side; no user queries are transmitted. Local‑storage history is capped and user‑clearable. The approach is language‑aware without requiring user identity or sensitive attributes.