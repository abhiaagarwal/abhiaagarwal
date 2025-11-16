export const PAGE_SIZE = 20;

export const getTotalPages = (totalCount: number): number =>
    Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
