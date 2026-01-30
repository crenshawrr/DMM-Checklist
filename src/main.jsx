import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App.jsx";
import "./styles/App.css"; // or your actual css file name/case

ReactDOM.createRoot(document.getElementById("root")).render(
<BrowserRouter basename={import.meta.env.BASE_URL}>
  <App />
</BrowserRouter>
);
