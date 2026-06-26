import { writeFileSync } from "node:fs";
import { join } from "node:path";

const severities = ["low", "medium", "high", "critical"] as const;
const changes = [];
let id = 1;

const topics = [
  ["Metro config", "Update metro.config.js for new resolver", "expo", "metro-config"],
  ["Babel preset", "Update babel-preset-expo version", "babel-preset-expo"],
  ["React Native version", "Bump react-native to required version", "react-native"],
  ["New Architecture", "New Architecture default changes", "expo"],
  ["expo-router", "expo-router API changes", "expo-router"],
  ["Splash screen", "expo-splash-screen config migration", "expo-splash-screen"],
  ["Reanimated", "react-native-reanimated plugin config", "react-native-reanimated"],
  ["Gesture handler", "RNGH import path changes", "react-native-gesture-handler"],
  ["Screens", "react-native-screens native API", "react-native-screens"],
  ["Safe area", "SafeAreaView deprecation", "react-native-safe-area-context"],
  ["Async storage", "AsyncStorage migration guide", "@react-native-async-storage/async-storage"],
  ["Gradle plugin", "Android Gradle Plugin version", "expo"],
  ["iOS deployment", "Minimum iOS deployment target", "expo"],
  ["Hermes engine", "Hermes version bump", "react-native"],
  ["Edge to edge", "Android edge-to-edge default", "expo"],
  ["Privacy manifest", "iOS PrivacyInfo.xcprivacy required", "expo"],
  ["16KB pages", "Android 16KB page size requirement", "react-native"],
  ["Expo modules", "expo-modules-core API changes", "expo-modules-core"],
  ["App config", "app.config.js schema changes", "expo"],
  ["EAS Build", "EAS build image requirements", "eas-cli"],
  ["Notifications", "expo-notifications permission API", "expo-notifications"],
  ["Camera module", "expo-camera permission model", "expo-camera"],
  ["Location module", "expo-location background modes", "expo-location"],
  ["File system", "expo-file-system path changes", "expo-file-system"],
  ["Updates module", "expo-updates runtime version", "expo-updates"],
  ["Dev client", "expo-dev-client build changes", "expo-dev-client"],
  ["SVG", "react-native-svg breaking props", "react-native-svg"],
  ["WebView", "react-native-webview props changes", "react-native-webview"],
  ["Maps", "react-native-maps provider config", "react-native-maps"],
  ["Sentry", "@sentry/react-native init API", "@sentry/react-native"],
  ["Navigation", "@react-navigation v7 changes", "@react-navigation/native"],
  ["Firebase", "@react-native-firebase modular API", "@react-native-firebase/app"],
  ["Stripe", "@stripe/stripe-react-native payment sheet", "@stripe/stripe-react-native"],
  ["RevenueCat", "react-native-purchases v8 migration", "react-native-purchases"],
  ["Lottie", "lottie-react-native v7", "lottie-react-native"],
  ["MMKV", "react-native-mmkv encryption API", "react-native-mmkv"],
  ["Vision camera", "Frame processor API", "react-native-vision-camera"],
  ["Skia", "@shopify/react-native-skia version", "@shopify/react-native-skia"],
  ["FlashList", "@shopify/flash-list v2 changes", "@shopify/flash-list"],
  ["Keyboard controller", "react-native-keyboard-controller inset", "react-native-keyboard-controller"],
  ["CodePush", "CodePush EOL migration to EAS Update", "react-native-code-push"],
  ["Jest", "jest-expo preset changes", "jest-expo"],
  ["NativeWind", "NativeWind v4 migration", "nativewind"],
  ["Tamagui", "Tamagui Expo SDK 52", "tamagui"],
  ["Router v4", "expo-router v4 file-based routing", "expo-router"],
  ["Image SDK 52", "expo-image v2 caching", "expo-image"],
  ["Video SDK 52", "expo-video replaces expo-av", "expo-video"],
  ["Audio SDK 52", "expo-audio replaces expo-av audio", "expo-audio"],
];

for (let from = 49; from <= 52; from++) {
  const to = from + 1;
  for (let i = 0; i < topics.length; i++) {
    const [title, desc, ...pkgs] = topics[i]!;
    changes.push({
      id: `BC-${String(id++).padStart(3, "0")}`,
      fromSdk: from,
      toSdk: to,
      title: `SDK ${from}→${to}: ${title}`,
      description: desc,
      affectedPackages: pkgs,
      severity: severities[i % 4]!,
      fixHint: i % 3 === 0 ? `See Expo SDK ${to} changelog` : undefined,
    });
  }
}

const out = join(import.meta.dir, "..", "data", "breaking-changes.json");
writeFileSync(out, `${JSON.stringify({ version: "0.1.0", changes }, null, 2)}\n`);
console.log(`Wrote ${changes.length} breaking changes to ${out}`);
