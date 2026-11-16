# TODO

Źródło zasad: instrukcja Hasbro 2020 (`docs/cluedo-rules.md`). Poniżej decyzje dotyczące odstępstw od instrukcji.

## Do zrobienia

### 1. Oskarżenie tylko z pokoju (domyślnie zgodnie z instrukcją)
- [ ] Domyślnie: oskarżyć można tylko, gdy pionek stoi w **dowolnym** pokoju (nie na korytarzu).
- [ ] Opcja hosta w lobby „Miejsce oskarżenia”:
  - `any_room` (domyślnie) – gracz musi być w jakimkolwiek pokoju,
  - `named_room` – gracz musi być w pokoju, który wskazuje w oskarżeniu.
- [ ] Reguła w `packages/game` (`makeAccusation` + `availableActions`), nowe kody błędów (np. `NOT_IN_ROOM`, `WRONG_ROOM`).
- [ ] UI: przycisk „Oskarż” niedostępny poza pokojem; przy `named_room` pokój w oknie oskarżenia ustawiony na bieżący i zablokowany.

### 2. Oskarżenie w tej samej turze co sugestia (opcja hosta)
- [ ] Opcja hosta w lobby „Oskarżenie po sugestii w tej samej turze”:
  - włączona (domyślnie, zgodnie z instrukcją) – można oskarżyć zaraz po sugestii,
  - wyłączona – po sugestii w tej turze oskarżenie jest zablokowane (`turn.hasSuggested`).
- [ ] Reguła w `packages/game` + `availableActions`, nowy kod błędu (np. `ACCUSE_AFTER_SUGGESTION_DISABLED`).

### 3. Brak ruchu po sugestii (gracz przeniesiony sugestią)
- [ ] Gracz przeniesiony do pokoju cudzą sugestią może w swojej turze **albo** się ruszyć (kości / sekretne przejście), **albo** zgłosić sugestię w tym pokoju – nie oba.
- [ ] `rollError` (`packages/game/src/movement/index.ts`) ma blokować rzut i sekretne przejście, gdy `turn.hasSuggested` (np. kod `ALREADY_SUGGESTED`); „roll”/„passage” znika z `availableActions`.
- [ ] Testy jednostkowe + e2e (`suggestion.spec.ts`).

### 4. Sugestia po pozostaniu w pokoju (opcja hosta)
- [ ] Domyślnie (jak obecnie): pozostanie w pokoju **nie** pozwala na sugestię – trzeba do niego wejść w tej turze albo zostać przeniesionym.
- [ ] Opcja hosta w lobby „Sugestia po pozostaniu w pokoju”: gdy włączona, gracz, który zaczyna turę w pokoju, może bez ruszania się zgłosić sugestię w tym pokoju (zgodnie z instrukcją). Sugestia zamiast ruchu – po niej nie można rzucić kośćmi (jak w pkt 3).
- [ ] Reguła w `suggestionRoomFor` (`packages/game/src/suggestion/index.ts`) / `freshTurn` (`shared/play.ts`).

### 5. Limit czasu tury (opcja hosta)
- [ ] Domyślnie **90 s** na turę; host może zmienić w lobby przed rozpoczęciem gry: brak / 30 / 60 / 90 / 120 / 180 s.
- [ ] Po upływie czasu tura kończy się automatycznie (serwer).
- [ ] Timer w UI jako pasek przyklejony do sekcji „co się teraz dzieje w grze”, widoczny dla wszystkich graczy.
- [ ] Licznik tury jest wstrzymany, gdy czekamy na pokazanie karty przez innego gracza (wtedy działa licznik z pkt 6).

### 6. Limit czasu na pokazanie karty (opcja hosta)
- [ ] Osobny licznik dla gracza, który ma pokazać kartę. Domyślnie **30 s**; host może zmienić w lobby: brak / 15 / 30 / 45 / 60 s.
- [ ] Po upływie czasu serwer pokazuje losową pasującą kartę tego gracza.
- [ ] Ten sam pasek w sekcji „co się teraz dzieje w grze”, pokazujący czas pokazującego.

### 7. Karty zakryte w pokojach (opcja hosta, wariant z instrukcji)
- [ ] Opcja hosta w lobby „Karty zakryte w pokojach”: **0** (domyślnie) – 8.
- [ ] Przygotowanie: po wypełnieniu koperty z przetasowanych pozostałych kart bierze się N kart i kładzie zakryte w N różnych, losowych pokojach (najwyżej 1 karta na pokój); resztę rozdaje się graczom jak zwykle.
- [ ] Każdy gracz, którego pionek znajduje się w pokoju z kartą, może ją w tajemnicy podejrzeć (i zaznaczyć w notesie) – niezależnie od tego, jak się tam znalazł: ruchem, sekretnym przejściem czy przeniesiony cudzą sugestią. Karta zostaje w pokoju dla kolejnych graczy.
- [ ] Karty z pokojów nie należą do nikogo – nie biorą udziału w obalaniu sugestii.
- [ ] UI: oznaczenie na planszy, że w pokoju leży zakryta karta; podgląd karty dla gracza, którego pionek stoi w tym pokoju.

