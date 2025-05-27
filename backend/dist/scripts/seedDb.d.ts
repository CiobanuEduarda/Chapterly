declare const pool: any;
declare const Book: any;
declare const sampleBooks: Omit<Book, 'id'>[];
declare function seedDatabase(): Promise<void>;
