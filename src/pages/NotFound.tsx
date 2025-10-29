import React from "react";
import { Link } from "react-router-dom";

const NotFound: React.FC = () => {
  return (
    <main style={{ padding: 24 }}>
      <h1>404 — Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <p>
        <Link to="/">Go back home</Link>
      </p>
    </main>
  );
};

export default NotFound;