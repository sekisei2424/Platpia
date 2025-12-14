'use client';

import { useEffect, useRef } from 'react';

export default function PhaserGame({
    currentScene,
    onOpenJobBoard,
    onOpenPost,
    onPostsLoaded
}: {
    currentScene: 'plaza' | 'village';
    onOpenJobBoard: () => void;
    onOpenPost: (post: any) => void;
    onPostsLoaded?: (posts: any[]) => void;
}) {
    const gameRef = useRef<Phaser.Game | null>(null);
    const onOpenJobBoardRef = useRef(onOpenJobBoard);
    const onOpenPostRef = useRef(onOpenPost);
    const onPostsLoadedRef = useRef(onPostsLoaded);

    // Update refs when props change
    useEffect(() => {
        onOpenJobBoardRef.current = onOpenJobBoard;
        onOpenPostRef.current = onOpenPost;
        onPostsLoadedRef.current = onPostsLoaded;
    }, [onOpenJobBoard, onOpenPost, onPostsLoaded]);

    // Initialize Game
    useEffect(() => {
        let game: Phaser.Game | null = null;

        if (typeof window !== 'undefined') {
            const initGame = async () => {
                if (game) return; // Already initialized

                const [Phaser, { gameConfig }, { PlazaScene }, { VillageScene }] = await Promise.all([
                    import('phaser'),
                    import('@/game/config'),
                    import('@/game/scenes/PlazaScene'),
                    import('@/game/scenes/VillageScene')
                ]);

                const parent = document.getElementById('phaser-container');
                if (!parent) return;

                // Ensure parent has dimensions
                if (parent.clientWidth === 0 || parent.clientHeight === 0) {
                    // Wait a bit and try again
                    await new Promise(r => setTimeout(r, 100));
                    if (!document.getElementById('phaser-container')) return;
                }

                // Clone config to avoid mutating the original export
                const config = { ...gameConfig };
                config.width = parent.clientWidth || window.innerWidth;
                config.height = parent.clientHeight || window.innerHeight;

                // Fix for "Framebuffer status: Incomplete Attachment"
                // This often happens if width/height is 0 or odd in some browsers, or if context is lost.
                // Ensure even numbers
                config.width = Math.max(config.width, 320);
                config.height = Math.max(config.height, 240);
                if (config.width % 2 !== 0) config.width++;
                if (config.height % 2 !== 0) config.height++;

                // Force canvas type to avoid some WebGL context loss issues if possible, 
                // but we want WebGL. 
                // Let's try to ensure we don't create multiple contexts.

                game = new Phaser.default.Game(config);
                gameRef.current = game;

                // Manually add scenes
                game.scene.add('PlazaScene', PlazaScene);
                game.scene.add('VillageScene', VillageScene);

                game.events.once('ready', () => {
                    const sceneManager = game?.scene;
                    if (sceneManager) {
                        const sceneClass = currentScene === 'plaza' ? 'PlazaScene' : 'VillageScene';
                        sceneManager.start(sceneClass);
                    }
                });

                // Listen for events from the game
                game.events.on('open_job_board', () => {
                    if (onOpenJobBoardRef.current) onOpenJobBoardRef.current();
                });

                game.events.on('open_post', (post: any) => {
                    if (onOpenPostRef.current) onOpenPostRef.current(post);
                });

                game.events.on('posts_loaded', (posts: any[]) => {
                    if (onPostsLoadedRef.current) onPostsLoadedRef.current(posts);
                });
            };

            initGame();
        }

        return () => {
            if (game) {
                game.destroy(true);
                game = null;
                gameRef.current = null;
            }
        };
    }, [currentScene]);

    return <div id="phaser-container" className="w-full h-full flex items-center justify-center" />;
}
