import { COLORS } from '@/constants/Colors';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';


export const HistoriqueScreen = () => {
  const dispatch = useDispatch();
  const { historiqueLivraisons } = useSelector((state) => state.livraison);
  const [refreshing, setRefreshing] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState('week'); // week, month, all

  useEffect(() => {
    loadHistorique();
  }, []);

  const loadHistorique = () => {
    dispatch(fetchHistoriqueLivraisons(filterPeriod));
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    dispatch(fetchHistoriqueLivraisons(filterPeriod)).finally(() => setRefreshing(false));
  }, [filterPeriod]);

  const FilterButton = ({ period, label, isActive, onPress }) => (
    <TouchableOpacity
      style={[styles.filterButton, isActive && styles.activeFilterButton]}
      onPress={onPress}
    >
      <Text style={[styles.filterText, isActive && styles.activeFilterText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderHistoriqueItem = ({ item }) => (
    <View style={styles.historiqueCard}>
      <View style={styles.cardHeader}>
        <View style={styles.commandeInfo}>
          <Text style={styles.commandeId}>Commande #{item.commande.id}</Text>
          <Text style={styles.dateText}>
            {new Date(item.heureLivraison).toLocaleDateString('fr-FR')}
          </Text>
        </View>
        <Text style={styles.montant}>{item.commande.prix} FCFA</Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.addressRow}>
          <Ionicons name="restaurant" size={16} color={COLORS.secondary} />
          <Text style={styles.addressText} numberOfLines={1}>
            {item.commande.plat.restaurant.name}
          </Text>
        </View>
        
        <View style={styles.addressRow}>
          <Ionicons name="location" size={16} color={COLORS.primary} />
          <Text style={styles.addressText} numberOfLines={1}>
            {item.commande.position}
          </Text>
        </View>
      </View>

      <View style={styles.historiqueFooter}>
        <View style={styles.timeInfo}>
          <Text style={styles.timeLabel}>Durée:</Text>
          <Text style={styles.timeValue}>
            {Math.round((new Date(item.heureLivraison) - new Date(item.heureAssignation)) / 60000)} min
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: COLORS.success + '20' }]}>
          <Text style={[styles.statusText, { color: COLORS.success }]}>
            Livrée
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Historique</Text>
      </View>

      {/* Filtres */}
      <View style={styles.filterContainer}>
        <FilterButton
          period="week"
          label="Cette semaine"
          isActive={filterPeriod === 'week'}
          onPress={() => setFilterPeriod('week')}
        />
        <FilterButton
          period="month"
          label="Ce mois"
          isActive={filterPeriod === 'month'}
          onPress={() => setFilterPeriod('month')}
        />
        <FilterButton
          period="all"
          label="Tout"
          isActive={filterPeriod === 'all'}
          onPress={() => setFilterPeriod('all')}
        />
      </View>

      {historiqueLivraisons.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="time" size={80} color={COLORS.gray} />
          <Text style={styles.emptyTitle}>Aucun historique</Text>
          <Text style={styles.emptyText}>
            Vos livraisons terminées apparaîtront ici.
          </Text>
        </View>
      ) : (
        <FlatList
          data={historiqueLivraisons}
          renderItem={renderHistoriqueItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  header: {
    backgroundColor: COLORS.white,
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4,
  },
  listContainer: {
    padding: 20,
  },
  livraisonCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historiqueCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  commandeInfo: {
    flex: 1,
  },
  commandeId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  montant: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  cardBody: {
    marginBottom: 10,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  addressText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.dark,
    flex: 1,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  clientText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.gray,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.light,
  },
  historiqueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.light,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginRight: 5,
  },
  timeValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.white,
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.light,
    marginRight: 10,
  },
  activeFilterButton: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  activeFilterText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  profileHeader: {
    backgroundColor: COLORS.white,
    alignItems: 'center',
    padding: 30,
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 5,
  },
  profilePhone: {
    fontSize: 14,
    color: COLORS.gray,
  },
  statsSection: {
    backgroundColor: COLORS.white,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 5,
  },
  actionsSection: {
    backgroundColor: COLORS.white,
    padding: 20,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
  },
  actionText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    color: COLORS.dark,
  },
});