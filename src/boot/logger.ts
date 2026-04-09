// Logger boot file: capture uncaught Vue errors and forward them to the logging pipeline.
import { boot } from 'quasar/wrappers';
import axios from 'axios';
import { environment } from 'src/config/environment';

// Hook into Vue's global error pipeline and send a fire-and-forget Logstash payload.
export default boot(({ app }) => {
  // Global Vue error handler with Logstash forwarding.
  app.config.errorHandler = (err: unknown, instance, info) => {
    console.error('Erreur capturée par Quasar:', err);

    // Normalize unknown errors into a readable message.
    const errorMessage = err instanceof Error ? err.message : String(err);

    // Fire-and-forget Logstash payload.
    axios
      .post(environment.loggerEndpoint, {
        level: 'ERROR',
        application: environment.loggerApplication,
        message: errorMessage,
        vue_info: info,
        timestamp: new Date().toISOString(),
      })
      .catch((e) => console.error('Impossible de joindre Logstash', e));
  };
});
