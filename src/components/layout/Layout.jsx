import React from 'react';
import Header from './Header';
import './Layout.css';

const Layout = ({ children }) => {
  return (
    <div className="app-layout">
      <div className="main-wrapper">
        <main className="main-content">
          <Header />
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
