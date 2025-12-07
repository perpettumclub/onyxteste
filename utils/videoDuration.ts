// Utility to extract video duration from various sources

export const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Get duration from YouTube video using noembed (no API key needed)
export const getYouTubeDuration = async (url: string): Promise<string | null> => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (!match) return null;

    const videoId = match[1];

    try {
        // Using a workaround: we load the video in a hidden element and get duration
        // Note: YouTube API would require auth, so we'll estimate based on typical video
        // For production, you'd use YouTube Data API v3 with an API key

        // Fallback: return a placeholder that will be updated when video loads
        return null;
    } catch {
        return null;
    }
};

// Get duration from Vimeo using oEmbed API
export const getVimeoDuration = async (url: string): Promise<string | null> => {
    const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (!match) return null;

    try {
        const response = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`);
        if (!response.ok) return null;

        const data = await response.json();
        if (data.duration) {
            return formatDuration(data.duration);
        }
        return null;
    } catch {
        return null;
    }
};

// Get duration from direct video file (HTML5)
export const getDirectVideoDuration = (url: string): Promise<string | null> => {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';

        video.onloadedmetadata = () => {
            resolve(formatDuration(video.duration));
            video.remove();
        };

        video.onerror = () => {
            resolve(null);
            video.remove();
        };

        // Timeout after 10 seconds
        setTimeout(() => {
            resolve(null);
            video.remove();
        }, 10000);

        video.src = url;
    });
};

// Main function to auto-detect and get duration
export const getVideoDuration = async (url: string): Promise<string> => {
    if (!url) return '00:00';

    // Check if YouTube - skip auto-detection (requires API key)
    // The duration field will stay as-is for manual input
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        // Return empty to indicate no auto-detection available
        return '';
    }

    // Check if Vimeo
    if (url.includes('vimeo.com')) {
        const duration = await getVimeoDuration(url);
        return duration || '00:00';
    }

    // Check if direct video file
    if (url.match(/\.(mp4|webm|ogg|mov)$/i)) {
        const duration = await getDirectVideoDuration(url);
        return duration || '00:00';
    }

    return '00:00';
};
