/**
 * db.js - IndexedDB storage for "Lesen & Schreiben"
 * Manages Profiles, Leitner Boxes, and History logs.
 */

export class AppDB {
    constructor() {
        this.dbName = 'LesenSchreibenDB';
        this.dbVersion = 1;
        this.db = null;
    }

    async init() {
        if (this.db) return this;
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (e) => {
                console.error("Database open error:", e);
                reject(e);
            };

            request.onsuccess = (e) => {
                this.db = e.target.result;
                resolve(this);
            };

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                
                // Profiles Store
                if (!db.objectStoreNames.contains('profiles')) {
                    db.createObjectStore('profiles', { keyPath: 'id', autoIncrement: true });
                }

                // Progress Store (Leitner repetition tracker)
                if (!db.objectStoreNames.contains('progress')) {
                    // keyPath: composite key or unique ID like `${profileId}_${sentenceId}`
                    db.createObjectStore('progress', { keyPath: 'id' });
                }

                // History Store for logs
                if (!db.objectStoreNames.contains('history')) {
                    db.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
                }
            };
        });
    }

    // --- PROFILES ---
    async getProfiles() {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('profiles', 'readonly');
            const store = tx.objectStore('profiles');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async saveProfile(profile) {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('profiles', 'readwrite');
            const store = tx.objectStore('profiles');
            const request = store.put(profile); // updates if has id, else creates
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteProfile(profileId) {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['profiles', 'progress'], 'readwrite');
            
            // Delete profile
            tx.objectStore('profiles').delete(profileId);
            
            // Delete associated progress records
            const progressStore = tx.objectStore('progress');
            const cursorRequest = progressStore.openCursor();
            cursorRequest.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    if (cursor.value.profileId === profileId) {
                        cursor.delete();
                    }
                    cursor.continue();
                }
            };
            
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    // --- PROGRESS / LEITNER SYSTEM ---
    async getProgress(profileId, sentenceId) {
        await this.init();
        const id = `${profileId}_${sentenceId}`;
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('progress', 'readonly');
            const store = tx.objectStore('progress');
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    async getProfileProgress(profileId) {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('progress', 'readonly');
            const store = tx.objectStore('progress');
            const progressList = [];
            const request = store.openCursor();
            request.onsuccess = (e) => {
                const cursor = e.target.result;
                if (cursor) {
                    if (cursor.value.profileId === profileId) {
                        progressList.push(cursor.value);
                    }
                    cursor.continue();
                } else {
                    resolve(progressList);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    async saveProgress(progressRecord) {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('progress', 'readwrite');
            const store = tx.objectStore('progress');
            const request = store.put(progressRecord);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Updates Leitner box state for a sentence.
     * Box 1: Repetition immediately / first tier
     * Box 5: Mastered
     */
    async recordResult(profileId, sentenceId, mode, isSuccess, stats = {}) {
        await this.init();
        const recordId = `${profileId}_${sentenceId}`;
        let record = await this.getProgress(profileId, sentenceId);

        if (!record) {
            record = {
                id: recordId,
                profileId,
                sentenceId,
                box: 1,
                nextReview: Date.now(),
                errorsWriting: 0,
                errorsReading: 0,
                successCount: 0,
                attempts: 0,
                points: undefined,
                previousPoints: null,
                lastErrorsList: [],
                repeatedErrors: []
            };
        }

        record.attempts += 1;

        if (isSuccess) {
            record.successCount += 1;
            // Promote to next Leitner Box (max Box 5)
            record.box = Math.min(5, record.box + 1);
            
            // Set review interval based on box level:
            // Box 1: 30 seconds (re-try quickly)
            // Box 2: 2 minutes
            // Box 3: 10 minutes
            // Box 4: 1 hour
            // Box 5: 1 day
            const intervals = [0, 30 * 1000, 120 * 1000, 600 * 1000, 3600 * 1000, 86400 * 1000];
            record.nextReview = Date.now() + intervals[record.box];
        } else {
            // Demote back to Box 1 immediately
            record.box = 1;
            record.nextReview = Date.now() + 30 * 1000; // review in 30s
            if (mode === 'write') {
                record.errorsWriting += 1;
            } else {
                record.errorsReading += 1;
            }
        }

        // Handle points and error list tracking
        if (stats.points !== undefined) {
            record.previousPoints = record.points !== undefined ? record.points : null;
            record.points = stats.points;
        }

        if (stats.mistakes) {
            const previousMistakes = record.lastErrorsList || [];
            record.repeatedErrors = stats.mistakes.filter(w => previousMistakes.includes(w));
            record.lastErrorsList = stats.mistakes;
        } else {
            record.repeatedErrors = [];
            record.lastErrorsList = [];
        }

        await this.saveProgress(record);
        await this.logHistory({
            profileId,
            sentenceId,
            mode,
            isSuccess,
            timestamp: Date.now()
        });

        return record;
    }

    // --- SESSION HISTORY ---
    async logHistory(logEntry) {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('history', 'readwrite');
            const store = tx.objectStore('history');
            const request = store.add(logEntry);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getHistory(profileId) {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('history', 'readonly');
            const store = tx.objectStore('history');
            const list = [];
            const request = store.openCursor();
            request.onsuccess = (e) => {
                const cursor = e.target.result;
                if (cursor) {
                    if (cursor.value.profileId === profileId) {
                        list.push(cursor.value);
                    }
                    cursor.continue();
                } else {
                    resolve(list.sort((a, b) => b.timestamp - a.timestamp));
                }
            };
            request.onerror = () => reject(request.error);
        });
    }
}
