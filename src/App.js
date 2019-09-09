import React from 'react';

// Material UI
import Container from '@material-ui/core/Container';
//import CssBaseline from '@material-ui/core/CssBaseline';
//import Typography from '@material-ui/core/Typography';

// Apex Chart
import Chart from "react-apexcharts";

// Materialize css
import 'materialize-css/dist/css/materialize.min.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
//import 'materialize-css'; // JS assets

// Custom components
import SelectCities from './components/SelectCities';
import './App.css';
import chevron from './img/down-chevron.svg'
import waiting from './img/waiting.svg'


class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      savedCities: [],
      selectedCityNames: [],
      log: [],
      chart: {
        options: {
          plotOptions: {
            bar: {
              horizontal: false,
            }
          },
          dataLabels: {
            enabled: false
          },
          xaxis: {
            categories: [],
          },
        },
        series: [{
          name: "Temp. atual",
          data: []
        }],

      }
    };

    // This - Bindings
    this.handleSelectCity = this.handleSelectCity.bind(this);
    this.setState = this.setState.bind(this);
    this.generateChartData = this.generateChartData.bind(this);
    this.createDataObject = this.createDataObject.bind(this);
    this.sortTableData = this.sortTableData.bind(this);
    this.generateTable = this.generateTable.bind(this);
  }

  sortTableData(categoria, data) {
    if (typeof data[0][categoria] === "string") {
      data.sort((a, b) => {
        if (a[categoria] > b[categoria]) {
          return 1;
        }
        if (a[categoria] < b[categoria]) {
          return -1;
        }
        return 0;
      });

    } else {

      data.sort((a, b) => {
        return a[categoria] - b[categoria];
      });

    }
    this.setState({
      savedCities: data,
      chart: this.generateChartData(data)
    });
  }

  // Gerador das definições necessárias para inicializar o Chart(gráfico de barras)
  generateChartData(savedCities) {
    let cityNames = [];
    let cityTemp = [];

    for (let i = 0; i < savedCities.length; i++) {
      cityNames.push(savedCities[i].cidade);
      cityTemp.push(savedCities[i].temp);
    }

    return {
      options: {
        plotOptions: {
          bar: {
            horizontal: false,
          }
        },
        dataLabels: {
          enabled: false
        },
        xaxis: {
          categories: cityNames,
        }
      },
      series: [{
        name: "Temp. atual",
        data: cityTemp
      }],
    }
  }

  // Converte timestamp recebido da API externa em timezone UTC
  timestampToUTC(timestamp) {
    const data = new Date(Date.UTC(96, 11, 1, 0, 0, timestamp));
    const dataToString = data.toString().split(" ");
    return dataToString[4];
  }

  // Cria objeto com formato personalizado para posteriormente ser usado na Tabela e no Chart(gráfico de barras) 
  createDataObject(data) {
    let translateName = data.name === "Lisbon" ? "Lisboa" : data.name;
    const obj = {
      cidade: translateName,
      temp: data.main.temp,
      tempmin: data.main.temp_min,
      tempmax: data.main.temp_max,
      sunrise: this.timestampToUTC(data.sys.sunrise),
      sunset: this.timestampToUTC(data.sys.sunset)
    };

    return obj;
  }

  resetState() {
    this.setState({
      savedCities: [],
      selectedCityNames: [],
      log: [],
      chart: {
        options: {
          plotOptions: {
            bar: {
              horizontal: false,
            }
          },
          dataLabels: {
            enabled: false
          },
          xaxis: {
            categories: [],
          },
        },
        series: [{
          name: "Temp. atual",
          data: []
        }],

      }
    });
  }

  apiFetch(cities) {
    // Fetch com promises que faz a call ao nosso API interno (servidor)
    fetch('/api?city=' + cities[cities.length - 1].value)
      .then(response => {
        if (response.status !== 200) {
          console.log('Falha na conexão ao servidor (api): ' + response.status);
          return;
        }
        response.json().then((result) => {
          let savedCities = [];
          if (!this.state.savedCities) {
            savedCities = [this.createDataObject(result)];
          } else {
            savedCities = [...this.state.savedCities, this.createDataObject(result)];
          }
          this.setState({
            selectedCityNames: cities, // [value, label]
            savedCities: savedCities, // [{}, {}]
            chart: this.generateChartData(savedCities)
          })
        });
      }
      )
      .catch(function (err) {
        console.log('Erro: ', err);
      })
  }

  // Retorna o nome da cidade que foi eliminado do form
  findDeletedCity(savedCities, selectedCities) {

    let cityName = "";
    //let cityIndex = "";
    savedCities.forEach((item, index) => {

      let cityFound = false;
      for (let i = 0; i < selectedCities.length; i++) {
        if (selectedCities[i].value === item.cidade) {
          cityFound = true;
        }
      }

      if (cityFound === false) {
        //cityIndex = index;
        cityName = item.cidade;
      }

    });
    return cityName;
  }

  updateSavedCities(deletedCity) {
    let updatedSavedCities = [...this.state.savedCities];
    let currentCityIndex = null;
    this.state.savedCities.forEach((item, index) => {
      if (item.cidade === deletedCity) {
        currentCityIndex = index;
      }
    });
    updatedSavedCities.splice(currentCityIndex, 1);
    this.setState({
      savedCities: updatedSavedCities, // [{}, {}]
      chart: this.generateChartData(updatedSavedCities)
    })
  }

  // Método que aciona sempre que inserimos nova cidade ou o inverso, no form de pesquisa
  handleSelectCity(cities) {
    // Verifica se foram apagadas todas as cidades do formulário. Faz reset no state
    if (cities === null || cities.length === 0) {
      toast.info("Digita três ou mais cidades, no formulário.");
      this.resetState();
      return;
    }
    // Verifica se devemos atualizar o objeto das cidades para re-render
    if (cities.length < this.state.savedCities.length) {
      const deletedCity = this.findDeletedCity(this.state.savedCities, cities);
      this.updateSavedCities(deletedCity);
      return;
    }

    // Fetch ao nosso servidor local (node API)
    this.apiFetch(cities)

  }

  generateTable() {
    const chevronIcon = <img alt="sort" src={chevron} className="chevron" />;
    return (
      <table className="highlight z-depth-1">
        <thead>
          <tr>
            <th onClick={() => this.sortTableData("cidade", this.state.savedCities)}>Cidade {chevronIcon}</th>
            <th onClick={() => this.sortTableData("temp", this.state.savedCities)}>Temp. atual {chevronIcon}</th>
            <th onClick={() => this.sortTableData("tempmin", this.state.savedCities)}>Temp. min. {chevronIcon}</th>
            <th onClick={() => this.sortTableData("tempmax", this.state.savedCities)}>Temp. Máx. {chevronIcon}</th>
            <th onClick={() => this.sortTableData("sunrise", this.state.savedCities)}>Nascer-do-sol {chevronIcon}</th>
            <th onClick={() => this.sortTableData("sunset", this.state.savedCities)}>Pôr-do-sol {chevronIcon}</th>
          </tr>
        </thead>
        <tbody>
          {
            this.state.savedCities.map((item, index) => {
              return (
                <tr key={index}>
                  <td className="cidade">{item.cidade}</td>
                  <td className="temp">{item.temp}</td>
                  <td className="temp_min">{item.tempmin}</td>
                  <td className="temp_max">{item.tempmax}</td>
                  <td className="sunrise">{item.sunrise}</td>
                  <td className="sunset">{item.sunset}</td>
                </tr>
              );
            })
          }
        </tbody>
      </table>
    );
  }

  generateChart(stateChart) {
    return (
      <div className="z-depth-1">
        <Chart key="2" options={stateChart.options} series={stateChart.series} type="bar" height="250" />
      </div>
    );
  }

  waitingSvg() {
    return (
      <object className="waitingSvg" data={waiting} type="image/svg+xml"> </object>
    );
  }

  render() {
    return (
      <Container maxWidth="md">
        <ToastContainer />
        <h2>Digita 3 ou mais cidades...</h2>
        <SelectCities key="1" handleSelectCity={this.handleSelectCity} apiOptions={this.apiOptions} apiCallback={this.apiCallback} />
        {this.state.savedCities.length > 0 ? this.generateChart(this.state.chart) : <div className="waitingSvgContainer">{this.waitingSvg()}</div>}
        {this.state.savedCities.length > 0 ? this.generateTable() : null}

      </Container >
    );
  }
}

export default App;