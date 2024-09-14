import React from "react";
import "./Board.css";
import Header from "./Header/Header.tsx";
import ContentSection from "./ContentSection";

const HomePage: React.FC = () => {
  return (
    <div className="container">
      <Header />
      <ContentSection />
    </div>
  );
};

export default HomePage;
