const products = [
  {
    productId: 'free',
    name: 'payment_product_free',
    isPremium: false,
    limits: {
      transactions: 30
    }
  },
  {
    productId: 'premium',
    name: 'payment_product_premium',
    isPremium: true,
    limits: {
      transactions: 100000
    }
  },
  {
    productId: 'premium_year',
    name: 'payment_product_premium_year',
    isPremium: true,
    limits: {
      transactions: 100000
    }
  }
];

module.exports = {
  currentFreePlan: products[0],
  products
};
