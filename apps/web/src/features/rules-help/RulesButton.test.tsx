import { afterEach, describe, expect, it } from "vitest";
import { act } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setLocale } from "../../shared/i18n/index.js";
import { renderWithGame } from "../../test/renderWithGame.js";
import { RulesButton } from "./RulesButton.js";

afterEach(() => act(() => setLocale("en")));

describe("RulesButton", () => {
  it("opens and closes the dialog", async () => {
    render(<RulesButton />);
    await userEvent.click(screen.getByRole("button", { name: "Rules" }));
    const dialog = screen.getByRole("dialog", { name: "How to play" });
    expect(dialog).toHaveTextContent("The host can change some rules");
    await userEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("optional lines carry the \"Room setting\" chip", async () => {
    renderWithGame(<RulesButton />);
    await userEvent.click(screen.getByRole("button", { name: "Rules" }));
    const items = within(screen.getByRole("dialog")).getAllByRole("listitem");
    const marked = items.filter((li) => li.textContent?.startsWith("Room setting"));
    expect(marked.length).toBeGreaterThan(0);
    expect(items[0]).not.toHaveTextContent("Room setting");
  });

  it("PL text when locale is pl", async () => {
    act(() => setLocale("pl"));
    render(<RulesButton />);
    await userEvent.click(screen.getByRole("button", { name: "Zasady" }));
    expect(screen.getByRole("dialog", { name: "Jak grać" })).toBeInTheDocument();
  });
});
