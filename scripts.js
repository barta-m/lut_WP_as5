const map = L.map("map", {
    minZoom: -3 
});

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

async function fetchMigData() {
    const posMigration = await fetch("https://statfin.stat.fi/PxWeb/sq/4bb2c735-1dc3-4c5e-bde7-2165df85e65f").then(res => res.json());
    const negMigration = await fetch("https://statfin.stat.fi/PxWeb/sq/944493ca-ea4d-4fd9-a75c-4975192f7b6e").then(res => res.json());
    return { posMigration, negMigration };
}

function getColor(pos, neg) {
    let hue = Math.min((Math.pow((pos / neg), 3) * 60), 120);
    return "hsl(" + hue + ", 75%, 50%)";
}

fetch("https://geo.stat.fi/geoserver/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=tilastointialueet:kunta4500k&outputFormat=json&srsName=EPSG:4326")
    .then(response => response.json())
    .then(async geojsonData => {
        const migrationData = await fetchMigData();
        const positiveData = migrationData.posMigration;
        const negativeData = migrationData.negMigration;
        const geojsonLayer = L.geoJSON(geojsonData, {
            style: function(feature) {
                const id = feature.id
                const municipalityIndex = parseInt(id.split(".")[1])
                const posValue = positiveData.dataset.value[municipalityIndex];
                const negValue = negativeData.dataset.value[municipalityIndex];
                const color = getColor(posValue, negValue);
                return {
                    weight: 2,
                    color: color
                };
            },
            onEachFeature: function(feature, layer) {
                layer.bindTooltip(feature.properties.name);
                const id = feature.id;
                const municipalityIndexPopup = parseInt(id.split(".")[1]);
                const posValuePopup = positiveData.dataset.value[municipalityIndexPopup];
                const negValuePopup = negativeData.dataset.value[municipalityIndexPopup];
                layer.on("click", function () {
                    const popupContent = `
                        Municipality: ${feature.properties.name}<br>
                        Positive migration: ${posValuePopup}<br>
                        Negative migration: ${negValuePopup}
                    `;
                    layer.bindPopup(popupContent).openPopup();
                });
            }
        }).addTo(map);
        map.fitBounds(geojsonLayer.getBounds());
    })