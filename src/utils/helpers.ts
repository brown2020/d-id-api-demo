// Collection name constants
export const USERS_COLLECTION = "users";
export const DRAFTS_COLLECTION = "drafts";
export const VIDEOS_COLLECTION = "videos";

/**
 * Get the path to a user's drafts collection
 */
export function getDraftsCollection(userId: string): string {
  return `${USERS_COLLECTION}/${userId}/${DRAFTS_COLLECTION}`;
}

/**
 * Get the path to a user's videos collection
 */
export function getVideosCollection(userId: string): string {
  return `${USERS_COLLECTION}/${userId}/${VIDEOS_COLLECTION}`;
}
