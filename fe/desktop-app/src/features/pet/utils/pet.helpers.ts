export function formatPetCode(code: string) {
    return code.replace(/_/g, " ").toUpperCase();
}

export function getPetEmoji(code: string) {
    const lowerCode = code.toLowerCase();
    if (lowerCode.includes("dragon")) return "🐉";
    if (lowerCode.includes("cat")) return "🐈";
    if (lowerCode.includes("dog") || lowerCode.includes("shiba")) return "🐕";
    if (lowerCode.includes("fish")) return "🐠";
    return "🐾";
}

export function getPetTheme(code: string) {
    const lowerCode = code.toLowerCase();
    if (lowerCode.includes("dragon")) return "theme-pink";
    if (lowerCode.includes("shiba") || lowerCode.includes("dog")) return "theme-orange";
    if (lowerCode.includes("cat")) return "theme-purple";
    if (lowerCode.includes("fish")) return "theme-yellow";
    return "theme-blue";
}