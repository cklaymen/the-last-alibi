# The Last Alibi

Dedukcyjna gra planszowa online dla 2–6 graczy (mechanika w stylu „kto, czym i gdzie”) z własną oprawą. Gracze dołączają do prywatnego pokoju po kodzie albo linku, wybierają postać, a potem na zmianę rzucają kośćmi, chodzą po planszy, sugerują, obalają i oskarżają. Wygrywa ten, kto pierwszy poprawnie wskaże zawartość koperty.

- mobile first, układ responsywny na desktop;
- motyw jasny / ciemny / systemowy, interfejs PL / EN;
- notatnik detektywa zapisywany w przeglądarce;
- link do pokoju (`/room/<kod>`), zapamiętany nick, zmiana nicku w pokoju;
- obecność graczy: po 30 s nieobecności gracz w lobby opuszcza pokój, a w trakcie gry jego tury są pomijane, a karty pokazuje za niego serwer;
- po zakończeniu gry wszyscy wracają do lobby tego samego pokoju z podsumowaniem ostatniej partii.

Zasady gry: [`docs/cluedo-rules.md`](docs/cluedo-rules.md) (sekcja „Implementation clarifications” jest wiążąca). Plan i architektura: [`docs/game-screens-plan.md`](docs/game-screens-plan.md).

## Technologie

| Obszar | Technologie |
|---|---|
| Monorepo | pnpm 10 (workspaces), Turborepo 2, TypeScript 5.9 (strict), Node.js ≥ 22 |
| Domena (`packages/game`) | czysty TypeScript bez zależności runtime, niemutowalne funkcje zwracające `Result`, wstrzykiwany RNG |
| Kontrakty (`packages/contracts`) | Zod 4 – schematy HTTP/WebSocket, typy zdarzeń Socket.IO, kody błędów |
| API (`apps/api`) | NestJS 11, Socket.IO 4, repozytoria in-memory (interfejsy gotowe pod bazę danych) |
| Web (`apps/web`) | React 19, Vite 7, Tailwind CSS 4 (tokeny CSS dla motywów), lucide-react, socket.io-client; bez Reduxa i bez biblioteki routingu |
| Testy | Vitest (domena, API z `@nestjs/testing` i socket.io-client, web z Testing Library + jsdom), Playwright (E2E, projekty `mobile-chromium` i `desktop-chromium`) |
| Uruchomienie | Docker (multi-stage), docker compose, nginx (statyczny web + proxy `/api` i `/socket.io`) |

### Architektura w skrócie

```
packages/game        reguły gry (czyste funkcje)          ◄── jedyne źródło reguł
packages/contracts   Zod + typy wspólne dla API i web
apps/api             transport (HTTP + Socket.IO), sesje, obecność, projekcje stanu
apps/web             widoki; pokazuje tylko akcje dozwolone przez serwer
apps/e2e             testy Playwright (fixture'y wielu graczy, Page Objects)
```

- **Serwer jest autorytatywny.** Klient wysyła intencję (np. `turn:move`), serwer waliduje ją funkcjami z `packages/game` i rozsyła stan.
- **Projekcje.** Stan publiczny (`game:state`) dostają wszyscy, a stan prywatny (`game:private`: ręka, dozwolone akcje, osiągalne pola, prośba o obalenie, pokazane karty) tylko właściciel. Koperta i cudze karty nigdy nie trafiają do stanu publicznego.
- **Tożsamość.** Gracz dostaje token sesji przy tworzeniu pokoju lub dołączaniu; socket uwierzytelnia się tokenem w handshake'u.
- **Feature folders** w każdej warstwie; słowniki i18n per feature (EN + PL).

## Uruchomienie lokalne (dev)

Wymagania: Node.js ≥ 22 i pnpm 10 (`corepack enable`).

```bash
pnpm install
pnpm --filter @mystery-game/game --filter @mystery-game/contracts build   # biblioteki współdzielone
pnpm dev                                                                   # API :3000 + web :5173
```

Aplikacja działa pod <http://localhost:5173>. Zmienne środowiskowe są opisane w [`.env.example`](.env.example):

| Zmienna | Domyślnie | Opis |
|---|---|---|
| `PORT` | `3000` | port API |
| `WEB_ORIGIN` | `http://localhost:5173` | origin weba (CORS) |
| `PRESENCE_GRACE_MS` | `30000` | po ilu ms rozłączony gracz opuszcza lobby / zostaje oznaczony jako nieobecny w grze |
| `ENABLE_TEST_API` | — | `1` włącza `POST /testing/rooms/:code/scenario` (tylko testy E2E) |
| `VITE_API_URL` | `http://localhost:3000` | adres API dla weba (może być względny, np. `/api`, za reverse proxy) |

## Uruchomienie w Dockerze

```bash
docker compose up --build
```

Gra jest dostępna pod <http://localhost:8080>; port zmienisz przez `WEB_PORT=9000 docker compose up`. Kontener `web` (nginx) serwuje zbudowaną aplikację i przekazuje `/api/*` oraz `/socket.io/*` do kontenera `api`, więc wszystko działa na jednym originie. Stan gier jest trzymany w pamięci API, więc restart kontenera kasuje pokoje.

## Testy i jakość

```bash
pnpm typecheck     # TypeScript we wszystkich pakietach
pnpm test          # testy jednostkowe: domena, API, web (Vitest)
pnpm build         # build wszystkich pakietów
pnpm test:e2e      # Playwright; sam uruchamia API (:3100) i web (:5174)
```

Przed pierwszym uruchomieniem E2E zainstaluj przeglądarkę: `pnpm --filter @mystery-game/e2e exec playwright install chromium`.

## Struktura repozytorium

```
apps/
  api/        NestJS: modules/{session,rooms,game,presence,testing}, shared/
  web/        React: app/, features/<feature>/, shared/{ui,i18n,errors,lib}
  e2e/        Playwright: fixtures/, pages/, tests/
packages/
  game/       src/{lobby,setup,board,movement,suggestion,accusation,turn-flow,presence,shared}
  contracts/  src/{session,rooms,game,testing}, errors.ts, events.ts
docker/       konfiguracja nginx
docs/         zasady, plan wdrożenia, referencje designu
```
