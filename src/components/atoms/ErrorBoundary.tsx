import React, {Component, ErrorInfo, ReactNode} from 'react';
import {View, TouchableOpacity, StyleSheet, Appearance} from 'react-native';
import i18n from 'i18next';
import PrimaryText from './PrimaryText';
import {appendErrorLog} from '../../utils/errorLog';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {hasError: false};
  }

  static getDerivedStateFromError(): State {
    return {hasError: true};
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    appendErrorLog(error, true);
    if (__DEV__) {
      console.error('ErrorBoundary caught:', error, info.componentStack);
    }
  }

  handleRetry = () => {
    this.setState({hasError: false});
  };

  render() {
    if (this.state.hasError) {
      const isDark = Appearance.getColorScheme() === 'dark';
      return (
        <View style={[styles.container, {backgroundColor: isDark ? '#000' : '#fff'}]}>
          <PrimaryText size={40} weight="bold" color={isDark ? '#fff' : '#000'}>:(</PrimaryText>
          <PrimaryText size={16} weight="semibold" color={isDark ? '#fff' : '#000'} style={styles.title}>
            {i18n.t('errorBoundary.title')}
          </PrimaryText>
          <PrimaryText size={13} color="#888" style={styles.subtitle}>
            {i18n.t('errorBoundary.message')}
          </PrimaryText>
          <TouchableOpacity onPress={this.handleRetry} style={styles.button} activeOpacity={0.7}>
            <PrimaryText size={14} weight="semibold" color="#fff">
              {i18n.t('errorBoundary.retry')}
            </PrimaryText>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#22c55e',
  },
});

export default ErrorBoundary;
