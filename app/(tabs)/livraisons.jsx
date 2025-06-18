import { COLORS } from '@/constants/Colors';
import { getCommandesAsync, updateCommandeStatusAsync } from '@/redux/commandeSlice';
import {
  fetchActiveLivraisons,
} from '@/redux/livraisonSlice';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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


export default function LivraisonsScreen() {

const commandesDisponibles = useSelector(state => state.commande.commandes);
const activeLivraisons = useSelector((state) => state.livraison.activeLivraisons);
  const { 
    loading, 
    commandesDisponiblesLoading, 
    activeLivraisonsLoading 
  } = useSelector((state) => state.livraison);
  const livreur = useSelector((state) => state.auth.user);
  const livreurId = livreur?.id;
  
  // ✅ États locaux simplifiés
  const [activeTab, setActiveTab] = useState('disponibles');
  const [refreshing, setRefreshing] = useState(false);
  const dispatch = useDispatch();
console.log("commandesDisponibles Data:", commandesDisponibles);

useEffect(() => {
  dispatch(getCommandesAsync());
}, [dispatch]);


  // ✅ Fonction pour accepter une commande avec Redux
  const handleAccepterCommande = useCallback(async (commandeId) => {
    if (!livreurId) {
      Alert.alert('Erreur', 'Identifiant livreur manquant');
      return;
    }

    try {
      console.log(`📦 Acceptation commande ${commandeId}...`);
      
      const result = await dispatch(updateCommandeStatusAsync({ 
        id: commandeId, 
        status: 'VALIDER' 
      }));

      if (updateCommandeStatusAsync.fulfilled.match(result)) {
        Alert.alert(
          'Succès ! 🎉',
          'Commande acceptée avec succès !',
          [
            {
              text: 'Voir mes livraisons',
              onPress: () => setActiveTab('mes_livraisons')
            },
            {
              text: 'Continuer',
              onPress: () => router.push(`../livraison/${commandeId}`)
            }
          ]
        );
      } else {
        Alert.alert('Erreur', result.payload || 'Impossible d\'accepter la commande');
      }
    } catch (error) {
      console.error('❌ Erreur acceptation:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    }
  }, [dispatch, livreurId]);

  // ✅ Fonction de rafraîchissement avec Redux
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    
    if (livreurId) {
      let refreshAction;
      
      if (activeTab === 'disponibles') {
        refreshAction = dispatch(getCommandesAsync());
      } else {
        refreshAction = dispatch(fetchActiveLivraisons(livreurId));
      }
      
      refreshAction.finally(() => setRefreshing(false));
    } else {
      setRefreshing(false);
    }
  }, [livreurId, activeTab, dispatch]);

  // ✅ Debug des données Redux
 
  // ✅ Obtenir la couleur du statut
  const getStatusColor = (status) => {
    switch (status) {
      case 'EN_ATTENTE':
        return COLORS.warning;
      case 'ACCEPTEE':
      case 'ASSIGNEE':
        return COLORS.info;
      case 'EN_COURS':
        return COLORS.primary;
      case 'LIVREE':
        return COLORS.success;
      default:
        return COLORS.gray;
    }
  };

  // ✅ Obtenir le texte du statut
  const getStatusText = (status) => {
    switch (status) {
      case 'EN_ATTENTE':
        return 'Disponible';
      case 'ACCEPTEE':
        return 'Acceptée';
      case 'ASSIGNEE':
        return 'Assignée';
      case 'EN_COURS':
        return 'En cours';
      case 'LIVREE':
        return 'Livrée';
      default:
        return status;
    }
  };

  // ✅ Calculer le temps écoulé
  const getTimeAgo = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMinutes = Math.floor((now - past) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes}min`;
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`;
    return `Il y a ${Math.floor(diffInMinutes / 1440)}j`;
  };

  // ✅ Rendu d'une commande disponible
  const renderCommandeDisponible = ({ item }) => {
  
    return (
      <View style={styles.commandeCard}>
        <View style={styles.cardHeader}>
          <View style={styles.commandeInfo}>
            <Text style={styles.commandeId}>Commande #{item.id}</Text>
            <Text style={styles.timeAgo}>{getTimeAgo(item.createdAt)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {getStatusText(item.status)}
              </Text>
            </View>
          </View>
          <Text style={styles.montant}>{item.prix} FCFA</Text>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.addressRow}>
            <Ionicons name="restaurant" size={16} color={COLORS.secondary} />
            <Text style={styles.addressText} numberOfLines={2}>
              {item.plat?.name || 'Restaurant'}
            </Text>
          </View>
          
          <View style={styles.addressRow}>
            <Ionicons name="location" size={16} color={COLORS.primary} />
            <Text style={styles.addressText} numberOfLines={2}>
              {item.position || 'Adresse non spécifiée'}
            </Text>
          </View>

          <View style={styles.clientRow}>
            <Ionicons name="person" size={16} color={COLORS.gray} />
            <Text style={styles.clientText}>
              {item.user?.username || 'Client'} - {item.telephone}
            </Text>
          </View>

          {item.recommandation && (
            <View style={styles.noteRow}>
              <Ionicons name="chatbubble" size={16} color={COLORS.info} />
              <Text style={styles.noteText} numberOfLines={2}>
                {item.recommandation}
              </Text>
            </View>
          )}

          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>Quantité: </Text>
            <Text style={styles.detailValue}>{item.quantity}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.timeText}>
            {new Date(item.createdAt).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
          
          <TouchableOpacity
            style={[
              styles.accepterBtn,
              loading && styles.accepterBtnLoading
            ]}
            onPress={() => handleAccepterCommande(item.id)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="checkmark" size={18} color="white" />
                <Text style={styles.accepterText}>Accepter</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ✅ Rendu d'une livraison assignée
  const renderLivraisonItem = ({ item }) => (
    <TouchableOpacity
      style={styles.livraisonCard}
      onPress={() => router.push(`/livraison/${item.id}`)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.commandeInfo}>
          <Text style={styles.commandeId}>Livraison #{item.id}</Text>
          <Text style={styles.timeAgo}>{getTimeAgo(item.createdAt)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>
        <Text style={styles.montant}>{item.commande?.prix || '0'} FCFA</Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.addressRow}>
          <Ionicons name="restaurant" size={16} color={COLORS.secondary} />
          <Text style={styles.addressText} numberOfLines={1}>
            {item.commande?.plat?.restaurant?.name || 'Restaurant'}
          </Text>
        </View>
        
        <View style={styles.addressRow}>
          <Ionicons name="location" size={16} color={COLORS.primary} />
          <Text style={styles.addressText} numberOfLines={1}>
            {item.commande?.position || 'Position non définie'}
          </Text>
        </View>

        <View style={styles.clientRow}>
          <Ionicons name="person" size={16} color={COLORS.gray} />
          <Text style={styles.clientText}>
            {item.commande?.user?.username || 'Client'} - {item.commande?.telephone}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.timeText}>
          {new Date(item.createdAt).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
        <View style={styles.actionIndicator}>
          <Text style={styles.actionText}>Voir détails</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
        </View>
      </View>
    </TouchableOpacity>
  );

  // ✅ Rendu des onglets
  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'disponibles' && styles.activeTab]}
        onPress={() => setActiveTab('disponibles')}
      >
        <Ionicons 
          name="notifications" 
          size={20} 
          color={activeTab === 'disponibles' ? COLORS.white : COLORS.gray} 
        />
        <Text style={[styles.tabText, activeTab === 'disponibles' && styles.activeTabText]}>
          Disponibles
        </Text>
        {commandesDisponibles.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{commandesDisponibles.length}</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'mes_livraisons' && styles.activeTab]}
        onPress={() => setActiveTab('mes_livraisons')}
      >
        <Ionicons 
          name="bicycle" 
          size={20} 
          color={activeTab === 'mes_livraisons' ? COLORS.white : COLORS.gray} 
        />
        <Text style={[styles.tabText, activeTab === 'mes_livraisons' && styles.activeTabText]}>
          Mes livraisons
        </Text>
        {activeLivraisons.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{activeLivraisons.length}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  // ✅ Rendu de l'état vide
  const renderEmptyState = () => {
    const isDisponibles = activeTab === 'disponibles';
    return (
      <View style={styles.emptyState}>
        <Ionicons 
          name={isDisponibles ? "notifications-off" : "bicycle"} 
          size={80} 
          color={COLORS.gray} 
        />
        <Text style={styles.emptyTitle}>
          {isDisponibles ? 'Aucune commande disponible' : 'Aucune livraison active'}
        </Text>
        <Text style={styles.emptyText}>
          {isDisponibles 
            ? 'Aucune nouvelle commande pour le moment. Restez en ligne !' 
            : 'Vous n\'avez pas de livraisons en cours. Acceptez des commandes pour commencer !'
          }
        </Text>
        {isDisponibles && (
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={() => dispatch(getCommandesAsync())}
          >
            <Ionicons name="refresh" size={20} color={COLORS.primary} />
            <Text style={styles.refreshButtonText}>Actualiser</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ✅ Données à afficher selon l'onglet actif (Redux)
  const currentData = activeTab === 'disponibles' ? commandesDisponibles : activeLivraisons;
  const currentLoading = activeTab === 'disponibles' ? commandesDisponiblesLoading : activeLivraisonsLoading;
  const renderItem = activeTab === 'disponibles' ? renderCommandeDisponible : renderLivraisonItem;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Livraisons</Text>
        <Text style={styles.subtitle}>
          {activeTab === 'disponibles' 
            ? `${commandesDisponibles.length} commande${commandesDisponibles.length > 1 ? 's' : ''} disponible${commandesDisponibles.length > 1 ? 's' : ''}`
            : `${activeLivraisons.length} livraison${activeLivraisons.length > 1 ? 's' : ''} active${activeLivraisons.length > 1 ? 's' : ''}`
          }
        </Text>
      </View>

      {renderTabs()}

      {currentLoading && currentData.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : currentData.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={currentData}
          renderItem={renderItem}
          keyExtractor={(item) => `${activeTab}-${item.id}`}
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
    paddingBottom: 15,
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
  
  // ✅ Styles des onglets
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    backgroundColor: COLORS.light,
    marginHorizontal: 5,
    position: 'relative',
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray,
  },
  activeTabText: {
    color: COLORS.white,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: 10,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },

  // ✅ Styles des cartes
  listContainer: {
    padding: 20,
  },
  commandeCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  commandeInfo: {
    flex: 1,
  },
  commandeId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 4,
  },
  timeAgo: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 6,
  },
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
  montant: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  cardBody: {
    marginBottom: 12,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  addressText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.dark,
    flex: 1,
    lineHeight: 20,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  clientText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.gray,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    backgroundColor: COLORS.light,
    padding: 8,
    borderRadius: 8,
  },
  noteText: {
    marginLeft: 8,
    fontSize: 13,
    color: COLORS.dark,
    fontStyle: 'italic',
    flex: 1,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.light,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  actionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    color: COLORS.primary,
    marginRight: 4,
  },

  // ✅ Styles bouton accepter
  accepterBtn: {
    backgroundColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  accepterBtnLoading: {
    backgroundColor: COLORS.gray,
  },
  accepterText: {
    color: COLORS.white,
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },

  // ✅ Styles état vide et chargement
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
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  refreshButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.gray,
  },
});