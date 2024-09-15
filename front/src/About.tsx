// src/pages/AboutPage.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

const AboutPage: React.FC = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/contact");
  };

  return (
    <div>
      <p>treesirop</p>
      This is the About Page!
      <button onClick={handleClick}>Go to Contact Page</button>
    </div>
  );
};

export default AboutPage;
