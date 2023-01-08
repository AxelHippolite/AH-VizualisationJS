function unpack(rows, key, rate) {
    return Object.values(rows).map(row => {
        return row[key] / rate;
    });
}
function unpackSTR(rows, key) {
    return Object.values(rows).map(row => {
        return row[key];
    });
}
async function getBubbleTrace(year){
    const lat = [50.8333, 43, 35, 52.52, 56, 59, 39, 40, 64, 48, 45, 53, 65, 42.8333, 56, 57, 42, 35.8333, 52.5, 62, 52, 39.5, 46, 62, 46, 39, 54];
    const lon = [4, 25, 33, 13.40, 10, 26, 22, -4, 26, 2, 15, -8, -18, 12.8333, 24, 25, 19, 14.5833, 5.75, 10, 20, -8, 25, 15, 15, 35, -2];
    const dataset = await d3.csv("data/gross_weight_of_goods_handled_in_all_ports_annual.csv");
    return [{
        type: "scattermapbox",
        locations: unpackSTR(dataset, "rep_mar"),
        lat: lat,
        lon: lon,
        marker: { 
            size: unpack(dataset, year, 7000),
            color: unpack(dataset, year, 10000),
            cmin: 0,
            cmax: 100,
            colorscale: 'YlOrRd'}
    }];
}

async function getTHSPiechartTrace(year){
    const dataset = await d3.csv("data/gross_weight_of_goods_handled_in_all_ports_annual.csv");
    const values = unpack(dataset, year, 1);
    const text = unpackSTR(dataset, "rep_mar");
    let sum = 0;
    for(let i = 0; i < values.length; i++){if(!isNaN(values[i])){sum = sum + values[i];}}
    const normalize = values.map(function(i){return (i / sum) * 8;});
    for(let i = 0; i < text.length; i++){if(normalize[i] / 8 < 0.03){text[i] = null;}}
    return [{
        type: 'pie',
        values: values,
        labels: unpackSTR(dataset, "rep_mar"),
        hoverinfo: 'label+percent',
        text: text,
        textinfo: 'text',
        marker: {
            colors: normalize.map(d3.interpolateYlOrRd)
        }
    }];
}

async function getInOutTrace(year){
    const dataset = await d3.csv("data/gross_weight_of_goods_handled_in_all_ports_by_direction_annual.csv");
    return [{
        type: 'bar',
        x: unpackSTR(dataset, "rep_mar"),
        y: unpack(dataset, year, 1).slice(0, 27),
        name: "IN",
        marker: {color: 'rgb(221, 26, 32)'},
        hoverinfo: 'none',
        transforms: [{
            type: 'sort',
            target: 'y',
            order: 'descending'
        }]
        }, {
        type: 'bar',
        x: unpackSTR(dataset, "rep_mar"),
        y: unpack(dataset, year, 1).slice(27, 54),
        name: "OUT",
        marker: {color: 'rgb(253, 128, 57)'},
        hoverinfo: 'none'
    }];
}

async function getLinesChartTrace(){
    const dataset = await d3.csv("data/gross_weight_of_goods_handled_in_all_ports_by_direction_annual.csv");
    const years = Array.from({length: 22}, (value, index) => 2000 + index)
    const dataIn = [], dataOut = [];
    for(let i = 2000; i < 2022; i++){
        let sumIn = 0, sumOut = 0;
        const valuesIn = unpack(dataset, i.toString(), 1).slice(0, 27), valuesOut = unpack(dataset, i.toString(), 1).slice(27, 54);
        for(let i = 0; i < valuesIn.length; i++){if(!isNaN(valuesIn[i]) && !isNaN(valuesIn[i])){sumIn += valuesIn[i]; sumOut += valuesOut[i]}}
        dataIn.push(sumIn); dataOut.push(sumOut);
    }
    return [{
        type: 'scatter',
        name: "IN",
        mode: 'lines',
        line: {color: 'rgb(221, 26, 32)'},
        x: years,
        y: dataIn
    }, {
        type: 'scatter',
        name: "OUT",
        mode: 'lines',
        line: {color: 'rgb(253, 128, 57)'},
        x: years,
        y: dataOut  
    }];
}

async function getRadarTrace(year){
    const dataset = await d3.csv("data/gross_weight_of_goods_handled_in_main_ports_by_type_of_goods_annual.csv");
    const labels = ["GT01", "GT02", "GT03", "GT04", "GT05", "GT06", "GT07", "GT08", "GT09", "GT10", "GT10", "GT11", "GT12", "GT13", "GT14", "GT15", "GT16", "GT17", "GT18", "GT19", "GT20"];
    const values = unpack(dataset, year, 1);
    const data = []
    for(let i = 0; i < labels.length; i++){
        let partial = [], sum = 0;
        for(let j = i; j < values.length; j += 20){partial.push(values[j]);}
        for(let k = 0; k < partial.length; k++){if(!isNaN(partial[k])){sum += partial[k];}}
        data.push(sum);
    }
    return [{
        type: 'scatterpolar',
        hoverinfo: 'none',
        r: data,
        theta: labels,
        fill: 'toself',
        line: {color: '#fec864'},
    }];
}

