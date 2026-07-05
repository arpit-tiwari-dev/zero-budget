import {Platform} from 'react-native';
import {appendErrorLog} from './errorLog';

const g = globalThis as any;

const defaultHandler = g.ErrorUtils?.getGlobalHandler?.();

g.ErrorUtils?.setGlobalHandler?.(
  (error: Error, isFatal?: boolean) => {
    appendErrorLog(error, !!isFatal);

    if (__DEV__) {
      console.error('[GlobalErrorHandler]', isFatal ? 'FATAL' : 'NON-FATAL', error);
      defaultHandler?.(error, isFatal);
      return;
    }

    if (!isFatal) {
      return;
    }

    if (Platform.OS === 'android') {
      return;
    }

    defaultHandler?.(error, isFatal);
  },
);

if (!__DEV__) {
  g.onunhandledrejection = (event: any) => {
    if (event?.reason instanceof Error) {
      appendErrorLog(event.reason, false);
    }
    event?.preventDefault?.();
  };
}
