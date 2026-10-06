import el from "../../elements/CartItemElements";
import { parsePrice, sumPrices } from "../../utils/money";

/** Lista de itens exibida no carrinho e na revisão do pedido. */
class CartItemList {
  /**
   * Valida exatamente os produtos listados, na ordem, com quantidade e preço.
   * @param {{ name: string, quantity: number, price: string }[]} products
   */
  shouldContainExactly(products) {
    cy.get(el.item).should("have.length", products.length);
    products.forEach(({ name, quantity, price }, index) => {
      cy.get(el.item)
        .eq(index)
        .within(() => {
          cy.get(el.name).should("have.text", name);
          cy.get(el.quantity).should("have.text", String(quantity));
          cy.get(el.price).should("have.text", price);
          cy.get(el.description).should("not.be.empty");
        });
    });
  }

  shouldBeEmpty() {
    cy.get(el.item).should("not.exist");
  }

  removeProduct(name) {
    cy.contains(el.item, name).find(el.removeButton).click();
  }

  /** Soma preço x quantidade dos itens exibidos e entrega o valor via alias. */
  sumDisplayedPrices(alias) {
    cy.get(el.item)
      .then(($items) =>
        sumPrices(
          [...$items].map((item) => {
            const price = parsePrice(Cypress.$(item).find(el.price).text());
            const quantity = Number(Cypress.$(item).find(el.quantity).text());
            return price * quantity;
          }),
        ),
      )
      .as(alias);
  }
}

export default new CartItemList();
