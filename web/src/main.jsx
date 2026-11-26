// Starting point of the web app: wraps everything in the router, the login
// state and the language setting, then shows <App />.
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './auth.jsx';
import { LangProvider } from './i18n.jsx';
import App from './App.jsx';
import './ui/app.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <LangProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </LangProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
