import { COLORS } from '@/constants/Colors';
import { StyleSheet, Text } from 'react-native';

const StatusBadge = ({ status, style }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'ASSIGNEE':
        return { color: COLORS.secondary, text: 'Assignée', bg: COLORS.secondary + '20' };
      case 'EN_COURS':
        return { color: COLORS.primary, text: 'En cours', bg: COLORS.primary + '20' };
      case 'LIVREE':
        return { color: COLORS.success, text: 'Livrée', bg: COLORS.success + '20' };
      case 'ANNULEE':
        return { color: COLORS.error, text: 'Annulée', bg: COLORS.error + '20' };
      default:
        return { color: COLORS.gray, text: status, bg: COLORS.gray + '20' };
    }
  };

  const config = getStatusConfig(status);

  return (
    <View style={[styles.statusBadge, { backgroundColor: config.bg }, style]}>
      <Text style={[styles.statusText, { color: config.color }]}>
        {config.text}
      </Text>
    </View>
  );
};


const styles = StyleSheet.create({
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default StatusBadge;
