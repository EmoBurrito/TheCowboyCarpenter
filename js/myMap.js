/*variables to track map objects for smoother functionality*/
var map, info, route, mapContainer;
var markers = [];
var geoCoded = { "isError": true, "city": "not found", "state": "not found", "stateAbbr": "not found", "country": "not found", "countryAbbbr": "not found", "address": "not found" };
var reverseGeocodeReturn = $.noop; //it will not do anything

function reverseGeocode(position) {
    var lat = position.coords.latitude,
        lng = position.coords.longitude,
        latlng = new google.maps.LatLng(lat, lng),
        geocoder = new google.maps.Geocoder();
    //makes another asyncronus call to google geocoder services
    //When the call returns it will execute the parseReverseGeocode function
    geocoder.geocode({ 'latLng': latlng }, parseReverseGeocode);
}

function parseReverseGeocode(results, status) {
    if (status == google.maps.GeocoderStatus.OK && results[1]) {
        geoCoded.isError = false;
        geoCoded.address = results[1].formatted_address;
        for (var ac = 0; ac < results[0].address_components.length; ac++) {
            var component = results[0].address_components[ac];

            switch (component.types[0]) {
                case 'locality':
                    geoCoded.city = component.long_name;
                    break;
                case 'administrative_area_level_1':
                    geoCoded.state = component.long_name;
                    geoCoded.stateAbbr = component.short_name;
                    break;
                case 'country':
                    geoCoded.country = component.long_name;
                    geoCoded.countryAbbbr = component.short_name;
                    break;
            }
        }
    }
    else {
        geoCoded.isError = true;
    }
    reverseGeocodeReturn(geoCoded);
}


/* create the map and plot the first marker on the map*/
function loadMap(target,startAddress,description) {

    clearMap();
    mapContainer = $(target);
    mapContainer.gmap3({
        map: {
            options: { maxZoom: 17 },
            callback: function (newMap) { map = newMap; }
        },
        marker: {
            address: startAddress, /* set marker position with a full address */
            data: description,
            events: { click: showInfo },
            callback: function (newMarker) { markers.push(newMarker); }
        },
        autofit: {} /*tell map to zoom and center automatically*/
    });
}

/* use geolocation to get the user's current location and plot the marker on the map */
function showLocation() {
    mapContainer.gmap3({
        getgeoloc: {
            callback: function (latLng) {
                if (latLng) {
                    $(this).gmap3({
                        /*plot a marker on the map for the geolocation result*/
                        marker: {
                            latLng: latLng, /* set marker position with latitiude and longitude instead of an address */
                            options: { icon: "//maps.google.com/mapfiles/marker_green.png" },/* use a different marker icon*/
                            data: "your current location <a href='javascript:showRoute();'>Navigate</a>",
                            events: { click: showInfo },
                            callback: function (newMarker) { markers.push(newMarker); }
                        },
                        autofit: {} /*tell map to zoom and center automatically*/
                    });
                } else {
                    alert("Don't know where you are!")
                }
            }
        }
    });
}

/* show infowindow when user clicks on a marker in the map*/
function showInfo(marker, event, context) {
    if (info) {
        /*infowindow already exists so re-use infowindow object*/
        info.open(map, marker);/* set infowindow location to clicked marker */
        info.setContent(context.data);/* set infowindow content from context.data */
    } else {
        /* infowindow does not exist yet so get gmap3 to create one */
        $(this).gmap3({
            infowindow: {
                anchor: marker,/* set infowindow location to clicked marker */
                options: { content: context.data }, /* set infowindow content from context.data */
                callback: function (newInfo) { info = newInfo; }
            }
        });
    }
}


/* clear the markers and plot a route on the map*/
function showRoute() {
    mapContainer.gmap3({
        getroute: {
            options: {
                origin: markers[1].getPosition(),
                destination: markers[0].getPosition(),
                travelMode: google.maps.DirectionsTravelMode.DRIVING
            },
            callback: function (results) {
                if (results) {
                    clearMap();

                    $(this).gmap3({
                        directionsrenderer: {
                            options: { directions: results },
                            callback: function (newRoute) { route = newRoute; }
                        },
                        autofit: {} /*tell map to zoom and center automatically*/
                    });
                } else {
                    alert("Can't get there from here!")
                }
            }
        }
    });
}

/* remove the markers and routes from the map */
function clearMap() {

    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];/* re-initialize the markers array to delete markers */


    if (route) {
        route.setMap(null);
        route = null;/* re-initialize the route variable to delete route */
    }
}