### 8. Usprawnienia UI ekranu gry

#### 8a. Wynik sugestii w sekcji akcji
- [ ] Wynik bieżącej sugestii pokazywany wyraźnie w sekcji akcji (`TurnPanel`), nie tylko w dzienniku zdarzeń.
- [ ] Widzą go wszyscy gracze, do końca tury:
  - sugerujący: „Nikt nie mógł obalić” / „X pokazał Ci kartę: [karta]” (podgląd karty jak obecnie w `SeenCards`),
  - pozostali: „Nikt nie mógł obalić sugestii Y” / „X pokazał kartę graczowi Y” (bez ujawniania karty).
- [ ] Selektor wyniku na bazie zdarzeń `suggested` / `card_shown` / `no_one_disproved` od ostatniego `turn_ended` (rozszerzenie `latestShownToMe` z `disprove/selectors.ts`).

#### 8b. Sekcja akcji zawsze widoczna (sticky)
- [x] Desktop: prawa kolumna z sekcją akcji przyklejona u góry (`sticky top-…`).
- [x] Mobile: sekcja akcji stoi normalnie pod planszą; gdy nie mieści się na ekranie (plansza za wysoka) – przyklejona do dołu ekranu, po przewinięciu niżej – przyklejona do góry. Natywnie: `position: sticky; top: 0; bottom: 0`, bez JS.
  - Warunek: sekcja musi być bezpośrednim dzieckiem `<main>` (na mobile np. `display: contents` na wrapperze prawej kolumny), inaczej sticky działa tylko w obrębie kolumny.
  - Jeśli to się nie sprawdzi – kompromis prostym CSS, bez nasłuchiwania scrolla.
- [ ] Sekcja akcji obejmuje: `TurnPanel`, `DisprovePanel`, wynik sugestii (8a), timer (pkt 5/6). Zadbać o tło i cień, żeby nie zlewała się z treścią pod spodem.

#### 8c. Sekcja akcji przyciąga uwagę, gdy muszę coś zrobić
- [x] Gdy mam akcję do wykonania (moja tura z dostępnymi akcjami lub muszę pokazać kartę): pomarańczowo-żółte wyróżnienie z ramką, delikatnie mieniące się (animowana ramka/gradient).
- [ ] Gdy kończy się czas na decyzję (np. ostatnie 10 s – do ustalenia przy pkt 5/6): dodatkowo pulsujące mruganie na czerwono, razem z timerem. **Zależy od pkt 5 i 6** (timery).
- [x] Animacje wyłączone przy `prefers-reduced-motion` (zostaje statyczny kolor/ramka). Kolory jako tokeny motywu (jasny/ciemny).

#### 8d. Kolejność sekcji
- [x] Dziennik zdarzeń bezpośrednio pod sekcją akcji (na desktopie i mobile).
- [ ] Następnie połączony notatnik z kartami (8e). Pasek graczy przeniesiony pod planszę (8h).

#### 8e. Notatnik-tabela połączony z „Moje karty”
- [ ] Jedna sekcja zamiast `CardHand` + `Notebook` + `SeenCards`: tabela, każda karta to wiersz, z podziałem na sekcje podejrzani / narzędzia / pokoje (jak teraz).
- [ ] Kolumny wiersza: ikona + nazwa karty | ogólny znacznik (✓ / ✗ / ?, jak teraz) | wąskie kolumny – po jednej na każdego **innego** gracza (bez mojej kolumny), w kolejności tury.
- [ ] Nagłówek kolumny gracza: kropka w kolorze postaci z inicjałem nicku, tooltip z pełnym nickiem (hover + tap). Gracze, którzy odpadli, zostają (nadal obalają sugestie) – nagłówek wyszarzony.
- [ ] Karty z mojej ręki: inne tło i ramka wiersza + ✓, **zablokowane** (ogólny znacznik i komórki graczy = ✗, bez edycji).
- [ ] Usunąć listę `SeenCards` („Widziane karty”) – świeży wynik trafia do sekcji akcji (8a), historia do notatnika i dziennika.
- [x] Usunąć osobny przycisk „Notatnik” na mobile (zastępuje go zwijanie z 8g).
- [ ] Jeden przełącznik „pokaż/ukryj kolumny graczy” (domyślnie widoczne), stan w `localStorage`. Po ukryciu zostaje widok jak dziś: karta + ogólny znacznik.
- [ ] Mobile: przy 5 innych graczach kolumny ok. 28 px muszą się zmieścić na 360 px bez poziomego przewijania strony (nazwa karty się skraca).

