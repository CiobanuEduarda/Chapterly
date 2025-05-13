import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// Configuration
const NUM_CATEGORIES = 50;
const NUM_BOOKS = 100000;
const NUM_REVIEWS = 200000; // Average 2 reviews per book

// Helper function to generate a random number between min and max
const randomNumber = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Generate categories
async function generateCategories() {
  console.log('Generating categories...');
  const categories = [];
  
  for (let i = 0; i < NUM_CATEGORIES; i++) {
    categories.push({
      name: faker.helpers.uniqueArray(faker.commerce.department, 1)[0],
      description: faker.commerce.productDescription(),
    });
  }

  console.log('Inserting categories...');
  await prisma.category.createMany({
    data: categories,
    skipDuplicates: true,
  });
  
  return await prisma.category.findMany();
}

// Generate books
async function generateBooks(categories: any[]) {
  console.log('Generating books...');
  const books = [];
  const batchSize = 1000; // Process in batches to avoid memory issues
  
  for (let i = 0; i < NUM_BOOKS; i++) {
    if (i % batchSize === 0) {
      console.log(`Processing book batch ${i / batchSize + 1}...`);
    }

    books.push({
      title: faker.commerce.productName(),
      author: faker.person.fullName(),
      genre: faker.helpers.arrayElement(categories).name,
      price: parseFloat(faker.commerce.price({ min: 5, max: 100 })),
      rating: randomNumber(1, 5),
    });

    // Insert in batches
    if (books.length === batchSize || i === NUM_BOOKS - 1) {
      await prisma.book.createMany({
        data: books,
        skipDuplicates: true,
      });
      books.length = 0; // Clear the array
    }
  }
}

// Generate reviews
async function generateReviews() {
  console.log('Generating reviews...');
  const reviews = [];
  const batchSize = 1000;
  const books = await prisma.book.findMany({ select: { id: true } });
  
  for (let i = 0; i < NUM_REVIEWS; i++) {
    if (i % batchSize === 0) {
      console.log(`Processing review batch ${i / batchSize + 1}...`);
    }

    reviews.push({
      content: faker.lorem.paragraph(),
      rating: randomNumber(1, 5),
      bookId: faker.helpers.arrayElement(books).id,
    });

    // Insert in batches
    if (reviews.length === batchSize || i === NUM_REVIEWS - 1) {
      await prisma.review.createMany({
        data: reviews,
        skipDuplicates: true,
      });
      reviews.length = 0; // Clear the array
    }
  }
}

// Assign categories to books
async function assignCategoriesToBooks(categories: any[]) {
  console.log('Assigning categories to books...');
  const books = await prisma.book.findMany({ select: { id: true } });
  const bookCategories = [];
  const batchSize = 1000;
  
  for (const book of books) {
    // Each book gets 1-3 random categories
    const numCategories = randomNumber(1, 3);
    const selectedCategories = faker.helpers.arrayElements(categories, numCategories);
    
    for (const category of selectedCategories) {
      bookCategories.push({
        bookId: book.id,
        categoryId: category.id,
      });
    }

    // Insert in batches
    if (bookCategories.length >= batchSize) {
      await prisma.bookCategory.createMany({
        data: bookCategories,
        skipDuplicates: true,
      });
      bookCategories.length = 0; // Clear the array
    }
  }

  // Insert any remaining book categories
  if (bookCategories.length > 0) {
    await prisma.bookCategory.createMany({
      data: bookCategories,
      skipDuplicates: true,
    });
  }
}

async function main() {
  try {
    console.log('Starting data generation...');
    
    // Clear existing data
    console.log('Clearing existing data...');
    await prisma.$transaction([
      prisma.review.deleteMany(),
      prisma.bookCategory.deleteMany(),
      prisma.book.deleteMany(),
      prisma.category.deleteMany(),
    ]);

    // Generate and insert data
    const categories = await generateCategories();
    await generateBooks(categories);
    await generateReviews();
    await assignCategoriesToBooks(categories);

    console.log('Data generation completed successfully!');
  } catch (error) {
    console.error('Error generating data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 