"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrders = getOrders;
exports.getOrderById = getOrderById;
exports.createOrder = createOrder;
exports.updateOrder = updateOrder;
exports.deleteOrder = deleteOrder;
const database_1 = __importDefault(require("../config/database"));
// Get all orders
function getOrders() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield database_1.default.query(`
      SELECT o.*, 
             json_agg(
               json_build_object(
                 'id', oi.id,
                 'book_id', oi.book_id,
                 'quantity', oi.quantity,
                 'price', oi.price
               )
             ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);
            return result.rows;
        }
        catch (error) {
            console.error('Error getting orders:', error);
            throw error;
        }
    });
}
// Get an order by ID
function getOrderById(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield database_1.default.query(`
      SELECT o.*, 
             json_agg(
               json_build_object(
                 'id', oi.id,
                 'book_id', oi.book_id,
                 'quantity', oi.quantity,
                 'price', oi.price
               )
             ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = $1
      GROUP BY o.id
    `, [id]);
            return result.rows[0] || null;
        }
        catch (error) {
            console.error(`Error getting order with ID ${id}:`, error);
            throw error;
        }
    });
}
// Create a new order
function createOrder(order, items) {
    return __awaiter(this, void 0, void 0, function* () {
        const client = yield database_1.default.connect();
        try {
            yield client.query('BEGIN');
            // Create the order
            const orderResult = yield client.query('INSERT INTO orders (user_id, status, total_amount) VALUES ($1, $2, $3) RETURNING *', [order.user_id, order.status, order.total_amount]);
            const newOrder = orderResult.rows[0];
            // Create order items
            for (const item of items) {
                yield client.query('INSERT INTO order_items (order_id, book_id, quantity, price) VALUES ($1, $2, $3, $4)', [newOrder.id, item.book_id, item.quantity, item.price]);
            }
            // Get the complete order with items
            const completeOrderResult = yield client.query(`
      SELECT o.*, 
             json_agg(
               json_build_object(
                 'id', oi.id,
                 'book_id', oi.book_id,
                 'quantity', oi.quantity,
                 'price', oi.price
               )
             ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = $1
      GROUP BY o.id
    `, [newOrder.id]);
            yield client.query('COMMIT');
            return completeOrderResult.rows[0];
        }
        catch (error) {
            yield client.query('ROLLBACK');
            console.error('Error creating order:', error);
            throw error;
        }
        finally {
            client.release();
        }
    });
}
// Update an order
function updateOrder(id, order) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { status, total_amount } = order;
            const result = yield database_1.default.query(`
      UPDATE orders 
      SET status = COALESCE($1, status), 
          total_amount = COALESCE($2, total_amount) 
      WHERE id = $3 
      RETURNING *
    `, [status, total_amount, id]);
            return result.rows[0] || null;
        }
        catch (error) {
            console.error(`Error updating order with ID ${id}:`, error);
            throw error;
        }
    });
}
// Delete an order
function deleteOrder(id) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const client = yield database_1.default.connect();
        try {
            yield client.query('BEGIN');
            // Delete order items first
            yield client.query('DELETE FROM order_items WHERE order_id = $1', [id]);
            // Delete the order
            const result = yield client.query('DELETE FROM orders WHERE id = $1 RETURNING id', [id]);
            yield client.query('COMMIT');
            return ((_a = result.rowCount) !== null && _a !== void 0 ? _a : 0) > 0;
        }
        catch (error) {
            yield client.query('ROLLBACK');
            console.error(`Error deleting order with ID ${id}:`, error);
            throw error;
        }
        finally {
            client.release();
        }
    });
}
