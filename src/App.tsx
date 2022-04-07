import "./App.css";
import React, { useState, useEffect, useRef } from "react";
import Card from "./Card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import CountryDropdown from "country-dropdown-with-flags-for-react";
import countries, { CountryNameType, CountryType } from "./country";
import cloud from "./images/wetherIcon.svg";
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import Loader from "react-loader-spinner";

export interface Temp {
  day: number;
  min: number;
  max: number;
  night: number;
  eve: number;
  morn: number;
}

export interface FeelsLike {
  day: number;
  night: number;
  eve: number;
  morn: number;
}

export interface Weather {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface WeekData {
  dt: number;
  sunrise: number;
  sunset: number;
  moonrise: number;
  moonset: number;
  moon_phase: number;
  temp: Temp;
  feels_like: FeelsLike;
  pressure: number;
  humidity: number;
  dew_point: number;
  wind_speed: number;
  wind_deg: number;
  wind_gust: number;
  weather: Weather[];
  clouds: number;
  pop: number;
  uvi: number;
  rain?: number;
}

//=================================================================================

export interface Coord {
  lon: number;
  lat: number;
}

export interface Weather {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface Main {
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  pressure: number;
  humidity: number;
  sea_level: number;
  grnd_level: number;
}

export interface Wind {
  speed: number;
  deg: number;
  gust: number;
}

export interface Clouds {
  all: number;
}

export interface Sys {
  type: number;
  id: number;
  country: string;
  sunrise: number;
  sunset: number;
}

export type CurrentDataType = null | {
  coord: Coord;
  weather: Weather[];
  base: string;
  main: Main;
  visibility: number;
  wind: Wind;
  clouds: Clouds;
  dt: number;
  sys: Sys;
  timezone: number;
  id: number;
  name: string;
  cod: number;
};

interface Feedback {
  msg: string;
  id: number;
  isError: boolean;
}

function App() {
  const [weekData, setWeekData] = useState<WeekData[]>([]);
  const [searchInput, setSearchInput] = useState<string>("");
  const [currentData, setCurrentData] = useState<CurrentDataType>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [country, setCountry] = useState<CountryNameType>("Serbia (Србија)");
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);

  const chosenCountry = countries.find(({ n }) => n === country) as CountryType;

