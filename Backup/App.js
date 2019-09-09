import React from 'react';
//import CssBaseline from '@material-ui/core/CssBaseline';
//import Typography from '@material-ui/core/Typography';
import Container from '@material-ui/core/Container';
import SelectCities from './components/SelectCities';
import Chart from "react-apexcharts";


import 'materialize-css'; // JS assets
import 'materialize-css/dist/css/materialize.min.css';
var request = require("request");


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
          }
        },
        series: [{
          data: []
        }],

      }
    };
    this.handleSelectCity = this.handleSelectCity.bind(this);
    this.setState = this.setState.bind(this);
    this.generateChartData = this.generateChartData.bind(this);
    this.fetchLocalApi = this.fetchLocalApi.bind(this);
  }

  componentDidUpdate() {
    this.fetchLocalApi();
  }

  fetchLocalApi() {
    //event.preventDefault();
    fetch('/api?city=' + this.state.selectedCityNames[this.state.selectedCityNames.length - 1].value)
      .then(response => console.log(response.json()));
  }

  createDataObject(data) {
    const obj = {
      cidade: data.name,
      tempmin: data.main.temp_min,
      tempmax: data.main.temp_max,
      sunrise: this.timestampToUTC(data.sys.sunrise),
      sunset: this.timestampToUTC(data.sys.sunset)
    };

    return obj;
  }

  generateChartData(savedCities) {
    let cityNames = [];
    let cityTemp = [];

    for (let i = 0; i < savedCities.length; i++) {
      cityNames.push(savedCities[i].cidade);
      cityTemp.push(savedCities[i].tempmax);
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
        data: cityTemp
      }],
    }
  }

  timestampToUTC(timestamp) {
    const data = new Date(Date.UTC(96, 11, 1, 0, 0, timestamp));
    const dataToString = data.toString().split(" ");
    return dataToString[4];
  }

  handleSelectCity(cities) {
    if (cities === null || this.state.selectedCityNames === null) {
      return;
    } else if (cities.length < this.state.selectedCityNames.length) {
      return;
    }
    // Última cidade da array cities
    let city = cities[cities.length - 1].value


    let apiOptions = {
      method: 'GET',
      url: 'https://community-open-weather-map.p.rapidapi.com/weather',
      qs: {
        id: '2172797',
        units: 'metric',
        mode: 'json',
        lang: 'pt',
        q: city
      },
      headers: {
        'x-rapidapi-host': 'community-open-weather-map.p.rapidapi.com',
        'x-rapidapi-key': 'b4df5082b2msh080615806cff35ep17a4a1jsncf6c49e48ac1'
      }
    }

    request(apiOptions, (error, response, body) => {
      if (error) throw new Error(error);
      let result = JSON.parse(body);
      let log = [...this.state.log, result];
      let savedCities = [...this.state.savedCities, this.createDataObject(result)]
      this.setState({
        log: log,
        selectedCityNames: cities, // [value, label]
        savedCities: savedCities, // [{}, {}]
        chart: this.generateChartData(savedCities)
      })
    });

  }

  render() {

    return (
      <Container maxWidth="md">
        <button onClick={this.fetchLocalApi}>Teste</button>
        <SelectCities key="1" handleSelectCity={this.handleSelectCity} apiOptions={this.apiOptions} apiCallback={this.apiCallback} />

        <table className="highlight">
          <thead>
            <tr>
              <th>Cidade</th>
              <th>Temp. min.</th>
              <th>Temp. Máx.</th>
              <th>Nascer-do-sol</th>
              <th>Pôr-do-sol</th>
            </tr>
          </thead>
          <tbody>
            {
              this.state.savedCities.map((item, index) => {
                return (
                  <tr key={index}>
                    <td className="cidade">{item.cidade}</td>
                    <td className="Temp. min.">{item.tempmin}</td>
                    <td className="Temp. máx.">{item.tempmax}</td>
                    <td className="Sunrise">{item.sunrise}</td>
                    <td className="Sunset">{item.sunset}</td>
                  </tr>
                );
              })
            }
          </tbody>
        </table>

        <Chart key="2" options={this.state.chart.options} series={this.state.chart.series} type="bar" height="260" />

      </Container>
    );
  }
}

export default App;