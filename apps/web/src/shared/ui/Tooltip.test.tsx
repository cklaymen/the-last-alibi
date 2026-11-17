import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Tooltip } from "./Tooltip.js";

const setup = () =>
  render(
    <div>
      <Tooltip label="Ada" content="Ada Lovelace">
        A
      </Tooltip>
      <p>outside</p>
    </div>,
  );

describe("Tooltip", () => {
  it("hover shows and leave hides", async () => {
    setup();
    const btn = screen.getByRole("button", { name: "Ada" });
    await userEvent.hover(btn);
    expect(screen.getByRole("tooltip")).toHaveTextContent("Ada Lovelace");
    await userEvent.unhover(btn);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("click pins, second click closes", async () => {
    setup();
    const btn = screen.getByRole("button", { name: "Ada" });
    await userEvent.click(btn);
    await userEvent.unhover(btn);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    await userEvent.click(btn);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("Escape closes", async () => {
    setup();
    await userEvent.click(screen.getByRole("button", { name: "Ada" }));
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("click outside closes", async () => {
    setup();
    await userEvent.click(screen.getByRole("button", { name: "Ada" }));
    await userEvent.click(screen.getByText("outside"));
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("trigger has aria-describedby while open", async () => {
    setup();
    const btn = screen.getByRole("button", { name: "Ada" });
    expect(btn).not.toHaveAttribute("aria-describedby");
    await userEvent.click(btn);
    expect(btn).toHaveAccessibleDescription("Ada Lovelace");
  });
});
