import { COLORS } from '@/constants/Colors';
import { fetchHistoriqueLivraisons } from '@/redux/livraisonSlice';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';



export default function HistoriqueScreen() {
  // ✅ Récupération complète du state livraison
  const livraisonState = useSelector(state => state.livraison);
  const { historiqueLivraisons, historiqueLoading, historiqueError } = livraisonState;
  
  const [refreshing, setRefreshing] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState('week');
  const user = useSelector(state => state.auth.user);
  const livreurId = user?.id;
  const dispatch = useDispatch();

  console.debug("historiqueLivraisons:", livreurId);
  // ✅ Log détaillé des données si elles existent
  if (historiqueLivraisons && historiqueLivraisons.length > 0) {
    console.log("📦 Première livraison détaillée:");
    console.log(JSON.stringify(historiqueLivraisons[0], null, 2));
  }

  useEffect(() => {
    console.log("🔄 useEffect déclenché - loadHistorique");
    if (livreurId) {
      loadHistorique(livreurId);
    } else {
      console.log("❌ Pas de livreurId dans useEffect");
    }
  }, [livreurId, filterPeriod]);
  
  useFocusEffect(
    React.useCallback(() => {
      console.log("🔄 useFocusEffect déclenché");
      if (livreurId) {
        loadHistorique(livreurId);
      }
    }, [livreurId, filterPeriod])
  );
  
  const loadHistorique = async (livreurId) => {
    console.log(`📜 === DEBUT loadHistorique ===`);
    console.log(`📜 livreurId: ${livreurId}, period: ${filterPeriod}`);
    
    try {
      const action = { livreurId, period: filterPeriod };
      console.log("📡 Action à dispatcher:", action);
      
      const result = await dispatch(fetchHistoriqueLivraisons(action));
      
  
      
      if (fetchHistoriqueLivraisons.fulfilled.match(result)) {
        console.log("✅ loadHistorique réussi");
        console.log("✅ Données reçues:", result.payload);
      } else if (fetchHistoriqueLivraisons.rejected.match(result)) {
        console.error("❌ loadHistorique échoué:", result.payload);
        console.error("❌ Erreur complète:", result.error);
      } else {
        console.warn("⚠️ Résultat inattendu:", result);
      }
    } catch (error) {
    }
    
    console.log(`📜 === FIN loadHistorique ===`);
  };
  
  const onRefresh = React.useCallback(async () => {
    if (!livreurId) {
      return;
    }
    
    setRefreshing(true);
    
    try {
      await dispatch(fetchHistoriqueLivraisons({ livreurId, period: filterPeriod }));
      console.log("✅ Refresh terminé");
    } catch (error) {
      console.error("❌ Erreur refresh:", error);
      Alert.alert('Erreur', 'Impossible de rafraîchir l\'historique');
    } finally {
      setRefreshing(false);
      console.log("🔄 === FIN REFRESH ===");
    }
  }, [filterPeriod, livreurId, dispatch]);

  const handlePeriodChange = (newPeriod) => {
    console.log(`📅 Changement période: ${filterPeriod} -> ${newPeriod}`);
    setFilterPeriod(newPeriod);
  };

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

  // ✅ RENDERITEM AVEC GESTION DEFENSIVE ET DEBUG
  const renderHistoriqueItem = ({ item, index }) => {
    console.log(`🎨 Render item ${index}:`, JSON.stringify(item, null, 2));
    
    // ✅ Gestion défensive des données
    const commandeData = item.commande || item;
    const livraisonId = item.id || `temp-${index}`;
    const commandeId = commandeData.id || item.commandeId || 'N/A';
    const prix = commandeData.prix || item.prix || 'N/A';
    const heureLivraison = item.heureLivraison || item.createdAt || new Date().toISOString();
    
    // Debug des données extraites
    console.log(`🔍 Item ${index} - commandeData:`, commandeData);
    console.log(`🔍 Item ${index} - prix: ${prix}, commandeId: ${commandeId}`);
    
    return (
      <View style={styles.historiqueCard}>
        <View style={styles.cardHeader}>
          <View style={styles.commandeInfo}>
            <Text style={styles.commandeId}>Commande #{commandeId}</Text>
            <Text style={styles.dateText}>
              {new Date(heureLivraison).toLocaleDateString('fr-FR')}
            </Text>
          </View>
          <Text style={styles.montant}>{prix} FCFA</Text>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.addressRow}>
            <Ionicons name="restaurant" size={16} color={COLORS.secondary} />
            <Text style={styles.addressText} numberOfLines={1}>
              {commandeData.plat?.categorie?.menu?.restaurant?.name || 
               commandeData.plat?.restaurant?.name || 
               commandeData.plat?.name || 
               'Restaurant'}
            </Text>
          </View>
          
          <View style={styles.addressRow}>
            <Ionicons name="location" size={16} color={COLORS.primary} />
            <Text style={styles.addressText} numberOfLines={1}>
              {commandeData.position || 'Position non définie'}
            </Text>
          </View>
          <View style={styles.clientRow}>
            <Ionicons name="person" size={16} color={COLORS.gray} />
            <Text style={styles.clientText}>
              {commandeData.user?.username || 'Client'} - {commandeData.user?.phone}
            </Text>
          </View>
        </View>

        <View style={styles.historiqueFooter}>
          <View style={styles.timeInfo}>
            <Text style={styles.timeLabel}>Durée:</Text>
            <Text style={styles.timeValue}>
              {item.heureAssignation 
                ? Math.round((new Date(heureLivraison) - new Date(item.heureAssignation)) / 60000)
                : '--'
              } min
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
  };

  // ✅ VÉRIFICATIONS AVANT RENDU
  console.log("🎭 === AVANT RENDU ===");
  console.log("🎭 Condition loading:", historiqueLoading && !refreshing);
  console.log("🎭 Condition error:", !!historiqueError);
  console.log("🎭 Condition empty:", !historiqueLivraisons || historiqueLivraisons.length === 0);
  console.log("🎭 Condition normale:", historiqueLivraisons && historiqueLivraisons.length > 0);

  // ✅ Loading state
  if (historiqueLoading && !refreshing) {
    console.log("🎭 RENDU: Loading");
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Historique</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Chargement de l'historique...</Text>
        </View>
      </View>
    );
  }

  // ✅ Rendu principal
  console.log("🎭 RENDU: Principal");
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Historique</Text>
        <Text style={styles.subtitle}>
          {historiqueLivraisons?.length || 0} livraison{(historiqueLivraisons?.length || 0) !== 1 ? 's' : ''} terminée{(historiqueLivraisons?.length || 0) !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Filtres */}
      <View style={styles.filterContainer}>
        <FilterButton
          period="week"
          label="Cette semaine"
          isActive={filterPeriod === 'week'}
          onPress={() => handlePeriodChange('week')}
        />
        <FilterButton
          period="month"
          label="Ce mois"
          isActive={filterPeriod === 'month'}
          onPress={() => handlePeriodChange('month')}
        />
        <FilterButton
          period="all"
          label="Tout"
          isActive={filterPeriod === 'all'}
          onPress={() => handlePeriodChange('all')}
        />
      </View>

      {/* Debug info (à retirer en production) */}
      <View style={{ padding: 10, backgroundColor: '#f0f0f0', margin: 10 }}>
        <Text style={{ fontSize: 12, color: '#666' }}>
          DEBUG: {historiqueLivraisons?.length || 0} items | Loading: {historiqueLoading ? 'OUI' : 'NON'} | Error: {historiqueError || 'NONE'}
        </Text>
      </View>

      {/* Gestion des erreurs */}
      {historiqueError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Erreur: {historiqueError}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => loadHistorique(livreurId)}
          >
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Liste ou état vide */}
      {(!historiqueLivraisons || historiqueLivraisons.length === 0) ? (
        <View style={styles.emptyState}>
          <Ionicons name="time" size={80} color={COLORS.gray} />
          <Text style={styles.emptyTitle}>Aucun historique</Text>
          <Text style={styles.emptyText}>
            Vos livraisons terminées apparaîtront ici.
          </Text>
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={onRefresh}
          >
            <Ionicons name="refresh" size={20} color={COLORS.primary} />
            <Text style={styles.refreshButtonText}>Actualiser</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={historiqueLivraisons}
          renderItem={renderHistoriqueItem}
          keyExtractor={(item, index) => item.id?.toString() || `item-${index}`}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}


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


  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  
  // ✅ NOUVEAU: Loading Text
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.gray || '#6c757d',
    fontWeight: '500',
  },
  errorContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: COLORS.error + '10' || '#dc354520',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error || '#dc3545',
    alignItems: 'center',
  },

  errorText: {
    fontSize: 14,
    color: COLORS.error || '#dc3545',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: COLORS.error || '#dc3545',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  
  // ✅ NOUVEAU: Retry Text
  retryText: {
    color: COLORS.white || '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
   refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10' || '#007bff10',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary || '#007bff',
  },
  refreshButtonText: {
    marginLeft: 12,
    fontSize: 14,
    color: COLORS.primary || '#007bff',
    fontWeight: '600',
  },


});