#### 8f. Znaczniki: ręczne i automatyczne
- [ ] Każda komórka (gracz × karta) i ogólny znacznik: klik cyklicznie `auto → ✓ → ✗ → ? → auto`. Stan „auto” pokazuje wartość wyliczoną (pustą, jeśli nic nie wiadomo).
- [ ] Ręczny znacznik zawsze wygrywa z automatycznym. Automatyczne wyświetlane lżej (np. przygaszony kolor), ręczne normalnie – widać, co jest wnioskiem aplikacji.
- [ ] Zapis w `localStorage` (per gra i gracz) tylko ręcznych znaczników; automatyczne liczone na bieżąco (czysta funkcja), nie zapisywane. Bez migracji starego formatu (nowa wersja = restart serwera = nowe gry); stary wpis po prostu się nie wczyta.
- [ ] Opcja hosta w lobby „Automatyczne notatki”: **włączone** (domyślnie) / wyłączone. Wyłączone → widok tabeli bez zmian, ale żadnych automatycznych znaczników (komórki graczy, ogólny znacznik, wyróżnienie „w kopercie”) – gracz uzupełnia wszystko ręcznie. Zostają: wyróżnienie i blokada moich kart oraz ✓ „pokazał mi” w kolumnie gracza (to fakty, które gracz zna, a nie wnioski). Część `settings` (patrz „Wspólne”).
- [ ] Automatyczne wnioski w kolumnach graczy (czysta funkcja w `notebookModel`/`deduction.ts`, dane: `game.events`, `me.hand`, `me.seenCards`, `cardCount` graczy):
  - `cannot_disprove` gracza X na sugestię → ✗ u X dla 3 kart z sugestii,
  - X pokazał mi kartę (`seenCards`) → ✓ u X dla tej karty,
  - X pokazał kartę komuś innemu (`card_shown`) → ? u X dla kart z tej sugestii, które nie są u X ✗,
  - moje karty → ✗ u wszystkich innych graczy,
  - propagacja (do punktu stałego): ✓ u jednego gracza → ✗ u pozostałych; liczba ✓ gracza = jego `cardCount` → ✗ w reszcie jego komórek; z „?” danej sugestii została jedna możliwa karta (pozostałe ✗ u X) → ✓.
  - Wnioski liczone tylko z faktów (bez uwzględniania ręcznych znaczników).
- [ ] Automatyczny ogólny znacznik: karta jest u kogoś (✓ u gracza lub w mojej ręce) → ✓. Wszyscy inni gracze mają ✗ i karta nie jest moja → wiersz wyróżniony jako „w kopercie”; również gdy to ostatnia niewykluczona karta w swojej sekcji.
- [ ] „Kto pokazał” widać wyłącznie w kolumnach graczy: ✓ w kolumnie gracza, który mi pokazał kartę, wyróżnione (np. obwódka = „pokazał mi”), w `aria-label` komórki. Bez osobnej kropki z inicjałem przy karcie.
- [ ] Serwer: wysyłać **pełną historię zdarzeń** zamiast ostatnich 50 (`EVENT_WINDOW` w `game.projector.ts`) – potrzebna do wnioskowania po odświeżeniu / na innym urządzeniu. Sprawdzić testy API zależne od okna.
- [ ] Dostępność: tabela jako `<table>` z nagłówkami wierszy/kolumn, `aria-label` komórki: „karta – gracz – stan (automatycznie/ręcznie)”.

#### 8g. Zwijane sekcje
- [x] Dziennik zdarzeń i notatnik z kartami zwijane/rozwijane (natywnie `<details>`/`<summary>` lub przycisk z `aria-expanded`), domyślnie rozwinięte.
- [x] Stan zwinięcia zapamiętany per przeglądarka (`localStorage`, z try/catch).

#### 8h. Skondensowany pasek graczy w linii z przyciskami mapy
- [ ] `PlayersBar` w jednej linii z przyciskami mapy (+ / − / reset), pod planszą: gracze po lewej, przyciski po prawej – na desktopie i mobile.
- [ ] Kompaktowe „chipy”: awatar postaci + skrócony nick; liczba kart, status (offline/away) i „odpadł” jako małe oznaczenia na awatarze lub w tooltipie (pełne informacje w `aria-label`).
- [ ] Wyraźne oznaczenie gracza, który ma teraz ruch (ramka/tło w kolorze akcentu, `aria-current`).
- [ ] Gdy gracze się nie mieszczą – przewijanie poziome samego paska, przyciski mapy zawsze widoczne.

