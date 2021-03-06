import React from "react";
import "./Card.css";

type CardProps = {
  dayData: {
    dt: number;
    temp: {
      day: number;
    };
  };
  featuredDate?: string;
};

const Card = ({ dayData, featuredDate = "" }: CardProps) => {
  // adjust the data to get the proper day format
  const dayInWeek = new Date(dayData.dt * 1000).toLocaleString("en-us", {
    weekday: "long",
  });

  return (
    <div className={`card ${featuredDate ? "card--featured" : ""}`}>
      {featuredDate ? (
        <div className="card__date">{featuredDate}</div>
      ) : (
        <div className="card__day">{dayInWeek}</div>
      )}
      <div className="card__temp">{dayData.temp.day.toFixed(0)}&deg;C</div>
    </div>
  );
};

export default Card;
