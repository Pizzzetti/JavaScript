var map = L.map('myMap').setView([46.29518, 8.04795], 14);

//L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', {
//	maxZoom: 20,
//	attribution: '<a href="https://github.com/cyclosm/cyclosm-cartocss-style/releases" title="CyclOSM - Open Bicycle render">CyclOSM</a> | Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//}).addTo(map); // the CyclOSM tile layer available from Leaflet servers



function addSwisstopo(map) {
	swisstopo = L.tileLayer.wms(
		"https://wms.geo.admin.ch/",
		{"attribution": "", "format": "image/jpeg", "layers": "ch.swisstopo.landeskarte-grau-10", "opacity": 0.5, "styles": "", "transparent": true, "version": "1.1.1"}
	).addTo(map);
	return swisstopo;
}


function extractPropertyNames(data) {
	var propertyNames = [];
	data.features.forEach(feature => {
		Object.keys(feature.properties).forEach(property => {
			if (!propertyNames.includes(property)) {
				propertyNames.push(property);
			}
		});
	});
	return propertyNames;
}

// Function to extract all unique values for a given property from GeoJSON data
function extractPropertyValues(data, property) {
    var propertyValues = [];
    data.features.forEach(function(feature) {
        if (feature.properties && feature.properties.hasOwnProperty(property)) {
            var value = feature.properties[property];
            if (propertyValues.indexOf(value) === -1) {
                propertyValues.push(value);
            }
        }
    });
    return propertyValues;
}

function generateMap(data,map) {

    // Definisci lo stile dei tuoi dati GeoJSON
    function style(feature) {
        return {
            fillColor: getColor(feature.properties.KB),
            weight: 3,
            opacity: 1,
            color: getColor(feature.properties.KB),
            fillOpacity: 0.5
        };
    }

    // Crea un layer GeoJSON e aggiungilo alla mappa
    var geojson = L.geoJson(data, {
        style: style,
        onEachFeature: function(feature, layer) {
            // Aggiungi eventi a ciascuna feature
            layer.on('click', function(e) {
                if (selectedLayer) {
                    selectedLayer.selected = false;
                    geojson.resetStyle(selectedLayer);
                }

                map.fitBounds(e.target.getBounds());
                selectedLayer = layer;
                layer.selected = true;
                info.update(layer.feature.properties);
            });

            layer.on('mouseover', function(e) {
                var layer = e.target;
                
                layer.setStyle({
                    weight: 3,
                    color: 'blue',
                    dashArray: '',
                    fillColor: 'blue',
                    fillOpacity: 0.5
                });
                
                layer.bringToFront();
                info.update(layer.feature.properties);
            });

            layer.on('mouseout', function() { 
                if (!layer.selected) {
                    geojson.resetStyle(this);
                    info.update();
                }
            });
        }
    }).addTo(map);

    // Aggiungi controlli e legenda, se necessario

    // Restituisci il layer GeoJSON
    return geojson;
}

// Clear the map completely
function clearAllLayersExceptOne(map, layerToKeep) {
    map.eachLayer(function (layer) {
        if (layer !== layerToKeep) {
            map.removeLayer(layer);
        }
    });
}

