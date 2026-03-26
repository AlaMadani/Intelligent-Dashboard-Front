import { boot } from 'quasar/wrappers';
import axios from 'axios';

export default boot(({ app }) => {
  // Global Vue error handler with Logstash forwarding.
  app.config.errorHandler = (err: unknown, instance, info) => {
    console.error('Erreur capturée par Quasar:', err);

    // Normalize unknown errors into a readable message.
    const errorMessage = err instanceof Error ? err.message : String(err);

    // Fire-and-forget Logstash payload.
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
