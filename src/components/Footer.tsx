import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="sticky-footer">
      <div className="footer-content">
        <span> {new Date().getFullYear()} Powered By <a href="https://www.botivate.in/" target="_blank" rel="noopener noreferrer">Botivate</a></span>
      </div>
    </footer>
  );
};

export default Footer;
