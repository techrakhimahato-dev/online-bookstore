describe("Admin Page", () => {
  beforeEach(() => {
    cy.visit("http://127.0.0.1:5173");
  });

  it("navigates to admin page", () => {
    cy.contains("Admin").click();
  });

  it("admin page loads", () => {
    cy.contains("Admin").click();
    cy.get("body").should("exist");
  });
});