  // get the data for the city and store it in currentData
  function fetchToday(city: string, country: CountryType) {
    fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city},${country.i}&units=metric&appid=${process.env.REACT_APP_MY_KEY}`
    )
      .then((res) => {
        if (res.ok) {
          return res.json();
        } else {
          addFeedbackMessage("There is no such city! Try again!", true);
          setIsLoading(false);
        }
      })
      .then((data) => {
        // console.log("currentData", data);
        setCurrentData(data);
        // setError("");
      })
      .catch((error) => {
        setIsLoading(false);
        addFeedbackMessage(error, true);
        console.log(error);
      });
  }

  // get the data for a week and store it in weekData
  function fetchSevenDay(lat: number, lon: number) {
    fetch(
      `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&units=metric&appid=${process.env.REACT_APP_MY_KEY}`
    )
      .then((res) => {
        // console.log("RES", res);
        return res.json();
      })
      .then((data) => {
        setWeekData(data.daily as WeekData[]);
        addFeedbackMessage("City found!", false);
        setIsLoading(false);
      })
      .catch((error) => {
        setIsLoading(false);
        console.log(error);
      });
  }

  // if there is searchInput pass it to fetchToday()
  // setTimeout prevents unneccessary API calls
  useEffect(() => {
    if (searchInput) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      setIsLoading(true);
      timeoutRef.current = setTimeout(() => {
        fetchToday(searchInput, chosenCountry);
        timeoutRef.current = null;
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput, country]);

  // if the currentData exists extract lat and lon and pass them to fetchSevenDay()
  useEffect(() => {
    if (currentData?.coord) {
      const { lat, lon } = currentData.coord;
      fetchSevenDay(lat, lon);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentData]);

  // get first and last date of the forecast
  function getFeaturedDateRange() {
    if (!weekData) return "";
    const firstDate = new Date(weekData[0].dt * 1000);
    const lastDate = new Date(weekData[weekData.length - 2].dt * 1000);
    const firstDay = firstDate.getDate();
    const lastDay = lastDate.getDate();
    const firstMonth = new Intl.DateTimeFormat("en-US", {
      month: "long",
    }).format(firstDate);
    const lastMonth = new Intl.DateTimeFormat("en-US", {
      month: "long",
    }).format(lastDate);
    const firstYear = firstDate.getFullYear();
    const lastYear = lastDate.getFullYear();

    if (firstYear !== lastYear) {
      // DEC 28 2021 - JAN 5 2022
      return `${firstMonth} ${firstDay} ${firstYear} - ${lastMonth} ${lastDay} ${lastYear}`;
    }
    if (firstMonth !== lastMonth) {
      // JAN 30 - FEB 6 2022
      return `${firstMonth} ${firstDay} - ${lastMonth} ${lastDay} ${firstYear}`;
    }

    // MAY 4-10 2020
    return `${firstMonth} ${firstDay} - ${lastDay} ${firstYear}`;
  }

  // the gradient starts with the current temperature and represents a 10 degree range
  function getGradientOffset() {
    if (!weekData.length) return 0;
    const gradientRange = 81;
    const gradientUnit = 100 / gradientRange;
    const currentTemp = weekData[0].temp.day.toFixed(0);
    const currentRelativeTemp = Number(currentTemp) + 40;

    return gradientUnit * currentRelativeTemp;
  }

  function addFeedbackMessage(msg: string, isError: boolean) {
    const msgObj: Feedback = { msg, id: Math.random(), isError };
    setFeedbacks((prev) => [msgObj, ...prev]);
    setTimeout(() => {
      setFeedbacks((prev) => {
        const newState = [...prev];
        newState.pop();
        return newState;
      });
    }, 5000);
    // timeout duration == animation duration
  }

  return (
    <div className="container">
      <div
        className="container-background"
        style={{
          transform: `translateX(calc(-1 * ${getGradientOffset()}%))`,
          opacity: weekData?.length ? 1 : 0,
        }}
      >
        {Array.from({ length: 81 }, (_, i) => (
          <div className="container-background__unit" key={i}>
            <span> {-40 + i}&deg;C</span>
          </div>
        ))}
      </div>

      <div className="content">
        <h1>Weather Forecast</h1>
        <div className="input-wrapper">
          <div className="input-container">
            <img src={cloud} alt="weather icon" width="35px" />
            <div className="dropdown-wrapper">
              <CountryDropdown
                className="dropdown"
                preferredCountries={["rs"]}
                disabled
                handleChange={(e: Event) => {
                  setCountry(
                    (e.target as HTMLInputElement).value as CountryNameType
                  );
                }}
              ></CountryDropdown>
              <div className="country-short">
                {chosenCountry?.i.toUpperCase()}
              </div>
            </div>
            <div className="input-wrap">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Please enter your location"
              />

              <div className="icon-container">
                {isLoading ? (
                  <Loader
                    type="TailSpin"
                    color="#444444"
                    radius={0.5}
                    height={30}
                    width={30}
                  />
                ) : (
                  <div
                    className={`search-icon-container ${
                      searchInput ? "search-icon-container--has-content" : ""
                    }`}
                  >
                    <FontAwesomeIcon icon={faSearch} />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="feedback-messages">
            {feedbacks.map((feedback) => (
              <p
                className={`feedback-message ${
                  feedback.isError ? "feedback-message--error" : ""
                }`}
                key={feedback.id}
              >
                {feedback.msg}
              </p>
            ))}
          </div>
        </div>

        <div className="featured-card-container">
          {weekData[0] && (
            <Card featuredDate={getFeaturedDateRange()} dayData={weekData[0]} />
          )}
        </div>
        <div className="cards-container">
          {weekData.slice(0, 7).map((dayData, index) => (
            <Card dayData={dayData} key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
