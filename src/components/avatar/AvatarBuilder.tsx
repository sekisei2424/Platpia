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
        <div className="space-y-6">
            {/* Canvas Display */}
            <div className="flex justify-center">
                <canvas
                    ref={canvasRef}
                    width={256}
                    height={256}
                    className="border-2 border-white/20 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900"
                />
            </div>

            {/* Part Selectors */}
            <div className="space-y-4">
                {(['Body', 'Clothes', 'Eyes', 'Hair', 'Mouth'] as PartType[]).map((partType) => (
                    <div key={partType}>
                        <label className="block text-xs font-medium text-white/60 mb-2 uppercase">
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
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white/30 transition-colors"
                        >
                            <option value="">Select {partType}</option>
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
            <div className="flex gap-2">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? 'Saving...' : 'Save Avatar'}
                </button>
            </div>
        </div>
    );
}
