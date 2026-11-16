import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithGame, testRoom } from "../../test/renderWithGame.js";
import { RoomSettingsPanel } from "./RoomSettingsPanel.js";

const lobby = { ...testRoom, phase: "LOBBY" as const };

function panel() {
  return screen.getByRole("region", { name: "Room settings" });
}

describe("RoomSettingsPanel", () => {
  it("host sees enabled controls with defaults", () => {
    renderWithGame(<RoomSettingsPanel />, { room: lobby, game: null, me: null });
    const p = within(panel());
    const turn = p.getByRole("combobox", { name: "Turn time limit" });
    expect(turn).toBeEnabled();
    expect(within(turn).getByRole("option", { name: "90 s" })).toHaveProperty("selected", true);
    expect(within(turn).getAllByRole("option").map((o) => o.textContent)).toEqual([
      "None",
      "30 s",
      "60 s",
      "90 s",
      "120 s",
      "180 s",
    ]);
    const disprove = p.getByRole("combobox", { name: "Time to show a card" });
    expect(within(disprove).getByRole("option", { name: "30 s" })).toHaveProperty("selected", true);
    const place = p.getByRole("combobox", { name: "Accusation location" });
    expect(within(place).getByRole("option", { name: "Any room" })).toHaveProperty("selected", true);
    expect(p.getByRole("combobox", { name: "Face-down cards in rooms" })).toHaveValue("0");
    expect(p.getByRole("checkbox", { name: "Accuse after suggestion in the same turn" })).toBeChecked();
    expect(p.getByRole("checkbox", { name: "Suggest after staying in a room" })).not.toBeChecked();
    expect(p.getByRole("checkbox", { name: "Automatic notes" })).toBeChecked();
    for (const control of [...p.getAllByRole("combobox"), ...p.getAllByRole("checkbox")]) {
      expect(control).toBeEnabled();
    }
  });

  it("guest sees disabled controls", () => {
    renderWithGame(<RoomSettingsPanel />, { room: lobby, myId: "p2", game: null, me: null });
    const p = within(panel());
    const controls = [...p.getAllByRole("combobox"), ...p.getAllByRole("checkbox")];
    expect(controls).toHaveLength(7);
    for (const control of controls) expect(control).toBeDisabled();
  });

  it("shows the room's current values", () => {
    renderWithGame(<RoomSettingsPanel />, {
      room: {
        ...lobby,
        settings: {
          ...lobby.settings,
          turnTimeLimitSec: null,
          accusationPlace: "named_room",
          roomCards: 4,
          autoNotes: false,
        },
      },
      game: null,
      me: null,
    });
    const p = within(panel());
    expect(within(p.getByRole("combobox", { name: "Turn time limit" })).getByRole("option", { name: "None" })).toHaveProperty("selected", true);
    expect(within(p.getByRole("combobox", { name: "Accusation location" })).getByRole("option", { name: "The named room" })).toHaveProperty("selected", true);
    expect(p.getByRole("combobox", { name: "Face-down cards in rooms" })).toHaveValue("4");
    expect(p.getByRole("checkbox", { name: "Automatic notes" })).not.toBeChecked();
  });

  it("changing a value sends room:settings with a one-field patch", async () => {
    const { value } = renderWithGame(<RoomSettingsPanel />, { room: lobby, game: null, me: null });
    const p = within(panel());
    await userEvent.selectOptions(p.getByRole("combobox", { name: "Turn time limit" }), "120 s");
    expect(value.send).toHaveBeenLastCalledWith("room:settings", { turnTimeLimitSec: 120 });
    await userEvent.selectOptions(p.getByRole("combobox", { name: "Time to show a card" }), "None");
    expect(value.send).toHaveBeenLastCalledWith("room:settings", { disproveTimeLimitSec: null });
    await userEvent.selectOptions(p.getByRole("combobox", { name: "Accusation location" }), "The named room");
    expect(value.send).toHaveBeenLastCalledWith("room:settings", { accusationPlace: "named_room" });
    await userEvent.selectOptions(p.getByRole("combobox", { name: "Face-down cards in rooms" }), "3");
    expect(value.send).toHaveBeenLastCalledWith("room:settings", { roomCards: 3 });
    await userEvent.click(p.getByRole("checkbox", { name: "Accuse after suggestion in the same turn" }));
    expect(value.send).toHaveBeenLastCalledWith("room:settings", { accuseAfterSuggestion: false });
    await userEvent.click(p.getByRole("checkbox", { name: "Suggest after staying in a room" }));
    expect(value.send).toHaveBeenLastCalledWith("room:settings", { suggestAfterStaying: true });
    await userEvent.click(p.getByRole("checkbox", { name: "Automatic notes" }));
    expect(value.send).toHaveBeenLastCalledWith("room:settings", { autoNotes: false });
    expect(value.send).toHaveBeenCalledTimes(7);
  });

  it("server error code is shown", async () => {
    const send = vi.fn(async () => ({ ok: false as const, code: "INVALID_SETTINGS" as const }));
    renderWithGame(<RoomSettingsPanel />, { room: lobby, game: null, me: null, send });
    await userEvent.click(within(panel()).getByRole("checkbox", { name: "Automatic notes" }));
    expect(await within(panel()).findByRole("alert")).toBeInTheDocument();
  });
});
