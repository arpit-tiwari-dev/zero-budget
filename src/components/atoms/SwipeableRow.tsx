import {TouchableOpacity} from 'react-native-gesture-handler';
import React, {useCallback, useRef, memo} from 'react';
import Animated, {SharedValue, useAnimatedStyle, interpolate} from 'react-native-reanimated';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import type {SwipeableMethods} from 'react-native-gesture-handler/ReanimatedSwipeable';
import Icon from './Icons';
import {gs} from '../../styles/globalStyles';

const ACTION_WIDTH = 50;
const EDGE_INSET = 16;

interface SwipeableRowProps {
  onEdit?: () => void;
  onDelete?: () => void;
  children: React.ReactNode;
  colors: {
    accentGreen: string;
    accentOrange: string;
    lightAccent: string;
  };
  swipeRef?: React.RefObject<SwipeableMethods | null>;
  openSwipeableRef?: React.RefObject<{close: () => void} | null>;
  edgeToEdge?: boolean;
}

const SwipeAction = memo(({
  progress,
  iconName,
  iconColor,
  backgroundColor,
  side,
  onPress,
  edgeToEdge = false,
}: {
  progress: SharedValue<number>;
  iconName: string;
  iconColor: string;
  backgroundColor: string;
  side: 'left' | 'right';
  onPress: () => void;
  edgeToEdge?: boolean;
}) => {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.6, 1], [0, 0.8, 1]),
    transform: [{scale: interpolate(progress.value, [0, 1], [0.6, 1])}],
  }));

  const extraPadding = edgeToEdge ? EDGE_INSET : 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        gs.center,
        {
          flex: 1,
          width: ACTION_WIDTH + extraPadding,
          paddingLeft: side === 'left' ? extraPadding : 0,
          paddingRight: side === 'right' ? extraPadding : 0,
        },
      ]}>
      <Animated.View style={[gs.size40, gs.roundedFull, gs.center, animatedStyle, {backgroundColor}]}>
        <Icon name={iconName} size={18} color={iconColor} />
      </Animated.View>
    </TouchableOpacity>
  );
});

const SwipeableRow: React.FC<SwipeableRowProps> = memo(({
  onEdit,
  onDelete,
  children,
  colors,
  swipeRef,
  openSwipeableRef,
  edgeToEdge = false,
}) => {
  const localRef = useRef<SwipeableMethods | null>(null);
  const combinedRef = swipeRef ?? localRef;

  const handleSwipeWillOpen = useCallback(() => {
    if (openSwipeableRef?.current && openSwipeableRef.current !== combinedRef.current) {
      openSwipeableRef.current.close();
    }
    if (openSwipeableRef) {
      openSwipeableRef.current = combinedRef.current;
    }
  }, [openSwipeableRef, combinedRef]);

  return (
    <ReanimatedSwipeable
      ref={combinedRef}
      renderLeftActions={
        onEdit
          ? (progress, _translation, swipeableMethods) => (
              <SwipeAction
                progress={progress}
                iconName="pencil"
                iconColor={colors.accentGreen}
                backgroundColor={colors.lightAccent}
                side="left"
                edgeToEdge={edgeToEdge}
                onPress={() => {
                  onEdit();
                  swipeableMethods.close();
                }}
              />
            )
          : undefined
      }
      renderRightActions={
        onDelete
          ? (progress, _translation, swipeableMethods) => (
              <SwipeAction
                progress={progress}
                iconName="trash-2"
                iconColor={colors.accentOrange}
                backgroundColor={colors.lightAccent}
                side="right"
                edgeToEdge={edgeToEdge}
                onPress={() => {
                  onDelete();
                  swipeableMethods.close();
                }}
              />
            )
          : undefined
      }
      onSwipeableWillOpen={handleSwipeWillOpen}
      friction={2}
      overshootLeft={false}
      overshootRight={false}
      overshootFriction={8}>
      {children}
    </ReanimatedSwipeable>
  );
});

export default SwipeableRow;
export type {SwipeableRowProps};
