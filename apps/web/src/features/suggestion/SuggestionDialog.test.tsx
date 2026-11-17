import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithGame, testMe } from "../../test/renderWithGame.js";
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

  it("suggestion: shows \"In your hand\" for the room when I hold it", () => {
    renderWithGame(<SuggestionDialog room="kitchen" onSubmit={vi.fn()} onClose={vi.fn()} />, {
      me: { ...testMe, hand: ["red", "kitchen"] },
    });
    const dialog = screen.getByRole("dialog", { name: "Make a suggestion" });
    expect(within(dialog).getAllByText("In your hand")).toHaveLength(2); // Ms. Red + the room
  });

  it("suggestion: shows the notebook mark of the room", async () => {
    renderWithGame(
      <>
        <Notebook />
        <SuggestionDialog room="hall" onSubmit={vi.fn()} onClose={vi.fn()} />
      </>,
    );
    const dialog = screen.getByRole("dialog", { name: "Make a suggestion" });
    expect(within(dialog).getAllByTitle(/^Notebook:/)).toHaveLength(2); // Ms. Red, Rope
    await userEvent.click(screen.getByRole("button", { name: "Hall – Overall – empty (automatic)" }));
    expect(within(dialog).getAllByTitle(/^Notebook:/)).toHaveLength(3);
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
