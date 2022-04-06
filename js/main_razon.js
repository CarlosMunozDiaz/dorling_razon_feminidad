let width = document.getElementById('map').clientWidth;
let height = 600;
let tooltip = d3.select('#tooltip');

initMap();

function initMap() {
    d3.json('../data/municipios_razon21_geo.json', function(error,data) {
        if (error) throw error;
        let us = topojson.feature(data, data.objects.muni);
        
        //Desarrollo del mapa
        let map = d3.select("#map");

        let svg = map.append("svg")
            .attr("width", width)
            .attr("height", height);
        
        const projection = d3.geoConicConformalSpain().scale(2000).fitSize([width - 60,height], us);
        const path = d3.geoPath(projection);

        ///Centroide y radio
        for(let i = 0; i < us.features.length; i++) {
            let item = us.features[i];
            item.properties.radius = radiusScale(item.properties.Total);
            item.properties.centroid = path.centroid(item);
        }

        ///Prueba dorling
        let spreadMunicipios = applyForce(us.features);


        ///////////
        document.getElementById('loading').style.display = 'none';
        document.getElementById('loading').style.animationPlayState = 'paused';
        ///////////

        svg.append("g")
            .selectAll("circle")
            .data(spreadMunicipios)
            .enter()
            .append("circle")
            .attr('class','circles')
            .attr("fill", function(d) {
                if(d.properties.razon_fem != undefined) {
                    if(d.properties.razon_fem <= 33.33) {
                        return '#00354e';
                    } else if (d.properties.razon_fem > 33.33 && d.properties.razon_fem <= 66.66) {
                        return '#367390';
                    } else if (d.properties.razon_fem > 66.66 && d.properties.razon_fem < 100) {
                        return '#79b6d5';
                    } else if (d.properties.razon_fem == 100) {
                        return '#f5f5f5';
                    } else if (d.properties.razon_fem > 100 && d.properties.razon_fem <= 133.33) {
                        return '#f0995f';
                    } else if (d.properties.razon_fem > 133.33 && d.properties.razon_fem <= 166.66) {
                        return '#af4e1f';
                    } else {
                        return '#630900';
                    }
                } else {
                    return 'grey';
                }                
            })
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", function(d) {
                return d.properties.radius;
            })
            .style("stroke", "white")
            .style("stroke-width", ".3px")
            .on('mouseover', function(d,i,e) {
                this.style.stroke = '#000';
                this.style.strokeWidth = '0.8px';

                //Texto
                let html = `<p class="chart__tooltip--title">${d.properties.NAMEUNIT}</p>
                <p class="chart__tooltip--text">Razón de feminidad: ${numberWithCommas(d.properties.razon_fem.toFixed(2))} mujeres por cada 100 hombres </p>`;

                tooltip.html(html);

                //Tooltip
                positionTooltip(window.event, tooltip);
                getInTooltip(tooltip);

            })
            .on('mouseout', function() {
                this.style.stroke = 'white';
                this.style.strokeWidth = '0.3px';

                //Quitamos el tooltip
                getOutTooltip(tooltip);
            });

        function applyForce (nodes) {
            const simulation = d3.forceSimulation(nodes)
                .force("cx", d3.forceX().x(d => width / 2).strength(0.02))
                .force("cy", d3.forceY().y(d => width * (5/8) / 2).strength(0.02))
                .force("x", d3.forceX().x(d => d.properties.centroid ? d.properties.centroid[0] : 0).strength(1))
                .force("y", d3.forceY().y(d => d.properties.centroid ? d.properties.centroid[1] : 0).strength(1))
                .force("charge", d3.forceManyBody().strength(-1))
                .force("collide", d3.forceCollide().radius(d => d.properties.radius + 0.1).strength(1))
                .stop();
          
            let i = 0;

            while (simulation.alpha() > 0.01 && i < 200) {
              simulation.tick(); 
              i++;
            }          
          
            return simulation.nodes();
        }

        function radiusScale(pobl) {
            const populationMax = d3.max(us.features.map(function(item) {
                return item.properties.Total;
            }));

            let radio = d3.scaleSqrt()
              .domain([0, populationMax])
              .range([1.15, 15]);

            return radio(pobl);
        }
    });
}

/*
* FUNCIONES TOOLTIP
*/
function getInTooltip(tooltip) {
    tooltip.style('display','block').style('opacity', 1);
}

function getOutTooltip(tooltip) {
    tooltip.style('display','none').style('opacity', 0);
}

function positionTooltip(event, tooltip) {
    let x = event.pageX;
    let y = event.pageY;

    //Tamaño    
    let distanciaAncho = 135;

    //Posición
    let left = window.innerWidth / 2 > x ? 'left' : 'right';
    let mobile = window.innerWidth < 525 ? -30 : -15;
    let horizontalPos = left == 'left' ? 30 : - distanciaAncho + mobile;

    tooltip.style('top', (y - 10) + 'px');
    tooltip.style('left', (x + horizontalPos) + 'px');
}

/* Helpers */
function numberWithCommas(x) {
    //return x.toString().replace(/\./g, ',').replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ".");
    return x.toString().replace(/\./g, ',');
}