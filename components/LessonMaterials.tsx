import React from 'react';
import { FileText, Download, ExternalLink, File } from 'lucide-react';

interface Material {
    id: string;
    title: string;
    file_url: string;
    file_type: 'PDF' | 'LINK' | 'DOWNLOAD';
}

interface LessonMaterialsProps {
    materials: Material[];
}

export const LessonMaterials: React.FC<LessonMaterialsProps> = ({ materials }) => {
    if (!materials || materials.length === 0) return null;

    const getIcon = (type: string) => {
        switch (type) {
            case 'PDF': return <FileText size={16} className="text-red-400" />;
            case 'LINK': return <ExternalLink size={16} className="text-blue-400" />;
            default: return <Download size={16} className="text-green-400" />;
        }
    };

    return (
        <div className="mt-6 border-t border-onyx-800 pt-6">
            <h4 className="text-xs font-bold text-onyx-500 uppercase tracking-wider mb-3">
                Materiais de Apoio
            </h4>
            <div className="space-y-2">
                {materials.map(material => (
                    <a
                        key={material.id}
                        href={material.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-onyx-950 border border-onyx-800 rounded-xl hover:border-onyx-700 hover:bg-onyx-900 transition-all group"
                    >
                        <div className="w-10 h-10 rounded-lg bg-onyx-900 flex items-center justify-center">
                            {getIcon(material.file_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate group-hover:text-onyx-200">
                                {material.title}
                            </p>
                            <p className="text-xs text-onyx-500">{material.file_type}</p>
                        </div>
                        <Download size={16} className="text-onyx-600 group-hover:text-white transition-colors" />
                    </a>
                ))}
            </div>
        </div>
    );
};
