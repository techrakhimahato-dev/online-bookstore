describe("Inventory", () => {
  beforeEach(() => {
    cy.visit("http://127.0.0.1:5173");
  });

  it("loads inventory statistics", () => {
    cy.contains("Inventory").should("exist");
  });

  it("loads books from backend", () => {
    cy.intercept("GET", "**/api/books*").as("books");

    cy.reload();

    cy.wait("@books")
      .its("response.statusCode")
      .should("eq", 200);
  });
});