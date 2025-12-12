import React from 'react';
import { Playbook } from '../types';
import { Play, FileText, Link, ListChecks, ExternalLink, Clock } from 'lucide-react';

interface PlaybookCardProps {
    playbook: Playbook;
    compact?: boolean;
    onOpen?: (playbook: Playbook) => void;
}

const getIcon = (type: Playbook['type']) => {
    switch (type) {
        case 'VIDEO':
            return <Play size={14} className="text-red-400" />;
        case 'DOCUMENT':
            return <FileText size={14} className="text-blue-400" />;
        case 'LINK':
            return <Link size={14} className="text-green-400" />;
        case 'CHECKLIST':
            return <ListChecks size={14} className="text-purple-400" />;
        default:
            return <FileText size={14} className="text-onyx-400" />;
    }
};

const getTypeLabel = (type: Playbook['type']) => {
    switch (type) {
        case 'VIDEO':
            return 'Vídeo';
        case 'DOCUMENT':
            return 'Documento';
        case 'LINK':
            return 'Link';
        case 'CHECKLIST':
            return 'Checklist';
        default:
            return type;
    }
};

export const PlaybookCard: React.FC<PlaybookCardProps> = ({ playbook, compact = false, onOpen }) => {
    const handleClick = () => {
        if (onOpen) {
            onOpen(playbook);
        } else {
            window.open(playbook.url, '_blank');
        }
    };

    if (compact) {
        return (
            <button
                onClick={handleClick}
                className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-lg border border-white/[0.05] transition-all group w-full text-left"
            >
                {getIcon(playbook.type)}
                <span className="text-xs text-onyx-300 group-hover:text-white truncate flex-1">
                    {playbook.title}
                </span>
                {playbook.duration && (
                    <span className="text-[10px] text-onyx-500 flex items-center gap-1">
                        <Clock size={10} />
                        {playbook.duration}
                    </span>
                )}
                <ExternalLink size={12} className="text-onyx-600 group-hover:text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
        );
    }

    return (
        <div
            onClick={handleClick}
            className="flex items-start gap-3 p-4 bg-white/[0.02] hover:bg-white/[0.05] rounded-xl border border-white/[0.05] hover:border-white/[0.1] transition-all cursor-pointer group"
        >
            <div className="w-10 h-10 rounded-lg bg-white/[0.05] flex items-center justify-center flex-shrink-0">
                {getIcon(playbook.type)}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-bold text-white truncate group-hover:text-onyx-100">
                        {playbook.title}
                    </h4>
                    <span className="text-[9px] font-bold text-onyx-500 uppercase bg-white/[0.05] px-2 py-0.5 rounded">
                        {getTypeLabel(playbook.type)}
                    </span>
                </div>
                {playbook.description && (
                    <p className="text-xs text-onyx-500 line-clamp-2">{playbook.description}</p>
                )}
                {playbook.duration && (
                    <div className="flex items-center gap-1 mt-2 text-[10px] text-onyx-500">
                        <Clock size={10} />
                        <span>{playbook.duration}</span>
                    </div>
                )}
            </div>
            <ExternalLink size={16} className="text-onyx-600 group-hover:text-white transition-colors flex-shrink-0" />
        </div>
    );
};

// Lista de Playbooks para exibir em um Task Card
interface PlaybookListProps {
    playbooks: Playbook[];
    maxVisible?: number;
    onOpen?: (playbook: Playbook) => void;
}

export const PlaybookList: React.FC<PlaybookListProps> = ({ playbooks, maxVisible = 3, onOpen }) => {
    if (!playbooks || playbooks.length === 0) return null;

    const visiblePlaybooks = playbooks.slice(0, maxVisible);
    const hiddenCount = playbooks.length - maxVisible;

    return (
        <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-2">
                <FileText size={12} className="text-onyx-500" />
                <span className="text-[10px] font-bold text-onyx-500 uppercase tracking-wider">
                    Playbooks ({playbooks.length})
                </span>
            </div>
            {visiblePlaybooks.map((playbook) => (
                <PlaybookCard key={playbook.id} playbook={playbook} compact onOpen={onOpen} />
            ))}
            {hiddenCount > 0 && (
                <div className="text-[10px] text-onyx-500 text-center py-1">
                    +{hiddenCount} mais
                </div>
            )}
        </div>
    );
};

export default PlaybookCard;
