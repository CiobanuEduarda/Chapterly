export declare function logAction({ userId, action, entity, entityId }: {
    userId: number;
    action: string;
    entity: string;
    entityId?: number;
}): Promise<void>;
