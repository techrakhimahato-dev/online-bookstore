describe("Filters", () => {
  beforeEach(() => {
    cy.visit("http://127.0.0.1:5173");
  });

  it("opens category filter", () => {
    cy.contains("All categories").click();
  });

  it("opens status filter", () => {
    cy.contains("All statuses").click();
  });
});