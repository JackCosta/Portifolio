import { Given, Then, When } from "@badeball/cypress-cucumber-preprocessor";
import bookingPage from "../../support/pages/BookingPage";
import { getAuthHeaders } from "../../support/utils/authHeaders";
import { buildBooking, shiftDate, withoutField } from "../../support/utils/bookingFactory";
import { createdBookings } from "../../support/utils/createdBookings";

const ACCEPT_HEADERS = { JSON: "application/json", XML: "application/xml" };

const trackCreated = (response) => {
  if (response.status === 200 && response.body?.bookingid) {
    createdBookings.push(response.body.bookingid);
  }
};

const createBooking = (payload, headers) => {
  cy.wrap(payload, { log: false }).as("booking");
  return bookingPage.create(payload, headers).then((response) => {
    trackCreated(response);
    return response;
  });
};

const withBooking = (fn) =>
  cy
    .get("@bookingId", { log: false })
    .then((id) => cy.get("@booking", { log: false }).then((b) => fn(id, b)));

// ---------- Pré-condições ----------

Given("que existe uma reserva cadastrada", () => {
  createBooking(buildBooking()).then((response) => {
    expect(response.status, "pré-condição: criar reserva").to.eq(200);
    cy.wrap(response.body.bookingid, { log: false }).as("bookingId");
  });
});

// ---------- GET ----------

When("eu consulto a lista de reservas", () => {
  bookingPage.list().as("response");
});

When("eu consulto as reservas filtrando pelo nome da reserva cadastrada", () => {
  withBooking((_, booking) =>
    bookingPage.list({ firstname: booking.firstname, lastname: booking.lastname }).as("response"),
  );
});

When("eu consulto as reservas com o filtro {string} igual a {string}", (param, value) => {
  bookingPage.list({ [param]: value }).as("response");
});

When("eu consulto as reservas pelo {string} igual ao da reserva cadastrada", (param) => {
  withBooking((_, booking) => bookingPage.list({ [param]: booking.bookingdates[param] }).as("response"));
});

When("eu consulto as reservas pelo {string} {int} dia(s) antes do da reserva cadastrada", (param, days) => {
  withBooking((_, booking) =>
    bookingPage.list({ [param]: shiftDate(booking.bookingdates[param], -days) }).as("response"),
  );
});

When("eu consulto a reserva cadastrada", () => {
  withBooking((id) => bookingPage.getById(id).as("response"));
});

When("eu consulto a reserva cadastrada no formato {string}", (format) => {
  withBooking((id) => bookingPage.getById(id, { Accept: ACCEPT_HEADERS[format] }).as("response"));
});

When("eu consulto a reserva de id {string}", (id) => {
  bookingPage.getById(id).as("response");
});

Then("a lista não deve estar vazia", () => {
  cy.get("@response").then(({ body }) => expect(body).to.be.an("array").that.is.not.empty);
});

Then("a lista deve estar vazia", () => {
  cy.get("@response").then(({ body }) => expect(body).to.be.an("array").that.is.empty);
});

Then("a lista deve conter a reserva cadastrada", () => {
  cy.get("@bookingId").then((id) =>
    cy.get("@response").then(({ body }) => expect(body.map((b) => b.bookingid)).to.include(id)),
  );
});

Then("os dados retornados devem ser iguais aos da reserva cadastrada", () => {
  cy.get("@booking").then((booking) =>
    cy.get("@response").then(({ body }) => expect(body).to.deep.eq(booking)),
  );
});

Then("o corpo deve ser um XML com os dados da reserva cadastrada", () => {
  cy.get("@booking").then((booking) =>
    cy.get("@response").then(({ body }) => {
      expect(body).to.match(/^<\?xml/);
      expect(body).to.include(`<firstname>${booking.firstname}</firstname>`);
      expect(body).to.include(`<lastname>${booking.lastname}</lastname>`);
    }),
  );
});

// ---------- POST ----------

