export function getAvatarUrl(avatarType: string | null | undefined): string {
    if (!avatarType) {
        return '/images/character_murabito_young_man_blue.svg'; // Default
    }

    // 1. HTTP/HTTPS URL
    if (avatarType.startsWith('http://') || avatarType.startsWith('https://')) {
        return avatarType;
    }

    // 2. Legacy Avatar Keys Mapping
    switch (avatarType) {
        case 'avatar1':
            return '/images/character_murabito_middle_man_blue.svg';
        case 'avatar2':
            return '/images/character_murabito_middle_woman_blue.svg';
        case 'avatar3':
            return '/images/character_murabito_senior_man_blue.svg';
        case 'avatar4':
            return '/images/character_murabito_young_man_blue.svg';
    }

    // 3. Check for specific partial matches (legacy support if needed, based on PlazaScene)
    if (avatarType.includes('woman')) return '/images/character_murabito_middle_woman_blue.svg';
    if (avatarType.includes('senior')) return '/images/character_murabito_senior_man_blue.svg';

    // 4. Default to assuming it's a file in /images/
    // If it already starts with /images/, leave it
    if (avatarType.startsWith('/images/')) {
        return avatarType;
    }
    
    return `/images/${avatarType}`;
}
