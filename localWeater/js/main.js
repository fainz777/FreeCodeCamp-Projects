'use strict'

var Weather = {
	helpers: {
		upperFirstLetter: function(str) {
			return (str[0].toUpperCase() + str.slice(1).toLowerCase());
		},

		defineWinDirStr: function(windDirDeg) {
			if (windDirDeg <= 22) {
				return 'North';
			} else if (windDirDeg <= 68) {
				return 'Northeast';
			} else if (windDirDeg <= 113) {
				return 'East';
			} else if (windDirDeg <= 158) {
				return 'Southeast';
			} else if (windDirDeg <= 203) {
				return 'South';
			} else if (windDirDeg <= 248) {
				return 'Southwest';
			} else if (windDirDeg <= 293) {
				return 'West';
			} else if (windDirDeg <= 338) {
				return 'Northwest';
			} else {
				return 'North';
			}
		},

		celsiusToFahrenheit: function(temperature) {
			return temperature * 9 / 5 + 32;
		},

		celsiusToKelvin: function(temperature) {
			return temperature + 273.15;
		},

		fahrenheitToCelsius: function(temperature) {
			return (temperature - 32) * 5 / 9;
		},

		fahrenheitToKelvin: function(temperature) {
			return 5 * (temperature - 32) / 9 + 273.15;
		},

		kelvinToCelsius: function(temperature) {
			return temperature - 273.15
		},

		kelvinToFahrenheit: function(temperature) {
			return 9 * (temperature - 273.15) / 5 + 32
		},

		mmHgToHpa: function(preasure) {
			return preasure * 1.33322;
		},

		hPaToMmhg: function(preasure) {
			return preasure * 0.75006;
		}
	},

	getLocation: function(app) {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(function(position) {
				console.log('position', position)
				app.showPosition(position, app)
			}, function(error) {
				app.locationErrors(error, app)
			}, {
				enableHighAccuracy: true
			});
		} else {
			app.getLocationByIP(app);
		}
	},

	getLocationByIP: function(app) {
		$.getJSON('http://ipinfo.io', function(data) {
			var loc = data.loc.split(',');
			var position = {
				coords: {
					latitude: parseFloat(loc[0]),
					longitude: parseFloat(loc[1])
				}
			};

			$('#loading').hide();
			app.showPosition(position, app)
		});
	},

	showPosition: function(position, app) {
		var coords = {
			lat: position.coords.latitude,
			lng: position.coords.longitude
		};

		var geocoder = new google.maps.Geocoder;
		geocoder.geocode({
			'location': coords
		}, function(results, status) {
			if (status === google.maps.GeocoderStatus.OK) {
				if (results[1]) {
					app.location.innerHTML = results[1].formatted_address;
				} else {
					app.location.innerHTML = 'No results found';
				}
			} else {
				app.location.innerHTML = 'Geocoder failed due to: ' + status;
			}
		});

		document.getElementById('map').style.display = 'block';

		app.initMap(coords);
		app.getWeatherForecast(coords);
	},

	locationErrors: function(error, app) {
		if (error) {
			app.getLocationByIP(app);
		}
	},

	initMap: function(coords) {
		// Create a map object and specify the DOM element for display.
		var map = new google.maps.Map(document.getElementById('map'), {
			center: coords,
			scrollwheel: false,
			zoom: 15
		});

		// Create a marker and set its position.
		var marker = new google.maps.Marker({
			map: map,
			position: coords
		});

	},

	getWeatherForecast: function(coords) {
		var _this = this;

		$.ajax({
			url: 'http://api.openweathermap.org/data/2.5/weather',
			data: {
				lat: coords.lat,
				lon: coords.lng,
				units: 'metric',
				appid: 'df2d86280db7b1257032b6636533628e'
			},
			success: function(data) {
				// console.log(data);
				//document.getElementById("weather").innerHTNL = data;
				var html = '';

				html += '<ul>';
				html += '<li class="main_icon_wrapper"><i class="wi wi-owm-' + data.weather[0].id + ' main-icon"></i></li>';
				html += '<li class="description">' + _this.helpers.upperFirstLetter(data.weather[0].description) + '</li>';

				if (data.main.temp == data.main.temp_max && data.main.temp == data.main.temp_min) {
					html += '<li>\
						<i class="wi wi-thermometer"></i>\
						<span class="temperature">' +
						data.main.temp +
						'</span>\
						°<span class="measure_temp">C</span>\
						</li>';
				} else {
					html += '<li><i class="wi wi-thermometer"></i>\
						<span class="temperature">' +
						data.main.temp_min +
						'</span>\
						°<span class="measure_temp">C</span> ... \
						<span class="temperature">' +
						data.main.temp_max +
						'</span>\
						°<span class="measure_temp">C</span>\
						;</li>';
				}

				html += '<li><i class="wi wi-humidity"></i>' + data.main.humidity + ' %</li>';
				html += '<li><i class="wi wi-barometer"></i><span class="pressure">' + Math.round(data.main.pressure * 0.75006) + '</span>  <span class="measure_press">mmHg</span></li>';

				var windDirDeg = parseInt(data.wind.deg),
					winDirStr = _this.helpers.defineWinDirStr(windDirDeg);

				html += '<li><i class="wi wi-wind towards-' + windDirDeg + '-deg"></i>' + winDirStr + '</li>';

				html += '<i class="wi wi-wind-beaufort-' + parseInt(data.wind.speed) + '"></i>' + data.wind.speed + ' m/s </li>';

				var date = new Date(data.sys.sunrise * 1000),
					hours = date.getHours(),
					minutes = date.getMinutes(),
					seconds = date.getSeconds();

				hours = hours < 10 ? '0' + hours : hours;
				minutes = minutes < 10 ? '0' + minutes : minutes;
				seconds = seconds < 10 ? '0' + seconds : seconds;

				html += '<li><i class="wi wi-sunrise"></i>' +
					hours +
					':' +
					minutes +
					':' +
					seconds +
					'</li>';

				var date = new Date(data.sys.sunset * 1000),
					hours = date.getHours(),
					minutes = date.getMinutes(),
					seconds = date.getSeconds();

				hours = hours < 10 ? '0' + hours : hours;
				minutes = minutes < 10 ? '0' + minutes : minutes;
				seconds = seconds < 10 ? '0' + seconds : seconds;

				html += '<li><i class="wi wi-sunset"></i>' +
					hours +
					':' +
					minutes +
					':' +
					seconds +
					'</li>';

				html += '</ul>';

				document.getElementById("weather").innerHTML = html;
			}
		});

	},

	init: function() {
		var app = this;
		this.location = document.getElementById("location");
		app.getLocation(app);

		$('.temperature_switch').on('change', function() {
			var val = $(this).val(),
				measure = $(this).attr('data-measure'),
				curVal = $('.current_temperature').val();

			$('.current_temperature').val(val);

			$('.temperature').each(function() {
				val = app.helpers.upperFirstLetter(val)
				var t = parseFloat($(this).text());
				t = app.helpers[curVal + 'To' + val](t);
				$(this).text(t.toFixed(2));
			});

			$('.measure_temp').text(measure);
		});

		$('.preasure_switch').on('change', function() {
			var val = $(this).val(),
				curVal = $('.current_pressure').val();

			$('.current_pressure').val(val);

			$('.pressure').each(function() {
				$('.measure_press').text(val);
				val = app.helpers.upperFirstLetter(val)
				var p = parseFloat($(this).text());
				p = app.helpers[curVal + 'To' + val](p);
				$(this).text(Math.round(p));
			});

		});
	}
};

Weather.init();