module.exports = function (config) {
  // Plugin necessário para react-native-webrtc funcionar com Expo
  return {
    ...config,
    android: {
      ...config.android,
      permissions: [
        ...(config.android?.permissions || []),
        'android.permission.CAMERA',
        'android.permission.RECORD_AUDIO',
        'android.permission.ACCESS_NETWORK_STATE',
        'android.permission.CHANGE_NETWORK_STATE',
        'android.permission.MODIFY_AUDIO_SETTINGS',
        'android.permission.INTERNET',
      ],
    },
  };
};
