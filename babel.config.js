module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo reads `experiments.reactCompiler` from app.json and
    // injects the react-native-worklets/reanimated plugin automatically.
    presets: ['babel-preset-expo'],
  };
};
