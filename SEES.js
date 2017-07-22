var map = L.map('map', {center: [39, -98], zoom: 5, minZoom: 3});
//swutches basemap
var layer = L.esri.basemapLayer('Topographic').addTo(map);
var layerLabels;
function setBasemap(basemap) {
  if (layer) {
    map.removeLayer(layer);
  }
  layer = L.esri.basemapLayer(basemap);
  map.addLayer(layer);
  if (layerLabels) {
    map.removeLayer(layerLabels);
  }
  if (basemap === 'Gray'
  || basemap === 'Imagery') {
  layerLabels = L.esri.basemapLayer(basemap + 'Labels');
  map.addLayer(layerLabels);
  }
}
function changeBasemap(basemaps){
  var basemap = basemaps.value;
  setBasemap(basemap);
}

$(document).ready(function(){
  //variable names
  var vulnerable = L.esri.featureLayer({
    url: 'http://services.arcgisonline.com/arcgis/rest/services/Demographics/USA_Unemployment_Rate/MapServer/2',
    simplifyFactor:0.5,
    style: {color:"purple", fillOpacity:.5}
  });
  var watchesWarnings = L.esri.featureLayer({
      url:'https://idpgis.ncep.noaa.gov/arcgis/rest/services/NWS_Forecasts_Guidance_Warnings/watch_warn_adv/MapServer/1',
      simplifyFactor: 0.5,
      style:function(feature) {
                switch (feature.properties.prod_type) {
                    case "Heat Advisory": return {color: "orange",fillOpacity:0.6,weight: 0.2};
                    case "Excessive Heat Warning": return {color: "red",fillOpacity:0.6,weight: 0.2};
                    case "Excessive Heat Watch": return {color: "yellow",fillOpacity:0.6,weight: 0.2};
                    case "Extreme Cold Warning": return {color: "blue",fillOpacity:0.6,weight: 0.2};
                    case "Extreme Cold Watch": return {color: "teal",fillOpacity:0.6,weight: 0.2};
                    default:
                        return {color: 'grey'};
                        break;
                }
            }
    });
    var currentData = watchesWarnings.setWhere("prod_type='Excessive Heat Warning' OR prod_type='Excessive Heat Watch' OR prod_type='Heat Advisory' OR prod_type='Extreme Cold Warning' OR prod_type='Extreme Cold Watch'");
    var unemployment = vulnerable.setWhere("UNEMPRT_CY>16");

    var clicked= false;
    var clicked1= false;
//toggle switch code
    $("#currentCheck").on("click", function(){
      if(clicked) {
        map.removeLayer(currentData);
        clicked=false;
      } else if(!clicked) {
        map.addLayer(currentData);
        clicked=true;
      }
    });
    $("#homelessCheck").on("click", function(){
      if(clicked1) {
        map.removeLayer(unemployment);
        clicked1=false;
      } else if(!clicked1) {
        map.addLayer(unemployment);
        clicked1=true;
      }
    });
    //pop ups describing warnings
    watchesWarnings.bindPopup(function(evt) {
      return L.Util.template('<h3>{prod_type}</h3><hr /><p>This is a {prod_type}.', evt.feature.properties);
    });
    vulnerable.bindPopup(function(evt) {
      return L.Util.template('<h3>{NAME}</h3><hr /><p>This county has {UNEMPRT_CY}% unemployment.', evt.feature.properties);
    });
    function testQueryColor() {
      var query = L.esri.query({
        url: "http://services.arcgisonline.com/arcgis/rest/services/Demographics/USA_1990-2000_Population_Change/MapServer/3"
      });
      query.where("NAME='Philadelphia County'");
      query.run(function(error, featureCollection, response){
        //console.log();
        var polyDemoCounty = L.geoJson(featureCollection);
        //map.fitBounds(polyDemoCounty.getBounds());
        console.log(polyDemoCounty.getBounds())
        testQuery(polyDemoCounty.getBounds());
      });
    };
    testQueryColor();
    function testQuery(latLongBoundsIn) {
      var overlap= L.esri.query({
        url: "https://idpgis.ncep.noaa.gov/arcgis/rest/services/NWS_Forecasts_Guidance_Warnings/watch_warn_adv/MapServer/1"
      });
      overlap.intersects(latLongBoundsIn);
      overlap.run(function(error, featureCollection, response) {
      console.log(featureCollection);
  });
}
/* for collapsable menus
    var acc = document.getElementsByClassName("accordion");
    var i;
    for (i = 0; i < acc.length; i++) {
      acc[i].onclick = function(){
        /* Toggle between adding and removing the "active" class,
        to highlight the button that controls the panel
        this.classList.toggle("active");

        /* Toggle between hiding and showing the active panel
        var panel = this.nextElementSibling;
        if (panel.style.display === "block") {
            panel.style.display = "none";
        } else {
            panel.style.display = "block";
        }
    }}; */
});
