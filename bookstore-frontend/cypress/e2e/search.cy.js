describe("Book Search", () => {
  beforeEach(() => {
    cy.visit("http://127.0.0.1:5173");
  });

  it("allows typing in search box", () => {
    cy.get('input[placeholder*="Search"]')
      .type("history")
      .should("have.value", "history");
  });

  it("clears search", () => {
    cy.get('input[placeholder*="Search"]')
      .type("book")
      .clear()
      .should("have.value", "");
  });
});