/**
 * Query Code was Created by brentporter on 7/26/17.
 */
$(document).ready(function(){
    var map = L.map('map', {center: [40, -100], zoom: 5, minZoom: 3});
//variable names
    var vulnerable = L.esri.featureLayer({
        url: 'https://services.arcgisonline.com/arcgis/rest/services/Demographics/USA_Unemployment_Rate/MapServer/2',
        simplifyFactor:0.5,
        style: {color:"#ad42f4", fillOpacity:.5}
    });
    var affected = L.esri.featureLayer({
        url: 'https://services.arcgisonline.com/arcgis/rest/services/Demographics/USA_Unemployment_Rate/MapServer/2',
        simplifyFactor:0.5,
        style: {color:"#00802b", fillOpacity:.5, weight:10}
    });
    var watchesWarnings = L.esri.featureLayer({
        url:'https://idpgis.ncep.noaa.gov/arcgis/rest/services/NWS_Forecasts_Guidance_Warnings/watch_warn_adv/MapServer/1',
        simplifyFactor: 0.5,
        style:function(feature) {
            switch (feature.properties.prod_type) {
                    //Heat Advisory
                case "Heat Advisory": return {color: "orange",fillOpacity:0.6,weight: 0.2};
                    //Excessive Heat Warning
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
    var pastHeat=L.geoJSON(heat, {
        style: function(feature) {
            switch (feature.properties.prod_type) {
                    //Heat Advisory
                case "Heat Advisory": return {color: "orange",fillOpacity:0.6,weight: 0.2};
                    //Excessive Heat Warning
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
    var currentData = watchesWarnings.setWhere("prod_type='Excessive Heat Warning' OR prod_type='Excessive Heat Watch' OR prod_type='Heat Advisory'");
    var unemployment = vulnerable.setWhere("UNEMPRT_CY>12");
    var clicked= false;
    var clicked1= false;
    var clicked2 = false;
    var clicked3 = false;
    var layer = L.esri.basemapLayer('Topographic').addTo(map);
    var layerLabels;
    var poorCounties=[];
    var points=[];
    var shelters;
    //The following three I added, although polyFinalQuery is a place holder layer if you want to show the selected warnings
    var polyFinalQuery;
    var polyFinalCounties;
    //The following is what I use to aggregate the parameter conditions so you only call the query once
    var buildQueryString = "";
    $("#loading").hide();
    $('#welcome').on('click', function(){
          $("#start").hide();
    });
    $('#about').on('click', function(){
          $("#start").show();
    });
    $('#return').on('click', function(){
        map.flyTo([40, -100], 5);
    });
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
    $('#basemaps').on('change', function changeBasemap(){
        var basemap = document.getElementById("basemaps").value;
        setBasemap(basemap);
    });
//query code
    function state() {
        var st = document.getElementById("state").value;
        $("#loading").show();
        query1(st);
    }
    function query1(st) {
        var query = L.esri.query({
            url:"https://services.arcgisonline.com/arcgis/rest/services/Demographics/USA_Unemployment_Rate/MapServer/2"
        });
        query.where("ST_ABBREV='"+st+"' AND UNEMPRT_CY > 12");
        query.run(function(error, featureCollection, response){
          console.log(featureCollection.features);
          if(featureCollection.features.length==0) {
            $("#loading").hide();
            map.flyTo([40, -100], 5);
            document.getElementById("list").innerHTML = "No counties in "+ document.getElementById("state").value + " have an unemployment rate above 16%";
          }

            for(var i=0; i<featureCollection.features.length; i++) {
                poorCounties.push(featureCollection.features[i].properties.NAME);
                console.log(poorCounties.length);
                if(i==featureCollection.features.length-1) {
                    testQueryAry(poorCounties, st);
                }
            }
        });
    }
    function testQueryAry(nameAry, stateIncoming){
        var query = L.esri.query({
            url:"https://services.arcgisonline.com/arcgis/rest/services/Demographics/USA_Unemployment_Rate/MapServer/2"
        });
        console.log(nameAry.length);
        for(var i=0;i<nameAry.length;i++){
            //console.log(nameAry.length + " is the Array Length here is the iterator " + i );
            if(i==(nameAry.length-1)){
                buildQueryString = buildQueryString + "NAME= '"+nameAry[i]+"' AND UNEMPRT_CY > 12 AND ST_ABBREV = '"+stateIncoming+"'";
                console.log(buildQueryString);
                query.where(buildQueryString);
                query.run(function(error, featureCollection, response){
                    var polyDemoCounty = L.geoJson(featureCollection);
                    testQuerySecondSet(polyDemoCounty, nameAry, buildQueryString);
                });
            }
            else {
                buildQueryString = buildQueryString + "NAME= '"+nameAry[i]+"' AND UNEMPRT_CY > 12 AND ST_ABBREV = '"+stateIncoming+"' OR ";
            }
        }

    }
    function testQuerySecondSet(geomIn, nameAryIn, originalQueryIn) {
        var query1 = L.esri.query({
            url: "https://idpgis.ncep.noaa.gov/arcgis/rest/services/NWS_Forecasts_Guidance_Warnings/watch_warn_adv/MapServer/1"
        });                    //prod_type='Excessive Heat Warning' OR prod_type='Excessive Heat Watch' OR prod_type='Heat Advisory' OR prod_type='Extreme Cold Warning' OR prod_type='Extreme Cold Watch'
        var query= query1.where("prod_type='Excessive Heat Warning' OR prod_type='Excessive Heat Watch' OR prod_type='Heat Advisory'");
        LAcounties = affected.setWhere("UNEMPRT_CY>16");
        query.intersects(geomIn);
        //The following would tell you if any records were returned
        query.count(function(error, count, response){
            if(count==0) {
                  document.getElementById("list").innerHTML = "No counties in "+ document.getElementById("state").value + " with high unemployment are currently under heat warnings/watches";
                  map.flyTo([40, -100], 5);
                $("#loading").hide();
            }
        });
        query.run(function (error, featureCollection, response) {
            console.log(featureCollection);
            if(featureCollection.features.length>0) {
                //This is the final Warnings/Advisory Layer based on the Counties/State Employment Conditions Parameters
                polyFinalQuery = L.geoJson(featureCollection);
                //We call the Counties one more time, remembering to pass in the original query parameters
                queryBackCounties(polyFinalQuery, originalQueryIn);
            }
        });
    }

    function queryBackCounties(geomIn, originalQueryIn){
        // A final Array to collect the Names of the counties from the query
        var finalQueriedCountyAry = [];
        var query2 = L.esri.query({
            url:"http://services.arcgisonline.com/arcgis/rest/services/Demographics/USA_Unemployment_Rate/MapServer/2"
        });
        var myStyle = {
          "color": "#00802b",
          "weight": 10,
          "opacity": 0.65
        };
        query2.where(originalQueryIn);
        query2.intersects(geomIn);
        query2.run(function (error, featureCollection, response) {
            console.log(featureCollection);
            polyFinalCounties = L.geoJson(featureCollection, {
              style: myStyle
            });
            map.addLayer(polyFinalCounties);
            unemployment.bringToFront();
            map.setMaxZoom(7);
            map.flyToBounds(polyFinalCounties.getBounds());
            if(featureCollection.features.length>0) {
                for (var i = 0; i < featureCollection.features.length; i++) {
                    finalQueriedCountyAry.push(featureCollection.features[i].properties.NAME);
                    if (i == featureCollection.features.length - 1) {
                        console.log(finalQueriedCountyAry);
                        for(var i=0; i<finalQueriedCountyAry.length;i++){
                          $( "#list" ).append(finalQueriedCountyAry[i]+ "<br>");
                          map.setMaxZoom(15);
                          $("#loading").hide();
                        }
                    }
                }
            }

        });
    }
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
    $("#heatCheck").on("click", function(){
        if(clicked2) {
            map.removeLayer(pastHeat);
            clicked2=false;
        } else if(!clicked2) {
            map.addLayer(pastHeat);
            clicked2=true;
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
    $("#shelterCheck").on("click", function(){
    var queryString = "https://magic.csr.utexas.edu/SEES2017/samples/geoShelters.json";
    $.getJSON(queryString, function (data) {
        //console.log(data);
        for(var i =0; i<data.features.length; i++) {
            points.push(L.marker(L.latLng(data.features[i].properties.Latitude, data.features[i].properties.Longitude)).bindPopup(data.features[i].properties.name));
        }
        if(clicked3) {
            for(var j=0;j<points.length;j++){
                map.removeLayer(points[j]);
            }
            map.flyTo([40, -100], 5);
            clicked3=false;
            points = [];
        } else if(!clicked3) {
            for(var k=0;k<points.length;k++){
                map.addLayer(points[k]);
            }
            map.flyTo([39.3, -76.655], 13);
            clicked3=true;
        }
    });
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
        $('#state').on('change',function(){
          $('#ClearQueryLayer').click();
          state();
        })
        $('#ClearQueryLayer').on('click',function(){
            buildQueryString = "";
            poorCounties = [];
            //nameAry = []

            var currentDataOnFlg = false;
            if(map.hasLayer(currentData)){
                currentDataOnFlg = true;
            }
            var vulnerableDataOnFlg = false;
            if(map.hasLayer(vulnerable)){
                vulnerableDataOnFlg = true;
            }
            if(map.hasLayer(polyFinalCounties)) {
                map.removeLayer(polyFinalCounties);
            }
            //map.eachLayer(function (layer) {
            //    map.removeLayer(layer);
            //});
            if(map.hasLayer(layer)){
                map.addLayer(layer);

                if (currentDataOnFlg) {
                    map.addLayer(currentData);
                }
                if (vulnerableDataOnFlg) {
                    map.addLayer(vulnerable);
                }
            }
            document.getElementById("list").innerHTML = " ";
            map.removeLayer(affected);
        });
});
