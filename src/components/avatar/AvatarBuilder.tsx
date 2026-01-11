'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

interface AvatarBuilderProps {
    onSaved?: () => void;
}

type PartType = 'Body' | 'Clothes' | 'Eyes' | 'Hair' | 'Mouth';

export default function AvatarBuilder({ onSaved }: AvatarBuilderProps) {
    const { user } = useAuth();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [partOptions, setPartOptions] = useState<Record<PartType, string[]>>({
        Body: [],
        Clothes: [],
        Eyes: [],
        Hair: [],
        Mouth: [],
    });

    const [selectedParts, setSelectedParts] = useState<Record<PartType, string>>({
        Body: '',
        Clothes: '',
        Eyes: '',
        Hair: '',
        Mouth: '',
    });

    const [saving, setSaving] = useState(false);

    // Load available parts from Storage
    useEffect(() => {
        const loadParts = async () => {
            const partTypes: PartType[] = ['Body', 'Clothes', 'Eyes', 'Hair', 'Mouth'];
            const newOptions: Record<PartType, string[]> = {
                Body: [],
                Clothes: [],
                Eyes: [],
                Hair: [],
                Mouth: [],
            };

            for (const partType of partTypes) {
                try {
                    const { data, error } = await supabase.storage
                        .from('avatars')
                        .list(`Preset/${partType}`);

                    if (error) {
                        console.error(`Error loading ${partType}:`, error);
                        continue;
                    }

                    const files = (data || [])
                        .filter((item: any) => !item.name.startsWith('.'))
                        .map((item: any) => item.name);

                    newOptions[partType] = files;

                    // Auto-select first part
                    if (files.length > 0 && !selectedParts[partType]) {
                        setSelectedParts((prev) => ({ ...prev, [partType]: files[0] }));
                    }
                } catch (error) {
                    console.error(`Failed to load ${partType} options:`, error);
                }
            }

            setPartOptions(newOptions);
        };

        loadParts();
    }, []);

    // Draw avatar on canvas when parts change
    useEffect(() => {
        drawAvatar();
    }, [selectedParts]);

    const drawAvatar = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const drawOrder: PartType[] = ['Body', 'Clothes', 'Eyes', 'Hair', 'Mouth'];

        for (const partType of drawOrder) {
            const partName = selectedParts[partType];
            if (!partName) continue;

            try {
                const { data, error } = await supabase.storage
                    .from('avatars')
                    .download(`Preset/${partType}/${partName}`);

                if (error || !data) {
                    console.error(`Error loading ${partType}/${partName}:`, error);
                    continue;
                }

                const blob = data;
                const url = URL.createObjectURL(blob);
                const img = new Image();
                img.onload = () => {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    URL.revokeObjectURL(url);
                };
                img.src = url;
            } catch (error) {
                console.error(`Failed to draw ${partType}:`, error);
            }
        }
    };

    const handleSave = async () => {
        if (!canvasRef.current || !user) return;

        setSaving(true);
        try {
            // 現在のプロフィールから古いアバターの URL を取得
            const { data: profileData } = await supabase
                .from('profiles')
                .select('avatar_type')
                .eq('id', user.id)
                .single();

            // 古いアバターがあれば削除
            if (profileData?.avatar_type) {
                console.log('Old avatar URL:', profileData.avatar_type);
                
                // URL からファイルパスを抽出
                const pathMatch = profileData.avatar_type.match(/\/avatars\/(.+)$/);
                if (pathMatch) {
                    const filePath = pathMatch[1];
                    console.log('Attempting to delete file at path:', filePath);
                    try {
                        const { error: deleteError } = await supabase.storage
                            .from('avatars')
                            .remove([filePath]);
                        
                        if (deleteError) {
                            console.warn('Delete error:', deleteError);
                        } else {
                            console.log('✓ Successfully deleted old avatar at:', filePath);
                        }
                    } catch (deleteError) {
                        console.warn('Failed to delete old avatar:', deleteError);
                        // 削除失敗しても続行
                    }
                }
            }

            // 新しいアバターを作成・アップロード
            const blob = await new Promise<Blob>((resolve) => {
                canvasRef.current!.toBlob((blob) => {
                    resolve(blob || new Blob());
                }, 'image/png');
            });

            const file = new File([blob], `avatar-${Date.now()}.png`, { type: 'image/png' });
            const fileName = file.name;
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(`Users/${user.id}/${fileName}`, file, { upsert: false });

            if (uploadError) {
                throw uploadError;
            }

            // 新しい URL を取得
            const { data } = supabase.storage
                .from('avatars')
                .getPublicUrl(`Users/${user.id}/${fileName}`);

            const publicUrl = data.publicUrl;

            // プロフィールを更新
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_type: publicUrl })
                .eq('id', user.id);

            if (updateError) {
                throw updateError;
            }

            onSaved?.();
        } catch (error) {
            console.error('Error saving avatar:', error);
            alert('アバターの保存に失敗しました');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-white border-4 border-gray-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] overflow-hidden">
            {/* Top: Preview Area */}
            <div className="flex-shrink-0 bg-gray-100 p-4 border-b-4 border-gray-900 flex items-center justify-center relative">
                 <div className="absolute inset-0 pattern-dots opacity-10 pointer-events-none"></div>
                <div className="w-48 h-48 sm:w-56 sm:h-56 bg-white border-2 border-gray-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
                    <canvas 
                        ref={canvasRef} 
                        width={500} 
                        height={500} 
                        className="w-full h-full object-contain"
                    />
                </div>
            </div>

            {/* Bottom: Controls Area */}
            <div className="flex-1 flex flex-col bg-white min-h-0">                
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {Object.keys(partOptions).map((part) => (
                        <div key={part} className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{part}</label>
                            <div className="flex gap-2">
                                <select 
                                    className="flex-1 px-2 py-1.5 border-2 border-gray-900 font-bold text-xs bg-white text-gray-900 focus:bg-yellow-50 outline-none shadow-[2px_2px_0px_0px_#000] active:shadow-none active:translate-y-[2px] transition-all appearance-none rounded-none"
                                    value={selectedParts[part as PartType] || ''}
                                    onChange={(e) => setSelectedParts((prev) => ({ ...prev, [part as PartType]: e.target.value }))}
                                >
                                    {partOptions[part as PartType].map((opt) => (
                                        <option key={opt} value={opt} className="text-gray-900">{opt.replace('.png', '')}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t-2 border-gray-100 bg-gray-50 flex gap-2">
                     {onSaved && (
                         <button 
                            onClick={onSaved}
                            className="flex-1 py-3 border-2 border-gray-900 bg-white text-gray-900 font-bold text-sm uppercase tracking-widest hover:bg-gray-100 shadow-[3px_3px_0px_0px_#000] active:translate-y-[2px] active:shadow-none transition-all"
                        >
                            CANCEL
                        </button>
                    )}
                    <button 
                        onClick={handleSave} 
                        disabled={saving}
                        className="flex-1 py-3 border-2 border-gray-900 bg-gray-900 text-white font-bold text-sm uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-[3px_3px_0px_0px_#000] active:translate-y-[2px] active:shadow-none transition-all"
                    >
                        {saving ? 'SAVING...' : 'SAVE'}
                    </button>
                </div>
            </div>
        </div>
    );
}
