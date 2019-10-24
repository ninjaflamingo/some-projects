import { html, css, LitElement } from 'https://unpkg.com/@polymer/lit-element@latest/lit-element.js?module';

class VisitorsView extends LitElement {
    constructor(){
        super();
        this.charts = [];
        this.chartTypes = ['line', 'bar', 'bar', 'bar'];
        this.chartStyles = [
            "#456990",
            ["#456990", "#FFE66D", "#2F3061", "#343434", "red"],
            ["#456990", "#FFE66D", "#2F3061", "#343434", "red"],
            ["#456990", "#FFE66D", "#2F3061", "#343434", "red"]
        ]
    };
    
    async connectedCallback(){
        super.connectedCallback();
        const res = await this.fetchData();
        this.renderCharts(res, this.chartTypes, this.chartStyles);
    }

    async fetchData(){
        const res = await fetch('/api/visitors');
        const json = await res.json();
        const deviceData = this.parseData(json);
        const monthlyData = this.parseMonthlyData(json);
        let { browser, os, platform } = deviceData;
        return [ monthlyData, browser, os, platform ];
    };

    parseData(data){
        let stats = {};
        ['browser', 'platform', 'os'].forEach((field) =>{
            let count = data.reduce((object, value) => {
                object[value[field]] = (object[value[field]] || 0) + 1;
                return object;
            }, {});
            stats[field] = count;
        });
        return stats; 
    }

    parseMonthlyData(data){ 
        let stats = {};
        data.forEach((document) => {
            let date = new Date(document.createdAt);
            let month = date.toLocaleString('default', { month: 'long' }); // eg. August
            if(!!stats[month]){
                stats[month] = stats[month] + 1;
            }else{
                stats[month] = 1;
            };
        });
        return stats;
    }

    createChart(data, type, style){
        const chart = 
        {
            type: type, 
            data: {
                labels: Object.keys(data),
                datasets: [{
                    label: '',
                    backgroundColor: style,
                    data: Object.values(data)
                }]
            },
            options: {
                scales: {
                    yAxes: [{ ticks: { beginAtZero: true } }]
                }
            }
        };
        return chart;
    }

    renderCharts(data, types, styles){
        let containers = this.shadowRoot.querySelectorAll('canvas')
        containers.forEach((container) => {
            let ctx = container.getContext('2d');
            let chart = new Chart(ctx, this.createChart(data[0], types[0], styles[0]));
            this.charts.push(chart)
            data.shift();
            types.shift();
            styles.shift();
        })
    }

    static get styles() {
        return [css`
            .wrapper {
                display: grid;
                grid-template-columns: 1fr 3fr 1fr;
            }

            .displayArea {
                margin-top: 2em;
                padding: .5em;
                border: 2px solid #456990;
                border-radius: .25rem;
                display: grid;
                grid-template-columns: 1fr 1fr;
            }
        `];
    }

    render(){
        return html`
            <div class="wrapper">
                <div></div>
                <div class="displayArea">
                    <div class="col-md-6">
                        <canvas id="chart1"></canvas>
                    </div>
                    <div class="col-md-6">
                        <canvas id="chart2"></canvas>
                    </div>
                    <div class="col-md-6">
                        <canvas id="chart3"></canvas>
                    </div>
                    <div class="col-md-6">
                        <canvas id="chart4"></canvas>
                    </div>
                </div>
                <div></div>
            </div>
        `
    }
}

customElements.define("visitors-view", VisitorsView);
export { VisitorsView };