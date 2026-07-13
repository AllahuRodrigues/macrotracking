module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // Reanimated 4 uses the worklets plugin — must stay last.
      "react-native-worklets/plugin",
    ],
  };
};
