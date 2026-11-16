# TODO

Otwarty backlog / wymagania bieżącej partii prac. Cykl życia (todo → plan → aktualizacja dokumentacji → archiwum w `history/NN-<temat>/`): [`docs/README.md` → Work lifecycle](README.md#work-lifecycle-todo--plan--docs--history). Obecny stan aplikacji: [`docs/README.md`](README.md). Zakończone partie: [`history/`](history/README.md).

## Do zrobienia

- [ ] **Podejrzenie – info o pomieszczeniu:** w oknie rzucania podejrzenia przy pomieszczeniu pokazać, czy mam je na ręce albo czy już wiem, kto je ma (tak jak dziś przy narzędziach i postaciach).
- [ ] **Ściąga z zasad:** przycisk w linii górnego paska nawigacji otwierający krótkie, zwięzłe streszczenie zasad i przebiegu gry (bez nadmiaru tekstu).
- [ ] **Spójne tooltipy:** tooltipy działają wszędzie tak samo – w tabeli notatnika po najechaniu na inicjał/awatar gracza pokazuje się tooltip jak na mapie.
- [ ] **Tooltipy na mapie ucinane na brzegach:** naprawić przy możliwie najmniejszym skomplikowaniu logiki tooltipów.
- [ ] **Ucięta ramka gracza na liście graczy:** ramka (obwódka) gracza jest delikatnie ucinana, jakby rodzic miał `overflow` – poprawić, żeby wyglądało estetycznie.
- [ ] **Notatnik – karty na ręce:** karty, które mam na ręce, oznaczyć chipem podobnym do tego w oknie podejrzenia/oskarżenia; jeśli brakuje miejsca – sama ikonka łapki z tooltipem.
- [ ] **Zmiana nazwy sekcji:** sekcja „Notatnik” → „Karty” (EN: „Notebook” → „Cards”; i18n, testy e2e korzystające z nazwy, dokumentacja).
- [ ] **Dziennik – ikonki:** przy wpisach o podejrzeniach używać ikonek (postać, narzędzie, pomieszczenie), żeby log był czytelniejszy.
- [ ] **Konfiguracja pokoju – wyjaśnienia ustawień:** przy każdym ustawieniu pokoju przycisk (np. ikonka „i”/„?”) pokazujący dokładniejsze wyjaśnienie, co dane ustawienie zmienia w rozgrywce – obecnie nie jest to intuicyjne.

## Otwarte z wcześniejszych planów (nieprzypisane, do decyzji)

Punkty, które nie zostały zrobione w `history/02-mvp-vertical-slices/plan.md`. Nie są zobowiązaniem – przed podjęciem warto potwierdzić, czy są nadal potrzebne.

- [ ] **CI:** GitHub Actions: install → build game/contracts → lint → typecheck → test → build → e2e (`playwright install --with-deps`).
- [ ] **Prettier** w repo (formatowanie, spójne z ESLint).
- [ ] **Dostępność:** testy `@axe-core/playwright` na każdym ekranie w obu motywach; focus trap w dialogach i obsługa planszy z klawiatury (sprawdzić stan obecny).
- [ ] **Testy wizualne:** zrzuty ekranu planszy i głównych widoków w obu motywach (`toHaveScreenshot`).
- [ ] **Pełne gry w e2e:** scenariusz 2- i 6-osobowy od lobby do zwycięzcy.
- [ ] **Projekt w Figmie:** eksport ekranów (mobile/desktop, oba motywy) i planszy jako SVG.
- [ ] **Trwałość (opcjonalnie):** PostgreSQL + Prisma jako implementacje `GameRepository` / `SessionRepository`, wygasanie sesji, odtworzenie pokoju po restarcie API.

## Poza zakresem (świadomie)

Konta, publiczne wyszukiwanie pokoi, widzowie, czat, boty, ranking, gra offline, karty wskazówek, dołączanie w trakcie gry, ręczne przekazanie roli gospodarza. Uzasadnienia: `docs/product/overview.md`, `docs/product/decisions.md`.
