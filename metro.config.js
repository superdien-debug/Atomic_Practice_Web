const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Fix for react-native-render-html and @jsamr/counter-style resolution errors
config.resolver.sourceExts.push('mjs');

// Add support for parsing PDF and additional audio formats
if (!config.resolver.assetExts.includes('pdf')) {
    config.resolver.assetExts.push('pdf');
}
if (!config.resolver.assetExts.includes('mp3')) {
    config.resolver.assetExts.push('mp3');
}
if (!config.resolver.assetExts.includes('wav')) {
    config.resolver.assetExts.push('wav');
}

// Custom resolver to handle @jsamr packages on Windows/Modern RN
config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName.startsWith('@jsamr/counter-style/presets/')) {
        const presetName = moduleName.split('/').pop();
        // Redirect to the actual file in cjs folder which is more reliable for Metro
        return context.resolveRequest(
            context,
            `@jsamr/counter-style/lib/cjs/presets/${presetName}`,
            platform
        );
    }
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
