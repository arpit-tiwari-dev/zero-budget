import {NavigationContainerRef, CommonActions} from '@react-navigation/native';
import type {HomeStackParamList, OnboardingStackParamList} from '../navigation/types';

type AllScreens = HomeStackParamList & OnboardingStackParamList;

let navigationRef: NavigationContainerRef<HomeStackParamList> | null = null;

export const setNavigationRef = (ref: NavigationContainerRef<HomeStackParamList>) => {
  navigationRef = ref;
};

export const navigate = <T extends keyof AllScreens>(
  name: T,
  ...args: AllScreens[T] extends undefined ? [] : [AllScreens[T]]
) => {
  if (navigationRef) {
    navigationRef.dispatch(CommonActions.navigate({name: name as string, params: args[0]}));
  } else if (__DEV__) {
    console.error(
      'Navigation reference is not set. Make sure to call setNavigationRef.',
    );
  }
};

export const goBack = (action?: () => any) => {
  if (navigationRef) {
    navigationRef.dispatch(CommonActions.goBack());
  } else if (__DEV__) {
    console.error(
      'Navigation reference is not set. Make sure to call setNavigationRef.',
    );
  }
  if (typeof action === 'function') {
    action();
  }
};
