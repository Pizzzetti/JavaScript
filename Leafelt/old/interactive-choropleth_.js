var map = L.map('myMap').setView([46.29518, 8.04795], 14);

L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', {
	maxZoom: 20,
	attribution: '<a href="https://github.com/cyclosm/cyclosm-cartocss-style/releases" title="CyclOSM - Open Bicycle render">CyclOSM</a> | Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map); // the CyclOSM tile layer available from Leaflet servers


fetch("https://raw.githubusercontent.com/Pizzzetti/Public/main/Streamlit/SchaGaDu_v5_filtered_add.json")
    .then((response) =>{
        return response.json()
    })
    .then((data) => {
        var geojson;
        geojson = L.geoJson(data, {
            style: style,
            onEachFeature: ((feature, layer) => {
                layer.on('mouseover', ((e) => {  // highlight county on mouse hover
                    var layer = e.target;
                
                    layer.setStyle({
                        weight: 5,
                        color: getColor(feature.properties.KB),
                        dashArray: '',
                        fillOpacity: 0.7
                    });
                
                    layer.bringToFront();
                    info.update(layer.feature.properties)
                }))

                layer.on('mouseout', function () { // return to original symbology upon mouse hover out
                    geojson.resetStyle(this);
                    info.update();
                })

                layer.on('click', ((e) => {  // Zoom to county upon clicking it
                    map.fitBounds(e.target.getBounds())
                }))

            })
        }).addTo(map);
    })
    .catch((error) => {
        console.log(`This is the error: ${error}`)
    })

//// Adding some color
function getColor(d) {
    return 	d = 5 ? '#ff0000' :
			d = 4 ? '#ff9900' :
            d = 3 ? '#ffff00' :
            d = 2 ? '#c8e61e' :
            d = 1 ? '#46c846' :
                       '#808080';
}

// Function for setting color (using arrow function)
var style = ((feature)=> {
    return {
        fillColor: getColor(feature.properties.KB),
        weight: 2,
        opacity: 1,
        color: 'gray',
        fillOpacity: 0.5
    }
})

// Add control
var info = L.control();

info.onAdd = function (map) {
    this.div = L.DomUtil.create('div', 'info');
    this.update();
    return this.div;
};

// Method that we will use to update the control based on feature properties passed
info.update = function (props) {
    this.div.innerHTML = '<h4>Kenya Population Density</h4>' + (props ? 
        '<b>' + props.INV_KEY + '</br><br>' + 'Total Population' + '</b><br>' + props.KB + '<br><br>' + 
        props.OBJ_NAME + ' people / km<sup>2</sup>': 'Hover over state');
};

info.addTo(map);

// Create a legend
var legend = L.control({position: 'bottomright'});

legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend'),
    grades = [0, 1, 2, 3, 4, 5],
    labels = [];

    // loop through our density intervals and generate a label with a colored square for each interval
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML += 
            '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' + 
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
    }
    return div;
}

legend.addTo(map);