#### 8i. Oznaczenia na planszy
- [ ] Pionek gracza wykonującego ruch wyróżniony (np. pulsująca/akcentowa ramka), odróżnialny od obecnego pierścienia „mój pionek”.
- [ ] Podczas sugestii (do końca tury, jak 8a) wyróżnione ramką: pionek podejrzanego i ikona narzędzia, o które pyta gracz (pokój – opcjonalnie podświetlenie).
- [ ] Animacje wyłączone przy `prefers-reduced-motion`.

#### 8j. Tooltipy na planszy
- [ ] Kliknięcie/tapnięcie albo przytrzymanie ikony narzędzia lub pionka pokazuje tooltip z nazwą (postać: nazwa postaci + nick gracza, jeśli jest graczem; narzędzie: nazwa). Na desktopie także po najechaniu.
- [ ] Uwaga: obecnie pionki i narzędzia mają `pointerEvents="none"` – po włączeniu nie mogą psuć przesuwania/powiększania planszy ani kliknięcia pola w celu ruchu (np. tooltip tylko przy kliknięciu bez przeciągnięcia; pionek na korytarzu nie blokuje ruchu na sąsiednie pola).

#### Testy
- [ ] Testy jednostkowe wnioskowania (każda reguła z 8f osobno + propagacja + koperta, ręczny znacznik wygrywa, brak automatycznych znaczników przy wyłączonej opcji).
- [ ] Testy jednostkowe: selektor wyniku sugestii, blokada kart z ręki, ✓ „pokazał mi” w kolumnie gracza, przełącznik kolumn, oznaczenia aktywnego gracza i sugerowanych elementów na planszy.
- [ ] Aktualizacja e2e (`notebook.spec.ts`, `suggestion.spec.ts`, `GamePage.ts`) – usunięte `SeenCards`/`CardHand`, nowe komunikaty w sekcji akcji.
- [ ] Teksty i18n (PL/EN).

### 9. Wersja aplikacji na ekranie głównym
- [ ] Wersja = data i godzina buildu w UTC, format ISO 8601 z dokładnością do minut, np. `2026-11-16T14:32Z`.
- [ ] Wyliczana przy buildzie weba (`define` w `apps/web/vite.config.ts`, np. `__APP_VERSION__`), bez gita – `.git` jest w `.dockerignore`.
- [ ] Opcjonalnie krótki hash commita obok daty, np. `2026-11-16T14:32Z (13c8392)`: przekazany jako `ARG GIT_SHA` w `Dockerfile` / `build.args` w `docker-compose.yml` (`GIT_SHA=$(git rev-parse --short HEAD) docker compose build`); brak → pokazujemy samą datę.
- [ ] UI: dyskretny tekst w stopce ekranu głównego (mały, przygaszony), np. „Wersja 2026-11-16T14:32Z”; i18n PL/EN.
- [ ] Lokalnie (`pnpm dev`) wersja = `dev`.

### Wspólne dla 1, 2, 4, 5, 6, 7, 8f
- [ ] Ustawienia pokoju (`settings`) w stanie gry i kontraktach, ustawiane przez hosta tylko w lobby, widoczne dla wszystkich graczy; zachowane przy restarcie pokoju.
- [ ] Teksty i18n (PL/EN) dla opcji i komunikatów błędów.
- [ ] Aktualizacja `docs/cluedo-rules.md` (sekcje „Implementation clarifications”, „Deviations”, „Online-specific rules”).

## Zostaje bez zmian (świadome odstępstwa od instrukcji)
- Ruch „do” sumy oczek (instrukcja: dokładnie tyle pól).
- Ostatni nieodpadnięty gracz wygrywa automatycznie (instrukcja: gra do trafnego oskarżenia, możliwy brak zwycięzcy).
- Brak kart wskazówek (wariant tradycyjny, dopuszczony przez instrukcję).
- Obecny układ planszy aplikacji (klasyczny, z pokojem `hall`; edycja 2020 ma w tym miejscu Bathroom).
- Rozłączony gracz: obecne zachowanie aplikacji (pominięcie tury / automatyczne pokazanie karty).

## Do weryfikacji
- [ ] `docs/cluedo-rules.md` → „Online-specific rules” podaje 60 s grace period dla rozłączonych; w kodzie to `DEFAULT_GRACE_MS = 30_000`. Ujednolicić dokumentację z kodem (limity tury i pokazania karty – patrz pkt 5 i 6).
