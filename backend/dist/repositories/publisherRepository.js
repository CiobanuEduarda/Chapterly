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
exports.getPublishers = getPublishers;
exports.getPublisherById = getPublisherById;
exports.createPublisher = createPublisher;
exports.updatePublisher = updatePublisher;
exports.deletePublisher = deletePublisher;
const database_1 = __importDefault(require("../config/database"));
// Get all publishers
function getPublishers() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield database_1.default.query('SELECT * FROM publishers ORDER BY name');
            return result.rows;
        }
        catch (error) {
            console.error('Error getting publishers:', error);
            throw error;
        }
    });
}
// Get a publisher by ID
function getPublisherById(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield database_1.default.query('SELECT * FROM publishers WHERE id = $1', [id]);
            return result.rows[0] || null;
        }
        catch (error) {
            console.error(`Error getting publisher with ID ${id}:`, error);
            throw error;
        }
    });
}
// Create a new publisher
function createPublisher(publisher) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { name, address, contact_info } = publisher;
            const result = yield database_1.default.query('INSERT INTO publishers (name, address, contact_info) VALUES ($1, $2, $3) RETURNING *', [name, address, contact_info]);
            return result.rows[0];
        }
        catch (error) {
            console.error('Error creating publisher:', error);
            throw error;
        }
    });
}
// Update a publisher
function updatePublisher(id, publisher) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { name, address, contact_info } = publisher;
            const result = yield database_1.default.query('UPDATE publishers SET name = COALESCE($1, name), address = COALESCE($2, address), contact_info = COALESCE($3, contact_info) WHERE id = $4 RETURNING *', [name, address, contact_info, id]);
            return result.rows[0] || null;
        }
        catch (error) {
            console.error(`Error updating publisher with ID ${id}:`, error);
            throw error;
        }
    });
}
// Delete a publisher
function deletePublisher(id) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const result = yield database_1.default.query('DELETE FROM publishers WHERE id = $1 RETURNING id', [id]);
            return ((_a = result.rowCount) !== null && _a !== void 0 ? _a : 0) > 0;
        }
        catch (error) {
            console.error(`Error deleting publisher with ID ${id}:`, error);
            throw error;
        }
    });
}
