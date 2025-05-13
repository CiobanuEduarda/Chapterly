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
exports.getGenres = getGenres;
exports.getGenreById = getGenreById;
exports.createGenre = createGenre;
exports.updateGenre = updateGenre;
exports.deleteGenre = deleteGenre;
const database_1 = __importDefault(require("../config/database"));
// Get all genres
function getGenres() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield database_1.default.query('SELECT * FROM genres ORDER BY name');
            return result.rows;
        }
        catch (error) {
            console.error('Error getting genres:', error);
            throw error;
        }
    });
}
// Get a genre by ID
function getGenreById(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield database_1.default.query('SELECT * FROM genres WHERE id = $1', [id]);
            return result.rows[0] || null;
        }
        catch (error) {
            console.error(`Error getting genre with ID ${id}:`, error);
            throw error;
        }
    });
}
// Create a new genre
function createGenre(genre) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { name, description } = genre;
            const result = yield database_1.default.query('INSERT INTO genres (name, description) VALUES ($1, $2) RETURNING *', [name, description]);
            return result.rows[0];
        }
        catch (error) {
            console.error('Error creating genre:', error);
            throw error;
        }
    });
}
// Update a genre
function updateGenre(id, genre) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { name, description } = genre;
            const result = yield database_1.default.query('UPDATE genres SET name = COALESCE($1, name), description = COALESCE($2, description) WHERE id = $3 RETURNING *', [name, description, id]);
            return result.rows[0] || null;
        }
        catch (error) {
            console.error(`Error updating genre with ID ${id}:`, error);
            throw error;
        }
    });
}
// Delete a genre
function deleteGenre(id) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const result = yield database_1.default.query('DELETE FROM genres WHERE id = $1 RETURNING id', [id]);
            return ((_a = result.rowCount) !== null && _a !== void 0 ? _a : 0) > 0;
        }
        catch (error) {
            console.error(`Error deleting genre with ID ${id}:`, error);
            throw error;
        }
    });
}
