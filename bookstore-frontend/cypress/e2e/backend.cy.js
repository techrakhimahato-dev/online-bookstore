describe("Backend API Tests", () => {

  it("GET /api/books returns 200", () => {
    cy.request("http://localhost:3000/api/books")
      .its("status")
      .should("eq", 200);
  });

  it("returns JSON", () => {
    cy.request("http://localhost:3000/api/books")
      .its("headers")
      .its("content-type")
      .should("include", "application/json");
  });

  it("returns books data", () => {
    cy.request("http://localhost:3000/api/books")
      .its("body")
      .should("exist");
  });

});