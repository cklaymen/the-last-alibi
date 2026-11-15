import { describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { navigate, parseRoute, roomPath, useRoute } from "./index.js";

function Probe() {
  const route = useRoute();
  return <p>{route.name === "room" ? `room ${route.code}` : "home"}</p>;
}

describe("router", () => {
  it("parses / and /room/<code>", () => {
    expect(parseRoute("/")).toEqual({ name: "home" });
    expect(parseRoute("/room/1234")).toEqual({ name: "room", code: "1234" });
    expect(parseRoute("/room/123456/")).toEqual({ name: "room", code: "123456" });
    expect(parseRoute("/room/abc")).toEqual({ name: "home" });
    expect(parseRoute("/elsewhere")).toEqual({ name: "home" });
    expect(roomPath("1234")).toBe("/room/1234");
  });

  it("navigate pushes or replaces history and re-renders useRoute", () => {
    render(<Probe />);
    expect(screen.getByText("home")).toBeInTheDocument();
    const before = window.history.length;
    act(() => navigate("/room/1234"));
    expect(screen.getByText("room 1234")).toBeInTheDocument();
    expect(window.history.length).toBe(before + 1);
    act(() => navigate("/room/5678", { replace: true }));
    expect(window.location.pathname).toBe("/room/5678");
    expect(window.history.length).toBe(before + 1);
  });

  it("follows back/forward (popstate)", () => {
    render(<Probe />);
    act(() => {
      window.history.pushState(null, "", "/room/4321");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(screen.getByText("room 4321")).toBeInTheDocument();
  });
});
