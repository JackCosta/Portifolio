/** Seletores de um item listado no carrinho e na revisão do pedido. */
const CartItemElements = {
  item: '[data-test="inventory-item"]',
  name: '[data-test="inventory-item-name"]',
  description: '[data-test="inventory-item-desc"]',
  price: '[data-test="inventory-item-price"]',
  quantity: '[data-test="item-quantity"]',
  removeButton: 'button[data-test^="remove"]',
};

export default CartItemElements;
