import { COLORS } from '@/constants/Colors';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

const Card = ({ 
  children, 
  style, 
  padding = true, 
  shadow = true, 
  onPress, 
  ...props 
}) => {
  const cardStyle = [
    styles.card,
    padding && styles.cardPadding,
    shadow && styles.cardShadow,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} {...props}>
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  );
};


const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
  },
  cardPadding: {
    padding: 16,
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

});

export default Card;
