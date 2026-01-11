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
        <div className="w-full h-full bg-white border-2 border-gray-900 flex flex-col md:flex-row gap-6 p-6 font-pixel text-gray-900">
            {/* Left: Canvas Preview */}
            <div className="md:w-3/5 flex flex-col items-center justify-center">
                <div className="text-xs font-bold text-gray-600 tracking-widest uppercase mb-4">Preview</div>
                <div className="relative bg-white border-2 border-gray-900 rounded-lg p-6 shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
                    <canvas
                        ref={canvasRef}
                        width={256}
                        height={256}
                        className="border-2 border-gray-900 rounded-lg bg-gray-100 image-rendering-pixelated"
                    />
                </div>
            </div>

            {/* Right: Part Selectors */}
            <div className="md:w-2/5 flex flex-col">
                <div className="text-xs font-bold text-gray-600 tracking-widest uppercase mb-4">Customize</div>
                
                <div className="flex-grow overflow-y-auto space-y-3 pr-2">
                    {(['Body', 'Clothes', 'Eyes', 'Hair', 'Mouth'] as PartType[]).map((partType) => (
                        <div key={partType} className="bg-white border-2 border-gray-900 p-4 rounded-lg shadow-[2px_2px_0px_rgba(0,0,0,0.1)]">
                            <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
                                {partType}
                            </label>
                            <select
                                value={selectedParts[partType]}
                                onChange={(e) =>
                                    setSelectedParts((prev) => ({
                                        ...prev,
                                        [partType]: e.target.value,
                                    }))
                                }
                                className="w-full bg-white border-2 border-gray-900 px-3 py-2 text-gray-900 text-xs font-bold focus:outline-none focus:bg-green-50/50 transition-colors rounded cursor-pointer shadow-[inset_2px_2px_0px_rgba(0,0,0,0.1)]"
                            >
                                <option value="">None</option>
                                {partOptions[partType].map((option) => (
                                    <option key={option} value={option}>
                                        {option.replace(/\.[^/.]+$/, '')}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`
                        w-full mt-4 px-4 py-3 border-2 border-gray-900 font-bold transition-all text-sm uppercase tracking-widest
                        ${saving 
                            ? "bg-gray-400 text-gray-700 opacity-50 cursor-not-allowed shadow-[inset_2px_2px_0px_rgba(0,0,0,0.1)]" 
                            : "bg-gray-900 text-white shadow-[inset_-2px_-2px_0px_rgba(50,50,50,1),3px_3px_0px_#000] hover:bg-gray-800 active:shadow-none active:translate-y-[3px]"
                        }
                    `}
                >
                    {saving ? '保存中...' : 'Save Avatar'}
                </button>
            </div>
        </div>
    );
}
