const products = [
  {
    productId: 'free',
    name: 'payment_product_free',
    isPremium: false,
    limits: {
      transactions: 100
    }
  },
  {
    productId: 'premium',
    name: 'payment_product_premium',
    isPremium: true,
    limits: {
      transactions: 1000
    }
  }
];

module.exports = {
  currentFreePlan: products[0],
  products
};
