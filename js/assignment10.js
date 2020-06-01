/*code sources: 1. https://bl.ocks.org/mbostock/5562380 for color mapping
                2. https://stackoverflow.com/questions/54947126/geojson-map-with-d3-only-rendering-a-single-path-in-a-feature-collection


/*jslint browser: true*/
/*global d3*/



//Define the width and height variables
var w = 960;
var h = 700;


//Define map projection. I used geoMercator.
//Used .center(), .scale(), .translate() to position the map and make it bigger
var projection = d3.geoMercator()
                    .center([70, 38.5])
                    .scale(5100)
                    .translate([w/2 - 1550 , h/2 - 1550]);




//Define path generator
var path = d3.geoPath()
             .projection(projection);



                          
								
//Create SVG element
//create svg element with defined width and height variables
var svg = d3.select("body")
            .append("svg")
            .attr("width", w)
            .attr("height", h); 




// referred to https://bl.ocks.org/mbostock/5562380 for color mapping
//assign variable color to d3.scaleThreshold()
var color = d3.scaleThreshold()
    .domain([1000, 2000, 3000, 7000, 10000, 12000, 20000]) //I used values for the domain based on the population density values of all the regions
    .range(d3.schemeGreens[8]); //Used a greenscale for my visualization as the range


//create the domain and range values for the legend
var x = d3.scaleSqrt()
    .domain([1600, 21000]) //legend goes from values 1600 to 21000
    .rangeRound([440, 950]);


//append the legend for the map to the svg element
var g = svg.append("g")
    .attr("class", "key")
    .attr("transform", "translate(0,40)");


//We create a a color scheme for the legend which will correspond to the map's color scheme
g.selectAll("rect")
  .data(color.range().map(function(d) {
      d = color.invertExtent(d);
      if (d[0] == null) d[0] = x.domain()[0];
      if (d[1] == null) d[1] = x.domain()[1];
      return d;
    }))
  .enter().append("rect")
    .attr("height", 8)
    .attr("x", function(d) { return x(d[0]); })
    .attr("width", function(d) { return x(d[1]) - x(d[0]); })
    .attr("fill", function(d) { return color(d[0]); });

//This appends the text related to the label - Population per square kilometer
g.append("text")
    .attr("class", "caption")
    .attr("x", x.range()[0])
    .attr("y", -6)
    .attr("fill", "#000")
    .attr("text-anchor", "start")
    .attr("font-weight", "bold")
    .text("Population per square kilometer");

//we create the axis for the legend 
g.call(d3.axisBottom(x)
    .tickSize(13) //assign tickSize to 13
    .tickValues(color.domain())) //apply the colors to the legend using color.domain()
  .select(".domain")
    .remove();




//Read in the population density csv file that contains region name, population size and area
d3.csv("popden.csv").then(function(data){



        //Load in GeoJSON data - Bangladesh.json
        d3.json("Bangladesh.json").then(function(json) {

            
            //referred to https://stackoverflow.com/questions/54947126/geojson-map-with-d3-only-rendering-a-single-path-in-a-feature-collection
            //assign variable features to the json.features that contains all the information about the regions
            var features = json.features;

            //for each feature, we filter for geometry type of MultiPolygon and map it
            features.forEach(function(feature) {
            if(feature.geometry.type == "MultiPolygon") {
                feature.geometry.coordinates.forEach(function(polygon) {

                 
                 polygon.forEach(function(ring) {
                 ring.reverse();
               })
             })
           }
           
            //for each feature, we filter for geometry type of Polygon and map it
           else if (feature.geometry.type == "Polygon") {
             feature.geometry.coordinates.forEach(function(ring) {
               ring.reverse();
             })  
           }
         })


             //Loop through csv file
            for (var i = 0; i < data.length; i++) {

                //Look for the region name
                var dataState = data[i].region;
                console.log(dataState);

                //Find the population density for each region by dividing population by area
                var dataValue = parseFloat(data[i].population)/parseFloat(data[i].area);
                console.log(dataValue);

                //Find the matching GeoJson value in Bangladesh,json file
                for (var j = 0; j < json.features.length; j++) {

                    //Look for the region name that is under properties.NAME_1 in the json file
                    var jsonState = json.features[j].properties.NAME_1;

                    //Compare regions to find a match
                    if (dataState == jsonState) {

                        //Copy the data value into the JSON
                        json.features[j].properties.value = dataValue;

                        //Stop looking through the JSON
                        break;

                    }
                }		
            }

            
            //This appends the map to the svg element
            svg.selectAll("path")
               .data(features) //data takes in features
               .enter()
               .append("path")
               .attr("d", path)
                .attr("stroke", "black")  //creates black outline for all the regions on the map
                .attr("stroke-width", 0.5)
                .style("fill", function(d) {
                    var value = d.properties.value; //assign var value to d.properties.value
                    console.log(value);
                    if (value) {
                        return color(value);    //assign color to the region
                    } 
               });


        });

    });

