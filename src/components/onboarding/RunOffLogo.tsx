import { Image, StyleSheet, View } from 'react-native';

const MAIN_LOGO = require('../../../assets/icons/main-logo.png');

const LOGO_ASPECT_RATIO =
  Image.resolveAssetSource(MAIN_LOGO).width / Image.resolveAssetSource(MAIN_LOGO).height;

type RunOffLogoProps = {
  size?: number;
};

export function RunOffLogo({ size = 72 }: RunOffLogoProps) {
  return (
    <View style={styles.container}>
      <Image
        accessibilityLabel="Run Off"
        resizeMode="contain"
        source={MAIN_LOGO}
        style={{ height: size, width: size * LOGO_ASPECT_RATIO }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
});
