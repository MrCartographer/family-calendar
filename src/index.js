import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import Migrate from './Migrate';
import reportWebVitals from './reportWebVitals';

// Simple routing based on URL path
const getComponent = () => {
  const path = window.location.pathname;
  if (path === '/migrate') {
    return <Migrate />;
  }
  return <App />;
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {getComponent()}
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