When("eu cadastro uma reserva com dados válidos", () => {
  createBooking(buildBooking()).as("response");
});

When("eu cadastro uma reserva sem o campo {string}", (field) => {
  createBooking(withoutField(buildBooking(), field)).as("response");
});

When("eu cadastro uma reserva com o campo {string} igual a {string}", (field, jsonValue) => {
  createBooking(buildBooking({ [field]: JSON.parse(jsonValue) })).as("response");
});

When("eu cadastro uma reserva com o corpo vazio", () => {
  createBooking({}).as("response");
});

When("eu cadastro uma reserva com o corpo {string}", (rawBody) => {
  createBooking(rawBody).as("response");
});

When("eu cadastro uma reserva com o header Accept {string}", (accept) => {
  createBooking(buildBooking(), { Accept: accept }).as("response");
});

Then("a resposta deve conter o id da reserva criada", () => {
  cy.get("@response").then(({ body }) => {
    expect(body.bookingid).to.be.a("number").and.to.be.greaterThan(0);
    cy.wrap(body.bookingid, { log: false }).as("bookingId");
  });
});

Then("os dados da reserva criada devem ser iguais aos enviados", () => {
  cy.get("@booking").then((booking) =>
    cy.get("@response").then(({ body }) => expect(body.booking).to.deep.eq(booking)),
  );
});

Then("a reserva deve estar disponível para consulta", () => {
  withBooking((id, booking) =>
    bookingPage.getById(id).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.deep.eq(booking);
    }),
  );
});

// ---------- PUT ----------

const updateBooking = (payload, mode, id) =>
  getAuthHeaders(mode).then((headers) => {
    cy.wrap(payload, { log: false }).as("updatedBooking");
    const target = id ? cy.wrap(id, { log: false }) : cy.get("@bookingId", { log: false });
    return target.then((bookingId) => bookingPage.update(bookingId, payload, headers));
  });

When("eu atualizo a reserva cadastrada usando autenticação {string}", (mode) => {
  updateBooking(buildBooking({ totalprice: 1234, depositpaid: false }), mode).as("response");
});

When("eu atualizo a reserva cadastrada sem o campo {string}", (field) => {
  updateBooking(withoutField(buildBooking(), field), "token").as("response");
});

When("eu atualizo a reserva cadastrada com o corpo {string}", (rawBody) => {
  updateBooking(rawBody, "token").as("response");
});

When("eu atualizo a reserva de id {string} usando autenticação {string}", (id, mode) => {
  updateBooking(buildBooking(), mode, id).as("response");
});

Then("os dados retornados devem ser iguais aos da atualização", () => {
  cy.get("@updatedBooking").then((updated) =>
    cy.get("@response").then(({ body }) => expect(body).to.deep.eq(updated)),
  );
});

Then("a reserva deve refletir os dados da atualização", () => {
  cy.get("@updatedBooking").then((updated) =>
    withBooking((id) =>
      bookingPage.getById(id).then((response) => expect(response.body).to.deep.eq(updated)),
    ),
  );
});

Then("a reserva não deve ter sido alterada", () => {
  withBooking((id, booking) =>
    bookingPage.getById(id).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.deep.eq(booking);
    }),
  );
});

// ---------- DELETE ----------

When("eu excluo a reserva cadastrada usando autenticação {string}", (mode) => {
  getAuthHeaders(mode).then((headers) => withBooking((id) => bookingPage.delete(id, headers).as("response")));
});

When("eu excluo a reserva de id {string} usando autenticação {string}", (id, mode) => {
  getAuthHeaders(mode).then((headers) => bookingPage.delete(id, headers).as("response"));
});

Then("a reserva não deve mais existir", () => {
  withBooking((id) => bookingPage.getById(id).its("status").should("eq", 404));
});

Then("a reserva ainda deve existir", () => {
  withBooking((id) => bookingPage.getById(id).its("status").should("eq", 200));
});
