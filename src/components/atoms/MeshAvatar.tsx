import React, {memo, useMemo} from 'react';
import {StyleSheet, View} from 'react-native';
import PrimaryText from './PrimaryText';

interface MeshAvatarProps {
  name: string;
  size?: number;
  bgColor: string;
  textColor: string;
  meshColor: string;
}

const GRID_COUNT = 12;
const LINE_OPACITY = 0.28;

const MeshAvatar: React.FC<MeshAvatarProps> = ({name, size = 40, bgColor, textColor, meshColor}) => {
  const initials = useMemo(
    () =>
      (name?.split(' ') ?? [])
        .map((n: string) => n.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase(),
    [name],
  );

  const fontSize = Math.round(size * 0.42);
  const step = size / GRID_COUNT;

  const lines = useMemo(() => {
    const arr = [];
    for (let i = 1; i < GRID_COUNT; i++) {
      const pos = Math.round(step * i);
      arr.push(
        <View key={`h${i}`} style={[styles.hLine, {top: pos, backgroundColor: meshColor}]} />,
        <View key={`v${i}`} style={[styles.vLine, {left: pos, backgroundColor: meshColor}]} />,
      );
    }
    return arr;
  }, [step, meshColor]);

  return (
    <View style={[styles.container, {width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor}]}>
      {lines}
      <PrimaryText size={fontSize} weight="bold" color={textColor} style={styles.initials}>
        {initials}
      </PrimaryText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  hLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    opacity: LINE_OPACITY,
  },
  vLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    opacity: LINE_OPACITY,
  },
  initials: {
    zIndex: 3,
  },
});

export default memo(MeshAvatar);
