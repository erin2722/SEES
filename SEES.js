var map = L.map('map', {center: [40, -100], zoom: 5, minZoom: 3});
//variable names
var vulnerable = L.esri.featureLayer({
  url: 'http://services.arcgisonline.com/arcgis/rest/services/Demographics/USA_Unemployment_Rate/MapServer/2',
  simplifyFactor:0.5,
  style: {color:"#ad42f4", fillOpacity:.5}
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
var layer = L.esri.basemapLayer('Topographic').addTo(map);
var layerLabels;
var poorCounties=[];
var countyList=[];
var counter = 0;
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
//query code
function state() {
  var st = document.getElementById("state").value;
  poorCounties=[];
  countyList=[];
  query1(st);
}
function query1(st) {
  var query = L.esri.query({
     url:"http://services.arcgisonline.com/arcgis/rest/services/Demographics/USA_Unemployment_Rate/MapServer/2"
  });
  query.where("ST_ABBREV='"+st+"' AND UNEMPRT_CY > 16");
  query.run(function(error, featureCollection, response){
    for(var i=0; i<featureCollection.features.length; i++) {
      poorCounties.push(featureCollection.features[i].properties.NAME);
    }
    console.log(poorCounties.length);
    for(var i=0; i<poorCounties.length; i++) {
      testQueryFirstSet(poorCounties[i]);
    }
  });
}
function testQueryFirstSet(name) {
    var query = L.esri.query({
       url:"http://services.arcgisonline.com/arcgis/rest/services/Demographics/USA_Unemployment_Rate/MapServer/2"
    });
    query.where("NAME= '"+name+"' AND UNEMPRT_CY > 16"); //w  my pseiudocode i could get rid of UNEMPRT_CY
    query.run(function(error, featureCollection, response){
        var polyDemoCounty = L.geoJson(featureCollection);
        testQuerySecondSet(polyDemoCounty, name);
    });
};
function testQuerySecondSet(geomIn, name) {
    var query1 = L.esri.query({
        url: "https://idpgis.ncep.noaa.gov/arcgis/rest/services/NWS_Forecasts_Guidance_Warnings/watch_warn_adv/MapServer/1"
    });
    var query= query1.where("prod_type='Excessive Heat Warning' OR prod_type='Excessive Heat Watch' OR prod_type='Heat Advisory' OR prod_type='Extreme Cold Warning' OR prod_type='Extreme Cold Watch'");
    counter++;
    query.intersects(geomIn);
    query.run(function (error, featureCollection, response) {
        var polyFinalQuery = L.geoJson(featureCollection);
        map.addLayer(polyFinalQuery);
        countyList.push(name);
        document.getElementById("list").innerHTML = name;
    });
    if(counter==poorCounties.length) {
      console.log(countyList);
    }
};
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
//this is for collapsable menus
    var acc = document.getElementsByClassName("accordion");
    var i;
    for (i = 0; i < acc.length; i++) {
      acc[i].onclick = function(){
        /* Toggle between adding and removing the "active" class,
        to highlight the button that controls the panel */
        this.classList.toggle("active");

        /* Toggle between hiding and showing the active panel */
        var panel = this.nextElementSibling;
        if (panel.style.display === "block") {
            panel.style.display = "none";
        } else {
            panel.style.display = "block";
        }
    }};
