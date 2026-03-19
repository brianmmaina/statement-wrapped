import { describe, it, expect } from "vitest";
import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LandingView } from "./views/LandingView";

function renderWithRouter(ui: ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("LandingView", () => {
  it("renders StatementWrapped heading", () => {
    renderWithRouter(<LandingView />);
    expect(screen.getByRole("heading", { name: /StatementWrapped/i })).toBeInTheDocument();
  });

  it("renders How It Works section", () => {
    renderWithRouter(<LandingView />);
    expect(screen.getByRole("heading", { name: /How It Works/i })).toBeInTheDocument();
  });

  it("renders Upload Your Statement link", () => {
    renderWithRouter(<LandingView />);
    expect(screen.getByRole("link", { name: /Upload Your Statement/i })).toBeInTheDocument();
  });
});
