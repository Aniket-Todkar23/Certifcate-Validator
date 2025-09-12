import React from 'react';

const Header = ({ title, subtitle, description }) => {
  return (
    <div className="header">
      <div className="container">
        <h1>{title}</h1>
        <p>{subtitle}</p>
        {description && <p className="text-small">{description}</p>}
      </div>
    </div>
  );
};

export default Header;