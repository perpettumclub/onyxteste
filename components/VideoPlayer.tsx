import React from 'react';

interface VideoPlayerProps {
    src: string;
    poster?: string;
    title?: string;
    onEnded?: () => void;
    onTimeUpdate?: (currentTime: number) => void;
    autoPlay?: boolean;
}

// Helper to extract video ID and platform from URL
const getVideoInfo = (url: string) => {
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return { platform: 'youtube', id: ytMatch[1] };

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) return { platform: 'vimeo', id: vimeoMatch[1] };

    // Direct video file (mp4, webm, etc)
    if (url.match(/\.(mp4|webm|ogg|mov)$/i)) return { platform: 'direct', id: url };

    return null;
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
    src,
    poster,
    title,
    onEnded,
    autoPlay = false
}) => {
    const videoInfo = getVideoInfo(src);

    // YouTube embed
    if (videoInfo?.platform === 'youtube') {
        return (
            <div className="w-full h-full">
                <iframe
                    src={`https://www.youtube.com/embed/${videoInfo.id}?autoplay=${autoPlay ? 1 : 0}&rel=0&modestbranding=1`}
                    title={title || 'Video'}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                />
            </div>
        );
    }

    // Vimeo embed
    if (videoInfo?.platform === 'vimeo') {
        return (
            <div className="w-full h-full">
                <iframe
                    src={`https://player.vimeo.com/video/${videoInfo.id}?autoplay=${autoPlay ? 1 : 0}`}
                    title={title || 'Video'}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                />
            </div>
        );
    }

    // Direct video (HTML5)
    if (videoInfo?.platform === 'direct') {
        return (
            <div className="w-full h-full bg-black">
                <video
                    src={src}
                    poster={poster}
                    className="w-full h-full object-contain"
                    controls
                    autoPlay={autoPlay}
                    onEnded={onEnded}
                    playsInline
                >
                    Seu navegador não suporta vídeo.
                </video>
            </div>
        );
    }

    // Fallback for unknown format - show error
    return (
        <div className="w-full h-full bg-onyx-900 flex flex-col items-center justify-center text-onyx-400">
            <div className="text-center p-8">
                <p className="text-lg font-bold mb-2">URL de vídeo não reconhecida</p>
                <p className="text-sm opacity-70 mb-4">Formatos suportados: YouTube, Vimeo, ou arquivos diretos (mp4, webm)</p>
                <code className="text-xs bg-black px-3 py-1 rounded-lg block overflow-hidden text-ellipsis max-w-md">{src}</code>
            </div>
        </div>
    );
};
