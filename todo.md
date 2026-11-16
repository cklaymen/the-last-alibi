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

### Wspólne dla 1, 2, 4, 5, 6, 7
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
