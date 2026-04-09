const esES = {
  common: {
    anomaly: 'Anomalia',
    observed: 'Observado',
    unknown: 'DESCONOCIDO',
    notAvailable: 'n/d',
  },
  layout: {
    subtitle: 'Cockpit de inteligencia de comportamiento para operaciones de sesion en vivo',
    topPillLiveTelemetry: 'Telemetria en vivo',
    topPillStack: 'Redis + Kafka + contexto de IA',
    grafanaButton: 'Grafana',
    kibanaButton: 'Kibana',
    grafanaTooltip: 'Paneles de Grafana',
    kibanaTooltip: 'Resumen de Kibana',
    drawerKicker: 'Centro de mando',
    drawerTitle: 'Navega por las superficies en vivo',
    drawerCopy:
      'Mantiene alineados el stream, el triage de anomalias, las trazas de sesion y la inteligencia de usuarios en un solo flujo operativo.',
    navHeader: 'Superficies de control',
    operationalNoteLabel: 'Nota operativa',
    operationalNoteBody:
      'La barra lateral permanece abierta cuando cambias de pagina para que el contexto de mando siga visible durante la investigacion.',
    metricRefreshLabel: 'Refresco',
    metricRefreshValue: '60s',
    metricModeLabel: 'Modo',
    metricModeValue: 'En vivo',
    metricFocusLabel: 'Enfoque',
    metricFocusValue: 'Ops de riesgo',
    navigation: {
      overview: {
        label: 'Resumen',
        caption: 'Tablero ejecutivo de senales',
      },
      anomalies: {
        label: 'Anomalias',
        caption: 'Investigar eventos marcados',
      },
      workbench: {
        label: 'Workbench',
        caption: 'Revisar el contexto del stream en vivo',
      },
      sessions: {
        label: 'Sesiones',
        caption: 'Inspeccionar trazas de comportamiento',
      },
      insights: {
        label: 'Insights de usuario',
        caption: 'Cargar contexto de riesgo del asegurado',
      },
      analytics: {
        label: 'Analitica',
        caption: 'Tendencias y graficos geo',
      },
    },
    aria: {
      toggleNavigation: 'Alternar navegacion',
      openGrafana: 'Abrir el panel de Grafana en una nueva pestana',
      openKibana: 'Abrir el resumen de Kibana en una nueva pestana',
      profile: 'Perfil',
    },
  },
  analyticsSection: {
    title: 'Analitica de comportamiento',
    subtitle:
      'Senales de plataforma en vivo combinadas con eventos de anomalia, sesiones recientes y salida de pronostico.',
    anomalyTierDistributionTitle: 'Distribucion de niveles de anomalia',
    anomalyTierDistributionSubtitle:
      'Salida de clasificacion en vivo a partir de eventos de anomalia confirmados.',
    eventsCount: '{count} eventos',
    confirmedCenterLabel: 'Confirmados',
    topAnomalyTypesTitle: 'Principales tipos de anomalia',
    topAnomalyTypesSubtitle: 'Prioriza el ajuste y los playbooks de respuesta.',
    topAnomalyTypesEmpty: 'Aun no hay tipos de anomalia.',
    topActionsTitle: 'Acciones principales en 15 minutos',
    topActionsSubtitle: 'Concentracion de comportamiento en la ventana de estadisticas en vivo.',
    topActionsEmpty: 'No hay datos de acciones en vivo.',
    geolocationTitle: 'Geolocalizacion de paises activos',
    geolocationSubtitle: 'Paises mas activos en la ventana de trafico en vivo.',
    sessionDurationTrendTitle: 'Tendencia de duracion de sesion',
    sessionDurationTrendSubtitle:
      'Movimiento reciente de la duracion de sesion desde las ultimas trazas analizadas.',
    latestDurationLabel: 'Duracion mas reciente',
    averageDurationLabel: 'Duracion promedio',
    averageActionsLabel: 'Acciones promedio',
    forecastedSpikesTitle: 'Picos pronosticados',
    forecastedSpikesSubtitle: 'Picos de acciones predichos por el servicio de tendencias.',
    forecastedSpikesEmpty: 'No hay alertas de picos.',
    anomalyScorePulseTitle: 'Pulso de puntuacion de anomalia',
    anomalyScorePulseSubtitle: 'Que tan agresivas se ven las ultimas puntuaciones de anomalia.',
    recentSessionsTitle: 'Sesiones recientes',
    recentSessionsSubtitle: 'Actividad de sesion mas reciente del conjunto actual.',
    loadingSessions: 'Cargando sesiones...',
    noSessionsReturned: 'No se devolvieron sesiones.',
    recentAnomalyEventsTitle: 'Eventos de anomalia recientes',
    recentAnomalyEventsSubtitle:
      'Ultimas anomalias confirmadas para la respuesta de analistas.',
    loadingAnomalies: 'Cargando anomalias...',
    noAnomalyEventsReturned: 'No se devolvieron eventos de anomalia.',
    actionFallback: 'Accion {id}',
  },
  overviewPage: {
    liveAlertTitle: 'Alerta de anomalia en vivo recibida',
    behaviorMomentumTitle: 'Impulso de comportamiento',
    behaviorMomentumSubtitle:
      'Duracion reciente de sesiones y volumen de acciones a partir de las ultimas trazas monitoreadas.',
    recentSessionsLoaded: '{count} sesiones recientes cargadas',
    sessionDurationPulseLabel: 'Pulso de duracion de sesion',
    actionVolumePulseLabel: 'Pulso de volumen de acciones',
    averageActionsLabel: 'Acciones promedio',
    averageUniqueActionsLabel: 'Acciones unicas promedio',
    latestAnomalyScoreLabel: 'Ultima puntuacion de anomalia',
    geolocationTitle: 'Geolocalizacion de paises activos',
    geolocationSubtitle:
      'Distribucion en vivo de paises extraida de la ventana actual de telemetria.',
    liveActionsTitle: 'Acciones en vivo',
    liveActionsSubtitle: 'Acciones principales de los ultimos 15 minutos.',
    liveActionsEmpty: 'Aun no hay datos de acciones en vivo.',
    anomalyTierMixTitle: 'Mezcla de niveles de anomalia',
    anomalyTierMixSubtitle: 'Distribucion de las clasificaciones de anomalia mas recientes.',
    anomalyTierMixCenterLabel: 'Niveles de anomalia',
    priorityAnomalyTypesTitle: 'Tipos de anomalia prioritarios',
    priorityAnomalyTypesSubtitle: 'Usa esto para enfocar el triage y el ajuste de analistas.',
    priorityAnomalyTypesEmpty: 'Aun no hay tipos de anomalia.',
  },
  countryActivityMap: {
    activeCountries: 'Paises activos',
    mappedCount: '{count} mapeados',
    coordinateUnavailable: 'coordenada no disponible',
    noTelemetry: 'No hay telemetria de paises en la ventana en vivo actual.',
    unknownRegion: 'Region desconocida',
  },
  sparkAreaChart: {
    noSignalYet: 'Aun no hay senal.',
  },
};

export default esES;

