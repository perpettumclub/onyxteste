
import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { Send, Image, Link, FileText, BarChart2, Video, X, Loader2 } from 'lucide-react';
import { CommunityPost } from '../types';

interface PostCreatorProps {
    onPostCreated: (post: CommunityPost) => void;
    tenantId: string | null;
}

export const PostCreator: React.FC<PostCreatorProps> = ({ onPostCreated, tenantId }) => {
    const { user } = useAuth();
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [category, setCategory] = useState('Geral');
    const [attachedImage, setAttachedImage] = useState<string | null>(null);
    const [linkUrl, setLinkUrl] = useState('');
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `posts/${tenantId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('media')
                .upload(filePath, file);

            if (uploadError) {
                console.error('Upload error:', uploadError);
                alert('Erro ao fazer upload da imagem');
                return;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('media')
                .getPublicUrl(filePath);

            setAttachedImage(publicUrl);
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Erro ao fazer upload da imagem');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleAddLink = () => {
        if (linkUrl.trim()) {
            setContent(prev => prev + (prev ? '\n' : '') + linkUrl);
            setLinkUrl('');
            setShowLinkInput(false);
        }
    };

    const handleToolbarAction = (action: 'image' | 'link' | 'file' | 'poll' | 'video') => {
        switch (action) {
            case 'image':
                imageInputRef.current?.click();
                break;
            case 'link':
                setShowLinkInput(!showLinkInput);
                break;
            case 'file':
                alert('📁 Anexar arquivo: Em breve!');
                break;
            case 'poll':
                alert('📊 Criar enquete: Em breve!');
                break;
            case 'video':
                alert('🎥 Adicionar vídeo: Em breve!');
                break;
        }
    };
    const handleSubmit = async () => {
        console.log('Attempting to create post...');
        console.log('Tenant ID:', tenantId);
        console.log('User ID:', user?.id);
        console.log('Title:', title);
        console.log('Content:', content);

        if (!content.trim() || !tenantId) {
            console.error('Validation failed: Missing content or tenantId');
            return;
        }
        setLoading(true);

        const postData: any = {
            tenant_id: tenantId,
            author_id: user.id,
            content
        };

        // Include image if attached
        if (attachedImage) {
            postData.image_url = attachedImage;
        }

        const { data, error } = await supabase.from('posts').insert(postData)
            .select('*, author:author_id(full_name, avatar_url, role)').single();

        if (data) {
            onPostCreated(data as CommunityPost);
            setContent('');
            setTitle('');
            setCategory('Geral');
            setAttachedImage(null);
            setIsExpanded(false);
        } else if (error) {
            console.error('Error creating post:', error);
            alert(`Erro ao publicar: ${error.message || error.code || 'Erro desconhecido'}`);
        }
        setLoading(false);
    };

    return (
        <div className="flux-card p-5 flex gap-5 items-start focus-within:ring-1 focus-within:ring-flux-border transition-all">
            {/* Hidden file input for images */}
            <input
                type="file"
                ref={imageInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
            />

            <div className="w-11 h-11 rounded-xl bg-flux-subtle border border-flux-border flex-shrink-0 flex items-center justify-center font-bold text-white text-sm overflow-hidden">
                {user.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                    user.name?.charAt(0) || 'U'
                )}
            </div>
            <div className="flex-1">
                {isExpanded && (
                    <input
                        className="w-full bg-transparent text-base font-bold text-white mb-2 placeholder-flux-text-tertiary focus:outline-none"
                        placeholder="Título (opcional)"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        autoFocus
                    />
                )}
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onFocus={() => setIsExpanded(true)}
                    placeholder="Compartilhe algo com a comunidade..."
                    className="w-full bg-transparent text-sm text-white placeholder-flux-text-tertiary focus:outline-none resize-none min-h-[60px] font-medium"
                />

                {/* Image Preview */}
                {attachedImage && (
                    <div className="relative mt-3 rounded-lg overflow-hidden border border-flux-border">
                        <img src={attachedImage} alt="Anexo" className="max-h-48 w-auto" />
                        <button
                            onClick={() => setAttachedImage(null)}
                            className="absolute top-2 right-2 p-1.5 bg-black/70 rounded-full hover:bg-black transition-colors"
                            title="Remover imagem"
                        >
                            <X size={14} className="text-white" />
                        </button>
                    </div>
                )}

                {/* Link Input */}
                {showLinkInput && (
                    <div className="flex gap-2 mt-3">
                        <input
                            type="url"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            placeholder="Cole o link aqui..."
                            className="flex-1 bg-flux-subtle border border-flux-border rounded-lg px-3 py-2 text-sm text-white placeholder-flux-text-tertiary focus:outline-none focus:border-flux-accent-blue"
                        />
                        <button
                            onClick={handleAddLink}
                            className="px-3 py-2 bg-flux-accent-blue text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                        >
                            Adicionar
                        </button>
                        <button
                            onClick={() => { setShowLinkInput(false); setLinkUrl(''); }}
                            className="p-2 text-flux-text-tertiary hover:text-white transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                {isExpanded && (
                    <div className="flex items-center gap-4 mt-2 mb-3">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleToolbarAction('image')}
                                className={`text-flux-text-tertiary hover:text-white transition-colors p-1.5 rounded hover:bg-flux-subtle ${uploadingImage ? 'opacity-50' : ''}`}
                                title="Adicionar Imagem"
                                disabled={uploadingImage}
                            >
                                {uploadingImage ? <Loader2 size={16} className="animate-spin" /> : <Image size={16} />}
                            </button>
                            <button
                                onClick={() => handleToolbarAction('link')}
                                className={`text-flux-text-tertiary hover:text-white transition-colors p-1.5 rounded hover:bg-flux-subtle ${showLinkInput ? 'text-flux-accent-blue' : ''}`}
                                title="Adicionar Link"
                            >
                                <Link size={16} />
                            </button>
                            <button
                                onClick={() => handleToolbarAction('file')}
                                className="text-flux-text-tertiary hover:text-white transition-colors p-1.5 rounded hover:bg-flux-subtle"
                                title="Adicionar Arquivo"
                            >
                                <FileText size={16} />
                            </button>
                            <button
                                onClick={() => handleToolbarAction('poll')}
                                className="text-flux-text-tertiary hover:text-white transition-colors p-1.5 rounded hover:bg-flux-subtle"
                                title="Enquete"
                            >
                                <BarChart2 size={16} />
                            </button>
                            <button
                                onClick={() => handleToolbarAction('video')}
                                className="text-flux-text-tertiary hover:text-white transition-colors p-1.5 rounded hover:bg-flux-subtle"
                                title="Vídeo"
                            >
                                <Video size={16} />
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center mt-3 border-t border-flux-border pt-4">
                    <div className="text-[10px] text-flux-text-tertiary font-bold uppercase tracking-wider flex items-center gap-2">
                        Postar como {user.role}
                        <span className="w-0.5 h-3 bg-flux-border"></span>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="bg-transparent text-white focus:outline-none cursor-pointer hover:text-flux-accent-blue transition-colors"
                        >
                            <option value="Geral" className="bg-flux-panel text-white">Geral</option>
                            <option value="Avisos" className="bg-flux-panel text-white">Avisos</option>
                            <option value="Dúvidas" className="bg-flux-panel text-white">Dúvidas</option>
                        </select>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={!content.trim() || loading}
                        className="flux-btn-primary px-5 py-2 text-xs font-bold disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                        {loading ? 'Publicando...' : 'Publicar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

