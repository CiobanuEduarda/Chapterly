import { Book } from './bookContext';

const API_URL = 'http://localhost:3001/api';

export const api = {
  async getBooks(sort?: string, filter?: string) {
    const params = new URLSearchParams();
    if (sort) params.append('sort', sort);
    if (filter) params.append('filter', filter);
    
    const response = await fetch(`${API_URL}/books?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch books');
    return response.json();
  },

  async addBook(book: Omit<Book, 'id'>) {
    const response = await fetch(`${API_URL}/books`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(book),
    });
    if (!response.ok) throw new Error('Failed to add book');
    return response.json();
  },

  async updateBook(id: number, book: Omit<Book, 'id'>) {
    const response = await fetch(`${API_URL}/books/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(book),
    });
    if (!response.ok) throw new Error('Failed to update book');
    return response.json();
  },

  async deleteBook(id: number) {
    const response = await fetch(`${API_URL}/books/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete book');
  },
}; 