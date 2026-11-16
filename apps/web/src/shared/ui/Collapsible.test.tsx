import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Collapsible } from "./Collapsible.js";

function renderLog(defaultOpen = true) {
  return render(
    <Collapsible id="log" title="Event log" defaultOpen={defaultOpen}>
      <p>content</p>
    </Collapsible>,
  );
}

const details = () => screen.getByText("Event log").closest("details")!;

describe("Collapsible", () => {
  afterEach(() => vi.restoreAllMocks());

  it("defaults open", () => {
    renderLog();
    expect(details()).toHaveAttribute("open");
    expect(screen.getByText("content")).toBeVisible();
  });

  it("respects defaultOpen=false", () => {
    renderLog(false);
    expect(details()).not.toHaveAttribute("open");
  });

  it("toggle persists to localStorage key ui:collapsed:log", async () => {
    const { unmount } = renderLog();
    await userEvent.click(screen.getByText("Event log"));
    expect(details()).not.toHaveAttribute("open");
    expect(localStorage.getItem("ui:collapsed:log")).toBe("1");
    unmount();
    renderLog();
    expect(details()).not.toHaveAttribute("open");
    await userEvent.click(screen.getByText("Event log"));
    expect(details()).toHaveAttribute("open");
    expect(localStorage.getItem("ui:collapsed:log")).toBe("0");
  });

  it("works when localStorage throws", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });
    renderLog();
    expect(details()).toHaveAttribute("open");
    await userEvent.click(screen.getByText("Event log"));
    expect(details()).not.toHaveAttribute("open");
  });
});
