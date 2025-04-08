export interface Book {
  id: number;
  title: string;
  author: string;
  genre: string;
  price: number;
  rating: number;
}

declare global {
  var books: Book[];
} 