/**
 * Helper to parse a queue number string into an array of lowercase character strings,
 * removing any space characters.
 * @param {string|number} queueNumber - The queue number to parse (e.g. 'A001' or 'A-023').
 * @returns {string[]} An array of character strings (e.g. ['a', '0', '0', '1']).
 */
export function parseQueueNumber(queueNumber) {
  if (!queueNumber) return [];
  // Convert to string, lowercase, and remove all spaces
  const clean = queueNumber.toString().toLowerCase().replace(/\s/g, '');
  // Also strip hyphens or non-alphanumeric chars so we don't try to play them as files
  return clean.replace(/[^a-z0-9]/g, '').split('');
}

class AudioQueueService {
  constructor() {
    this.queue = [];
    this.isPlaying = false;
    this.currentAudio = null;
  }

  /**
   * Play the queue announcement by enqueuing the call.
   * @param {string|number} queueNumber - The queue ticket number (e.g., 'A-023').
   * @param {string|number} counterNumber - The destination counter number/name (e.g. 1 or 'Loket 1').
   */
  playQueueAnnouncement(queueNumber, counterNumber) {
    if (!queueNumber || !counterNumber) {
      console.warn('playQueueAnnouncement called with missing arguments:', { queueNumber, counterNumber });
      return;
    }

    // DEBUG log as requested
    console.log('Queue called:', queueNumber);

    this.queue.push({ queueNumber, counterNumber });
    this.processQueue();
  }

  /**
   * Process the next item in the queue.
   */
  async processQueue() {
    if (this.isPlaying) return;
    if (this.queue.length === 0) return;

    this.isPlaying = true;
    const { queueNumber, counterNumber } = this.queue.shift();

    try {
      await this.playCallSequence(queueNumber, counterNumber);
    } catch (error) {
      console.error('Error playing call sequence:', error);
    } finally {
      this.isPlaying = false;
      // Continue to the next queue item
      this.processQueue();
    }
  }

  /**
   * Play the sequence of audio files for a single call.
   */
  async playCallSequence(queueNumber, counterNumber) {
    const playlist = [];

    // 1. "Nomor Antrian" introduction
    playlist.push(this.getAudioPath('nomor-antrian'));

    // 2. Parse queue number character-by-character using helper
    const chars = parseQueueNumber(queueNumber);
    for (let char of chars) {
      playlist.push(this.getAudioPath(char));
    }

    // 3. "Silahkan Menuju" transition
    playlist.push(this.getAudioPath('silahkan-menuju'));

    // 4. "Loket {number}" destination
    // Clean up counter number/name to extract the number
    const cleanCounter = counterNumber.toString().toLowerCase().replace(/loket/g, '').trim();
    playlist.push(this.getAudioPath(`loket-${cleanCounter}`));

    console.log('Playing queue audio playlist:', playlist);

    // Play all files in the playlist sequentially
    for (const src of playlist) {
      await this.playFile(src);
    }
  }

  /**
   * Maps an audio key to its corresponding file path.
   * Supports both slugified/lowercase names and maps them to the actual
   * files in /public/audio (which use Capital Letters & Spaces).
   */
  getAudioPath(key) {
    const cleanKey = key.toString().toLowerCase().trim();

    // Mapping main phrases
    if (cleanKey === 'nomor-antrian' || cleanKey === 'nomorantrian' || cleanKey === 'nomor_antrian') {
      return '/audio/Nomor Antrian.mp3';
    }
    if (cleanKey === 'silahkan-menuju' || cleanKey === 'silahkanmenuju' || cleanKey === 'silahkan_menuju') {
      return '/audio/Silahkan Menuju.mp3';
    }

    // Mapping counter names (e.g. loket-1 -> Loket 1.mp3)
    if (cleanKey.startsWith('loket')) {
      const numMatch = cleanKey.match(/\d+/);
      const num = numMatch ? numMatch[0] : '1';
      return `/audio/Loket ${num}.mp3`;
    }

    // Mapping individual digits / characters (e.g. a -> A.mp3, 0 -> 0.mp3)
    if (/^[a-z0-9]$/.test(cleanKey)) {
      return `/audio/${cleanKey.toUpperCase()}.mp3`;
    }

    // Default fallback
    return `/audio/${key}.mp3`;
  }

  /**
   * Plays a single audio file and returns a Promise that resolves when it ends
   * or if playback fails/is prevented.
   */
  playFile(src) {
    return new Promise((resolve) => {
      const audio = new Audio(src);
      this.currentAudio = audio;

      audio.onended = () => {
        this.currentAudio = null;
        resolve();
      };

      audio.onerror = (e) => {
        console.error(`Audio error for ${src}:`, e);
        this.currentAudio = null;
        resolve(); // Resolve to avoid locking the queue
      };

      audio.play().catch((err) => {
        console.warn(`Audio playback prevented or failed for ${src}:`, err);
        this.currentAudio = null;
        resolve(); // Resolve to avoid locking the queue
      });
    });
  }

  /**
   * Instantly stops playback and clears the entire queue.
   */
  clear() {
    this.queue = [];
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    this.isPlaying = false;
  }
}

const audioQueueService = new AudioQueueService();
export default audioQueueService;
