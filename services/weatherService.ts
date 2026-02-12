
// SERVIÇO DE METEOROLOGIA ATUALIZADO PARA OPEN-METEO
// Vantagem: Não requer chave de API (API Key), eliminando erros de autenticação.
const LAT = -22.6119; // Paracambi-RJ Latitude
const LON = -43.7111; // Paracambi-RJ Longitude

// Mapeia os códigos WMO (World Meteorological Organization) do Open-Meteo para emojis.
const getWmoWeatherIcon = (code: number): string => {
    if (code === 0) return '☀️'; // Céu limpo
    if (code >= 1 && code <= 3) return '🌤️'; // Principalmente limpo, parcialmente nublado
    if (code === 45 || code === 48) return '🌫️'; // Nevoeiro
    if (code >= 51 && code <= 57) return '🌦️'; // Chuvisco
    if (code >= 61 && code <= 67) return '🌧️'; // Chuva
    if (code >= 71 && code <= 77) return '❄️'; // Neve
    if (code >= 80 && code <= 82) return '🌧️'; // Pancadas de chuva
    if (code === 95 || code === 96 || code === 99) return '⛈️'; // Tempestade
    return '🌡️'; // Padrão
};

const WMO_DESCRIPTIONS: { [key: number]: string } = {
    0: 'Céu limpo',
    1: 'Principalmente limpo',
    2: 'Parcialmente nublado',
    3: 'Nublado',
    45: 'Nevoeiro',
    48: 'Nevoeiro com geada',
    51: 'Chuvisco leve',
    53: 'Chuvisco moderado',
    55: 'Chuvisco intenso',
    61: 'Chuva leve',
    63: 'Chuva moderada',
    65: 'Chuva forte',
    80: 'Pancadas de chuva leves',
    81: 'Pancadas de chuva moderadas',
    82: 'Pancadas de chuva violentas',
    95: 'Trovoada',
    96: 'Trovoada com granizo leve',
    99: 'Trovoada com granizo forte',
};

export const getWeatherForecast = async (dateStr: string): Promise<string> => {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&daily=weather_code,temperature_2m_max&timezone=America/Sao_Paulo`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API retornou status ${response.status}`);
        }
        const data = await response.json();
        
        const dateIndex = data.daily.time.findIndex((d: string) => d === dateStr);

        if (dateIndex === -1) {
            return 'Previsão não disponível para esta data.';
        }

        const weatherCode = data.daily.weather_code[dateIndex];
        const maxTemp = Math.round(data.daily.temperature_2m_max[dateIndex]);
        const icon = getWmoWeatherIcon(weatherCode);
        const description = WMO_DESCRIPTIONS[weatherCode] || 'Condição desconhecida';
        
        return `${icon} ${description}, ${maxTemp}°C`;

    } catch (error: any) {
        console.error("Erro ao buscar previsão do tempo:", error.message);
        return `Falha na previsão: ${error.message}`;
    }
};

export const getHistoricalWeather = async (dateStr: string): Promise<string> => {
    try {
        const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${LAT}&longitude=${LON}&start_date=${dateStr}&end_date=${dateStr}&daily=weather_code,temperature_2m_max&timezone=America/Sao_Paulo`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API de histórico retornou status ${response.status}`);
        }
        const data = await response.json();

        if (!data.daily || !data.daily.time || data.daily.time.length === 0) {
            return 'Dados históricos não encontrados.';
        }

        const weatherCode = data.daily.weather_code[0];
        const maxTemp = Math.round(data.daily.temperature_2m_max[0]);
        const icon = getWmoWeatherIcon(weatherCode);
        const description = WMO_DESCRIPTIONS[weatherCode] || 'Condição desconhecida';
        
        return `${icon} ${description}, ${maxTemp}°C`;

    } catch (error: any) {
        console.error("Erro ao buscar tempo histórico:", error.message);
        return `Falha no histórico: ${error.message}`;
    }
};
