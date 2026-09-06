import React from 'react';
import {TouchableOpacity, View, StyleSheet} from 'react-native';

interface Props {
  onPress: () => void;
  disabled?: boolean;
}

const CaptureButton: React.FC<Props> = ({onPress, disabled = false}) => {
  return (
    <TouchableOpacity
      style={styles.outerCircle}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}>
      <View style={[styles.innerCircle, disabled && styles.disabled]} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  outerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  innerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  disabled: {
    backgroundColor: '#999',
  },
});

export default CaptureButton;
