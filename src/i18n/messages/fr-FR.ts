const frFR = {
  common: {
    anomaly: 'Anomalie',
    observed: 'Observé',
    unknown: 'INCONNU',
    notAvailable: 'n/d',
  },
  layout: {
    subtitle: 'Cockpit d intelligence comportementale pour les operations de session en direct',
    topPillLiveTelemetry: 'Telemetrie en direct',
    topPillStack: 'Redis + Kafka + contexte IA',
    grafanaButton: 'Grafana',
    kibanaButton: 'Kibana',
    grafanaTooltip: 'Tableaux de bord Grafana',
    kibanaTooltip: 'Vue d ensemble Kibana',
    drawerKicker: 'Poste de commande',
    drawerTitle: 'Naviguer entre les surfaces en direct',
    drawerCopy:
      'Gardez le flux, le tri des anomalies, les traces de session et l intelligence utilisateur alignes dans un seul flux operationnel.',
    navHeader: 'Surfaces de controle',
    operationalNoteLabel: 'Note operationnelle',
    operationalNoteBody:
      'La barre laterale reste ouverte lorsque vous changez de page afin que le contexte de commande reste visible pendant votre investigation.',
    metricRefreshLabel: 'Rafraichissement',
    metricRefreshValue: '60s',
    metricModeLabel: 'Mode',
    metricModeValue: 'Direct',
    metricFocusLabel: 'Focus',
    metricFocusValue: 'Ops risque',
    navigation: {
      overview: {
        label: 'Vue globale',
        caption: 'Tableau des signaux executifs',
      },
      anomalies: {
        label: 'Anomalies',
        caption: 'Examiner les evenements signales',
      },
      workbench: {
        label: 'Workbench',
        caption: 'Revoir le contexte du flux en direct',
      },
      sessions: {
        label: 'Sessions',
        caption: 'Inspecter les traces comportementales',
      },
      insights: {
        label: 'Insights utilisateur',
        caption: 'Charger le contexte de risque assure',
      },
      analytics: {
        label: 'Analytique',
        caption: 'Tendances et graphiques geo',
      },
    },
    aria: {
      toggleNavigation: 'Basculer la navigation',
      openGrafana: 'Ouvrir le tableau de bord Grafana dans un nouvel onglet',
      openKibana: 'Ouvrir la vue Kibana dans un nouvel onglet',
      profile: 'Profil',
    },
  },
  analyticsSection: {
    title: 'Analytique comportementale',
    subtitle:
      'Signaux de plateforme en direct combines avec les anomalies, les sessions recentes et les previsions.',
    anomalyTierDistributionTitle: 'Distribution des niveaux d anomalie',
    anomalyTierDistributionSubtitle:
      'Sortie de classification en direct basee sur les evenements d anomalie confirmes.',
    eventsCount: '{count} evenements',
    confirmedCenterLabel: 'Confirmes',
    topAnomalyTypesTitle: 'Principaux types d anomalie',
    topAnomalyTypesSubtitle: 'Prioriser les reglages et les playbooks de reponse.',
    topAnomalyTypesEmpty: 'Aucun type d anomalie pour le moment.',
    topActionsTitle: 'Actions principales sur 15 minutes',
    topActionsSubtitle: 'Concentration comportementale de la fenetre de stats en direct.',
    topActionsEmpty: 'Aucune donnee d action en direct.',
    geolocationTitle: 'Geolocalisation des pays actifs',
    geolocationSubtitle: 'Points chauds pays dans la fenetre de trafic en direct.',
    sessionDurationTrendTitle: 'Tendance de la duree des sessions',
    sessionDurationTrendSubtitle:
      'Evolution recente de la duree des sessions a partir des dernieres traces analysees.',
    latestDurationLabel: 'Duree la plus recente',
    averageDurationLabel: 'Duree moyenne',
    averageActionsLabel: 'Actions moyennes',
    forecastedSpikesTitle: 'Pics prevus',
    forecastedSpikesSubtitle: 'Pics d actions predits par le service de tendance.',
    forecastedSpikesEmpty: 'Aucune alerte de pic.',
    anomalyScorePulseTitle: 'Pulse du score d anomalie',
    anomalyScorePulseSubtitle: 'Niveau d agressivite des derniers scores d anomalie.',
    recentSessionsTitle: 'Sessions recentes',
    recentSessionsSubtitle: 'Derniere activite des sessions dans le jeu de resultats courant.',
    loadingSessions: 'Chargement des sessions...',
    noSessionsReturned: 'Aucune session retournee.',
    recentAnomalyEventsTitle: 'Evenements d anomalie recents',
    recentAnomalyEventsSubtitle:
      'Dernieres anomalies confirmees pour la reponse des analystes.',
    loadingAnomalies: 'Chargement des anomalies...',
    noAnomalyEventsReturned: 'Aucun evenement d anomalie retourne.',
    actionFallback: 'Action {id}',
  },
  overviewPage: {
    liveAlertTitle: 'Alerte d anomalie en direct recue',
    behaviorMomentumTitle: 'Dynamique comportementale',
    behaviorMomentumSubtitle:
      'Duree recente des sessions et volume d actions derives des dernieres traces surveillees.',
    recentSessionsLoaded: '{count} sessions recentes chargees',
    sessionDurationPulseLabel: 'Pulse duree de session',
    actionVolumePulseLabel: 'Pulse volume d action',
    averageActionsLabel: 'Actions moyennes',
    averageUniqueActionsLabel: 'Actions uniques moyennes',
    latestAnomalyScoreLabel: 'Dernier score d anomalie',
    geolocationTitle: 'Geolocalisation des pays actifs',
    geolocationSubtitle: 'Distribution en direct des pays extraite de la fenetre de telemetrie.',
    liveActionsTitle: 'Actions en direct',
    liveActionsSubtitle: 'Actions principales sur les 15 dernieres minutes.',
    liveActionsEmpty: 'Aucune donnee d action en direct pour le moment.',
    anomalyTierMixTitle: 'Repartition des niveaux d anomalie',
    anomalyTierMixSubtitle: 'Distribution des dernieres classifications d anomalie.',
    anomalyTierMixCenterLabel: 'Niveaux d anomalie',
    priorityAnomalyTypesTitle: 'Types d anomalie prioritaires',
    priorityAnomalyTypesSubtitle:
      'Utilisez ceci pour concentrer le triage analyste et les reglages.',
    priorityAnomalyTypesEmpty: 'Aucun type d anomalie pour le moment.',
  },
  countryActivityMap: {
    activeCountries: 'Pays actifs',
    mappedCount: '{count} cartographies',
    coordinateUnavailable: 'coordonnee indisponible',
    noTelemetry: 'Aucune telemetrie pays dans la fenetre en direct actuelle.',
    unknownRegion: 'Region inconnue',
  },
  sparkAreaChart: {
    noSignalYet: 'Aucun signal pour le moment.',
  },
};

export default frFR;

