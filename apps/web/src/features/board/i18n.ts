import { defineMessages } from "../../shared/i18n/index.js";

export const boardMessages = defineMessages({
  en: {
    region: "Board",
    pawnInRoom: "{character} – {room}",
    pawnInCorridor: "{character} – corridor",
    weapon: "{weapon} – {room}",
    moveToCell: "Move to row {row}, column {col}",
    enterRoom: "Enter {room}",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    resetZoom: "Reset zoom",
    playedBy: "{character} ({player})",
    roomCard: "Face-down card",
  },
  pl: {
    region: "Plansza",
    pawnInRoom: "{character} – {room}",
    pawnInCorridor: "{character} – korytarz",
    weapon: "{weapon} – {room}",
    moveToCell: "Idź do wiersza {row}, kolumny {col}",
    enterRoom: "Wejdź: {room}",
    zoomIn: "Przybliż",
    zoomOut: "Oddal",
    resetZoom: "Resetuj powiększenie",
    playedBy: "{character} ({player})",
    roomCard: "Zakryta karta",
  },
});
