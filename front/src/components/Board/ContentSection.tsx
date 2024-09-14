import React from "react";
import KingOfTheHill from "./KingOfHill";
import Terminal from "./Terminal/Terminal";
import { useNavigate } from "react-router-dom";

const ContentSection: React.FC = () => {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate("/contact");
  };
  return (
    <div className="content-section">
      <button onClick={handleClick} className="btn">
        [start a new coin]
      </button>
      <KingOfTheHill />
      <Terminal />
    </div>
  );
};

export default ContentSection;
