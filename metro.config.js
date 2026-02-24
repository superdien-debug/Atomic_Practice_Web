const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Fix for react-native-render-html and @jsamr/counter-style resolution errors
config.resolver.sourceExts.push('mjs');

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
