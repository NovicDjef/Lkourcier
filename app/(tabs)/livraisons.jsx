import { COLORS } from '@/constants/Colors';
import { getCommandesAsync, updateCommandeStatusAsync } from '@/redux/commandeSlice';
import { postLivraison } from '@/redux/livraisonSlice';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  // ✅ Récupération des données Redux
  const toutesLesCommandes = useSelector((state) => state.commande?.commandes || []);
  const loading = useSelector((state) => state.commande?.loading || false);
  const livreur = useSelector((state) => state.auth?.user);
  const livreurId = livreur?.id;
  
  // ✅ États locaux
  const [activeTab, setActiveTab] = useState('disponibles');
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const dispatch = useDispatch();

  // ✅ Filtrage intelligent des commandes
  const commandesDisponibles = useMemo(() => {
    return toutesLesCommandes.filter(commande => commande.status === 'EN_ATTENTE');
  }, [toutesLesCommandes]);


  // ✅ Mes livraisons ACTIVES (exclure les LIVREE)
  const mesLivraisons = useMemo(() => {
    return toutesLesCommandes.filter(commande => 
      commande.status !== 'EN_ATTENTE' &&
      commande.livreurId === livreurId && 
      (commande.status === 'VALIDER' || commande.status === 'EN_COURS') // ✅ Seulement les actives
    );
  }, [toutesLesCommandes, livreurId]);
  
  // mesLivraisons = commandes.filter(commande => 
  //   commande.status !== 'EN_ATTENTE' && commande.livreurId === livreurId
  // );
  
  // Debug détaillé de mes livraisons
  mesLivraisons.forEach(livraison => {
    console.log(`📦 Ma livraison #${livraison.id}: status=${livraison.status}, livreurId=${livraison.livreurId}`);
  });

  useEffect(() => {
    console.log("🔄 Chargement des commandes...");
    dispatch(getCommandesAsync());
  }, [dispatch]);

  // ✅ Fonction pour accepter une commande
  const handleAccepterCommande = useCallback(async (commandeId) => {
    if (!livreurId) {
      Alert.alert('Erreur', 'Identifiant livreur manquant');
      return;
    }

    setActionLoading(commandeId);
    try {
      console.log(`📦 Acceptation commande ${commandeId} par livreur ${livreurId}...`);
      
      // ✅ IMPORTANT: Envoyer le livreurId pour associer la commande
      const result = await dispatch(updateCommandeStatusAsync({ 
        id: commandeId, 
        status: 'VALIDER',
        livreurId: livreurId // 🔥 Clé : associer le livreur à la commande
      }));

      if (updateCommandeStatusAsync.fulfilled.match(result)) {
        console.log("✅ Commande acceptée, rechargement des données...");
        
        // Recharger toutes les commandes
        await dispatch(getCommandesAsync());
        
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
              style: 'default'
            }
          ]
        );
      } else {
        console.error("❌ Erreur lors de l'acceptation:", result.payload);
        Alert.alert('Erreur', result.payload || 'Impossible d\'accepter la commande');
      }
    } catch (error) {
      console.error('❌ Erreur acceptation:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setActionLoading(null);
    }
  }, [dispatch, livreurId]);

  // ✅ Fonction pour démarrer une livraison (VALIDER -> EN_COURS)
  const handleDemarrerLivraison = useCallback(async (commandeId) => {
    Alert.alert(
      'Démarrer la livraison',
      'Êtes-vous prêt à démarrer cette livraison ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Démarrer',
          onPress: async () => {
            setActionLoading(commandeId);
            try {
              console.log(`🚀 Démarrage livraison ${commandeId}...`);
              
              const result = await dispatch(updateCommandeStatusAsync({ 
                id: commandeId, 
                status: 'EN_COURS',
                livreurId: livreurId // Maintenir l'association
              }));

              if (updateCommandeStatusAsync.fulfilled.match(result)) {
                console.log("✅ Livraison démarrée");
                await dispatch(getCommandesAsync()); // Recharger les données
                
                Alert.alert('Succès', 'Livraison démarrée !', [
                  {
                    text: 'Voir détails',
                    onPress: () => router.push(`/livraison/${commandeId}`)
                  },
                  { text: 'OK' }
                ]);
              } else {
                Alert.alert('Erreur', result.payload || 'Impossible de démarrer la livraison');
              }
            } catch (error) {
              console.error('❌ Erreur démarrage:', error);
              Alert.alert('Erreur', 'Une erreur est survenue');
            } finally {
              setActionLoading(null);
            }
          }
        }
      ]
    );
  }, [dispatch, livreurId]);

  // ✅ Fonction pour terminer une livraison (EN_COURS -> LIVREE)
  const handleTerminerLivraison = useCallback(async (commandeId) => {
  
    // ✅ Récupération des données complètes de la commande depuis Redux
    const commandeComplete = toutesLesCommandes.find(commande => commande.id === commandeId);
      
    // ✅ Vérifications des données obligatoires
    if (!commandeId || !livreurId) {
      Alert.alert('Erreur', 'ID de commande ou livreur manquant');
      return;
    }
  
    if (!commandeComplete) {
      Alert.alert('Erreur', 'Commande introuvable');
      return;
    }
  
    // ✅ Vérification que la commande est bien en cours et assignée au bon livreur
    if (commandeComplete.status !== 'EN_COURS') {
      Alert.alert('Erreur', 'Cette livraison ne peut pas être terminée (statut incorrect)');
      return;
    }
  
    if (commandeComplete.livreurId !== livreurId) {
      Alert.alert('Erreur', 'Cette livraison n\'est pas assignée à vous');
      return;
    }
  
    Alert.alert(
      'Terminer la livraison',
      'Confirmez-vous que cette livraison a été terminée ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            setActionLoading(commandeId);
            try {
  
              // ✅ Préparation des données pour l'API avec toutes les infos nécessaires
              const livraisonData = {
                livreurId: livreurId,
                status: 'LIVREE',
                heureLivraison: new Date().toISOString(),
                commandeId: commandeId,
                userId: commandeComplete.userId || commandeComplete.user?.id, // Gestion des deux formats possibles
              };
  
              // ✅ Appel de l'action Redux
              const result = await dispatch(postLivraison(livraisonData));
  
              if (postLivraison.fulfilled.match(result)) {
  
                // ✅ Rechargement des données pour synchroniser l'état
                await Promise.all([
                  dispatch(getCommandesAsync()),
                  dispatch(updateCommandeStatusAsync({ 
                      id: commandeId, 
                      status: 'LIVREE',
                      livreurId: livreurId 
                    }))
                ]);
  
                Alert.alert('Succès ! 🎉', 'Livraison terminée avec succès !');
                router.push('/historique');
                
              } else if (postLivraison.rejected.match(result)) {
                console.error("❌ Erreur lors de la création:", result.payload);
                console.error("❌ Error details:", result.error);
                
                const errorMessage = result.payload?.message || result.payload || 'Erreur inconnue';
                Alert.alert('Erreur', `Impossible de terminer la livraison: ${errorMessage}`);
                
              } else {
                console.error("❌ Résultat inattendu:", result);
                Alert.alert('Erreur', 'Réponse inattendue du serveur');
              }
  
            } catch (error) {
              console.error('❌ Exception dans handleTerminerLivraison:', error);
              console.error('❌ Stack trace:', error.stack);
              Alert.alert('Erreur', `Une erreur est survenue: ${error.message}`);
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  }, [dispatch, livreurId, toutesLesCommandes]);

  // const handleTerminerLivraison = useCallback(async (commandeData) => {
  
  //   // ✅ 1. Debug complet des données reçues
  //   console.log("🔍 === DEBUG TERMINER LIVRAISON ===");
  //   console.log("commandeData reçue :", JSON.stringify(commandeData, null, 2));
  //   console.log("livreurId :", livreurId);
  //   console.log("Type de commandeData :", commandeId);
  //   console.log("commandeData?.userId :", userId);
  //   console.log("commandeData?.id :", commandeData);
  //   console.log("commandeData?.status :", status);
    
  //   // ✅ 2. Vérification de chaque condition individuellement
  //   if (!commandeData) {
  //     console.error("❌ commandeData est null/undefined");
  //     Alert.alert('Erreur', 'Aucune donnée de commande fournie');
  //     return;
  //   }
    
  //   if (!commandeData.userId) {
  //     console.error("❌ userId manquant dans commandeData");
  //     Alert.alert('Erreur', 'ID utilisateur manquant');
  //     return;
  //   }
    
  //   if (!commandeData.id) {
  //     console.error("❌ id manquant dans commandeData");
  //     Alert.alert('Erreur', 'ID de commande manquant');
  //     return;
  //   }
    
  //   if (!livreurId) {
  //     console.error("❌ livreurId manquant");
  //     Alert.alert('Erreur', 'ID livreur manquant');
  //     return;
  //   }
    
  //   if (!commandeData.status) {
  //     console.error("❌ status manquant dans commandeData");
  //     Alert.alert('Erreur', 'Statut de commande manquant');
  //     return;
  //   }
    
  //   console.log("✅ Toutes les validations passées");
  
  //   Alert.alert(
  //     'Terminer la livraison',
  //     'Confirmez-vous que cette livraison a été terminée ?',
  //     [
  //       { text: 'Annuler', style: 'cancel' },
  //       {
  //         text: 'Confirmer',
  //         onPress: async () => {
  //           setActionLoading(commandeData.id);
  //           try {
  //             console.log(`🏁 Début processus fin livraison pour commande ${commandeData.id}...`);
              
  //             // ✅ 3. Préparer les données selon VOTRE schéma
  //             const livraisonData = {
  //               livreurId,
  //               status: 'LIVREE',
  //               heureLivraison: new Date().toISOString(),
  //               commandeId: commandeData.id,
  //               userId: commandeData.userId,
  //             };
  
  //             console.log("📦 Données préparées pour envoi:", JSON.stringify(livraisonData, null, 2));
  
  //             // ✅ 4. Appel Redux avec logging détaillé
  //             console.log("📡 Appel dispatch postLivraison...");
  //             const result = await dispatch(postLivraison(livraisonData));
              
  //             console.log("📡 Résultat dispatch:", result);
  //             console.log("📡 Type de résultat:", result.type);
  //             console.log("📡 Payload:", result.payload);
  
  //             // ✅ 5. Vérification du résultat
  //             if (postLivraison.fulfilled.match(result)) {
  //               console.log("✅ Livraison créée avec succès");
  //               console.log("✅ Données retournées:", result.payload);
                
  //               // Recharger les données
  //               console.log("🔄 Rechargement des données...");
  //               await Promise.all([
  //                 dispatch(getCommandesAsync()),
  //                 dispatch(getMesLivraisonsAsync(livreurId)),
  //               ]);
                
  //               Alert.alert('Succès ! 🎉', 'Livraison terminée avec succès !');
  //               router.push(`/historique`);
                
  //             } else if (postLivraison.rejected.match(result)) {
  //               console.error("❌ Action rejetée:", result.payload);
  //               console.error("❌ Error code:", result.error?.code);
  //               console.error("❌ Error message:", result.error?.message);
  //               Alert.alert('Erreur', `Impossible de terminer la livraison: ${result.payload}`);
                
  //             } else {
  //               console.error("❌ Résultat inattendu:", result);
  //               Alert.alert('Erreur', 'Réponse inattendue du serveur');
  //             }
              
  //           } catch (error) {
  //             console.error('❌ Exception dans handleTerminerLivraison:', error);
  //             console.error('❌ Stack trace:', error.stack);
  //             Alert.alert('Erreur', `Une erreur est survenue: ${error.message}`);
  //           } finally {
  //             console.log("🔚 Fin du processus, reset loading...");
  //             setActionLoading(null);
  //           }
  //         },
  //       },
  //     ]
  //   );
  // }, [dispatch, livreurId]);
  
  


  // ✅ Fonction de rafraîchissement
  const onRefresh = useCallback(async () => {
    console.log("🔄 Rafraîchissement...");
    setRefreshing(true);
    
    try {
      await dispatch(getCommandesAsync());
      console.log("✅ Rafraîchissement terminé");
    } catch (error) {
      console.error("❌ Erreur rafraîchissement:", error);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  // ✅ Obtenir la couleur du statut
  const getStatusColor = (status) => {
    switch (status) {
      case 'EN_ATTENTE':
        return COLORS.warning;
      case 'VALIDER':
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
      case 'VALIDER':
        return 'Validée';
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

  // ✅ Rendu des boutons d'action pour les livraisons
  const renderActionButton = (item) => {
    const isLoading = actionLoading === item.id;
    
    if (isLoading) {
      return (
        <View style={styles.actionBtn}>
          <ActivityIndicator size="small" color="white" />
        </View>
      );
    }

    switch (item.status) {
      case 'VALIDER':
        return (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
            onPress={() => handleDemarrerLivraison(item.id)}
          >
            <Ionicons name="play" size={18} color="white" />
            <Text style={styles.actionText}>Démarrer</Text>
          </TouchableOpacity>
        );
      
      case 'EN_COURS':
        return (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.success }]}
            onPress={() => handleTerminerLivraison(item.id)}
          >
            <Ionicons name="checkmark-circle" size={18} color="white" />
            <Text style={styles.actionText}>Terminer</Text>
          </TouchableOpacity>
        );
      
      case 'LIVREE':
        return (
          <View style={[styles.actionBtn, { backgroundColor: COLORS.gray }]}>
            <Ionicons name="checkmark-done" size={18} color="white" />
            <Text style={styles.actionText}>Terminée</Text>
          </View>
        );
      
      default:
        return (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push(`/livraison/${item.id}`)}
          >
            <Text style={styles.actionText}>Voir détails</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        );
    }
  };

  // ✅ Rendu d'une commande disponible (status = EN_ATTENTE)
  const renderCommandeDisponible = ({ item }) => {
    const isLoading = actionLoading === item.id;
    
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
              isLoading && styles.accepterBtnLoading
            ]}
            onPress={() => handleAccepterCommande(item.id)}
            disabled={isLoading}
          >
            {isLoading ? (
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

  // ✅ Rendu d'une livraison (status != EN_ATTENTE et mon livreurId)
  const renderLivraisonItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.livraisonCard}
        onPress={() => {
          if (item.status === 'EN_COURS') {
            router.push(`/livraison/${item.id}`);
          }
        }}
        disabled={item.status === 'LIVREE'}
      >
        <View style={styles.cardHeader}>
          <View style={styles.commandeInfo}>
            <Text style={styles.commandeId}>Livraison #{item.id}</Text>
            <Text style={styles.timeAgo}>{getTimeAgo(item.updatedAt || item.createdAt)}</Text>
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
            <Text style={styles.addressText} numberOfLines={1}>
              {item.plat?.name || 'Restaurant'}
            </Text>
          </View>
          
          <View style={styles.addressRow}>
            <Ionicons name="location" size={16} color={COLORS.primary} />
            <Text style={styles.addressText} numberOfLines={1}>
              {item.position || 'Position non définie'}
            </Text>
          </View>

          <View style={styles.clientRow}>
            <Ionicons name="person" size={16} color={COLORS.gray} />
            <Text style={styles.clientText}>
              {item.user?.username || 'Client'} - {item.telephone}
            </Text>
          </View>
          
          {/* ✅ Affichage debug du livreur (optionnel) */}
          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>Assignée à: </Text>
            <Text style={styles.detailValue}>Livreur #{item.livreurId}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.timeText}>
            {new Date(item.updatedAt || item.createdAt).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
          {renderActionButton(item)}
        </View>
      </TouchableOpacity>
    );
  };

  // ✅ Rendu des onglets
  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'disponibles' && styles.activeTab]}
        onPress={() => {
          console.log("📱 Onglet: Disponibles");
          setActiveTab('disponibles');
        }}
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
        onPress={() => {
          console.log("📱 Onglet: Mes livraisons");
          setActiveTab('mes_livraisons');
        }}
      >
        <Ionicons 
          name="bicycle" 
          size={20} 
          color={activeTab === 'mes_livraisons' ? COLORS.white : COLORS.gray} 
        />
        <Text style={[styles.tabText, activeTab === 'mes_livraisons' && styles.activeTabText]}>
          Mes livraisons
        </Text>
        {mesLivraisons.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{mesLivraisons.length}</Text>
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
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={20} color={COLORS.primary} />
          <Text style={styles.refreshButtonText}>Actualiser</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ✅ Données à afficher selon l'onglet actif
  const currentData = activeTab === 'disponibles' ? commandesDisponibles : mesLivraisons;
  const renderItem = activeTab === 'disponibles' ? renderCommandeDisponible : renderLivraisonItem;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Livraisons</Text>
        <Text style={styles.subtitle}>
          {activeTab === 'disponibles' 
            ? `${commandesDisponibles.length} commande${commandesDisponibles.length > 1 ? 's' : ''} disponible${commandesDisponibles.length > 1 ? 's' : ''}`
            : `${mesLivraisons.length} livraison${mesLivraisons.length > 1 ? 's' : ''} active${mesLivraisons.length > 1 ? 's' : ''}`
          }
        </Text>
      </View>

      {renderTabs()}

      {loading && currentData.length === 0 ? (
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

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  
  actionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  
  accepterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  
  accepterBtnLoading: {
    opacity: 0.7,
  },
  
  accepterText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  
});