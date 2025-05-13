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
exports.getAuthors = getAuthors;
exports.getAuthorById = getAuthorById;
exports.createAuthor = createAuthor;
exports.updateAuthor = updateAuthor;
exports.deleteAuthor = deleteAuthor;
const database_1 = __importDefault(require("../config/database"));
// Get all authors
function getAuthors() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield database_1.default.query('SELECT * FROM authors ORDER BY name');
            return result.rows;
        }
        catch (error) {
            console.error('Error getting authors:', error);
            throw error;
        }
    });
}
// Get an author by ID
function getAuthorById(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield database_1.default.query('SELECT * FROM authors WHERE id = $1', [id]);
            return result.rows[0] || null;
        }
        catch (error) {
            console.error(`Error getting author with ID ${id}:`, error);
            throw error;
        }
    });
}
// Create a new author
function createAuthor(author) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { name, bio } = author;
            const result = yield database_1.default.query('INSERT INTO authors (name, bio) VALUES ($1, $2) RETURNING *', [name, bio]);
            return result.rows[0];
        }
        catch (error) {
            console.error('Error creating author:', error);
            throw error;
        }
    });
}
// Update an author
function updateAuthor(id, author) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { name, bio } = author;
            const result = yield database_1.default.query('UPDATE authors SET name = COALESCE($1, name), bio = COALESCE($2, bio) WHERE id = $3 RETURNING *', [name, bio, id]);
            return result.rows[0] || null;
        }
        catch (error) {
            console.error(`Error updating author with ID ${id}:`, error);
            throw error;
        }
    });
}
// Delete an author
function deleteAuthor(id) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const result = yield database_1.default.query('DELETE FROM authors WHERE id = $1 RETURNING id', [id]);
            return ((_a = result.rowCount) !== null && _a !== void 0 ? _a : 0) > 0;
        }
        catch (error) {
            console.error(`Error deleting author with ID ${id}:`, error);
            throw error;
        }
    });
}
