import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { testRoom } from "../../test/renderWithGame.js";
import { RoomSettingsView } from "./RoomSettingsView.js";

const settings = testRoom.settings;
const controls = () => [...screen.getAllByRole("combobox"), ...screen.getAllByRole("checkbox")];

describe("RoomSettingsView", () => {
  it("without onChange all controls are disabled", () => {
    render(<RoomSettingsView settings={settings} />);
    expect(controls()).toHaveLength(7);
    for (const c of controls()) expect(c).toBeDisabled();
  });

  it("with onChange a change sends a one-field patch", async () => {
    const onChange = vi.fn();
    render(<RoomSettingsView settings={settings} onChange={onChange} />);
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Turn time limit" }), "120 s");
    expect(onChange).toHaveBeenLastCalledWith({ turnTimeLimitSec: 120 });
    await userEvent.click(screen.getByRole("checkbox", { name: "Automatic notes" }));
    expect(onChange).toHaveBeenLastCalledWith({ autoNotes: !settings.autoNotes });
  });

  it("every setting has an info button", () => {
    render(<RoomSettingsView settings={settings} />);
    expect(screen.getAllByRole("button", { name: /^About: / })).toHaveLength(7);
  });

  it("guest can open info although controls are disabled", async () => {
    render(<RoomSettingsView settings={settings} />);
    await userEvent.click(screen.getByRole("button", { name: "About: Face-down cards in rooms" }));
    expect(screen.getByRole("tooltip")).toHaveTextContent("never used to disprove");
  });
});
