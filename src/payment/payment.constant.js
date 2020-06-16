module.exports = {
  products: [
    {
      id: 'free',
      name: 'payment_product_free',
      limits: {
        transactions: 100
      }
    },
    {
      id: 'premium',
      name: 'payment_product_premium',
      limits: {
        transactions: 1000
      }
    }
  ]
};
