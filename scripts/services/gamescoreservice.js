const BEST_STORAGE_KEY = "softwareanvil-typing-best";
/** Remembers the visitor's best score in the typing game. */
export class GameScoreService {
    /** Read the best score, or 0 when storage is blocked or empty. */
    static readBest() {
        try {
            return Number(localStorage.getItem(BEST_STORAGE_KEY)) || 0;
        }
        catch {
            // Storage blocked (private mode): the best score lasts only for this visit
            return 0;
        }
    }
    /** Save the best score, ignoring storage that is blocked. */
    static storeBest(score) {
        try {
            localStorage.setItem(BEST_STORAGE_KEY, String(score));
        }
        catch {
            // Storage blocked (private mode): the best score lasts only for this visit
        }
    }
}
