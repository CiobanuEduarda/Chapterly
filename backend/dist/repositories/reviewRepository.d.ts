import { Review } from '@prisma/client';
export interface CreateReviewData {
    content: string;
    rating: number;
    bookId: number;
}
export interface UpdateReviewData {
    content?: string;
    rating?: number;
}
export interface ReviewFilters {
    bookId?: number;
    rating?: number;
    minRating?: number;
    maxRating?: number;
}
export interface ReviewSort {
    field: 'rating' | 'createdAt';
    order: 'asc' | 'desc';
}
export declare function getReviews(page?: number, limit?: number, filters?: ReviewFilters, sort?: ReviewSort): Promise<{
    reviews: Review[];
    total: number;
}>;
export declare function getReviewById(id: number): Promise<Review | null>;
export declare function createReview(data: CreateReviewData): Promise<Review>;
export declare function updateReview(id: number, data: UpdateReviewData): Promise<Review | null>;
export declare function deleteReview(id: number): Promise<boolean>;
export declare function getBookReviews(bookId: number, page?: number, limit?: number, sort?: ReviewSort): Promise<{
    reviews: Review[];
    total: number;
}>;
