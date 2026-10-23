/** "Season" card in Metrics: this year against earlier ones. es is the source; en/pt must match keys and {placeholders}. */
export const esHistory = {
  "season.title": "Temporada",
  "season.badge": "VIIRS NOAA-20",
  "season.intro":
    "¿Es mucho o poco para esta época? Los focos de los últimos 10 días contra las mismas fechas de años anteriores.",
  "season.loading":
    "Consultando el archivo de NASA FIRMS (puede tardar unos segundos)…",
  "season.error": "No se pudo traer la comparación con otras temporadas.",
  "season.denied":
    "Tu sesión venció. Volvé a iniciar sesión para ver la comparación.",
  "season.retry": "Reintentar",
  "season.empty":
    "NASA FIRMS no devolvió datos de años anteriores para estas fechas, así que no hay con qué comparar.",
  "season.v.high": "Por encima de lo normal",
  "season.v.normal": "Normal para la época",
  "season.v.low": "Por debajo de lo normal",
  "season.v.unknown": "Sin veredicto",
  "season.phrase":
    "Hoy hay {x} veces los focos de un día típico de esta fecha.",
  "season.same": "Hoy hay prácticamente los mismos focos que en un día típico de esta fecha.",
  "season.tiny":
    "En esta época hay muy pocos focos en años anteriores (menos de {min} en 10 días): una comparación daría cifras sin sentido.",
  "season.noCurrent":
    "Este año no hay datos de los últimos 10 días para comparar.",
  "season.basis": "Comparado con {used} de {asked} años anteriores ({years}).",
  "season.range":
    "En las mismas fechas esos años tuvieron entre {min} y {max} focos en 10 días; este año, {cur}.",
  "season.legend.now": "Este año",
  "season.legend.band": "Rango de años anteriores",
  "season.legend.mean": "Promedio",
  "season.aria":
    "Focos por día en los últimos 10 días: este año {cur} en total; años anteriores, {avg} en promedio.",
  "season.caption": "Focos por día: este año y rango de años anteriores",
  "season.col.day": "Día",
  "season.col.now": "Este año",
  "season.col.min": "Mínimo",
  "season.col.mean": "Promedio",
  "season.col.max": "Máximo",
  "season.note":
    "Un solo satélite (NOAA-20, el único que vuela en todos los años comparados) y solo confianza nominal o alta. Los años anteriores salen del archivo estándar de FIRMS; este año, del tiempo casi real, que después puede ajustarse un poco.",
};

export const enHistory: typeof esHistory = {
  "season.title": "Season",
  "season.badge": "VIIRS NOAA-20",
  "season.intro":
    "Is this a lot or a little for the time of year? Fires in the last 10 days against the same dates in earlier years.",
  "season.loading": "Querying the NASA FIRMS archive (may take a few seconds)…",
  "season.error": "Could not load the comparison with other seasons.",
  "season.denied": "Your session expired. Sign in again to see the comparison.",
  "season.retry": "Retry",
  "season.empty":
    "NASA FIRMS returned no data for earlier years on these dates, so there is nothing to compare with.",
  "season.v.high": "Above normal",
  "season.v.normal": "Normal for the season",
  "season.v.low": "Below normal",
  "season.v.unknown": "No verdict",
  "season.phrase":
    "Today there are {x} times the fires of a typical day on this date.",
  "season.same": "Today has practically the same number of fires as a typical day on this date.",
  "season.tiny":
    "This time of year has very few fires in earlier years (under {min} in 10 days): a comparison would give meaningless figures.",
  "season.noCurrent":
    "There is no data for the last 10 days of this year to compare.",
  "season.basis": "Compared with {used} of {asked} earlier years ({years}).",
  "season.range":
    "On the same dates those years had between {min} and {max} fires in 10 days; this year, {cur}.",
  "season.legend.now": "This year",
  "season.legend.band": "Range of earlier years",
  "season.legend.mean": "Average",
  "season.aria":
    "Fires per day over the last 10 days: {cur} in total this year; earlier years averaged {avg}.",
  "season.caption": "Fires per day: this year and range of earlier years",
  "season.col.day": "Day",
  "season.col.now": "This year",
  "season.col.min": "Minimum",
  "season.col.mean": "Average",
  "season.col.max": "Maximum",
  "season.note":
    "A single satellite (NOAA-20, the only one flying in every year compared) and only nominal or high confidence. Earlier years come from the FIRMS standard archive; this year from near-real-time, which may be adjusted slightly later.",
};

export const ptHistory: typeof esHistory = {
  "season.title": "Temporada",
  "season.badge": "VIIRS NOAA-20",
  "season.intro":
    "É muito ou pouco para esta época? Os focos dos últimos 10 dias contra as mesmas datas de anos anteriores.",
  "season.loading":
    "Consultando o arquivo da NASA FIRMS (pode levar alguns segundos)…",
  "season.error":
    "Não foi possível carregar a comparação com outras temporadas.",
  "season.denied": "Sua sessão expirou. Entre de novo para ver a comparação.",
  "season.retry": "Tentar de novo",
  "season.empty":
    "A NASA FIRMS não devolveu dados de anos anteriores para estas datas, então não há com o que comparar.",
  "season.v.high": "Acima do normal",
  "season.v.normal": "Normal para a época",
  "season.v.low": "Abaixo do normal",
  "season.v.unknown": "Sem veredito",
  "season.phrase": "Hoje há {x} vezes os focos de um dia típico desta data.",
  "season.same": "Hoje há praticamente os mesmos focos de um dia típico desta data.",
  "season.tiny":
    "Nesta época há pouquíssimos focos em anos anteriores (menos de {min} em 10 dias): uma comparação daria números sem sentido.",
  "season.noCurrent":
    "Este ano não há dados dos últimos 10 dias para comparar.",
  "season.basis": "Comparado com {used} de {asked} anos anteriores ({years}).",
  "season.range":
    "Nas mesmas datas esses anos tiveram entre {min} e {max} focos em 10 dias; este ano, {cur}.",
  "season.legend.now": "Este ano",
  "season.legend.band": "Faixa de anos anteriores",
  "season.legend.mean": "Média",
  "season.aria":
    "Focos por dia nos últimos 10 dias: {cur} no total este ano; anos anteriores, {avg} em média.",
  "season.caption": "Focos por dia: este ano e faixa de anos anteriores",
  "season.col.day": "Dia",
  "season.col.now": "Este ano",
  "season.col.min": "Mínimo",
  "season.col.mean": "Média",
  "season.col.max": "Máximo",
  "season.note":
    "Um único satélite (NOAA-20, o único que voa em todos os anos comparados) e só confiança nominal ou alta. Os anos anteriores vêm do arquivo padrão da FIRMS; este ano, do tempo quase real, que depois pode ser ajustado um pouco.",
};
