new Vue({
   el: "#Dashboard",
   data: {
       dataChart: [],
       lineChart: [],
       owner: "",
       tokenAddress: "",
       rate: 0,
       bonus: 0,
       icoEnd: 0,
       timeToIcoEnd: 0,
       privateInvestors: 0,
       cap: 0,
       preSaleCap: 0,
       preSaleEnd: 0,
       timeToPreSaleEnd: 0,
       ETHRaised: 0,
       event: [],
       eventByDay: [],
       contractInstance: [],
   },
   methods: {
        IcoDetails: function() {
            
            var instance = this.contractInstance;

            this.owner = instance.owner();
            
            this.tokenAddress = instance.token();
            
            this.rate = instance.rate();
            
            this.bonus = instance.bonus();

            this.preSaleEnd = instance.preSaleEnd();

            this.icoEnd = instance.endTime();
            
            this.cap = web3.fromWei(instance.cap(), 'ether');
            
            this.preSaleCap = web3.fromWei(instance.preSaleCap(), 'ether');

            this.ETHRaised = web3.fromWei(instance.weiRaised());

            this.privateInvestors = web3.fromWei(instance.totalPrivateInvestments());

            instance.TokenPurchase({}, { fromBlock: 0, toBlock: 'latest' }).get((error, eventResult) => {
                if (error)
                  console.log('Error in myEvent event handler: ' + error);
                else
                    this.event =  eventResult.map(item => { 
                        return { address: item.args.purchaser,
                                 blockNumber: item.blockNumber,
                                 time: moment.unix(web3.eth.getBlock(item.blockNumber).timestamp).format("LS"),
                                 tokens: item.args.amount.c[0],
                                 amount: item.args.value.c[0] / 10000
                                }
                    });

                    this.eventByDay = this.event.reduce((acc, item) => {
                        !acc[item.time] ? acc[item.time] = item.amount : acc[item.time] += item.amount;    
                        return acc; 
                    }, {});
                  
            });
            

            console.log(this.event)

            var preSale = this.preSaleCap - this.ETHRaised <= 0 ? 0 : this.preSaleCap - this.ETHRaised;
            
            this.dataChart = [this.ETHRaised - this.privateInvestors, this.privateInvestors, this.cap - this.ETHRaised, preSale];

            this.timer();

            this.chart();
            

        },
        timer:function() {
            self = this;
            
            setInterval(function() {
                var timeStamp = web3.eth.getBlock(web3.eth.blockNumber).timestamp;

                var secSale = self.preSaleEnd - timeStamp;
                var secICO = self.icoEnd - timeStamp;

                var Sale = moment.duration(secSale, 'seconds').format("d[d] h:mm:ss");
                var ICO = moment.duration(secICO, 'seconds').format("d[d] h:mm:ss");

                secSale > 0 ? self.timeToPreSaleEnd = Sale : self.timeToPreSaleEnd = "finished";
                secICO > 0 ? self.timeToIcoEnd = ICO : self.timeToIcoEnd = "finished";

                self.ETHRaised = web3.fromWei(self.contractInstance.weiRaised());

                self.privateInvestors = web3.fromWei(self.contractInstance.totalPrivateInvestments());

            }, 1000)

        },
        chart:function() {
            self = this;
            
            setInterval(function() {
                var preSale = self.preSaleCap - self.ETHRaised <= 0 ? 0 : self.preSaleCap - self.ETHRaised;
                
                self.dataChart = [self.ETHRaised, self.privateInvestors, self.cap - self.ETHRaised, preSale ];

            }, 60000)
        },


        
   },
   mounted: function() {

    if (typeof web3 !== 'undefined') {
        web3 = new Web3(web3.currentProvider);
      } else {
        web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
      }
    
    this.$http.get('../ABI/2getherABI.json').then(response => {

        var abi = JSON.parse(response.bodyText)
        
        var contract = web3.eth.contract(abi);

        this.contractInstance = contract.at('0xf8a7f2055d87e7d87bd39ce79bff44bdb7c119d9');

        this.IcoDetails();
       
    });

   }
});


Vue.component("doughnut-chart", {
    extends: VueChartJs.Doughnut,
    props: ["data", "options"],
    mounted() {
      this.renderDoughnutChart();
    },
    computed: {
        dataChart: function() {
        return this.data;
      }
    },
    methods: {
      renderDoughnutChart: function() {
      this.renderChart(
        {
          labels: ["ETH Reised by the community", "ETH reised by private Investors", "ETH left till completion", "ETH left for the pre-sale"],
          datasets: [
            {
              label: "Data One",
              backgroundColor: ['green', 'red', 'blue', "yellow"], 
              data: this.dataChart
            }
          ]
        },
        { responsive: true, maintainAspectRatio: false }
      );      
      }
    },
    watch: {
      data: function() {
        this._chart.destroy();
        this.renderDoughnutChart();
      }
    }
  });

  Vue.component("line-chart", {
    extends: VueChartJs.Line,
    props: ["data", "options"],
    mounted() {
      this.renderlineChart();
    },
    computed: {
        event: function() {
        return this.data;
      }
    },
    methods: {
      renderlineChart: function() {
      this.renderChart(
        {
          labels: this.event.map(item => item.time),
          datasets: [
            {
              label: "Ethereum investment in time",
              backgroundColor: ['#32CD32'], 
              data: this.event.map(item => item.amount)
            }
          ]
        },
        { responsive: true, maintainAspectRatio: false }
      );      
      }
    },
    watch: {
      data: function() {
        this._chart.destroy();
        this.renderlineChart();
      }
    }
  });

  /*
Vue.component("line-chart", {
    extends: VueChartJs.Line,
    props: ["data", "options"],
    mounted() {
      this.renderlineChart();
    },
    computed: {
        eventByDay: function() {
        return this.data;
      }
    },
    methods: {
      renderlineChart: function() {
      this.renderChart(
        {
          labels: Object.keys(this.eventByDay),
          datasets: [
            {
              label: "Ethereum investment in time",
              backgroundColor: ['green'], 
              data: Object.keys(this.eventByDay).map(key => this.eventByDay[key])
            }
          ]
        },
        { responsive: true, maintainAspectRatio: false }
      );      
      }
    },
    watch: {
      data: function() {
        this._chart.destroy();
        this.renderlineChart();
      }
    }
  }); */