
 import echarts from 'echarts'
 import Service from "./model/service";

export default class HubEcharts implements IService {
    constructor(){}
    public initialize() {
        Service.registerServices();
    }
   public chart(chartDom:any,option:any){
        //var chartDom = document.getElementById('main')!;
        var myChart = echarts.init(chartDom);
        option && myChart.setOption(option);
    }
}