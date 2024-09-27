// Simple API to check for availability of stocks

const express = require('express');
const redis = require('redis');
const { promisify } = require("util");

const api = express();

const listProducts = [
  { id: 1, name: "Suitcase 250", price: 50, stock: 4 },
  { id: 2, name: "Suitcase 450", price: 100, stock: 10 },
  { id: 3, name: "Suitcase 650", price: 350, stock: 2 },
  { id: 4, name: "Suitcase 1050", price: 550, stock: 4 },
];

const client = redis.createClient()
  .on('error', err => console.error(`Redis client error: ${err}`))
  .on('connect', () => console.log('Redis client connected successfully to server'));

const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);

function getItemById(id) {
  if (id > listProducts.length) {
    return null;
  }

  return listProducts.find((item) => item.id === id);
}

async function reserveStockById(itemId, stock) {
  try {
    await setAsync(`item.${itemId}`, stock);
    console.log(`Reserved stock for item.${itemId}: ${stock}`);
  } catch (err) {
    console.error(`Error reserving stock for item.${itemId}: ${err}`);
  }
}

async function getCurrentReservedStockById(itemId) {
  try {
    const stock = await getAsync(`item.${itemId}`);
    return stock !== null ? parseInt(stock, 10) : null;
  } catch (error) {
    console.error(`Error fetching reserved stock for item.${itemId}: ${error}`);
    return null;
  }
}

api.listen(1245, () => {
  console.log('The server is running on port 1245');
});

/**
 * GET /list_products
 *
 * List all available products.
 */
api.get('/list_products', (req, res) => {
  const response = listProducts.map((product) => ({
    itemId: product.id,
    itemName: product.name,
    price: product.price,
    initialAvailableQuantity: product.stock,
  }));
  res.json(response);
});

/**
 * GET /list_products/:itemId
 *
 * Retrieve a reserved stock.
 */
api.get('/list_products/:itemId', async (req, res) => {
  const itemId = parseInt(req.params.itemId, 10);
  let item = getItemById(itemId);

  if (!item) {
    return res.status(404).json({ status: 'Product not found' });
  }

  const numberInStock = await getCurrentReservedStockById(item.id);
  res.json({
    itemId: item.id,
    itemName: item.name,
    price: item.price,
    initialAvailableQuantity: item.stock,
    currentQuantity: numberInStock !== null ? numberInStock : item.stock,
  });
});

/**
 * GET /reserve_product/:itemId
 *
 * Reserve a product and reduce the number of available stocks.
 */
api.get('/reserve_product/:itemId', async (req, res) => {
  const itemId = parseInt(req.params.itemId, 10);
  const item = getItemById(itemId);

  if (!item) {
    return res.json({ status: 'Product not found' });
  }

  let numberInStock = await getCurrentReservedStockById(itemId);
  console.log(`Reserved product: ${JSON.stringify(item.name)}`);

  numberInStock = numberInStock !== null ? numberInStock : item.stock;
  if (numberInStock <= 0) {
    return res.json({ status: 'Not enough stock available', itemId: itemId });
  }

  await reserveStockById(itemId, numberInStock - 1);
  res.json({ status: 'Reservation confirmed', itemId: itemId });
});
