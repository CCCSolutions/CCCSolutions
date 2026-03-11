import React from 'react';
import { Link } from 'react-router-dom';

const ClickableCard = ({title, description, link}) => {
  return (
    <a href={link} className="block bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 w-full">
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-2">{title}</h2>
        <p className="text-gray-700">{description}</p>
      </div>
    </a>
  );
};

export default ClickableCard;
