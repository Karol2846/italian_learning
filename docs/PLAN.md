# Plan: apka do nauki włoskiego

Dla dwóch osób (iPhone + Android), start od zera, cel: dogadać się we Włoszech
(podróże, restauracja, sklep, small talk).

## Założenia z notatek

| Wymaganie | Jak to realizujemy |
|---|---|
| Pojedyncze słówka + krótkie frazy na pamięć | Każda lekcja to 8–10 słówek/fraz, wprowadzanych po 3 |
| Powtórki ze starych tematów przy nowych | Powtórki rozłożone w czasie (SRS) wplatane w każdą nową lekcję + osobny tryb „Powtórki” |
| Rygorystyczne sprawdzanie | Pisanie: liczy się dokładna pisownia łącznie z akcentami; literówka = błąd, pokazujemy poprawną wersję i ćwiczenie wraca na koniec sesji |
| Wyjaśnienia gramatyczne | Krótka karta gramatyki w każdej lekcji, zawsze dostępna też z listy lekcji |
| Widoczna struktura nauki | Ekran główny = mapa całego kursu (moduły → lekcje) z tym, czego się nauczysz |
| Najpierw słuchanie i czytanie, potem mówienie i pisanie | Każda lekcja ma listę odblokowanych umiejętności; pisanie od lekcji 3, mówienie od modułu 3; potem wszystko się przeplata |
| Słówka → potem gramatyka na tych słówkach | Kolejność w lekcji: słówka → rozpoznawanie → gramatyka → układanie zdań z poznanych słów → dialog |
| „Dziś poznałeś *piłka*, więc dialog z piłką” | Etap 1: dialog każdej lekcji napisany pod jej słówka. Etap 3: Claude generuje dialogi z tego, co dana osoba faktycznie zna i z czym ma kłopot |

## Decyzje techniczne

- **PWA** (React + TypeScript + Vite): jeden kod, instalacja z przeglądarki na
  ekran główny na obu telefonach, działa offline, bez sklepów i opłat.
- **Hosting**: GitHub Pages, wdrożenie automatyczne po pushu na `main`.
- **Treść kursu w repo** (`src/content/`), jako typowane dane — przewidywalna,
  sprawdzona, działa offline. Bez klucza API i kosztów na start.
- **Postęp lokalnie na telefonie** (localStorage) — każde z was ma swój telefon,
  więc konta nie są potrzebne. Eksport/import postępu jako zabezpieczenie.
- **Wymowa**: syntezator mowy wbudowany w telefon (głos włoski). Jeśli jakość
  na Androidzie będzie słaba → nagrania generowane z góry do repo.
- **Claude na żywo** (etap 3): mały backend (Cloudflare Worker) trzyma klucz API
  z Claude Console. Subskrypcji claude.ai nie da się podpiąć do własnej apki.

## Budowa lekcji (ok. 10 minut)

1. Nowe słówka po 3: karta z wymową → czytanie (IT → wybierz PL) → słuchanie
   (dźwięk → wybierz PL).
2. Wplecione powtórki ze starszych lekcji (to, co „dojrzało” w SRS).
3. Przypominanie w drugą stronę (PL → wybierz IT), a gdy odblokowane — pisanie.
4. Karta gramatyki oparta na właśnie poznanych słowach.
5. Układanie zdań z kafelków.
6. Dialog (słuchanie + czytanie) i pytania na zrozumienie.
7. Błędne odpowiedzi wracają na koniec sesji, dopóki nie będą poprawne.

SRS: pudełka z odstępami 1 / 3 / 7 / 16 / 35 / 90 dni; błąd cofa do pierwszego.

## Program kursu (A1 „na życie”)

| # | Moduł | Sytuacje | Gramatyka |
|---|---|---|---|
| 1 | Pierwsze kroki | powitania, przedstawianie się, „jak się masz”, zwroty ratunkowe | wymowa, *essere* (l.poj.), -o/-a, *non*, tu vs Lei |
| 2 | W barze | kawa, zamawianie, płacenie | *un/una*, *il/la*, *vorrei*, liczby 0–20 |
| 3 | Ludzie | rodzina, wygląd, wiek, zawód | *avere*, zgodność przymiotników, *mio/tuo*, liczba mnoga |
| 4 | W mieście | pytanie o drogę, miejsca | *c'è / ci sono*, *dove*, przyimki miejsca |
| 5 | Restauracja | menu, zamawianie, upodobania | czasowniki *-are*, *mi piace*, rodzajniki l.mn. |
| 6 | Zakupy | ceny, ubrania, targ | liczby do 1000, *questo/quello*, *quanto* |
| 7 | Czas i dzień | godziny, dni tygodnia, rutyna | czasowniki *-ere/-ire*, zwrotne |
| 8 | Podróż | pociąg, bilety, lotnisko | *andare/venire*, przyimki *a/in/da* |
| 9 | Nocleg | hotel, mieszkanie, problemy | *potere/volere/dovere* |
| 10 | Small talk | pogoda, hobby, plany na weekend | *fare*, *stare*, przysłówki częstotliwości |
| 11 | Co się wydarzyło | opowiadanie o wczoraj, o wakacjach | *passato prossimo* |
| 12 | Plany i kłopoty | zdrowie, apteka, umawianie się | *stare per*, przyszły, *mi fa male* |

Każdy moduł: 4–5 lekcji + lekcja-powtórka z dłuższym dialogiem.

## Etapy

- [x] **Etap 1 — MVP**: PWA, silnik lekcji, SRS, rygorystyczne sprawdzanie,
  mapa kursu, moduł 1 (4 lekcje). Lekcję można rozbić na 2–3 części, przerwana
  sesja wznawia się od tego samego miejsca, pasek postępu jest podzielony na
  sekcje, a poznana gramatyka zbiera się w zakładce „Gramatyka”. Opcjonalny zapis fonetyczny (IPA).
- [ ] **Etap 2 — treść i mówienie**: moduły 4–12 (2 i 3 gotowe), ćwiczenia mówienia
  (rozpoznawanie mowy), osobne ćwiczenia z gramatyki w zakładce „Gramatyka”,
  eksport/import postępu, statystyki i seria dni.
- [ ] **Etap 3 — Claude na żywo**: backend z kluczem API; dialogi generowane z
  poznanych słówek, rozmowa tekstowa/głosowa w scenkach (bar, hotel…),
  ocena wolnych odpowiedzi z wyjaśnieniem błędu, „zapytaj o gramatykę”.
- [ ] **Etap 4 — we dwoje**: synchronizacja postępu, wspólne scenki, porównanie serii.
