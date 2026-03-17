import { boot } from 'quasar/wrappers';
import axios from 'axios';

export default boot(({ app }) => {
  // Capture les erreurs globales de Vue 3 avec le type 'unknown'
  app.config.errorHandler = (err: unknown, instance, info) => {
    console.error('Erreur capturée par Quasar:', err);

    // Vérification sécurisée du type de l'erreur pour extraire le message
    const errorMessage = err instanceof Error ? err.message : String(err);

    // Envoi de l'erreur vers Logstash (Port 5001)
    axios
      .post('http://localhost:5001', {
        level: 'ERROR',
        application: 'quasar-frontend',
        message: errorMessage,
        vue_info: info,
        timestamp: new Date().toISOString(),
      })
      .catch((e) => console.error('Impossible de joindre Logstash', e));
  };
});
