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

        // Update physics bounds
        // If width < 768 (mobile), reduce bottom height by ~80px (sidebar)
        const isMobile = width < 768;
        const bottomPadding = isMobile ? 80 : 0;
        this.physics.world.setBounds(0, height / 2, width, height / 2 - bottomPadding);

        // 2. Handle Resize
        this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
            if (this.cameras && this.cameras.main) {
                this.cameras.main.setViewport(0, 0, gameSize.width, gameSize.height);
                this.updateBackgroundScale(gameSize.width, gameSize.height);
                // Update physics bounds on resize
                const isMobileResize = gameSize.width < 768;
                const bottomPaddingResize = isMobileResize ? 80 : 0;
                this.physics.world.setBounds(0, gameSize.height / 2, gameSize.width, gameSize.height / 2 - bottomPaddingResize);
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
        const posts = await supabaseService.fetchLatestPostsPerUser();

        if (posts.length === 0) {
            // Fallback: Create some "bot" NPCs if no posts exist
            const botPosts: PostData[] = [
                { id: 'bot1', username: 'Villager A', content: 'Welcome to the Village!', avatarColor: 0xFFFFFF, avatarPath: '/images/character_murabito_middle_man_blue.svg', avatar_type: 'avatar1', user_type: 'individual' },
                { id: 'bot2', username: 'Villager B', content: 'Nice day, isn\'t it?', avatarColor: 0xFFFFFF, avatarPath: '/images/character_murabito_middle_woman_blue.svg', avatar_type: 'avatar2', user_type: 'individual' },
                { id: 'bot3', username: 'Elder', content: 'Have you checked the job board?', avatarColor: 0xFFFFFF, avatarPath: '/images/character_murabito_senior_man_blue.svg', avatar_type: 'avatar3', user_type: 'individual' },
            ];
            botPosts.forEach((post: PostData) => this.createNPC(post));
            this.game.events.emit('posts_loaded', botPosts);
            return;
        }

        // Pre-process posts to identify dynamic avatar URLs
        const avatarUrlsToLoad = new Set<string>();
        const mappedPosts: PostData[] = posts.map((post: Post) => {
            // Check if avatar_type seems to be a URL (starts with http or https)
            const rawAvatarType = post.profiles?.avatar_type;
            const isUrl = rawAvatarType && (rawAvatarType.startsWith('http://') || rawAvatarType.startsWith('https://'));
            
            let avatarKey = 'avatar4'; // Default
            let avatarPath = '/images/character_murabito_young_man_blue.svg';

            if (isUrl && rawAvatarType) {
                // Use the URL as the key (sanitized or raw)
                avatarKey = `avatar_url_${encodeURIComponent(rawAvatarType)}`;
                avatarUrlsToLoad.add(rawAvatarType);
                avatarPath = rawAvatarType;
            } else {
                const info = this.getAvatarInfo(rawAvatarType);
                avatarKey = info.key;
                avatarPath = info.path;
            }

            return {
                id: post.id,
                user_id: post.user_id,
                username: post.profiles?.username || 'Anonymous',
                content: post.content,
                image_url: post.image_url,
                avatarColor: 0xFFFFFF,
                avatarPath: avatarPath,
                avatar_type: rawAvatarType, // Keep original
                avatarKey: avatarKey as string, // Store the calculated key
                user_type: post.profiles?.user_type,
                job_id: post.job_id,
                job_title: post.jobs?.title
            };
        });

        // Load dynamic avatars if any
        if (avatarUrlsToLoad.size > 0) {
            let loadedCount = 0;
            const totalToLoad = avatarUrlsToLoad.size;

            avatarUrlsToLoad.forEach(url => {
                const key = `avatar_url_${encodeURIComponent(url)}`;
                if (!this.textures.exists(key)) {
                    this.load.image(key, url);
                } else {
                    loadedCount++;
                }
            });

            // Start loading if there are new assets
            if (loadedCount < totalToLoad) {
                this.load.once('complete', () => {
                    mappedPosts.forEach(post => this.createNPC(post));
                    this.game.events.emit('posts_loaded', mappedPosts);
                });
                this.load.start();
                return;
            }
        }

        // If no dynamic avatars or all already loaded
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

    private createNPC(post: any) {
        // Determine spawn position (random within lower half bounds)
        const width = this.scale.width;
        const height = this.scale.height;
        const padding = 50;

        const startX = Phaser.Math.Between(padding, width - padding);
        // Spawn ONLY in the bottom half (height/2 to height)
        const startY = Phaser.Math.Between(height / 2 + padding, height - padding);

        // Select avatar sprite based on prepared key
        let avatarKey = post.avatarKey;

        // Fallback calculation logic if key is not pre-calculated (for bots or legacy)
        if (!avatarKey) {
             const avatarInfo = this.getAvatarInfo(post.avatar_type);
             avatarKey = avatarInfo.key;
        }

        // Safety check: If texture is not loaded, fallback to default to avoid crash/green box
        if (!this.textures.exists(avatarKey)) {
            console.warn(`Avatar texture not found: ${avatarKey}. Using default.`);
            avatarKey = 'avatar4';
        }

        const npc = this.physics.add.sprite(startX, startY, avatarKey);

        // Scale NPC
        // If it's a URL-based avatar (from builder), it might be 800x800 or similar.
        // We need to scale it down significantly to fit the game world.
        if (avatarKey.startsWith('avatar_url_') || avatarKey.includes('dotto')) {
            npc.setDisplaySize(120, 120); 
            // Enable pixel art rendering mode if needed
            npc.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
        } else {
            // Standard SVGs
            npc.setScale(0.24); // approx 1.6x of 0.15 to match the increase 80->120ish
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
        npc.setInteractive({ useHandCursor: true, draggable: true });
        
        // Define drag state variables
        let isDragging = false;
        let dragStartTime = 0;
        (npc as any).isBeingDragged = false;
        let dangleTween: Phaser.Tweens.Tween | null = null;

        npc.on('dragstart', (pointer: Phaser.Input.Pointer) => {
            isDragging = true;
            dragStartTime = Date.now();
            (npc as any).isBeingDragged = true;
            
            // Stop physics
            npc.setVelocity(0);
            (npc.body as Phaser.Physics.Arcade.Body).moves = false;

            // Visual Effect: Dangle / Swing
            // Change origin to top-center to "hang"
            // Note: Changing origin might jump the sprite content, so we might need counter-offset or just rotate around center
            // Let's rotate around center for simplicity first to avoid position jumps
            
            dangleTween = this.tweens.add({
                targets: npc,
                angle: { from: -15, to: 15 },
                duration: 400,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            // Slightly Lift up
            npc.setScale(npc.scale * 1.1);
        });

        npc.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
            npc.x = dragX;
            npc.y = dragY;
            
            // Bubble will follow automatically via update() loop
        });

        npc.on('dragend', (pointer: Phaser.Input.Pointer) => {
            isDragging = false;
            (npc as any).isBeingDragged = false;
            const dragDuration = Date.now() - dragStartTime;

            // Re-enable physics
            (npc.body as Phaser.Physics.Arcade.Body).moves = true;
            
            // Restore scale
            npc.setScale(npc.scale / 1.1);

            // Stop dangling
            if (dangleTween) {
                dangleTween.stop();
                dangleTween = null;
            }
            // Reset angle
            this.tweens.add({
                targets: npc,
                angle: 0,
                duration: 200,
                ease: 'Power1'
            });

            // If it was a short click (not a drag), treat as click
            if (dragDuration < 200) {
                 this.game.events.emit('open_post', post);
            } else {
                // Drop effect? Maybe simple gravity will take over if bounds are set
                // Or give it a little toss velocity based on drag speed? (Simple version: just release)
            }
        });

        // Add Bubble
        // Increase offset because bubble is larger
        // Avatar is ~120px tall (center to top is ~60px). Bubble is 100px tall (center to bottom is 50px + pointer).
        // -130 Middle ground as requested.
        const bubbleOffsetY = -130;
        const bubble = this.add.container(startX, startY + bubbleOffsetY); 

        // Determine colors based on user_type
        // const isCompany = post.user_type === 'company';
        // const bubbleFillColor = isCompany ? 0xE3F2FD : 0xFFFFFF;
        // const bubbleStrokeColor = isCompany ? 0x2196F3 : 0x333333;

        // Bubble dimensions (Slightly wider for pixel look)
        const bWidth = 150;
        const bHeight = 100;
        // const radius = 10; // No radius for pixel style

        // Bubble shape
        const bubbleBg = this.add.graphics();
        // Removed old drawing logic, new logic is below where text is added
        
        // ... (Drawing moved to after text definition to layer correctly if needed, but graphics z-index is internal)
        // Actually, we need to draw it BEFORE adding to container so it's behind text?
        // Container adds children in order.
        
        bubble.add(bubbleBg);

        // Make bubble clickable
        const hitArea = new Phaser.Geom.Rectangle(-bWidth / 2, -bHeight / 2, bWidth, bHeight);
        bubble.setInteractive({
            hitArea: hitArea,
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            useHandCursor: true
        });
        
        bubble.on('pointerdown', () => {
            this.game.events.emit('open_post', post);
        });

        // Content Layout: Text Top (1 line), Image Bottom (Larger)

        // 1. Text (Top strip)
        // Truncate text to 10 chars max
        const truncatedContent = post.content.length > 10 ? post.content.substring(0, 10) + '...' : post.content;
        // Position text near the top
        const textY = -bHeight / 2 + 20; 
        
        const text = this.add.text(0, textY, truncatedContent, {
            color: '#111827', // gray-900
            fontSize: '14px', // Slightly larger for style
            fontStyle: 'bold',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"', // Clean sans-serif
            align: 'center',
            wordWrap: { width: bWidth - 10 }
        }).setOrigin(0.5);
        bubble.add(text);

        // 2. Image (Bottom ~3/4)
        if (post.image_url) {
            const imageKey = `post_image_${post.id}`;
            // Target area: Bottom part of the bubble
            // Start below text (approx 40px from top) to bottom (100px)
            // Available height approx 60px. Width approx 130px.
            const targetWidth = bWidth - 20;
            const targetHeight = bHeight - 40; // 100 - 40 = 60
            const imgY = 15; // Shifted down

            const addImageToBubble = () => {
                if (this.textures.exists(imageKey)) {
                    // Check if already added to avoid duplicates
                    if (bubble.getByName('post_image')) return;
                    
                    const img = this.add.image(0, imgY, imageKey);
                    img.setName('post_image');
                    
                    // Scale to fit nicely (cover or contain)
                    // Let's try to fill the width mostly
                    const scaleX = targetWidth / img.width;
                    const scaleY = targetHeight / img.height;
                    // Use cover-ish approach but constrained
                    const scale = Math.min(scaleX, scaleY);
                    
                    img.setScale(scale);
                    
                    // Masking if needed, but simple scaling is usually fine for pixel art style
                    // Just ensure it doesn't overflow borders visually
                    
                    bubble.add(img);
                }
            };
            
            if (!this.textures.exists(imageKey)) {
                this.load.image(imageKey, post.image_url);
                
                // Use a unique event for this specific file to avoid overlap duplications
                const eventKey = Phaser.Loader.Events.FILE_COMPLETE + '-image-' + imageKey;
                this.load.once(eventKey, () => {
                    addImageToBubble();
                });
                
                this.load.start();
            } else {
                addImageToBubble();
            }
        }

        // Add 3D effect shadow to bubble (pixel art style)
        // Draw shadow first so it's behind
        const shadowColor = 0x000000;
        const shadowOffset = 4;
        
        const bubbleShadow = this.add.graphics();
        bubbleShadow.fillStyle(shadowColor, 0.2);
        bubbleShadow.fillRoundedRect(-bWidth / 2 + shadowOffset, -bHeight / 2 + shadowOffset, bWidth, bHeight, 0); // Sharp corners for pixel feel or small radius
        // Actually, let's match the Search UI style: white bg, black border, sharp shadow
        bubbleShadow.clear();
        
        // Re-draw Bubble to match Search UI
        // Style: White background, 2px Black border, 4px solid shadow offset
        
        bubbleBg.clear();
        
        // Solid Shadow (Bottom-Right)
        bubbleBg.fillStyle(0x000000, 1);
        bubbleBg.fillRect(-bWidth / 2 + 4, -bHeight / 2 + 4, bWidth, bHeight);
        
        // Main Box (White)
        bubbleBg.fillStyle(0xFFFFFF, 1);
        bubbleBg.fillRect(-bWidth / 2, -bHeight / 2, bWidth, bHeight);
        
        // Border (Black 2px)
        bubbleBg.lineStyle(2, 0x111827, 1); // gray-900
        bubbleBg.strokeRect(-bWidth / 2, -bHeight / 2, bWidth, bHeight);
        
        // "Triangle" Pointer
        // For pixel art style, maybe just a small rect connector or keep the triangle but styled
        const pointerSize = 10;
        // Pointer Shadow
        bubbleBg.fillStyle(0x000000, 1);
        bubbleBg.beginPath();
        bubbleBg.moveTo(0 + 4, bHeight / 2 + 4);
        bubbleBg.lineTo(-pointerSize + 4, bHeight / 2 + 4);
        bubbleBg.lineTo(0 + 4, bHeight / 2 + pointerSize + 4);
        bubbleBg.fillPath();

        // Pointer Main
        bubbleBg.fillStyle(0xFFFFFF, 1);
        bubbleBg.beginPath();
        bubbleBg.moveTo(0, bHeight / 2); // Center bottom of box
        bubbleBg.lineTo(-pointerSize, bHeight / 2); // Left point on box edge
        bubbleBg.lineTo(0, bHeight / 2 + pointerSize); // Tip point
        bubbleBg.lineTo(pointerSize, bHeight / 2); // Right point on box edge
        bubbleBg.closePath();
        bubbleBg.fillPath();
        
        // Pointer Border lines (Manual drawing to avoid double lines at intersection)
        bubbleBg.lineStyle(2, 0x111827, 1);
        bubbleBg.beginPath();
        bubbleBg.moveTo(-pointerSize, bHeight / 2);
        bubbleBg.lineTo(0, bHeight / 2 + pointerSize);
        bubbleBg.lineTo(pointerSize, bHeight / 2);
        bubbleBg.strokePath();

        // Corner accents (optional pixel details like JobBoard)
        const cornerSize = 4;
        bubbleBg.fillStyle(0x111827, 1);
        // Top-Left inner
        bubbleBg.fillRect(-bWidth / 2 + 2, -bHeight / 2 + 2, 2, 2);
        // Top-Right inner
        bubbleBg.fillRect(bWidth / 2 - 4, -bHeight / 2 + 2, 2, 2);
        // Bottom-Left inner
        bubbleBg.fillRect(-bWidth / 2 + 2, bHeight / 2 - 4, 2, 2);
        // Bottom-Right inner
        bubbleBg.fillRect(bWidth / 2 - 4, bHeight / 2 - 4, 2, 2);

        // Update function for NPC movement
        this.events.on('update', () => {
             // Keep bubble above NPC
             // Note: bubble might be destroyed if scene changes, check if active
             if (bubble.scene && npc.scene) {
                 bubble.setPosition(npc.x, npc.y - 110);
             }
        });

        // Store references
        this.npcs.push({ sprite: npc, bubble });
    }

    update() {
        this.npcs.forEach(({ sprite, bubble }) => {
            if (!sprite.body) return; // Safety check

            // Update bubble position to follow NPC
            // Adjust offset based on new bubble size
            bubble.setPosition(sprite.x, sprite.y - 110);

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
                if (!(sprite as any).isBeingDragged) { // Only stop if not being dragged
                    sprite.setVelocity(0);
                }
            }
        });
    }
}
