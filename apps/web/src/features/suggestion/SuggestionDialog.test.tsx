import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithGame } from "../../test/renderWithGame.js";
import { AccusationDialog } from "../accusation/index.js";
import { Notebook } from "../notebook/index.js";
import { SuggestionDialog } from "./SuggestionDialog.js";

describe("card picker annotations", () => {
  it("suggestion: marks cards in my hand and shows live notebook marks", async () => {
    renderWithGame(
      <>
        <Notebook />
        <SuggestionDialog room="kitchen" onSubmit={vi.fn()} onClose={vi.fn()} />
      </>,
    );
    const dialog = screen.getByRole("dialog", { name: "Make a suggestion" });
    const red = within(dialog).getByRole("radio", { name: "Ms. Red" });
    expect(within(red).getByText("In your hand")).toBeInTheDocument();
    expect(within(red).getByTitle("Notebook: has")).toHaveTextContent("✓");
    const green = within(dialog).getByRole("radio", { name: "Mr. Green" });
    expect(within(green).queryByText("In your hand")).toBeNull();
    expect(within(green).queryByTitle(/^Notebook:/)).toBeNull();

    const notebook = screen.getByRole("region", { name: "Notebook" });
    await userEvent.click(within(notebook).getByRole("button", { name: "Mr. Green – Overall – empty (automatic)" }));
    await userEvent.click(within(notebook).getByRole("button", { name: "Mr. Green – Overall – has (manual)" }));
    expect(within(green).getByTitle("Notebook: not")).toHaveTextContent("✗");
    await userEvent.click(within(notebook).getByRole("button", { name: "Mr. Green – Overall – not (manual)" }));
    expect(within(green).getByTitle("Notebook: maybe")).toHaveTextContent("?");
  });

  it("accusation: annotates all three groups", () => {
    renderWithGame(<AccusationDialog onSubmit={vi.fn()} onClose={vi.fn()} />);
    const dialog = screen.getByRole("dialog", { name: "Make an accusation" });
    const rope = within(within(dialog).getByRole("radiogroup", { name: "Weapon" })).getByRole("radio", {
      name: "Rope",
    });
    expect(within(rope).getByText("In your hand")).toBeInTheDocument();
    const hall = within(within(dialog).getByRole("radiogroup", { name: "Room" })).getByRole("radio", {
      name: "Hall",
    });
    expect(within(hall).queryByText("In your hand")).toBeNull();
  });
});