async function getChoropleth(year){
    const geojson = await d3.json("data/europe.geojson");
    const dataset = await d3.csv("data/gross_weight_of_goods_handled_in_main_ports_by_type_of_goods_annual.csv");
    const dataCountry = await d3.csv("data/gross_weight_of_goods_handled_in_all_ports_annual.csv");
    const country = unpackSTR(dataCountry, "rep_mar").slice(0, 27)
    const labels = ["GT01", "GT02", "GT03", "GT04", "GT05", "GT06", "GT07", "GT08", "GT09", "GT10", "GT10", "GT11", "GT12", "GT13", "GT14", "GT15", "GT16", "GT17", "GT18", "GT19", "GT20"];
    const values = unpack(dataset, year, 1);
    const dataSTR = [], data = [];
    for(let i = 20; i < values.length; i += 20){
        let country = values.slice(i-20, i);
        for(let j = 0; j < country.length; j++){if(isNaN(country[j])){country[j] = 0;}}
        const index = country.indexOf(Math.max.apply(Math, country));
        dataSTR.push(labels[index]); data.push(parseInt(labels[index].slice(2, 4)))
    }
    return [{
        type: 'choroplethmapbox',
        geojson: geojson,
        featureidkey: 'properties.ISO2',
        locations: country,
        text: dataSTR,
        hoverinfo: 'text',
        showscale: false,
        z: data
    }];
}

map = document.getElementById('map');
ths_t_piechart = document.getElementById('ths_t_piechart');
in_out_bar = document.getElementById('in_out_bar');
lineschart = document.getElementById('lineschart');
radar = document.getElementById('radar');
choro = document.getElementById('choro');

let mapLayout = {showlegend: false, dragmode: "zoom", mapbox: { style: "dark", center: { lat: 48, lon: 21 }, zoom: 3 }, margin: { r: 0, t: 0, b: 0, l: 0 }};
let thstPieLayout = {title: "Distribution of the Weight of Goods Transported", showlegend: false, paper_bgcolor: "#191a1a", font: {color: 'white'}};
let inOutBarLayout = {title: "Weight of Goods Exported & Imported", xaxis: {title: "Country"}, yaxis: {title: "Weight of Goods"}, barmode: 'stack', plot_bgcolor: "#191a1a", paper_bgcolor: "#191a1a", font: {color: 'white'}};
let linesChartLayout = {autosize: true, title: "Evolution of the Quantity of Goods Transported", xaxis: {title: "Years"}, yaxis: {title: "Weight of Goods"}, plot_bgcolor: "#191a1a", paper_bgcolor: "#191a1a", font: {color: 'white'}};
let radarLayout = {title: "Proportion of Each Type of Goods handled in Main Ports", showlegend: false, polar: {radialaxis: {layer: 'below traces', color: 'white'}, angularaxis: {color: 'white'}, bgcolor: '#191a1a'}, plot_bgcolor: "#191a1a", paper_bgcolor: "#191a1a", font: {color: 'white'}};
let choroLayout = {dragmode: "zoom", mapbox: {style: "dark", center: { lat: 48, lon: 21 }, zoom: 3 }, margin: { r: 0, t: 0, b: 0, l: 0 }};

let mapConfig = {mapboxAccessToken: "pk.eyJ1IjoiYXlmZXl5IiwiYSI6ImNsY2diZDFqeTBneDgzb3BraTB2Nm5tYmoifQ.rhtC6qd0l-XHht8Ey_Ubdw"};

getLinesChartTrace().then((response) => {
    Plotly.newPlot(lineschart, response, linesChartLayout);
});
getChoropleth("2008").then((response) => {
    Plotly.newPlot(choro, response, choroLayout, mapConfig);
});
getRadarTrace("2008").then((response) => {
    Plotly.newPlot(radar, response, radarLayout);
});
getInOutTrace("2008").then((response) => {
    Plotly.newPlot(in_out_bar, response, inOutBarLayout);
});
getTHSPiechartTrace("2008").then((response) => {
    Plotly.newPlot(ths_t_piechart, response, thstPieLayout);
});
getBubbleTrace("2008").then((response) => {
    Plotly.newPlot(map, response, mapLayout, mapConfig);
});

let yearsDropdown = document.getElementById("years");

yearsDropdown.addEventListener("change", async function(){
    let selectedValue = yearsDropdown.value;
    Plotly.newPlot(map, await getBubbleTrace(selectedValue), mapLayout, mapConfig);
    Plotly.newPlot(ths_t_piechart, await getTHSPiechartTrace(selectedValue), thstPieLayout);
    Plotly.newPlot(in_out_bar, await getInOutTrace(selectedValue), inOutBarLayout);
    Plotly.newPlot(radar, await getRadarTrace(selectedValue), radarLayout);
    Plotly.newPlot(choro, await getChoropleth(selectedValue), choroLayout, mapConfig);
});