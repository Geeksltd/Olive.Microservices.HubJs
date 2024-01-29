
import * as echarts from 'echarts'
import Service from "./model/service";

export default class HubEcharts implements IService {
    constructor() { }
    public initialize() {
        Service.registerServices();
    }
    public myChart: any;
    public chart(chartDom: any, option: any) {
        this.myChart = echarts.init(chartDom);
        option && this.myChart.setOption(option);
    }
}