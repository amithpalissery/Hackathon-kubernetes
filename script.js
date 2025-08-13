document.addEventListener('DOMContentLoaded', () => {
    const cityForm = document.getElementById('city-form');
    const cityInput = document.getElementById('city-input');
    const dashboardContainer = document.getElementById('dashboard-container');
    const loadingIndicator = document.getElementById('loading-indicator');
    const body = document.body;

    let cities = JSON.parse(localStorage.getItem('weatherCities')) || [];
    cities.forEach(cityData => fetchWeatherData(cityData.name, true));

    cityForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const city = cityInput.value.trim();
        if (city) {
            const existingCity = cities.find(c => c.name.toLowerCase() === city.toLowerCase());
            if (!existingCity) {
                loadingIndicator.classList.remove('hidden');
                await fetchWeatherData(city, false);
                loadingIndicator.classList.add('hidden');
                cityInput.value = '';
            } else {
                alert('This city is already on the dashboard.');
            }
        }
    });

    dashboardContainer.addEventListener('click', (e) => {
        const removeButton = e.target.closest('.remove-btn');
        if (removeButton) {
            const card = removeButton.closest('.weather-card');
            const cityToRemove = card.dataset.city;

            cities = cities.filter(city => city.name !== cityToRemove);
            localStorage.setItem('weatherCities', JSON.stringify(cities));

            card.style.animation = 'fadeOut 0.5s ease-out forwards';
            card.addEventListener('animationend', () => card.remove());
        } else {
            // Toggle expanded class for more details
            const card = e.target.closest('.weather-card');
            if (card) {
                card.classList.toggle('expanded');
            }
        }
    });

    async function fetchWeatherData(city, isInitialLoad = false) {
        try {
            const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`);
            const geoData = await geoResponse.json();

            if (!geoData.results || geoData.results.length === 0) {
                if (!isInitialLoad) {
                    alert('City not found. Please try again.');
                }
                return;
            }
            const { name, latitude, longitude } = geoData.results[0];
            const cityData = { name, latitude, longitude };

            if (!isInitialLoad) {
                cities.push(cityData);
                localStorage.setItem('weatherCities', JSON.stringify(cities));
            }

            const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&timezone=auto`);
            const weatherData = await weatherResponse.json();

            const airQualityResponse = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&hourly=us_aqi&timezone=auto`);
            const airQualityData = await airQualityResponse.json();

            const aqi = airQualityData.hourly?.us_aqi?.[0] ?? 'N/A';
            const weatherCode = weatherData.current.weather_code;

            const weather = {
                name: name,
                temp: weatherData.current.temperature_2m,
                humidity: weatherData.current.relative_humidity_2m,
                description: getWeatherDescription(weatherCode),
                icon: getWeatherIcon(weatherCode),
                wind: weatherData.current.wind_speed_10m,
                aqi: aqi,
                lastUpdated: new Date().toLocaleTimeString()
            };


            displayWeatherCard(weather);

        } catch (error) {
            console.error('Error fetching data:', error);
            if (!isInitialLoad) {
                alert('Failed to fetch weather data. Please try again later.');
            }
        } finally {
            if (!isInitialLoad) {
                loadingIndicator.classList.add('hidden');
            }
        }
    }

 

    function getWeatherDescription(code) {
        const weatherDescriptions = {
            0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
            45: 'Fog', 48: 'Depositing rime fog', 51: 'Drizzle', 53: 'Moderate Drizzle', 55: 'Dense Drizzle',
            61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain',
            71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow',
            80: 'Rain showers', 81: 'Rain showers', 82: 'Heavy rain showers',
            95: 'Thunderstorm'
        };
        return weatherDescriptions[code] || 'N/A';
    }

    function getWeatherIcon(code) {
        if (code <= 3) return '☀️';
        if (code >= 45 && code <= 48) return '🌫️';
        if (code >= 51 && code <= 55) return '🌧️';
        if (code >= 61 && code <= 65 || code >= 80 && code <= 82) return '🌧️';
        if (code >= 71 && code <= 75) return '❄️';
        if (code === 95) return '⛈️';
        return '❓';
    }

    function displayWeatherCard(weather) {
        const aqiColorClass = getAqiColorClass(weather.aqi);
        const aqiStatus = getAqiStatus(weather.aqi);
        const weatherCardHtml = `
            <div class="weather-card" data-city="${weather.name}">
                <button class="remove-btn"><i class="fas fa-times"></i></button>
                <h2>${weather.name}</h2>
                <p class="temp">${weather.icon} ${Math.round(weather.temp)}°C</p>
                <p><strong>Condition:</strong> ${weather.description}</p>
                <p class="aqi ${aqiColorClass}"><strong>AQI:</strong> ${weather.aqi} (${aqiStatus})</p>
                <div class="extra-details">
                    <p><strong>Humidity:</strong> ${weather.humidity}%</p>
                    <p><strong>Wind:</strong> ${weather.wind} km/h</p>
                </div>
                <small>Last updated: ${weather.lastUpdated}</small>
            </div>
        `;
        dashboardContainer.insertAdjacentHTML('beforeend', weatherCardHtml);
    }

    function getAqiColorClass(aqi) {
        if (typeof aqi !== 'number') return '';
        if (aqi <= 50) return 'good';
        if (aqi <= 100) return 'moderate';
        if (aqi <= 150) return 'unhealthy';
        if (aqi > 150) return 'hazardous';
        return '';
    }

    function getAqiStatus(aqi) {
        if (typeof aqi !== 'number') return 'N/A';
        if (aqi <= 50) return 'Good';
        if (aqi <= 100) return 'Moderate';
        if (aqi <= 150) return 'Unhealthy';
        if (aqi > 150) return 'Hazardous';
        return 'N/A';
    }
});