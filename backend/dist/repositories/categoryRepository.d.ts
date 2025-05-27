import { Category } from '@prisma/client';
export interface CreateCategoryData {
    name: string;
    description?: string;
}
export interface UpdateCategoryData {
    name?: string;
    description?: string;
}
export interface CategoryFilters {
    name?: string;
    hasBooks?: boolean;
}
export interface CategorySort {
    field: 'name' | 'createdAt';
    order: 'asc' | 'desc';
}
export declare function getCategories(page?: number, limit?: number, filters?: CategoryFilters, sort?: CategorySort): Promise<{
    categories: Category[];
    total: number;
}>;
export declare function getCategoryById(id: number): Promise<Category | null>;
export declare function createCategory(data: CreateCategoryData): Promise<Category>;
export declare function updateCategory(id: number, data: UpdateCategoryData): Promise<Category | null>;
export declare function deleteCategory(id: number): Promise<boolean>;
export declare function addBookToCategory(bookId: number, categoryId: number): Promise<void>;
export declare function removeBookFromCategory(bookId: number, categoryId: number): Promise<void>;
export declare function getBookCategories(bookId: number): Promise<Category[]>;