fetch("https://raw.githubusercontent.com/Pizzzetti/Public/main/Streamlit/SchaGaDu_v5_filtered_add.json")
    .then((response) =>{
        return response.json()
    })
    .then((data) => {
	var geojson = generateMap(data,map);
	var swisstopo = addSwisstopo(map);
			
	// Function to extract all unique property names from GeoJSON data

	// Extract all unique property names from the GeoJSON data
	var propertyNames = extractPropertyNames(data);

	// Create the filter dropdown
	var filterDropdown = L.control({position: 'topleft'});

	filterDropdown.onAdd = function (map) {
		var div = L.DomUtil.create('div', 'info legend');
		var select = '<select id="propertyFilter">';
		//select += '<option value="">Filter by property</option>';
		propertyNames.forEach(property => {
			select += '<option value="' + property + '">' + property + '</option>';
		});
		select += '</select>';
		div.innerHTML = select;
		// Add event listener here
		div.addEventListener('change', function() {
			var selectedProperty = document.getElementById('propertyFilter').value;
			updateValueDropdown(selectedProperty);
		});
		return div;
	};
	filterDropdown.addTo(map);
	
	function updateValueDropdown(selectedProperty) {
		var geojson = generateMap(data,map);
		var propertValues = extractPropertyValues(data, selectedProperty);
		propertValues.unshift("ALL");
		var select = '<select id="valuesFilter">';
		//select += '<option value="">ALL</option>';
		propertValues.forEach(property => {
			select += '<option value="' + property + '">' + property + '</option>';
		});
		select += '</select>';
		document.getElementById('valueDropdown').innerHTML = select;
	}

	// Create the second filter dropdown
	var valueDropdown = L.control({position: 'topleft'});

	valueDropdown.onAdd = function (map) {
		var div = L.DomUtil.create('div', 'info legend');
		div.id = 'valueDropdown';
		return div;
	};

	valueDropdown.addTo(map);

	// Event listener for the second filter dropdown
	document.addEventListener('change', function(event) {
		if (event.target && event.target.id === 'valuesFilter') {
			var selectedProperty = document.getElementById('propertyFilter').value;
			var selectedValue = document.getElementById('valuesFilter').value;
			filterGeoJSON(selectedProperty, selectedValue, swisstopo);
		}
	});
	
	// Function to filter GeoJSON data based on selected property and value
	function filterGeoJSON(property, value, swisstopo) {
		clearAllLayersExceptOne(map,swisstopo);
		//var swisstopo = addSwisstopo(map);
		//map.removeLayer(geojson);
		console.log(property);
		console.log(value);
		console.log(geojson)
		// Filtra i dati GeoJSON in base alla proprietà e al valore selezionati
		if (value === "ALL") {
			var geojson = generateMap(data,map);// If "ALL" is selected, display all features without filtering
        return;
		}
	
		var filteredFeatures = data.features.filter(feature => {
        // Convert property value to string for comparison
        var propValueAsString = String(feature.properties[property]);
        var selectedValueAsString = String(value);
        return propValueAsString === selectedValueAsString;
		});

		// Crea un nuovo layer GeoJSON con le feature filtrate e aggiungilo alla mappa
		var geojson = L.geoJson(filteredFeatures, {
			style: style,
			onEachFeature: ((feature, layer) => {
				layer.on('click', ((e) => {  
					if (selectedLayer) {
						selectedLayer.selected = false;
						geojson.resetStyle(selectedLayer);
					}

					map.fitBounds(e.target.getBounds());
					selectedLayer = layer;
					layer.selected = true;
					info.update(layer.feature.properties);
				}));

				layer.on('mouseover', ((e) => {  
					var layer = e.target;
					
					layer.setStyle({
						weight: 3,
						color: 'blue',
						dashArray: '',
						fillColor: 'blue',
						fillOpacity: 0.5
					});
					
					layer.bringToFront();
					info.update(layer.feature.properties);
				}));

				layer.on('mouseout', function () { 
					if (!layer.selected) {
						geojson.resetStyle(this);
						info.update();
					}
				});
			})
		}).addTo(map);
		//return geojson;
	}
	})


    .catch((error) => {
        console.log(`This is the error: ${error}`)
    })


//// Adding some color
function getColor(d) {
    return 	d >= 5 ? '#ff0000' :
			d >= 4 ? '#ff9900' :
            d >= 3 ? '#ffff00' :
            d >= 2 ? '#c8e61e' :
            d >= 1 ? '#46c846' :
                     '#808080';
}

// Function for setting color (using arrow function)
var style = ((feature)=> {
    return {
        fillColor: getColor(feature.properties.KB),
        weight: 3,
        opacity: 1,
        color: getColor(feature.properties.KB),
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
    this.div.innerHTML = '<h4>GIS SchaGaDu</h4>' + (props ? 
        '<b> INV_KEY: ' + props.INV_KEY + '</br><br>ZK: ' + props.KB + '<br><br>NAME:' + 
        props.OBJ_NAME + '</br><br>Link:'+'<a href="https://www.gazzetta.it/">LINK</a>': 'No object selected');
};

info.addTo(map);

// Create a legend
var legend = L.control({position: 'bottomright'});

legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend'),
    grades = [1, 2, 3, 4, 5],
    labels = [];

    // loop through our density intervals and generate a label with a colored square for each interval
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML += 
            '<i style="background:' + getColor(grades[i]) + '"></i> ' + 
            grades[i] + (grades[i] ? ' ' + '<br>' : '');
    }
    return div;
}

legend.addTo(map);