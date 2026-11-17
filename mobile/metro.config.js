// Aperçu web (npm run web) : remplace les modules qui n'existent que sur téléphone
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const config = getDefaultConfig(__dirname);
const stubs = {
  'react-native-maps': path.resolve(__dirname, 'apercu-web/carte.js'),
  'expo-secure-store': path.resolve(__dirname, 'apercu-web/secure-store.js'),
};
const original = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && stubs[moduleName]) return { type: 'sourceFile', filePath: stubs[moduleName] };
  return (original ?? context.resolveRequest)(context, moduleName, platform);
};
module.exports = config;
