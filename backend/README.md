# Bookstore Backend

This is the backend server for the Bookstore application, using PostgreSQL as the database.

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- pnpm (v6 or higher)

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Create a PostgreSQL database:
   ```bash
   createdb bookstore
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the database connection details in `.env` if needed

4. Initialize the database:
   ```bash
   pnpm run init-db
   ```

5. (Optional) Seed the database with sample data:
   ```bash
   pnpm run seed-db
   ```

## Development

Start the development server:
```bash
pnpm run dev
```

The server will be available at http://localhost:3001.

## API Endpoints

### Books

- `GET /api/books` - Get all books with pagination, filtering, and sorting
- `GET /api/books/:id` - Get a book by ID
- `POST /api/books` - Create a new book
- `PUT /api/books/:id` - Update a book
- `DELETE /api/books/:id` - Delete a book

### Files

- `POST /api/upload` - Upload a file
- `GET /api/download/:filename` - Download a file
- `DELETE /api/files/:filename` - Delete a file
- `GET /api/files` - List all files

## WebSocket Events

The server uses Socket.IO for real-time updates. The following events are emitted:

- `books` - Emitted when books are added, updated, or deleted
  - `type`: 'add', 'update', or 'delete'
  - `book`: The book data (for 'add' and 'update')
  - `id`: The book ID (for 'delete')

## Testing

Run tests:
```bash
pnpm test
```

Run tests in watch mode:
```bash
pnpm test:watch
```

Generate test coverage:
```bash
pnpm test:coverage
``` 
 