/** Connection banner and per-view error boundary texts. es is the source; en/pt must match keys and {placeholders}. */
export const esResilience = {
  "conn.offline":
    "Sin conexión: los datos pueden estar desactualizados; tus cambios se guardan en este dispositivo y se suben al volver.",
  "conn.degraded":
    "El servidor no responde: los datos pueden estar desactualizados. Seguimos reintentando solos.",
  "conn.lastGood": "Último dato bueno {age}.",
  "conn.noData": "Todavía no se cargaron datos.",
  "conn.justNow": "hace menos de 1 min",
  "conn.retry": "Reintentar ahora",
  "conn.auth":
    "Tu sesión venció. Volvé a iniciar sesión; tus cambios locales se conservan en este dispositivo.",
  "conn.login": "Iniciar sesión",
  "view.error.title": "No se pudo mostrar {name}",
  "view.error.body":
    "Se cayó solo esta parte; el resto del panel sigue andando y tus datos no se tocaron.",
  "view.error.retry": "Reintentar",
  "view.map": "el mapa",
  "view.panel": "el panel lateral",
};

export const enResilience: typeof esResilience = {
  "conn.offline":
    "No connection: data may be out of date; your changes are saved on this device and uploaded when you are back online.",
  "conn.degraded":
    "The server is not responding: data may be out of date. We keep retrying on our own.",
  "conn.lastGood": "Last good data {age}.",
  "conn.noData": "No data has loaded yet.",
  "conn.justNow": "less than 1 min ago",
  "conn.retry": "Retry now",
  "conn.auth":
    "Your session expired. Sign in again; your local changes are kept on this device.",
  "conn.login": "Sign in",
  "view.error.title": "Could not display {name}",
  "view.error.body":
    "Only this part failed; the rest of the panel keeps working and your data was not touched.",
  "view.error.retry": "Retry",
  "view.map": "the map",
  "view.panel": "the side panel",
};

export const ptResilience: typeof esResilience = {
  "conn.offline":
    "Sem conexão: os dados podem estar desatualizados; suas alterações ficam salvas neste dispositivo e são enviadas quando voltar.",
  "conn.degraded":
    "O servidor não responde: os dados podem estar desatualizados. Continuamos tentando sozinhos.",
  "conn.lastGood": "Último dado bom {age}.",
  "conn.noData": "Ainda não foram carregados dados.",
  "conn.justNow": "há menos de 1 min",
  "conn.retry": "Tentar agora",
  "conn.auth":
    "Sua sessão expirou. Entre de novo; suas alterações locais ficam neste dispositivo.",
  "conn.login": "Entrar",
  "view.error.title": "Não foi possível mostrar {name}",
  "view.error.body":
    "Só esta parte falhou; o resto do painel segue funcionando e seus dados não foram tocados.",
  "view.error.retry": "Tentar de novo",
  "view.map": "o mapa",
  "view.panel": "o painel lateral",
};
