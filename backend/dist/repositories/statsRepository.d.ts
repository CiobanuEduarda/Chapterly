export interface BookStats {
    totalBooks: number;
    averagePrice: number;
    averageRating: number;
    totalReviews: number;
    categoryDistribution: {
        categoryName: string;
        bookCount: number;
        averageRating: number;
    }[];
    priceRangeDistribution: {
        range: string;
        count: number;
    }[];
    topRatedBooks: {
        id: number;
        title: string;
        author: string;
        rating: number;
        reviewCount: number;
    }[];
}
export declare const getBookStatistics: () => Promise<BookStats>;
export declare const getBooksWithStats: (page?: number, pageSize?: number) => Promise<any>;
