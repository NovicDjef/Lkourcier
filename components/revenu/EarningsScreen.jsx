import { fetchHistoriqueLivraisons } from '@/redux/livraisonSlice';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { useDispatch, useSelector } from 'react-redux';

const { width: screenWidth } = Dimensions.get('window');

export default function EarningsScreen() {
  const dispatch = useDispatch();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Redux selectors
  const { user } = useSelector(state => state.auth);
  const { historiqueLivraisons, historiqueLoading, historiqueError } = useSelector(state => state.livraison);
  
  const livreurId = user?.id;

  // Périodes disponibles
  const periods = [
    { key: 'day', label: 'Aujourd\'hui', icon: 'today' },
    { key: 'week', label: 'Cette semaine', icon: 'calendar' },
    { key: 'month', label: 'Ce mois', icon: 'calendar-outline' },
    { key: 'year', label: 'Cette année', icon: 'calendar-sharp' },
    { key: 'custom', label: 'Personnalisé', icon: 'options' }
  ];

  // Onglets
  const tabs = [
    { key: 'overview', label: 'Vue d\'ensemble', icon: 'analytics' },
    { key: 'details', label: 'Détails', icon: 'list' },
    { key: 'comparison', label: 'Comparaison', icon: 'git-compare' }
  ];

  useEffect(() => {
    if (livreurId) {
      loadEarningsData();
    }
    
    // Animation d'entrée
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [livreurId, selectedPeriod]);

  const loadEarningsData = async () => {
    if (!livreurId) return;
    
    try {
      await dispatch(fetchHistoriqueLivraisons({
        livreurId,
        period: selectedPeriod
      }));
    } catch (error) {
      console.error('Erreur chargement données revenus:', error);
    }
  };

  // Fonction pour déterminer le type de livraison
  const getDeliveryType = (livraison) => {
    if (livraison.type) {
      return livraison.type.toLowerCase().includes('colis') ? 'colis' : 'repas';
    }
    
    const restaurant = livraison.commande?.plat?.restaurant?.name || 
                      livraison.commande?.restaurant?.name ||
                      livraison.restaurant?.name || '';
    
    const platNom = livraison.commande?.plat?.nom || 
                   livraison.commande?.platNom || 
                   livraison.platNom || '';
    
    const allText = (restaurant + ' ' + platNom).toLowerCase();
    const colisKeywords = ['colis', 'package', 'livraison express', 'document', 'courrier'];
    
    if (colisKeywords.some(keyword => allText.includes(keyword))) {
      return 'colis';
    }
    
    return 'repas';
  };

  // Calculs des revenus détaillés
  const earningsData = useMemo(() => {
    if (!historiqueLivraisons || !Array.isArray(historiqueLivraisons)) {
      return {
        totalRevenue: 0,
        totalDeliveries: 0,
        averagePerDelivery: 0,
        repasRevenue: 0,
        colisRevenue: 0,
        repasCount: 0,
        colisCount: 0,
        dailyData: [],
        periodComparison: {},
        paymentBreakdown: [],
        topEarningDays: [],
        monthlyTrend: []
      };
    }

    const now = new Date();
    let startDate = new Date();
    
    // Définir la période de départ
    switch (selectedPeriod) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    // Filtrer les livraisons par période
    const filteredLivraisons = historiqueLivraisons.filter(livraison => {
      const livraisonDate = new Date(livraison.created_at || livraison.createdAt);
      return livraisonDate >= startDate;
    });

    let totalRevenue = 0;
    let repasRevenue = 0;
    let colisRevenue = 0;
    let repasCount = 0;
    let colisCount = 0;

    // Calculs par type
    filteredLivraisons.forEach(livraison => {
      const prix = parseFloat(livraison.commande?.prix || livraison.prix || 0);
      const commission = prix * 0.1; // 10% de commission
      const type = getDeliveryType(livraison);
      
      totalRevenue += commission;
      
      if (type === 'repas') {
        repasRevenue += commission;
        repasCount++;
      } else {
        colisRevenue += commission;
        colisCount++;
      }
    });

    // Données journalières pour le graphique
    const dailyData = [];
    const dailyLabels = [];
    const daysToShow = selectedPeriod === 'day' ? 24 : selectedPeriod === 'week' ? 7 : 30;
    
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date();
      
      if (selectedPeriod === 'day') {
        date.setHours(date.getHours() - i);
        dailyLabels.push(`${date.getHours()}h`);
      } else {
        date.setDate(date.getDate() - i);
        dailyLabels.push(selectedPeriod === 'week' ? 
          ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][date.getDay()] :
          `${date.getDate()}/${date.getMonth() + 1}`
        );
      }
      
      const dayRevenue = filteredLivraisons
        .filter(livraison => {
          const livraisonDate = new Date(livraison.created_at || livraison.createdAt);
          if (selectedPeriod === 'day') {
            return livraisonDate.getHours() === date.getHours() && 
                   livraisonDate.toDateString() === new Date().toDateString();
          } else {
            return livraisonDate.toDateString() === date.toDateString();
          }
        })
        .reduce((sum, livraison) => {
          const prix = parseFloat(livraison.commande?.prix || livraison.prix || 0);
          return sum + (prix * 0.1);
        }, 0);
      
      dailyData.push(Math.round(dayRevenue));
    }

    // Top des jours les plus rentables
    const dayRevenues = {};
    filteredLivraisons.forEach(livraison => {
      const date = new Date(livraison.created_at || livraison.createdAt);
      const dateKey = date.toDateString();
      const prix = parseFloat(livraison.commande?.prix || livraison.prix || 0);
      const commission = prix * 0.1;
      
      if (!dayRevenues[dateKey]) {
        dayRevenues[dateKey] = { date: dateKey, revenue: 0, count: 0 };
      }
      dayRevenues[dateKey].revenue += commission;
      dayRevenues[dateKey].count++;
    });

    const topEarningDays = Object.values(dayRevenues)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(day => ({
        ...day,
        formattedDate: new Date(day.date).toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: '2-digit',
          month: 'short'
        })
      }));

    // Répartition des paiements
    const paymentBreakdown = [
      {
        name: 'Livraisons repas',
        amount: Math.round(repasRevenue),
        count: repasCount,
        color: '#e74c3c',
        percentage: totalRevenue > 0 ? Math.round((repasRevenue / totalRevenue) * 100) : 0
      },
      {
        name: 'Livraisons colis',
        amount: Math.round(colisRevenue),
        count: colisCount,
        color: '#f39c12',
        percentage: totalRevenue > 0 ? Math.round((colisRevenue / totalRevenue) * 100) : 0
      }
    ];

    return {
      totalRevenue: Math.round(totalRevenue),
      totalDeliveries: filteredLivraisons.length,
      averagePerDelivery: filteredLivraisons.length > 0 ? Math.round(totalRevenue / filteredLivraisons.length) : 0,
      repasRevenue: Math.round(repasRevenue),
      colisRevenue: Math.round(colisRevenue),
      repasCount,
      colisCount,
      dailyData: {
        labels: dailyLabels,
        datasets: [{
          data: dailyData.length > 0 ? dailyData : [0],
          color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
          strokeWidth: 3
        }]
      },
      paymentBreakdown,
      topEarningDays
    };
  }, [historiqueLivraisons, selectedPeriod]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await loadEarningsData();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de rafraîchir les données');
    } finally {
      setRefreshing(false);
    }
  }, [livreurId, selectedPeriod]);

  const PeriodSelector = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodSelector}>
      {periods.map(period => (
        <TouchableOpacity
          key={period.key}
          style={[
            styles.periodButton,
            selectedPeriod === period.key && styles.selectedPeriodButton
          ]}
          onPress={() => setSelectedPeriod(period.key)}
        >
          <Ionicons 
            name={period.icon} 
            size={16} 
            color={selectedPeriod === period.key ? '#ffffff' : '#7f8c8d'} 
          />
          <Text style={[
            styles.periodButtonText,
            selectedPeriod === period.key && styles.selectedPeriodButtonText
          ]}>
            {period.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const TabSelector = () => (
    <View style={styles.tabSelector}>
      {tabs.map(tab => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tabButton,
            selectedTab === tab.key && styles.selectedTabButton
          ]}
          onPress={() => setSelectedTab(tab.key)}
        >
          <Ionicons 
            name={tab.icon} 
            size={18} 
            color={selectedTab === tab.key ? '#3498db' : '#7f8c8d'} 
          />
          <Text style={[
            styles.tabButtonText,
            selectedTab === tab.key && styles.selectedTabButtonText
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const RevenueCard = ({ title, amount, subtitle, icon, color, trend }) => (
    <View style={styles.revenueCard}>
      <View style={styles.revenueCardHeader}>
        <View style={[styles.revenueIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        {trend && (
          <View style={styles.trendContainer}>
            <Ionicons 
              name={trend > 0 ? 'trending-up' : 'trending-down'} 
              size={14} 
              color={trend > 0 ? '#27ae60' : '#e74c3c'} 
            />
            <Text style={[styles.trendText, { color: trend > 0 ? '#27ae60' : '#e74c3c' }]}>
              {Math.abs(trend)}%
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.revenueAmount}>{amount.toLocaleString()} F</Text>
      <Text style={styles.revenueTitle}>{title}</Text>
      {subtitle && <Text style={styles.revenueSubtitle}>{subtitle}</Text>}
    </View>
  );

  const OverviewTab = () => (
    <Animated.View style={{ opacity: fadeAnim }}>
      {/* Cartes de revenus principales */}
      <View style={styles.revenueCardsContainer}>
        <RevenueCard
          title="Revenus totaux"
          amount={earningsData.totalRevenue}
          subtitle={`${earningsData.totalDeliveries} livraisons`}
          icon="wallet"
          color="#27ae60"
          trend={12}
        />
        <RevenueCard
          title="Moyenne par livraison"
          amount={earningsData.averagePerDelivery}
          subtitle="Commission 10%"
          icon="calculator"
          color="#3498db"
          trend={5}
        />
        <RevenueCard
          title="Revenus repas"
          amount={earningsData.repasRevenue}
          subtitle={`${earningsData.repasCount} livraisons`}
          icon="restaurant"
          color="#e74c3c"
          trend={8}
        />
        <RevenueCard
          title="Revenus colis"
          amount={earningsData.colisRevenue}
          subtitle={`${earningsData.colisCount} livraisons`}
          icon="cube"
          color="#f39c12"
          trend={-2}
        />
      </View>

      {/* Graphique des revenus quotidiens */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>📊 Évolution des revenus</Text>
          <Text style={styles.chartSubtitle}>
            {selectedPeriod === 'day' ? 'Par heure' : 
             selectedPeriod === 'week' ? 'Cette semaine' :
             selectedPeriod === 'month' ? 'Ce mois' : 'Cette année'}
          </Text>
        </View>
        {historiqueLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        ) : (
          <LineChart
            data={earningsData.dailyData}
            width={screenWidth - 60}
            height={220}
            chartConfig={{
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(52, 73, 94, ${opacity * 0.8})`,
              style: { borderRadius: 16 },
              propsForDots: { r: '4', strokeWidth: '2', stroke: '#3498db' },
              propsForBackgroundLines: { stroke: '#ecf0f1', strokeWidth: 1 },
              propsForLabels: { fontSize: 10 }
            }}
            style={styles.chart}
            bezier
            withInnerLines={true}
            withOuterLines={false}
            withVerticalLines={false}
            withHorizontalLines={true}
          />
        )}
      </View>

      {/* Répartition des revenus */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>🥧 Répartition des revenus</Text>
          <Text style={styles.chartSubtitle}>Par type de livraison</Text>
        </View>
        {earningsData.paymentBreakdown.filter(item => item.amount > 0).length > 0 ? (
          <View>
            <PieChart
              data={earningsData.paymentBreakdown.filter(item => item.amount > 0).map(item => ({
                name: item.name,
                amount: item.amount,
                color: item.color,
                legendFontColor: '#34495e'
              }))}
              width={screenWidth - 60}
              height={200}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.chart}
            />
            <View style={styles.pieChartLegend}>
              {earningsData.paymentBreakdown.filter(item => item.amount > 0).map(item => (
                <View key={item.name} style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                  <Text style={styles.legendText}>
                    {item.name}: {item.amount.toLocaleString()} F ({item.percentage}%)
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.noDataContainer}>
            <Ionicons name="pie-chart-outline" size={48} color="#95a5a6" />
            <Text style={styles.noDataText}>Aucune donnée disponible</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );

  const DetailsTab = () => (
    <Animated.View style={{ opacity: fadeAnim }}>
      {/* Top des jours les plus rentables */}
      <View style={styles.detailCard}>
        <Text style={styles.detailCardTitle}>🏆 Meilleurs jours</Text>
        {earningsData.topEarningDays.length > 0 ? (
          earningsData.topEarningDays.map((day, index) => (
            <View key={index} style={styles.topDayItem}>
              <View style={styles.topDayRank}>
                <Text style={styles.rankNumber}>#{index + 1}</Text>
              </View>
              <View style={styles.topDayInfo}>
                <Text style={styles.topDayDate}>{day.formattedDate}</Text>
                <Text style={styles.topDayCount}>{day.count} livraisons</Text>
              </View>
              <Text style={styles.topDayRevenue}>{Math.round(day.revenue).toLocaleString()} F</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>Aucune donnée disponible</Text>
        )}
      </View>

      {/* Statistiques détaillées */}
      <View style={styles.detailCard}>
        <Text style={styles.detailCardTitle}>📈 Statistiques détaillées</Text>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Revenus par heure active</Text>
          <Text style={styles.statValue}>
            {earningsData.totalDeliveries > 0 ? 
              Math.round(earningsData.totalRevenue / (earningsData.totalDeliveries * 0.5)) : 0} F/h
          </Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Commission moyenne</Text>
          <Text style={styles.statValue}>{earningsData.averagePerDelivery} F</Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Meilleur type de livraison</Text>
          <Text style={styles.statValue}>
            {earningsData.repasRevenue >= earningsData.colisRevenue ? 'Repas' : 'Colis'}
          </Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Taux commission</Text>
          <Text style={styles.statValue}>10%</Text>
        </View>
      </View>

      {/* Objectifs et progression */}
      <View style={styles.detailCard}>
        <Text style={styles.detailCardTitle}>🎯 Objectifs</Text>
        
        <View style={styles.goalItem}>
          <View style={styles.goalInfo}>
            <Text style={styles.goalTitle}>Objectif mensuel</Text>
            <Text style={styles.goalSubtitle}>50,000 F</Text>
          </View>
          <View style={styles.goalProgress}>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${Math.min((earningsData.totalRevenue / 50000) * 100, 100)}%` }
                ]} 
              />
            </View>
            <Text style={styles.goalPercentage}>
              {Math.round((earningsData.totalRevenue / 50000) * 100)}%
            </Text>
          </View>
        </View>
        
        <View style={styles.goalItem}>
          <View style={styles.goalInfo}>
            <Text style={styles.goalTitle}>Livraisons mensuelles</Text>
            <Text style={styles.goalSubtitle}>100 livraisons</Text>
          </View>
          <View style={styles.goalProgress}>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${Math.min((earningsData.totalDeliveries / 100) * 100, 100)}%` }
                ]} 
              />
            </View>
            <Text style={styles.goalPercentage}>
              {Math.round((earningsData.totalDeliveries / 100) * 100)}%
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  const ComparisonTab = () => (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View style={styles.detailCard}>
        <Text style={styles.detailCardTitle}>📊 Comparaison de périodes</Text>
        
        <View style={styles.comparisonItem}>
          <Text style={styles.comparisonLabel}>Cette période vs précédente</Text>
          <View style={styles.comparisonValues}>
            <Text style={styles.comparisonCurrent}>{earningsData.totalRevenue.toLocaleString()} F</Text>
            <Ionicons name="arrow-forward" size={16} color="#7f8c8d" />
            <Text style={styles.comparisonPrevious}>En développement</Text>
          </View>
        </View>
        
        <Text style={styles.developmentNote}>
          🚧 La comparaison de périodes sera disponible dans une prochaine mise à jour
        </Text>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💰 Mes Revenus</Text>
        <Text style={styles.headerSubtitle}>Suivi détaillé de vos gains</Text>
      </View>

      {/* Sélecteur de période */}
      <PeriodSelector />

      {/* Sélecteur d'onglets */}
      <TabSelector />

      {/* Contenu */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {selectedTab === 'overview' && <OverviewTab />}
        {selectedTab === 'details' && <DetailsTab />}
        {selectedTab === 'comparison' && <ComparisonTab />}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  periodSelector: {
    backgroundColor: '#ffffff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  periodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  selectedPeriodButton: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7f8c8d',
    marginLeft: 6,
  },
  selectedPeriodButtonText: {
    color: '#ffffff',
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  selectedTabButton: {
    backgroundColor: '#3498db' + '20',
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7f8c8d',
    marginLeft: 6,
  },
  selectedTabButtonText: {
    color: '#3498db',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  revenueCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  revenueCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    width: (screenWidth - 55) / 2,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#ecf0f1',
  },
  revenueCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  revenueIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  revenueAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  revenueTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34495e',
  },
  revenueSubtitle: {
    fontSize: 10,
    color: '#7f8c8d',
    marginTop: 2,
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#ecf0f1',
  },
  chartHeader: {
    marginBottom: 15,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  chart: {
    borderRadius: 12,
    marginLeft: -15,
  },
  loadingContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  pieChartLegend: {
    marginTop: 15,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  legendText: {
    fontSize: 12,
    color: '#34495e',
    fontWeight: '500',
  },
  noDataContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: '#95a5a6',
    marginTop: 10,
    textAlign: 'center',
  },
  detailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#ecf0f1',
  },
  detailCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 15,
  },
  topDayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  topDayRank: {
    width: 30,
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3498db',
  },
  topDayInfo: {
    flex: 1,
    marginLeft: 15,
  },
  topDayDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  topDayCount: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  topDayRevenue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#27ae60',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  statLabel: {
    fontSize: 14,
    color: '#34495e',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2c3e50',
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  goalSubtitle: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  goalProgress: {
    alignItems: 'flex-end',
  },
  progressBarContainer: {
    width: 100,
    height: 6,
    backgroundColor: '#ecf0f1',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3498db',
    borderRadius: 3,
  },
  goalPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3498db',
  },
  comparisonItem: {
    marginBottom: 20,
  },
  comparisonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  comparisonValues: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  comparisonCurrent: {
    fontSize: 16,
    fontWeight: '700',
    color: '#27ae60',
  },
  comparisonPrevious: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7f8c8d',
  },
  developmentNote: {
    fontSize: 12,
    color: '#f39c12',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  bottomSpacing: {
    height: 20,
  },
});