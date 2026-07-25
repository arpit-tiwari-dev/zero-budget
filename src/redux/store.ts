import {configureStore} from '@reduxjs/toolkit';
import {persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER} from 'redux-persist';
import rootReducer from './rootReducer';
import mmkvStorage from './mmkvStorage';

// Hybrid persistence strategy:
// - redux-persist (MMKV-backed): monthSelection only — survives app restarts
// - Sync MMKV via StorageService: isOnboarded — read at slice init, never in whitelist
// - ThemeContext + MMKV: theme preference — managed outside Redux entirely
// - WatermelonDB: all domain data (expenses, categories, etc.) — source of truth
const persistConfig = {
  key: 'root',
  storage: mmkvStorage,
  whitelist: ['monthSelection'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  enhancers: getDefaultEnhancers =>
    getDefaultEnhancers({
      autoBatch: {type: 'tick'},
    }),
});

export const persistor = persistStore(store);

export type AppDispatch = typeof store.dispatch;

export default store;
