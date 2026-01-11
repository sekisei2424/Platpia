import { Scene } from 'phaser';
import { supabaseService, Post } from '@/services/supabaseService';

interface PostData {
    id: string;
    user_id?: string;
    username: string;
    content: string;
    image_url?: string | null;
    avatarColor: number;
    avatarPath: string;
    avatar_type?: string | null;
    user_type?: 'individual' | 'company' | null;
    job_id?: string | null;
    job_title?: string | null;
}

export class PlazaScene extends Scene {
    private mapBackground!: Phaser.GameObjects.Image;
    private npcs: { sprite: Phaser.Physics.Arcade.Sprite, bubble: Phaser.GameObjects.Container }[] = [];

    // Mock data removed, using real data from Supabase

    constructor() {
        super('PlazaScene');
    }

    preload() {
        // Load assets
        if (!this.textures.exists('background')) {
            this.load.image('background', '/images/hiroba.png');
        }

        const avatars = [
            { key: 'avatar1', path: '/images/character_murabito_middle_man_blue.svg' },
            { key: 'avatar2', path: '/images/character_murabito_middle_woman_blue.svg' },
            { key: 'avatar3', path: '/images/character_murabito_senior_man_blue.svg' },
            { key: 'avatar4', path: '/images/character_murabito_young_man_blue.svg' }
        ];

        avatars.forEach(avatar => {
            if (!this.textures.exists(avatar.key)) {
                this.load.svg(avatar.key, avatar.path);
            }
        });

        // Load new pixel art avatar
        if (!this.textures.exists('20251210_dotto.png')) {
            this.load.image('20251210_dotto.png', '/images/20251210_dotto.png');
        }
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // 1. Background Image
        this.mapBackground = this.add.image(width / 2, height / 2, 'background')
            .setOrigin(0.5);

        // Scale background to cover the screen (cover mode)
        this.updateBackgroundScale(width, height);

        // Set Physics Bounds to bottom half (sky is top half)
        this.physics.world.setBounds(0, height / 2, width, height / 2);

        // 2. Handle Resize
        this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
            if (this.cameras && this.cameras.main) {
                this.cameras.main.setViewport(0, 0, gameSize.width, gameSize.height);
                this.updateBackgroundScale(gameSize.width, gameSize.height);
                // Update physics bounds on resize
                this.physics.world.setBounds(0, gameSize.height / 2, gameSize.width, gameSize.height / 2);
            }
        });

        // 3. Fetch and Create NPCs from Supabase
        this.loadPosts();
    }

    private getAvatarInfo(avatarType: string | null | undefined): { key: string, path: string } {
        if (!avatarType) {
             return { key: 'avatar4', path: '/images/character_murabito_young_man_blue.svg' };
        }

        // 1. Check for specific known avatars (filenames or keys)
        if (avatarType === '20251210_dotto.png' || avatarType === 'dotto') {
             return { key: '20251210_dotto.png', path: '/images/20251210_dotto.png' };
        }

        // 2. Check for standard SVGs (filenames or keys)
        if (avatarType === 'avatar1' || avatarType === 'character_murabito_middle_man_blue.svg') 
            return { key: 'avatar1', path: '/images/character_murabito_middle_man_blue.svg' };
            
        if (avatarType === 'avatar2' || avatarType === 'character_murabito_middle_woman_blue.svg') 
            return { key: 'avatar2', path: '/images/character_murabito_middle_woman_blue.svg' };
            
        if (avatarType === 'avatar3' || avatarType === 'character_murabito_senior_man_blue.svg') 
            return { key: 'avatar3', path: '/images/character_murabito_senior_man_blue.svg' };
            
        if (avatarType === 'avatar4' || avatarType === 'character_murabito_young_man_blue.svg') 
            return { key: 'avatar4', path: '/images/character_murabito_young_man_blue.svg' };

        // 3. Partial match fallback (legacy support)
        if (avatarType.includes('woman')) return { key: 'avatar2', path: '/images/character_murabito_middle_woman_blue.svg' };
        if (avatarType.includes('senior')) return { key: 'avatar3', path: '/images/character_murabito_senior_man_blue.svg' };
        
        // 4. If it looks like a file path (ends with .png, .svg, .jpg), try to use it directly
        // Note: This requires the texture to be loaded. If not loaded, we might need to handle it in createNPC.
        // For now, we return it as key and path, assuming it might be loaded or we can load it.
        if (avatarType.match(/\.(png|svg|jpg|jpeg)$/i)) {
            return { key: avatarType, path: `/images/${avatarType}` };
        }

        // Default
        return { key: 'avatar4', path: '/images/character_murabito_young_man_blue.svg' };
    }

    private async loadPosts() {
        const posts = await supabaseService.fetchPosts();

        if (posts.length === 0) {
            // Fallback: Create some "bot" NPCs if no posts exist
            const botPosts: PostData[] = [
                { id: 'bot1', username: 'Villager A', content: 'Welcome to the Village!', avatarColor: 0xFFFFFF, avatarPath: '/images/character_murabito_middle_man_blue.svg', avatar_type: 'avatar1', user_type: 'individual' },
                { id: 'bot2', username: 'Villager B', content: 'Nice day, isn\'t it?', avatarColor: 0xFFFFFF, avatarPath: '/images/character_murabito_middle_woman_blue.svg', avatar_type: 'avatar2', user_type: 'individual' },
                { id: 'bot3', username: 'Elder', content: 'Have you checked the job board?', avatarColor: 0xFFFFFF, avatarPath: '/images/character_murabito_senior_man_blue.svg', avatar_type: 'avatar3', user_type: 'individual' },
            ];
            botPosts.forEach(post => this.createNPC(post));
            this.game.events.emit('posts_loaded', botPosts);
            return;
        }

        const mappedPosts: PostData[] = posts.map((post: Post) => {
            const avatarInfo = this.getAvatarInfo(post.profiles?.avatar_type);
            return {
                id: post.id,
                user_id: post.user_id, // Map user_id
                username: post.profiles?.username || 'Anonymous',
                content: post.content,
                image_url: post.image_url,
                avatarColor: 0xFFFFFF, // Not used with sprites
                avatarPath: avatarInfo.path, // Set path correctly
                avatar_type: post.profiles?.avatar_type,
                user_type: post.profiles?.user_type,
                job_id: post.job_id,
                job_title: post.jobs?.title
            };
        });

        mappedPosts.forEach(post => this.createNPC(post));
        this.game.events.emit('posts_loaded', mappedPosts);
    }

    private updateBackgroundScale(width: number, height: number) {
        this.mapBackground.setPosition(width / 2, height / 2);
        const scaleX = width / this.mapBackground.width;
        const scaleY = height / this.mapBackground.height;
        const scale = Math.max(scaleX, scaleY);
        this.mapBackground.setScale(scale);
    }

    private createNPC(post: PostData) {
        // Determine spawn position (random within lower half bounds)
        const width = this.scale.width;
        const height = this.scale.height;
        const padding = 50;

        const startX = Phaser.Math.Between(padding, width - padding);
        // Spawn ONLY in the bottom half (height/2 to height)
        const startY = Phaser.Math.Between(height / 2 + padding, height - padding);

        // Select avatar sprite based on avatar_type
        const avatarInfo = this.getAvatarInfo(post.avatar_type);
        let avatarKey = avatarInfo.key;

        // Safety check: If texture is not loaded, fallback to default to avoid crash/green box
        if (!this.textures.exists(avatarKey)) {
            console.warn(`Avatar texture not found: ${avatarKey}. Using default.`);
            avatarKey = 'avatar4';
        }

        const npc = this.physics.add.sprite(startX, startY, avatarKey);

        // Scale NPC (SVGs might be large, adjust as needed)
        // Pixel art might need different scaling
        if (avatarKey === '20251210_dotto.png') {
            npc.setDisplaySize(80, 80); // Force size to 80x80 to prevent huge images
            // Enable pixel art rendering mode if possible, or just scale
            npc.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
        } else {
            npc.setScale(0.15);
        }

        npc.setCollideWorldBounds(true);
        npc.setBounce(1);

        // Store post data on the NPC object
        (npc as any).postData = post;

        // Random movement
        const speed = 30;
        npc.setVelocity(
            (Math.random() - 0.5) * speed,
            (Math.random() - 0.5) * speed
        );

        // Click interaction for NPC
        npc.setInteractive({ useHandCursor: true });
        npc.on('pointerdown', () => {
            this.game.events.emit('open_post', post);
        });

        // Add Bubble
        // Increase offset because bubble is larger
        const bubble = this.add.container(startX, startY - 90);

        // Determine colors based on user_type
        const isCompany = post.user_type === 'company';
        // Company: Light Blue, Individual: White
        const bubbleFillColor = isCompany ? 0xE3F2FD : 0xFFFFFF;
        const bubbleStrokeColor = isCompany ? 0x2196F3 : 0x333333;

        // Bubble dimensions
        const bWidth = 140;
        const bHeight = 100;
        const radius = 10;

        // Bubble shape
        const bubbleBg = this.add.graphics();
        bubbleBg.fillStyle(bubbleFillColor, 0.95);
        bubbleBg.fillRoundedRect(-bWidth / 2, -bHeight / 2, bWidth, bHeight, radius);
        bubbleBg.lineStyle(2, bubbleStrokeColor, 1);
        bubbleBg.strokeRoundedRect(-bWidth / 2, -bHeight / 2, bWidth, bHeight, radius);

        // Triangle pointer
        const triY = bHeight / 2;
        bubbleBg.fillTriangle(0, triY + 10, -10, triY, 10, triY);
        
        bubble.add(bubbleBg);

        // Make bubble clickable
        // Set hit area for the container
        // The hit area is relative to the container's position (0,0 is the center of the container)
        const hitArea = new Phaser.Geom.Rectangle(-bWidth / 2, -bHeight / 2, bWidth, bHeight);
        bubble.setInteractive({
            hitArea: hitArea,
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            useHandCursor: true
        });
        
        bubble.on('pointerdown', () => {
            this.game.events.emit('open_post', post);
        });

        // Content Layout: Text Top, Image Bottom

        // 1. Text (Top half)
        // Truncate text to 10 characters
        const textContent = post.content.length > 10 ? post.content.substring(0, 10) + '...' : post.content;
        const textY = post.image_url ? -25 : 0; // If image exists, move text up. If not, center it.
        
        const text = this.add.text(0, textY, textContent, {
            color: '#000',
            fontSize: '12px',
            align: 'center',
            wordWrap: { width: bWidth - 10 }
        }).setOrigin(0.5);
        bubble.add(text);

        // 2. Image (Bottom half)
        if (post.image_url) {
            const imageKey = `post_image_${post.id}`;
            const targetHeight = 40;
            const targetWidth = 60;
            const imgY = 20;

            const addImageToBubble = () => {
                if (this.textures.exists(imageKey)) {
                    const img = this.add.image(0, imgY, imageKey);
                    // Scale to fit
                    const scaleX = targetWidth / img.width;
                    const scaleY = targetHeight / img.height;
                    const scale = Math.min(scaleX, scaleY);
                    img.setScale(scale);
                    bubble.add(img);
                }
            };

            if (!this.textures.exists(imageKey)) {
                this.load.image(imageKey, post.image_url);
                this.load.once('complete', () => {
                    addImageToBubble();
                });
                this.load.start();
            } else {
                addImageToBubble();
            }
        }

        this.npcs.push({ sprite: npc, bubble: bubble });
    }

    update() {
        this.npcs.forEach(({ sprite, bubble }) => {
            if (!sprite.body) return; // Safety check

            // Update bubble position to follow NPC
            // Adjust offset based on new bubble size
            bubble.setPosition(sprite.x, sprite.y - 90);

            // Randomly change direction occasionally
            if (Math.random() < 0.005) {
                const speed = 30;
                sprite.setVelocity(
                    (Math.random() - 0.5) * speed,
                    (Math.random() - 0.5) * speed
                );
            }

            // Stop occasionally
            if (Math.random() < 0.005) {
                sprite.setVelocity(0);
            }
        });
    }
}
