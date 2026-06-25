describe("API Tests", () => {
  it("loads books API", () => {
    cy.intercept("GET", "**/api/books*").as("books");

    cy.visit("http://127.0.0.1:5173");

    cy.wait("@books")
      .its("response.statusCode")
      .should("be.oneOf", [200,304]);
  });

  it("returns data", () => {
    cy.request("http://localhost:3000/api/books?limit=1000")
      .its("status")
      .should("eq", 200);
  });
});